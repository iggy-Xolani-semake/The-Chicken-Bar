export default function Location() {
  const address = "114 Bhala Street, Tsakane (ECentre), Gauteng, South Africa";
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <section className="texture-wood texture-wood-gallery texture-wood-overlay px-6 md:px-12 py-12 md:py-16">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-display text-bone text-4xl md:text-5xl mb-6">Find Us</h2>
        <p className="font-body text-bone/80 text-lg mb-2">114 Bhala Street</p>
        <p className="font-body text-bone/80 text-lg mb-8">Tsakane (ECentre), Gauteng</p>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block font-body font-bold uppercase tracking-wide bg-flame text-bone px-8 py-4 rounded-sm hover:bg-ember transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-char focus-visible:outline-offset-2"
        >
          Get Directions
        </a>
      </div>
    </section>
  );
}
