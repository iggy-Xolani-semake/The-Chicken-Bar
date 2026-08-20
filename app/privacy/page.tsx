import Link from "next/link";

export const metadata = {
  title: "Privacy & Trust | The Chicken Bar",
  description: "How The Chicken Bar handles orders, customer reviews, and optional food photos.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen texture-wood texture-wood-gallery">
      <section className="texture-wood-overlay relative px-6 py-16 md:px-12 md:py-20">
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="font-utility text-xs font-bold uppercase tracking-[0.26em] text-char">Privacy & Trust</p>
          <h1 className="mt-3 font-display text-5xl text-bone">Your information, treated with care.</h1>
          <p className="mt-4 font-body text-lg text-bone/75">Last updated: 20 August 2026</p>
        </div>
      </section>

      <article className="texture-wood-overlay relative px-6 py-12 md:px-12 md:py-16">
        <div className="relative z-10 mx-auto max-w-3xl space-y-8 font-body leading-relaxed text-bone/80">
          <section>
            <h2 className="font-display text-3xl text-bone">What we collect</h2>
            <p className="mt-3">
              When you place an order, we collect the details needed to prepare and deliver or hand over your food, such as your name, phone number, order, collection or delivery details, and any instructions you choose to give us.
            </p>
            <p className="mt-3">
              When you submit a customer review, we collect the name you choose to share, your rating, your review text, and an optional food photo if you attach one. We do not ask for review passwords, payment details, or social-media logins.
            </p>
          </section>

          <section>
            <h2 className="font-display text-3xl text-bone">How we use it</h2>
            <p className="mt-3">
              We use order details to manage your order, contact you about it when necessary, and run the restaurant. We use reviews to understand customer experience and, where approved, to share genuine customer feedback on this website.
            </p>
            <p className="mt-3">We do not sell your personal information or use it for unrelated advertising.</p>
          </section>

          <section>
            <h2 className="font-display text-3xl text-bone">Review and photo approval</h2>
            <p className="mt-3">
              Every review is moderated before it appears publicly. If you submit a photo, it stays private while the team reviews it. The Chicken Bar may approve your review with the photo, approve the review without the photo, or decline the submission. A photo that is not approved for publication is not shown in the public gallery.
            </p>
          </section>

          <section>
            <h2 className="font-display text-3xl text-bone">Sharing and protection</h2>
            <p className="mt-3">
              We use secure service providers to operate this website, process the restaurant database, and store approved site content. Access to administration areas and unpublished customer content is limited to authorised Chicken Bar administrators.
            </p>
          </section>

          <section>
            <h2 className="font-display text-3xl text-bone">Your choices</h2>
            <p className="mt-3">
              You can ask us about the information connected to an order or review, request a correction, or ask us to remove an approved review where appropriate. Please contact The Chicken Bar at <a className="text-char underline decoration-char/50 underline-offset-4 hover:text-bone" href="mailto:thechickenbarbj@gmail.com">thechickenbarbj@gmail.com</a>.
            </p>
          </section>

          <section className="border border-bone/15 bg-ink/60 p-5">
            <h2 className="font-display text-2xl text-bone">A quick reminder</h2>
            <p className="mt-2 text-sm text-bone/70">
              Please do not include private contact details, account numbers, medical information, or anything you would not want made public in a customer review.
            </p>
          </section>

          <p className="pt-2 text-sm text-bone/50">
            This page explains The Chicken Bar&apos;s current website practices. For a formal legal interpretation of your privacy rights, please obtain independent legal advice.
          </p>
          <Link href="/" className="inline-flex min-h-11 items-center rounded-sm border border-char px-4 py-2 font-body font-bold uppercase tracking-wide text-char hover:bg-char hover:text-ink">
            Back to The Chicken Bar
          </Link>
        </div>
      </article>
    </main>
  );
}
