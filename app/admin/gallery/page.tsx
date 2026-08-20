"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import ImageUploadButton from "@/app/components/ImageUploadButton";

interface GalleryRow {
  id: string;
  image_url: string;
  category: string;
  caption: string | null;
}

async function fetchGalleryImages(): Promise<GalleryRow[]> {
  const { data } = await supabase
    .from("gallery_images")
    .select("id, image_url, category, caption")
    .order("display_order");

  return (data as GalleryRow[]) ?? [];
}

export default function AdminGalleryPage() {
  const [images, setImages] = useState<GalleryRow[] | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [newCategory, setNewCategory] = useState("food");

  const load = useCallback(async () => {
    setImages(await fetchGalleryImages());
  }, []);

  useEffect(() => {
    let cancelled = false;

    void fetchGalleryImages().then((data) => {
      if (!cancelled) setImages(data);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function addImage(e: React.FormEvent) {
    e.preventDefault();
    if (!newUrl.trim()) return;
    await supabase.from("gallery_images").insert({ image_url: newUrl, category: newCategory });
    setNewUrl("");
    load();
  }

  async function addUploadedImage(url: string) {
    await supabase.from("gallery_images").insert({ image_url: url, category: newCategory });
    load();
  }

  async function deleteImage(id: string) {
    await supabase.from("gallery_images").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <h1 className="font-display text-bone text-2xl sm:text-3xl mb-6">Gallery</h1>

      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:flex-wrap sm:items-start">
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="bg-smoke border border-bone/20 rounded-sm px-3 py-2 text-bone"
        >
          {["food", "vibes", "events", "majita_monday", "customers", "restaurant"].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <ImageUploadButton folder="gallery" onUploaded={addUploadedImage} label="Upload From Device" />
      </div>

      <form onSubmit={addImage} className="flex flex-col gap-2 mb-6 sm:flex-row sm:flex-wrap sm:items-center">
        <p className="font-body text-bone/40 text-xs w-full">
          Or paste a URL directly (e.g. if the image is already hosted elsewhere):
        </p>
        <input
          placeholder="Image URL"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          className="w-full bg-smoke border border-bone/20 rounded-sm px-3 py-2 text-bone sm:flex-1"
        />
        <button type="submit" className="w-full min-h-11 font-body text-sm bg-smoke border border-bone/20 text-bone/70 px-4 py-2 rounded-sm sm:w-auto">
          Add URL
        </button>
      </form>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {images?.map((img) => (
          <div key={img.id} className="relative group aspect-square">
            <Image src={img.image_url} alt="" fill sizes="150px" className="object-cover rounded-sm" />
            <button
              type="button"
              onClick={() => deleteImage(img.id)}
              className="absolute right-2 top-2 min-h-10 rounded-sm bg-black/75 px-3 opacity-100 flex items-center justify-center text-bone text-xs transition-opacity sm:inset-0 sm:right-auto sm:top-auto sm:rounded-none sm:bg-black/60 sm:px-0 sm:text-sm sm:opacity-0 sm:group-hover:opacity-100"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
