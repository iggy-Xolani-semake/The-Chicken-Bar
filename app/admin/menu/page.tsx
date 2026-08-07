"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

interface Category {
  id: string;
  name: string;
}

interface Item {
  id: string;
  category_id: string;
  name: string;
  price: number;
  is_available: boolean;
  is_featured: boolean;
  is_active: boolean;
}

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const { data: cats } = await supabase
      .from("menu_categories")
      .select("id, name")
      .order("display_order");
    const { data: menuItems } = await supabase
      .from("menu_items")
      .select("id, category_id, name, price, is_available, is_featured, is_active")
      .order("display_order");

    setCategories((cats as Category[]) ?? []);
    setItems((menuItems as Item[]) ?? []);
    if (cats && cats.length > 0 && !activeCategoryId) {
      setActiveCategoryId(cats[0].id);
    }
  }, [activeCategoryId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function toggleAvailable(item: Item) {
    await supabase.from("menu_items").update({ is_available: !item.is_available }).eq("id", item.id);
    loadData();
  }

  async function toggleFeatured(item: Item) {
    await supabase.from("menu_items").update({ is_featured: !item.is_featured }).eq("id", item.id);
    loadData();
  }

  async function toggleActive(item: Item) {
    await supabase.from("menu_items").update({ is_active: !item.is_active }).eq("id", item.id);
    loadData();
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditPrice(String(item.price));
  }

  async function saveEdit(itemId: string) {
    const price = parseFloat(editPrice);
    if (isNaN(price) || price < 0) return;
    await supabase.from("menu_items").update({ name: editName, price }).eq("id", itemId);
    setEditingId(null);
    loadData();
  }

  async function addNewItem(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);

    if (!activeCategoryId) {
      setAddError("Select a category first.");
      return;
    }
    if (!newName.trim()) {
      setAddError("Item name is required.");
      return;
    }
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      setAddError("Enter a valid price.");
      return;
    }

    const { error } = await supabase.from("menu_items").insert({
      category_id: activeCategoryId,
      name: newName.trim(),
      price,
      description: newDescription.trim() || null,
      item_type: "simple",
      is_available: true,
      is_active: true,
      display_order: items.filter((i) => i.category_id === activeCategoryId).length + 1,
    });

    if (error) {
      setAddError(`Failed to add item: ${error.message}`);
      return;
    }

    setNewName("");
    setNewPrice("");
    setNewDescription("");
    setShowAddForm(false);
    loadData();
  }

  const visibleItems = items.filter((i) => i.category_id === activeCategoryId);

  return (
    <div>
      <h1 className="font-display text-bone text-3xl mb-6">Menu</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategoryId(cat.id)}
            className={`font-body text-sm px-4 py-2 rounded-sm ${
              activeCategoryId === cat.id
                ? "bg-flame text-bone"
                : "bg-smoke-light text-bone/60 hover:text-bone"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowAddForm(!showAddForm)}
        className="font-body text-sm bg-flame text-bone px-4 py-2 rounded-sm hover:bg-ember mb-4"
      >
        {showAddForm ? "Cancel" : "+ Add New Item"}
      </button>

      {showAddForm && (
        <form
          onSubmit={addNewItem}
          className="bg-smoke-light border border-bone/10 rounded-sm p-4 mb-6 space-y-3"
        >
          {addError && <p className="text-ember text-sm">{addError}</p>}
          <p className="font-body text-bone/50 text-xs">
            Adding to:{" "}
            <span className="text-char">
              {categories.find((c) => c.id === activeCategoryId)?.name ?? "no category selected"}
            </span>
          </p>
          <input
            placeholder="Item name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full bg-smoke border border-bone/20 rounded-sm px-3 py-2 text-bone"
          />
          <input
            placeholder="Price"
            type="number"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            className="w-full bg-smoke border border-bone/20 rounded-sm px-3 py-2 text-bone"
          />
          <textarea
            placeholder="Description (optional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            rows={2}
            className="w-full bg-smoke border border-bone/20 rounded-sm px-3 py-2 text-bone"
          />
          <button type="submit" className="font-body text-sm bg-flame text-bone px-4 py-2 rounded-sm">
            Save Item
          </button>
        </form>
      )}

      <div className="space-y-2">
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className={`bg-smoke-light border border-bone/10 rounded-sm p-4 flex items-center justify-between gap-4 ${
              !item.is_active ? "opacity-40" : ""
            }`}
          >
            {editingId === item.id ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-smoke border border-bone/20 rounded-sm px-3 py-1.5 text-bone flex-1"
                />
                <input
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  type="number"
                  className="bg-smoke border border-bone/20 rounded-sm px-3 py-1.5 text-bone w-24"
                />
                <button
                  type="button"
                  onClick={() => saveEdit(item.id)}
                  className="font-body text-sm bg-flame text-bone px-3 py-1.5 rounded-sm"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="font-body text-sm text-bone/50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <p className="font-body text-bone">{item.name}</p>
                  <p className="font-utility text-char text-sm">R{item.price}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => toggleAvailable(item)}
                    className={`font-body text-xs uppercase px-2 py-1 rounded-sm ${
                      item.is_available
                        ? "bg-bone/10 text-bone/60"
                        : "bg-ember/20 text-ember"
                    }`}
                  >
                    {item.is_available ? "Available" : "Out of Stock"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFeatured(item)}
                    className={`font-body text-xs uppercase px-2 py-1 rounded-sm ${
                      item.is_featured ? "bg-flame text-bone" : "bg-bone/10 text-bone/60"
                    }`}
                  >
                    {item.is_featured ? "Featured" : "Feature"}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="font-body text-xs uppercase px-2 py-1 rounded-sm bg-smoke border border-bone/20 text-bone/70"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(item)}
                    className="font-body text-xs uppercase px-2 py-1 rounded-sm bg-smoke border border-ember/40 text-ember"
                  >
                    {item.is_active ? "Hide" : "Restore"}
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
