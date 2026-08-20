-- Enforce the main-menu and Kota Bar availability windows on every new order item.
-- The trigger runs inside the existing atomic submit_order transaction: if any
-- line is outside its window, the whole order rolls back. Majita Monday is
-- deliberately excluded because it has its own day/override logic.

CREATE OR REPLACE FUNCTION public.enforce_menu_item_schedule()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_category_slug text;
  v_menu_type text;
  v_now_local time without time zone := (now() AT TIME ZONE 'Africa/Johannesburg')::time;
  v_local_day integer := EXTRACT(DOW FROM (now() AT TIME ZONE 'Africa/Johannesburg'))::integer;
  v_main_open time without time zone;
  v_main_close time without time zone;
  v_kota_order_open time without time zone;
  v_kota_order_close time without time zone;
BEGIN
  SELECT c.slug, c.menu_type
    INTO v_category_slug, v_menu_type
    FROM public.menu_items mi
    JOIN public.menu_categories c ON c.id = mi.category_id
    WHERE mi.id = NEW.menu_item_id;

  -- A missing item is handled by submit_order's existing validation.
  IF v_menu_type IS DISTINCT FROM 'main' THEN
    RETURN NEW;
  END IF;

  SELECT
    CASE
      WHEN v_local_day BETWEEN 1 AND 4 THEN order_hours_mon_thu_open
      ELSE order_hours_fri_sun_open
    END,
    CASE
      WHEN v_local_day BETWEEN 1 AND 4 THEN order_hours_mon_thu_close
      ELSE order_hours_fri_sun_close
    END,
    kota_order_open,
    kota_order_close
  INTO v_main_open, v_main_close, v_kota_order_open, v_kota_order_close
  FROM public.restaurant_settings
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_main_open IS NULL OR v_main_close IS NULL OR v_kota_order_open IS NULL OR v_kota_order_close IS NULL THEN
    RAISE EXCEPTION 'Restaurant availability settings are incomplete. Please contact The Chicken Bar.';
  END IF;

  IF v_category_slug = 'kota' THEN
    IF v_now_local < v_kota_order_open OR v_now_local >= v_kota_order_close THEN
      RAISE EXCEPTION 'Kota online orders are available from % to % (South Africa time).',
        to_char(v_kota_order_open, 'HH24:MI'), to_char(v_kota_order_close, 'HH24:MI');
    END IF;
  ELSIF v_now_local < v_main_open OR v_now_local >= v_main_close THEN
    RAISE EXCEPTION 'Main kitchen orders are available from % to % (South Africa time).',
      to_char(v_main_open, 'HH24:MI'), to_char(v_main_close, 'HH24:MI');
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_menu_item_schedule_before_insert ON public.order_items;

CREATE TRIGGER enforce_menu_item_schedule_before_insert
BEFORE INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.enforce_menu_item_schedule();
