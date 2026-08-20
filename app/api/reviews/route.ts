import { createHash, randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REVIEW_LENGTH = 1000;
const MAX_NAME_LENGTH = 60;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_SUBMISSIONS = 3;

interface ReviewSubmission {
  customerName: string;
  rating: number;
  reviewText: string;
  photo: File | null;
}

function getRequiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-nf-client-connection-ip") || "unknown";
}

function getRateLimitKey(request: Request, secret: string): string {
  const windowNumber = Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS);
  return createHash("sha256")
    .update(`${secret}:${getClientIp(request)}:${windowNumber}`)
    .digest("hex");
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return true;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function getExtension(type: string): string {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  return "webp";
}

function readSubmission(formData: FormData): ReviewSubmission {
  const customerName = String(formData.get("customerName") ?? "").trim();
  const rating = Number(formData.get("rating"));
  const reviewText = String(formData.get("reviewText") ?? "").trim();
  const candidate = formData.get("photo");
  const photo = candidate instanceof File && candidate.size > 0 ? candidate : null;

  if (customerName.length < 2 || customerName.length > MAX_NAME_LENGTH) {
    throw new Error("Please enter a name between 2 and 60 characters.");
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Please choose a rating from 1 to 5 stars.");
  }
  if (reviewText.length < 10 || reviewText.length > MAX_REVIEW_LENGTH) {
    throw new Error("Please write a review between 10 and 1,000 characters.");
  }
  if (photo && (!ALLOWED_PHOTO_TYPES.has(photo.type) || photo.size > MAX_PHOTO_BYTES)) {
    throw new Error("Photos must be a JPEG, PNG, or WebP image no larger than 5 MB.");
  }

  return { customerName, rating, reviewText, photo };
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "Invalid submission origin." }, { status: 403 });
  }

  const formData = await request.formData();
  if (String(formData.get("website") ?? "").trim()) {
    return Response.json({ success: true });
  }

  let submission: ReviewSubmission;
  try {
    submission = readSubmission(formData);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Invalid review submission." }, { status: 400 });
  }

  const serviceRoleKey = getRequiredEnvironment("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(
    getRequiredEnvironment("NEXT_PUBLIC_SUPABASE_URL"),
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const rateLimitKey = getRateLimitKey(request, serviceRoleKey);
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count, error: countError } = await supabase
    .from("customer_reviews")
    .select("id", { count: "exact", head: true })
    .gte("created_at", windowStart)
    .eq("submission_rate_key", rateLimitKey);

  if (countError) {
    console.error("Review rate-limit lookup failed", countError);
    return Response.json({ error: "Unable to submit your review right now. Please try again later." }, { status: 500 });
  }
  if ((count ?? 0) >= RATE_LIMIT_MAX_SUBMISSIONS) {
    return Response.json({ error: "Please wait before submitting another review." }, { status: 429 });
  }

  let photoPath: string | null = null;
  try {
    if (submission.photo) {
      photoPath = `pending/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${getExtension(submission.photo.type)}`;
      const { error: uploadError } = await supabase.storage
        .from("review-submissions")
        .upload(photoPath, await submission.photo.arrayBuffer(), {
          contentType: submission.photo.type,
          upsert: false,
        });
      if (uploadError) throw uploadError;
    }

    const { error: insertError } = await supabase.from("customer_reviews").insert({
      customer_name: submission.customerName,
      rating: submission.rating,
      review_text: submission.reviewText,
      photo_path: photoPath,
      submission_rate_key: rateLimitKey,
      status: "pending",
    });
    if (insertError) throw insertError;

    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    if (photoPath) {
      const { error: cleanupError } = await supabase.storage.from("review-submissions").remove([photoPath]);
      if (cleanupError) console.error("Unable to remove failed review photo upload", cleanupError);
    }
    console.error("Review submission failed", error);
    return Response.json({ error: "Unable to submit your review right now. Please try again later." }, { status: 500 });
  }
}
