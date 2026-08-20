-- Server-generated rolling-window key used only to limit repeated public review submissions.
-- It is not displayed publicly and does not store a customer's contact information.

ALTER TABLE public.customer_reviews
  ADD COLUMN submission_rate_key text NOT NULL DEFAULT '';

CREATE INDEX customer_reviews_rate_limit_index
  ON public.customer_reviews (submission_rate_key, created_at DESC);
