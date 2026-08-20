-- Public URL is populated only by the protected admin approval endpoint after
-- copying a chosen review image from the private moderation bucket to gallery/reviews.

ALTER TABLE public.customer_reviews
  ADD COLUMN published_photo_url text;
