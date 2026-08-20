-- Explicitly limit the public presentation view to read-only access.
-- Supabase role defaults can otherwise leave inherited relation privileges broader than intended.

REVOKE ALL ON public.published_customer_reviews FROM anon, authenticated;
GRANT SELECT ON public.published_customer_reviews TO anon, authenticated;
