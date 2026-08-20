-- Public visitors need only the approved presentation fields. Keep source photo
-- paths, moderation notes, and submission rate keys inside customer_reviews.

DROP POLICY IF EXISTS "public can read approved customer reviews" ON public.customer_reviews;

CREATE OR REPLACE VIEW public.published_customer_reviews
WITH (security_invoker = false)
AS
SELECT
  id,
  customer_name,
  rating,
  review_text,
  published_photo_url,
  approved_at,
  created_at
FROM public.customer_reviews
WHERE status IN ('approved', 'approved_without_photo');

GRANT SELECT ON public.published_customer_reviews TO anon, authenticated;
