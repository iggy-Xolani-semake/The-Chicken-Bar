import { supabase } from "./client";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // matches the gallery bucket's file_size_limit
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export class ImageUploadError extends Error {}

/**
 * Uploads an image file straight from the device (phone or PC) to the
 * "gallery" Supabase Storage bucket and returns its public URL — the
 * single upload path shared by every admin page that needs an image
 * (menu items, events, the gallery itself), so there's one place to fix
 * bugs or change behaviour rather than three near-duplicate copies.
 *
 * Requires the browser session to belong to a row in admin_users — the
 * storage bucket's RLS policy enforces this independently at the
 * database level, so this function can't be used to upload as a random
 * site visitor even if someone tried to call it directly.
 *
 * folder groups uploads by feature within the shared bucket (e.g.
 * "menu-items", "events", "gallery") purely for browsability in the
 * Supabase dashboard — it has no effect on access control, which is
 * governed by bucket_id alone.
 */
export async function uploadImage(file: File, folder: string): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ImageUploadError("Please choose a JPG, PNG, WEBP, or GIF image.");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new ImageUploadError("Image is too large — please choose a file under 10MB.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  // Timestamp + random suffix avoids overwriting another file if two
  // photos happen to share a name (e.g. two people both uploading
  // "IMG_0001.jpg" from their phones on different days).
  const uniqueName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("gallery")
    .upload(uniqueName, file, { cacheControl: "3600", upsert: false });

  if (uploadError) {
    throw new ImageUploadError(`Upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from("gallery").getPublicUrl(uniqueName);
  return data.publicUrl;
}
