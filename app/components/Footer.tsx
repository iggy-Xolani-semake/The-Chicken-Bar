import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-bone/10 bg-char-black px-6 py-12 md:px-12">
      <div className="mx-auto grid max-w-6xl gap-8 text-center md:grid-cols-4 md:text-left">
        <div>
          <h3 className="mb-3 font-display text-2xl text-flame">The Chicken Bar</h3>
          <p className="font-body text-sm text-bone/60">Best kasi flame-grilled chicken &amp; meat. Est. 2019, Tsakane.</p>
          <p className="mt-3 font-body text-base font-semibold text-bone/70">Ask us about our car wash service while you wait.</p>
        </div>

        <div>
          <h4 className="mb-3 font-body text-sm font-bold uppercase tracking-wide text-bone">Contact</h4>
          <p className="mb-1 font-body text-sm text-bone/60">065 801 2302</p>
          <p className="mb-1 font-body text-sm text-bone/60">079 095 1258</p>
          <p className="font-body text-sm text-bone/60">thechickenbarbj@gmail.com</p>
        </div>

        <div>
          <h4 className="mb-3 font-body text-sm font-bold uppercase tracking-wide text-bone">Community</h4>
          <Link href="/reviews" className="block font-body text-sm text-bone/60 transition-colors hover:text-char">
            Customer Reviews
          </Link>
          <Link href="/privacy" className="mt-2 block font-body text-sm text-bone/60 transition-colors hover:text-char">
            Privacy &amp; Trust
          </Link>
        </div>

        <div>
          <h4 className="mb-3 font-body text-sm font-bold uppercase tracking-wide text-bone">Follow</h4>
          <a
            href="https://facebook.com/TheChickenBar"
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-sm text-bone/60 transition-colors hover:text-char"
          >
            Facebook — The Chicken Bar
          </a>
        </div>
      </div>

      <p className="mt-10 text-center font-body text-xs text-bone/30">&copy; The Chicken Bar {new Date().getFullYear()}</p>
    </footer>
  );
}
