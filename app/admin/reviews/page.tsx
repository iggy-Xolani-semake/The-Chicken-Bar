"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";

type ReviewStatus = "pending" | "approved" | "approved_without_photo" | "declined";
type ReviewAction = "approve_with_photo" | "approve_without_photo" | "decline";

interface ReviewRow {
  id: string;
  customer_name: string;
  rating: number;
  review_text: string;
  photo_path: string | null;
  published_photo_url: string | null;
  status: ReviewStatus;
  admin_note: string | null;
  created_at: string;
}

interface ReviewWithPreview extends ReviewRow {
  privatePhotoUrl: string | null;
}

const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "Pending",
  approved: "Published with photo",
  approved_without_photo: "Published text only",
  declined: "Declined",
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewWithPreview[] | null>(null);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    let query = supabase
      .from("customer_reviews")
      .select("id, customer_name, rating, review_text, photo_path, published_photo_url, status, admin_note, created_at")
      .order("created_at", { ascending: false });
    if (filter === "pending") query = query.eq("status", "pending");

    const { data, error: loadError } = await query;
    if (loadError) {
      setError(loadError.message);
      setReviews([]);
      return;
    }

    const rows = (data ?? []) as ReviewRow[];
    const withPreviews = await Promise.all(
      rows.map(async (review) => {
        if (!review.photo_path || review.status !== "pending") return { ...review, privatePhotoUrl: null };
        const { data: signed } = await supabase.storage.from("review-submissions").createSignedUrl(review.photo_path, 600);
        return { ...review, privatePhotoUrl: signed?.signedUrl ?? null };
      })
    );
    setReviews(withPreviews);
  }, [filter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function decide(review: ReviewWithPreview, action: ReviewAction) {
    setWorkingId(review.id);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Your admin session has expired. Please sign in again.");

      const response = await fetch(`/api/admin/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to update this review.");
      await load();
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "Unable to update this review.");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 sm:mb-8">
        <p className="font-utility text-xs font-bold uppercase tracking-[0.22em] text-char">Customer feedback</p>
        <h1 className="mt-2 font-display text-2xl text-bone sm:text-3xl">Review Approval Queue</h1>
        <p className="mt-2 max-w-3xl font-body text-sm text-bone/60">
          Nothing submitted here is public yet. Decide whether to publish the review with the photo, publish the review as text only, or decline it. Private photos are removed after a decision.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(["pending", "all"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFilter(option)}
            className={`min-h-11 rounded-sm border px-4 font-body text-sm font-bold transition-colors ${
              filter === option ? "border-flame bg-flame text-bone" : "border-bone/20 text-bone/70 hover:border-bone/50"
            }`}
          >
            {option === "pending" ? "Pending Approval" : "All Reviews"}
          </button>
        ))}
      </div>

      {error && <p className="mb-5 border border-ember/40 bg-ember/10 p-4 font-body text-sm text-ember">{error}</p>}

      {reviews === null ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((item) => <div key={item} className="h-64 animate-pulse rounded-sm bg-smoke-light" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="border border-bone/15 bg-smoke-light p-6">
          <p className="font-body text-bone/70">No {filter === "pending" ? "reviews waiting for approval" : "customer reviews"} right now.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {reviews.map((review) => {
            const isWorking = workingId === review.id;
            return (
              <article key={review.id} className="overflow-hidden border border-bone/15 bg-smoke-light">
                <div className="grid gap-5 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_13rem]">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-body font-bold text-bone">{review.customer_name}</h2>
                      <span className="font-utility text-sm tracking-[0.12em] text-char">{"★".repeat(review.rating)}</span>
                      <span className={`rounded-sm border px-2 py-1 font-utility text-[10px] uppercase tracking-wide ${review.status === "pending" ? "border-char/50 text-char" : "border-bone/20 text-bone/50"}`}>
                        {STATUS_LABELS[review.status]}
                      </span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap font-body leading-relaxed text-bone/80">{review.review_text}</p>
                    <p className="mt-3 font-body text-xs text-bone/40">Submitted {new Date(review.created_at).toLocaleString()}</p>

                    {review.status === "pending" && (
                      <div className="mt-5 grid gap-2 sm:flex sm:flex-wrap">
                        {review.privatePhotoUrl && (
                          <button
                            type="button"
                            disabled={isWorking}
                            onClick={() => void decide(review, "approve_with_photo")}
                            className="min-h-11 rounded-sm bg-flame px-4 font-body text-sm font-bold text-bone hover:bg-ember disabled:opacity-50"
                          >
                            Approve Review + Photo
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => void decide(review, "approve_without_photo")}
                          className="min-h-11 rounded-sm border border-char px-4 font-body text-sm font-bold text-char hover:bg-char hover:text-ink disabled:opacity-50"
                        >
                          Approve Review Only
                        </button>
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => void decide(review, "decline")}
                          className="min-h-11 rounded-sm border border-ember/60 px-4 font-body text-sm font-bold text-ember hover:bg-ember/10 disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>

                  {review.privatePhotoUrl && (
                    <div className="relative aspect-[4/3] overflow-hidden rounded-sm border border-bone/15 bg-ink/80 md:aspect-auto md:min-h-48">
                      <Image
                        src={review.privatePhotoUrl}
                        alt={`Pending food photo from ${review.customer_name}`}
                        fill
                        sizes="(max-width: 767px) 100vw, 208px"
                        className="object-contain"
                      />
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
