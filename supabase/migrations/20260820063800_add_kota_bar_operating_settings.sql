-- Dedicated editable settings for The Kota Bar, which has a separate
-- collection address and availability window from the main Chicken Bar kitchen.

ALTER TABLE public.restaurant_settings
  ADD COLUMN IF NOT EXISTS kota_bar_address text,
  ADD COLUMN IF NOT EXISTS kota_bar_open time without time zone NOT NULL DEFAULT '07:00',
  ADD COLUMN IF NOT EXISTS kota_bar_close time without time zone NOT NULL DEFAULT '19:00',
  ADD COLUMN IF NOT EXISTS kota_order_open time without time zone NOT NULL DEFAULT '07:00',
  ADD COLUMN IF NOT EXISTS kota_order_close time without time zone NOT NULL DEFAULT '18:00';

COMMENT ON COLUMN public.restaurant_settings.kota_bar_address IS
  'Confirmed separate collection address for The Kota Bar.';
COMMENT ON COLUMN public.restaurant_settings.kota_bar_open IS
  'Public Kota Bar opening time.';
COMMENT ON COLUMN public.restaurant_settings.kota_bar_close IS
  'Public Kota Bar closing time.';
COMMENT ON COLUMN public.restaurant_settings.kota_order_open IS
  'Start of online Kota ordering window.';
COMMENT ON COLUMN public.restaurant_settings.kota_order_close IS
  'End of online Kota ordering window.';
