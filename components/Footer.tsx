export default function Footer() {
  return (
    <footer className="bg-char-black px-6 md:px-12 py-12 border-t border-bone/10">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 text-center md:text-left">
        <div>
          <h3 className="font-display text-flame text-2xl mb-3">The Chicken Bar</h3>
          <p className="font-body text-bone/60 text-sm">
            Best kasi flame-grilled chicken &amp; meat. Est. 2019, Tsakane.
          </p>
          <p className="font-body text-bone/40 text-xs mt-3">
            Ask us about our car wash service while you wait.
          </p>
        </div>

        <div>
          <h4 className="font-body font-bold text-bone mb-3 uppercase text-sm tracking-wide">
            Contact
          </h4>
          <p className="font-body text-bone/60 text-sm mb-1">065 801 2302</p>
          <p className="font-body text-bone/60 text-sm mb-1">079 095 1258</p>
          <p className="font-body text-bone/60 text-sm">info.thechickenbar@gmail.com</p>
        </div>

        <div>
          <h4 className="font-body font-bold text-bone mb-3 uppercase text-sm tracking-wide">
            Follow
          </h4>
          <a
            href="https://facebook.com/TheChickenBar"
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-bone/60 text-sm hover:text-char transition-colors"
          >
            Facebook — The Chicken Bar
          </a>
        </div>
      </div>

      <p className="font-body text-bone/30 text-xs text-center mt-10">
        &copy; The Chicken Bar {new Date().getFullYear()}
      </p>
    </footer>
  );
}
