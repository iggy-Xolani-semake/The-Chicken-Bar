-- Moderated customer reviews. Public visitors can read only approved reviews;
-- all submissions and optional photos remain private until an administrator acts.

CREATE TABLE public.customer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL CHECK (char_length(btrim(customer_name)) BETWEEN 2 AND 60),
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text text NOT NULL CHECK (char_length(btrim(review_text)) BETWEEN 10 AND 1000),
  photo_path text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'approved_without_photo', 'declined')),
  admin_note text CHECK (admin_note IS NULL OR char_length(admin_note) <= 500),
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX customer_reviews_public_index
  ON public.customer_reviews (status, approved_at DESC, created_at DESC);
CREATE INDEX customer_reviews_admin_index
  ON public.customer_reviews (status, created_at DESC);

ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public can read approved customer reviews"
  ON public.customer_reviews
  FOR SELECT
  TO public
  USING (status IN ('approved', 'approved_without_photo'));

CREATE POLICY "admins can manage customer reviews"
  ON public.customer_reviews
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.id = auth.uid())
  );

-- Review images use a private bucket. The public submission endpoint writes
-- with the service role after validating the image; only administrators can
-- inspect, remove, or create signed previews of pending images.
CREATE POLICY "admins can read review submission images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'review-submissions'
    AND EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.id = auth.uid())
  );

CREATE POLICY "admins can update review submission images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'review-submissions'
    AND EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.id = auth.uid())
  )
  WITH CHECK (
    bucket_id = 'review-submissions'
    AND EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.id = auth.uid())
  );

CREATE POLICY "admins can delete review submission images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'review-submissions'
    AND EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.id = auth.uid())
  );
