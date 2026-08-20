-- Order push delivery monitoring is intentionally admin-only. The log stores
-- compact outcome counts and safe summaries, never browser endpoints or keys.
CREATE TABLE IF NOT EXISTS public.push_delivery_logs (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  order_number text,
  registered_subscriptions integer NOT NULL DEFAULT 0 CHECK (registered_subscriptions >= 0),
  delivered_count integer NOT NULL DEFAULT 0 CHECK (delivered_count >= 0),
  failed_count integer NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
  expired_removed_count integer NOT NULL DEFAULT 0 CHECK (expired_removed_count >= 0),
  status text NOT NULL CHECK (status IN ('delivered', 'warning', 'failed', 'no_subscriptions')),
  failure_summary text,
  email_alert_status text NOT NULL DEFAULT 'not_requested'
    CHECK (email_alert_status IN ('not_requested', 'sent', 'failed', 'not_configured')),
  email_alert_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_delivery_logs_created_at_index
  ON public.push_delivery_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS push_delivery_logs_status_created_at_index
  ON public.push_delivery_logs (status, created_at DESC);

ALTER TABLE public.push_delivery_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.push_delivery_logs FROM anon;
GRANT SELECT ON TABLE public.push_delivery_logs TO authenticated;

CREATE POLICY "admins can read push delivery logs"
  ON public.push_delivery_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.id = auth.uid())
  );

-- The R20 two-wings extra belongs on every existing active Burger and Dagwood.
-- A guarded update/insert makes this safe if the migration must be replayed.
WITH target_items AS (
  SELECT mi.id
  FROM public.menu_items AS mi
  JOIN public.menu_categories AS mc ON mc.id = mi.category_id
  WHERE mi.is_active = true
    AND mc.slug IN ('burgers', 'dagwoods')
)
UPDATE public.menu_item_addons AS addon
SET
  name = 'Additional 2 Wings',
  price = 20.00,
  is_available = true,
  display_order = 100
FROM target_items
WHERE addon.menu_item_id = target_items.id
  AND lower(addon.name) = 'additional 2 wings';

WITH target_items AS (
  SELECT mi.id
  FROM public.menu_items AS mi
  JOIN public.menu_categories AS mc ON mc.id = mi.category_id
  WHERE mi.is_active = true
    AND mc.slug IN ('burgers', 'dagwoods')
)
INSERT INTO public.menu_item_addons (
  menu_item_id,
  name,
  price,
  is_available,
  display_order
)
SELECT
  target_items.id,
  'Additional 2 Wings',
  20.00,
  true,
  100
FROM target_items
WHERE NOT EXISTS (
  SELECT 1
  FROM public.menu_item_addons AS addon
  WHERE addon.menu_item_id = target_items.id
    AND lower(addon.name) = 'additional 2 wings'
);

-- Keep historical order records intact, but remove the legacy standalone
-- product from all active customer/admin menu listings.
UPDATE public.menu_items AS mi
SET is_active = false
FROM public.menu_categories AS mc
WHERE mc.id = mi.category_id
  AND mc.slug = 'burgers'
  AND mi.name = 'Additional 2 wings with Any Burger or Dagwood';
