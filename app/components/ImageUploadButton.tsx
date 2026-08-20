"use client";

import { useRef, useState } from "react";
import { uploadImage, ImageUploadError } from "@/lib/supabase/uploadImage";
import { cn } from "@/lib/utils";

interface ImageUploadButtonProps {
  folder: string;
  onUploaded: (url: string) => void;
  label?: string;
  className?: string;
}

/**
 * File-picker button that uploads directly to Supabase Storage and
 * hands the resulting public URL to the caller via onUploaded — the
 * caller decides what to do with the URL (insert a new row, update an
 * existing one, etc.), this component only handles the picking,
 * uploading, and progress/error feedback.
 *
 * Deliberately a plain <input type="file"> styled as a button rather
 * than a custom drag-and-drop zone — this needs to work reliably on a
 * phone browser (tapping to open the camera roll / camera) as much as
 * on desktop, and the native file input handles both without extra code.
 */
export default function ImageUploadButton({
  folder,
  onUploaded,
  label = "Upload Photo",
  className = "",
}: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file, folder);
      onUploaded(url);
    } catch (err) {
      setError(err instanceof ImageUploadError ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      // Reset so choosing the same file again (e.g. after an error) still fires onChange
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
        id={`upload-${folder}-${label}`}
      />
      <label
        htmlFor={`upload-${folder}-${label}`}
        className={cn(
          "inline-flex min-h-11 items-center justify-center cursor-pointer font-body text-xs uppercase px-3 py-2 rounded-sm bg-flame text-bone hover:bg-ember transition-colors",
          uploading && "opacity-50 pointer-events-none",
          className
        )}
      >
        {uploading ? "Uploading..." : label}
      </label>
      {error && <p className="font-body text-ember text-xs mt-1">{error}</p>}
    </div>
  );
}
