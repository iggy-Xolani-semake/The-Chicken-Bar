"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

interface GalleryRow {
  id: string;
  image_url: string;
  category: string;
  caption: string | null;
}

export default function AdminGalleryPage() {
  const [images, setImages] = useState<GalleryRow[] | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [newCategory, setNewCategory] = useState("food");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("gallery_images")
      .select("id, image_url, category, caption")
      .order("display_order");
    setImages((data as GalleryRow[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addImage(e: React.FormEvent) {
    e.preventDefault();
    if (!newUrl.trim()) return;
    await supabase.from("gallery_images").insert({ image_url: newUrl, category: newCategory });
    setNewUrl("");
    load();
  }

  async function deleteImage(id: string) {
    await supabase.from("gallery_images").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <h1 className="font-display text-bone text-3xl mb-6">Gallery</h1>

      <form onSubmit={addImage} className="flex gap-2 mb-6 flex-wrap">
        <input
          placeholder="Image URL"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          className="bg-smoke border border-bone/20 rounded-sm px-3 py-2 text-bone flex-1 min-w-[200px]"
        />
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
        <button type="submit" className="font-body text-sm bg-flame text-bone px-4 py-2 rounded-sm">
          Add
        </button>
      </form>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {images?.map((img) => (
          <div key={img.id} className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.image_url} alt="" className="w-full aspect-square object-cover rounded-sm" />
            <button
              type="button"
              onClick={() => deleteImage(img.id)}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-bone text-sm transition-opacity"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
