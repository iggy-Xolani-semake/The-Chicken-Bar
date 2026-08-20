"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";

interface PublishedReview {
  id: string;
  customer_name: string;
  rating: number;
  review_text: string;
  published_photo_url: string | null;
  approved_at: string | null;
  created_at: string;
}

const emptyForm = {
  customerName: "",
  rating: 0,
  reviewText: "",
  photo: null as File | null,
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<PublishedReview[] | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void supabase
      .from("published_customer_reviews")
      .select("id, customer_name, rating, review_text, published_photo_url, approved_at, created_at")
      .order("approved_at", { ascending: false })
      .limit(12)
      .then(({ data, error }) => {
        if (error) {
          setReviews([]);
          return;
        }
        setReviews((data ?? []) as PublishedReview[]);
      });
  }, []);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.rating < 1 || state === "submitting") return;

    const formElement = event.currentTarget;
    setState("submitting");
    setMessage("");
    const payload = new FormData(formElement);

    try {
      const response = await fetch("/api/reviews", { method: "POST", body: payload });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to submit your review.");

      setState("success");
      setMessage("Thank you. Your review is now waiting for Chicken Bar approval before it appears publicly.");
      setForm(emptyForm);
      formElement.reset();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Unable to submit your review.");
    }
  }

  return (
    <main className="min-h-screen texture-wood texture-wood-gallery">
      <section className="texture-wood-overlay relative px-6 py-16 md:px-12 md:py-20">
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="font-utility text-xs font-bold uppercase tracking-[0.26em] text-char">Your voice matters</p>
          <h1 className="mt-3 font-display text-5xl text-bone">Chicken Bar Reviews</h1>
          <p className="mx-auto mt-4 max-w-2xl font-body text-lg text-bone/75">
            Tell us about your plate. Every review is checked by The Chicken Bar before it is published.
          </p>
        </div>
      </section>

      <div className="texture-wood-overlay relative px-6 py-12 md:px-12 md:py-16">
        <div className="relative z-10 mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="border border-bone/15 bg-ink/70 p-5 sm:p-7" aria-labelledby="leave-a-review">
            <p className="font-utility text-xs font-bold uppercase tracking-[0.2em] text-char">Leave a review</p>
            <h2 id="leave-a-review" className="mt-2 font-display text-3xl text-bone">How was your craving?</h2>
            <p className="mt-3 font-body text-sm text-bone/65">
              Your review stays private until approved. If you share a food photo, the team can approve your words with the photo, approve your words without it, or decline the submission.
            </p>

            <form className="mt-6 space-y-5" onSubmit={submitReview}>
              <div className="sr-only" aria-hidden="true">
                <label htmlFor="review-website">Website</label>
                <input id="review-website" name="website" autoComplete="off" tabIndex={-1} />
              </div>

              <label className="block">
                <span className="font-body text-sm text-bone/75">Your first name or preferred name</span>
                <input
                  name="customerName"
                  required
                  minLength={2}
                  maxLength={60}
                  value={form.customerName}
                  onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))}
                  className="mt-2 w-full rounded-sm border border-bone/20 bg-smoke px-4 py-3 font-body text-bone outline-none focus:border-char focus:ring-2 focus:ring-char/30"
                />
              </label>

              <fieldset>
                <legend className="font-body text-sm text-bone/75">Your rating</legend>
                <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Your rating">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <label key={rating} className="cursor-pointer">
                      <input
                        className="peer sr-only"
                        type="radio"
                        name="rating"
                        value={rating}
                        checked={form.rating === rating}
                        onChange={() => setForm((current) => ({ ...current, rating }))}
                        required
                      />
                      <span className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm border border-bone/20 px-3 font-utility text-sm text-bone/70 transition-colors peer-checked:border-char peer-checked:bg-char peer-checked:text-ink hover:border-char">
                        {rating}★
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="block">
                <span className="font-body text-sm text-bone/75">Your review</span>
                <textarea
                  name="reviewText"
                  required
                  minLength={10}
                  maxLength={1000}
                  rows={5}
                  value={form.reviewText}
                  onChange={(event) => setForm((current) => ({ ...current, reviewText: event.target.value }))}
                  placeholder="Tell us what you enjoyed about your meal..."
                  className="mt-2 w-full resize-y rounded-sm border border-bone/20 bg-smoke px-4 py-3 font-body text-bone outline-none placeholder:text-bone/35 focus:border-char focus:ring-2 focus:ring-char/30"
                />
              </label>

              <label className="block">
                <span className="font-body text-sm text-bone/75">Food photo (optional)</span>
                <span className="mt-1 block font-body text-xs text-bone/45">JPEG, PNG or WebP · maximum 5 MB · published only if approved</span>
                <input
                  name="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => setForm((current) => ({ ...current, photo: event.target.files?.[0] ?? null }))}
                  className="mt-2 block w-full cursor-pointer rounded-sm border border-dashed border-bone/25 bg-smoke px-3 py-3 font-body text-sm text-bone/70 file:mr-3 file:rounded-sm file:border-0 file:bg-flame file:px-3 file:py-2 file:font-body file:font-bold file:text-bone"
                />
                {form.photo && <span className="mt-2 block font-body text-xs text-char">Selected: {form.photo.name}</span>}
              </label>

              <button
                type="submit"
                disabled={state === "submitting" || form.rating < 1}
                className="min-h-12 w-full rounded-sm bg-flame px-5 py-3 font-body font-bold uppercase tracking-wide text-bone transition-colors hover:bg-ember disabled:cursor-not-allowed disabled:opacity-50"
              >
                {state === "submitting" ? "Sending review..." : "Send for approval"}
              </button>
              {message && (
                <p className={`font-body text-sm ${state === "success" ? "text-char" : "text-ember"}`} role="status">
                  {message}
                </p>
              )}
            </form>
          </section>

          <section aria-labelledby="approved-reviews">
            <p className="font-utility text-xs font-bold uppercase tracking-[0.2em] text-char">Approved by the team</p>
            <h2 id="approved-reviews" className="mt-2 font-display text-3xl text-bone">What people are saying</h2>
            <p className="mt-3 font-body text-sm text-bone/65">
              These are genuine customer submissions selected for publication by The Chicken Bar.
            </p>

            {reviews === null ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[0, 1].map((index) => <div key={index} className="h-52 animate-pulse border border-bone/10 bg-smoke" />)}
              </div>
            ) : reviews.length === 0 ? (
              <div className="mt-6 border border-bone/15 bg-ink/60 p-6">
                <p className="font-body text-bone/70">The first approved customer stories will appear here soon.</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {reviews.map((review) => (
                  <article key={review.id} className="overflow-hidden border border-bone/15 bg-ink/70">
                    {review.published_photo_url && (
                      <div className="relative aspect-[4/3] bg-smoke">
                        <Image
                          src={review.published_photo_url}
                          alt={`Food photo shared with ${review.customer_name}'s review`}
                          fill
                          sizes="(max-width: 639px) 100vw, 50vw"
                          className="object-contain"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <p className="font-utility text-sm tracking-[0.15em] text-char">{"★".repeat(review.rating)}<span className="text-bone/20">{"★".repeat(5 - review.rating)}</span></p>
                      <p className="mt-3 font-body leading-relaxed text-bone/85">“{review.review_text}”</p>
                      <p className="mt-4 font-body text-sm font-bold text-bone">{review.customer_name}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
