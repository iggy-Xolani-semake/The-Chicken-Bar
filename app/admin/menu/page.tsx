"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import ImageUploadButton from "@/app/components/ImageUploadButton";

interface Category {
  id: string;
  name: string;
  menu_type: string;
}

interface Item {
  id: string;
  category_id: string;
  name: string;
  price: number;
  is_available: boolean;
  is_featured: boolean;
  is_todays_special: boolean;
  is_active: boolean;
  image_url: string | null;
}

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [activeMenuType, setActiveMenuType] = useState<"main" | "majita_monday">("main");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const fetchMenuData = useCallback(async () => {
    const { data: cats } = await supabase
      .from("menu_categories")
      .select("id, name, menu_type")
      .order("display_order");
    const { data: menuItems } = await supabase
      .from("menu_items")
      .select("id, category_id, name, price, is_available, is_featured, is_todays_special, is_active, image_url")
      .order("display_order");

    return { cats: (cats as Category[]) ?? [], menuItems: (menuItems as Item[]) ?? [] };
  }, []);

  const applyMenuData = useCallback(
    (allCats: Category[], menuItems: Item[]) => {
      setCategories(allCats);
      setItems(menuItems);

      // Only default activeCategoryId from categories that actually match
      // the currently selected tab (main vs. Majita Monday) — otherwise
      // the very first load could silently land on a majita_monday
      // category while the tab bar shows "Main Menu" selected, which is
      // exactly the mixed-up state this whole change is meant to fix.
      const catsForActiveTab = allCats.filter((c) => c.menu_type === activeMenuType);
      if (catsForActiveTab.length > 0 && !catsForActiveTab.some((c) => c.id === activeCategoryId)) {
        setActiveCategoryId(catsForActiveTab[0].id);
      }
    },
    [activeCategoryId, activeMenuType]
  );

  // Used by every button handler below (toggles, saves, creates) — these
  // are user-initiated, not effect-driven, so calling setState directly
  // here is the normal, correct pattern; only the mount/dependency-change
  // fetch below needs the cancelled-flag guard.
  const loadData = useCallback(async () => {
    const { cats, menuItems } = await fetchMenuData();
    applyMenuData(cats, menuItems);
  }, [fetchMenuData, applyMenuData]);

  useEffect(() => {
    let cancelled = false;
    fetchMenuData().then(({ cats, menuItems }) => {
      if (cancelled) return;
      applyMenuData(cats, menuItems);
    });
    return () => {
      cancelled = true;
    };
    // Intentionally omitting fetchMenuData/applyMenuData from deps — this
    // effect should only re-run on mount, not every time activeMenuType
    // changes tab selection recalculates applyMenuData's identity; the
    // tab switch itself is handled by switchMenuType below, not a refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoriesForActiveTab = categories.filter((c) => c.menu_type === activeMenuType);

  function switchMenuType(menuType: "main" | "majita_monday") {
    setActiveMenuType(menuType);
    const firstCat = categories.find((c) => c.menu_type === menuType);
    setActiveCategoryId(firstCat?.id ?? null);
    setShowAddForm(false);
    setShowNewCategoryForm(false);
  }

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    setCategoryError(null);
    if (!newCategoryName.trim()) {
      setCategoryError("Section name is required.");
      return;
    }

    const slug = newCategoryName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const nextOrder = categoriesForActiveTab.length + 1;

    const { data, error } = await supabase
      .from("menu_categories")
      .insert({
        name: newCategoryName.trim(),
        slug,
        display_order: nextOrder,
        is_active: true,
        menu_type: activeMenuType,
      })
      .select("id, name, menu_type")
      .single();

    if (error) {
      setCategoryError(`Failed to create section: ${error.message}`);
      return;
    }

    setNewCategoryName("");
    setShowNewCategoryForm(false);
    await loadData();
    if (data) setActiveCategoryId(data.id);
  }

  async function toggleAvailable(item: Item) {
    await supabase.from("menu_items").update({ is_available: !item.is_available }).eq("id", item.id);
    loadData();
  }

  async function toggleFeatured(item: Item) {
    await supabase.from("menu_items").update({ is_featured: !item.is_featured }).eq("id", item.id);
    loadData();
  }

  async function toggleTodaysSpecial(item: Item) {
    await supabase
      .from("menu_items")
      .update({ is_todays_special: !item.is_todays_special })
      .eq("id", item.id);
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

  async function saveItemImage(itemId: string, url: string) {
    await supabase.from("menu_items").update({ image_url: url }).eq("id", itemId);
    loadData();
  }

  async function removeItemImage(itemId: string) {
    await supabase.from("menu_items").update({ image_url: null }).eq("id", itemId);
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
      image_url: newImageUrl.trim() || null,
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
    setNewImageUrl("");
    setShowAddForm(false);
    loadData();
  }

  const visibleItems = items.filter((i) => i.category_id === activeCategoryId);

  return (
    <div>
      <h1 className="font-display text-bone text-2xl sm:text-3xl mb-6">Menu</h1>

      {/* Which menu this section belongs to — Main Menu vs. Majita
          Monday. Categories from both were previously mixed into one
          flat tab bar below (e.g. "Mogodu & Trotters" sitting next to
          "Burgers"), which made it easy to add a new section to the
          wrong menu without realising. */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {(["main", "majita_monday"] as const).map((mt) => (
          <button
            key={mt}
            type="button"
            onClick={() => switchMenuType(mt)}
            className={`min-h-11 w-full font-body text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-sm border ${
              activeMenuType === mt
                ? "bg-bone text-smoke border-bone"
                : "bg-transparent text-bone/50 border-bone/20 hover:text-bone"
            }`}
          >
            {mt === "main" ? "Main Menu" : "Majita Monday"}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {categoriesForActiveTab.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategoryId(cat.id)}
            className={`shrink-0 whitespace-nowrap min-h-11 font-body text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-sm ${
              activeCategoryId === cat.id
                ? "bg-flame text-bone"
                : "bg-smoke-light text-bone/60 hover:text-bone"
            }`}
          >
            {cat.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowNewCategoryForm(!showNewCategoryForm)}
          className="shrink-0 whitespace-nowrap min-h-11 font-body text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-sm bg-smoke border border-dashed border-bone/30 text-bone/60 hover:text-bone"
        >
          {showNewCategoryForm ? "Cancel" : "+ New Section"}
        </button>
      </div>

      {showNewCategoryForm && (
        <form
          onSubmit={createCategory}
          className="bg-smoke-light border border-bone/10 rounded-sm p-3 sm:p-4 mb-6 flex flex-col gap-3 sm:flex-row sm:items-start"
        >
          <div className="w-full sm:flex-1">
            <input
              placeholder="Section name, e.g. Dagwoods"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full bg-smoke border border-bone/20 rounded-sm px-3 py-2 text-bone"
            />
            <p className="font-body text-bone/40 text-xs mt-1">
              Creates a brand new tab under{" "}
              {activeMenuType === "main" ? "Main Menu" : "Majita Monday"} — it
              won&apos;t affect any existing section or its items.
            </p>
            {categoryError && <p className="text-ember text-sm mt-1">{categoryError}</p>}
          </div>
          <button type="submit" className="w-full min-h-11 font-body text-sm bg-flame text-bone px-4 py-2 rounded-sm sm:w-auto">
            Create Section
          </button>
        </form>
      )}

      <button
        type="button"
        onClick={() => setShowAddForm(!showAddForm)}
        disabled={!activeCategoryId}
        className="w-full min-h-11 font-body text-sm bg-flame text-bone px-4 py-2 rounded-sm hover:bg-ember mb-4 disabled:opacity-40 disabled:cursor-not-allowed sm:w-auto"
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
          <div>
            <label className="block font-body text-xs text-bone/50 mb-1">Photo (optional)</label>
            <div className="flex items-center gap-3 flex-wrap">
              {newImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={newImageUrl}
                  alt="New item preview"
                  className="w-14 h-14 object-cover rounded-sm border border-bone/10"
                />
              )}
              <ImageUploadButton folder="menu-items" onUploaded={setNewImageUrl} label="Upload Photo" />
              {newImageUrl && (
                <button
                  type="button"
                  onClick={() => setNewImageUrl("")}
                  className="font-body text-xs text-bone/50"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          <button type="submit" className="font-body text-sm bg-flame text-bone px-4 py-2 rounded-sm">
            Save Item
          </button>
        </form>
      )}

      <div className="space-y-2">
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className={`bg-smoke-light border border-bone/10 rounded-sm p-3 sm:p-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${
              !item.is_active ? "opacity-40" : ""
            }`}
          >
            {editingId === item.id ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-1">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-smoke border border-bone/20 rounded-sm px-3 py-2 text-bone sm:flex-1"
                />
                <input
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  type="number"
                  className="w-full bg-smoke border border-bone/20 rounded-sm px-3 py-2 text-bone sm:w-24"
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
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image_url}
                    alt=""
                    className="w-12 h-12 object-cover rounded-sm shrink-0 border border-bone/10"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-sm shrink-0 border border-dashed border-bone/20" />
                )}
                <div className="flex-1">
                  <p className="font-body text-bone">{item.name}</p>
                  <p className="font-utility text-char text-sm">R{item.price}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  <button
                    type="button"
                    onClick={() => toggleAvailable(item)}
                    className={`min-h-10 font-body text-[11px] uppercase px-2 py-1 rounded-sm ${
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
                    className={`min-h-10 font-body text-[11px] uppercase px-2 py-1 rounded-sm ${
                      item.is_featured ? "bg-flame text-bone" : "bg-bone/10 text-bone/60"
                    }`}
                  >
                    {item.is_featured ? "Featured" : "Feature"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleTodaysSpecial(item)}
                    title="Show this item in the homepage's Today's Special section"
                    className={`min-h-10 font-body text-[11px] uppercase px-2 py-1 rounded-sm ${
                      item.is_todays_special ? "bg-flame text-bone" : "bg-bone/10 text-bone/60"
                    }`}
                  >
                    {item.is_todays_special ? "★ Today's Special" : "+ Today's Special"}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="min-h-10 font-body text-[11px] uppercase px-2 py-1 rounded-sm bg-smoke border border-bone/20 text-bone/70"
                  >
                    Edit
                  </button>
                  <ImageUploadButton
                    folder="menu-items"
                    onUploaded={(url) => saveItemImage(item.id, url)}
                    label={item.image_url ? "Change Photo" : "+ Add Photo"}
                    className="bg-smoke border border-bone/20 text-bone/70 hover:bg-smoke"
                  />
                  {item.image_url && (
                    <button
                      type="button"
                      onClick={() => removeItemImage(item.id)}
                      className="min-h-10 font-body text-[11px] uppercase px-2 py-1 rounded-sm bg-smoke border border-ember/40 text-ember"
                    >
                      Remove Photo
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleActive(item)}
                    className="min-h-10 font-body text-[11px] uppercase px-2 py-1 rounded-sm bg-smoke border border-ember/40 text-ember"
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
