-- The legacy standalone wings product is intentionally inactive. Remove its
-- now-unused add-on row so it cannot inherit the Burger/Dagwood side option if
-- someone ever reactivates the old product by mistake.
DELETE FROM public.menu_item_addons AS addon
USING public.menu_items AS mi
JOIN public.menu_categories AS mc ON mc.id = mi.category_id
WHERE addon.menu_item_id = mi.id
  AND mc.slug = 'burgers'
  AND mi.name = 'Additional 2 wings with Any Burger or Dagwood';
