import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReviewAction = "approve_with_photo" | "approve_without_photo" | "decline";

function getRequiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function getBearerToken(request: Request): string | null {
  const value = request.headers.get("authorization");
  return value?.startsWith("Bearer ") ? value.slice(7) : null;
}

function isAction(value: unknown): value is ReviewAction {
  return value === "approve_with_photo" || value === "approve_without_photo" || value === "decline";
}

function extensionFromPath(path: string): string {
  const extension = path.split(".").pop()?.toLowerCase();
  return extension && /^[a-z0-9]+$/.test(extension) ? extension : "jpg";
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const token = getBearerToken(request);
  if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = getRequiredEnvironment("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = getRequiredEnvironment("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceKey = getRequiredEnvironment("SUPABASE_SERVICE_ROLE_KEY");
  const authClient = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const serviceClient = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: admin, error: adminError } = await serviceClient
    .from("admin_users")
    .select("id")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (adminError || !admin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json()) as { action?: unknown; adminNote?: unknown };
  if (!isAction(body.action)) return Response.json({ error: "Invalid review action" }, { status: 400 });
  const adminNote = typeof body.adminNote === "string" ? body.adminNote.trim().slice(0, 500) || null : null;
  const { id } = await context.params;

  const { data: review, error: reviewError } = await serviceClient
    .from("customer_reviews")
    .select("id, photo_path, status")
    .eq("id", id)
    .maybeSingle();
  if (reviewError || !review) return Response.json({ error: "Review not found" }, { status: 404 });
  if (review.status !== "pending") return Response.json({ error: "This review has already been decided." }, { status: 409 });

  let publishedPhotoUrl: string | null = null;
  let copiedPhotoPath: string | null = null;

  try {
    if (body.action === "approve_with_photo" && review.photo_path) {
      const { data: privatePhoto, error: downloadError } = await serviceClient.storage
        .from("review-submissions")
        .download(review.photo_path);
      if (downloadError || !privatePhoto) throw downloadError ?? new Error("Review photo could not be read.");

      copiedPhotoPath = `reviews/${review.id}.${extensionFromPath(review.photo_path)}`;
      const { error: uploadError } = await serviceClient.storage
        .from("gallery")
        .upload(copiedPhotoPath, await privatePhoto.arrayBuffer(), {
          contentType: privatePhoto.type || "image/jpeg",
          upsert: false,
        });
      if (uploadError) throw uploadError;
      publishedPhotoUrl = serviceClient.storage.from("gallery").getPublicUrl(copiedPhotoPath).data.publicUrl;
    }

    const nextStatus = body.action === "approve_with_photo" && publishedPhotoUrl ? "approved" : body.action === "decline" ? "declined" : "approved_without_photo";
    const { error: updateError } = await serviceClient
      .from("customer_reviews")
      .update({
        status: nextStatus,
        published_photo_url: publishedPhotoUrl,
        admin_note: adminNote,
        approved_at: nextStatus.startsWith("approved") ? new Date().toISOString() : null,
        approved_by: nextStatus.startsWith("approved") ? userData.user.id : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", review.id);
    if (updateError) throw updateError;

    if (review.photo_path) {
      const { error: removeError } = await serviceClient.storage.from("review-submissions").remove([review.photo_path]);
      if (removeError) console.error("Unable to remove resolved private review photo", removeError);
    }

    return Response.json({ status: nextStatus, publishedPhotoUrl });
  } catch (error) {
    if (copiedPhotoPath) {
      const { error: rollbackError } = await serviceClient.storage.from("gallery").remove([copiedPhotoPath]);
      if (rollbackError) console.error("Unable to remove failed published review photo", rollbackError);
    }
    console.error("Review moderation failed", error);
    return Response.json({ error: "Unable to update this review right now." }, { status: 500 });
  }
}
