import Image from "next/image";

export default function MajitaMonday() {
  return (
    <section className="texture-wood texture-wood-majita texture-wood-overlay px-6 md:px-12 py-20 md:py-28 border-y-4 border-flame">
      <div className="max-w-4xl mx-auto text-center">
        <Image
          src="/logo/majita-wordmark-white.png"
          alt="Majita Monday — Ox Liver, Pork Trotter, Mogodu"
          width={1511}
          height={512}
          className="mx-auto w-full max-w-lg h-auto mb-6"
        />
        <p className="font-body text-bone/80 text-lg max-w-xl mx-auto mb-4">
          Majita Monday isn&apos;t a scheduled event — it&apos;s people coming
          together informally to share a meal and conversation.
        </p>
        <p className="font-body text-bone/50 text-sm mb-10">
          Food. Vibes. Chill. Music when there&apos;s a DJ, good company always.
        </p>
        <a
          href="/majita-monday"
          className="inline-block font-body font-bold text-lg uppercase tracking-wide bg-flame text-bone px-10 py-4 rounded-sm hover:bg-ember transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-char focus-visible:outline-offset-2"
        >
          Majita Monday Menu
        </a>
      </div>
    </section>
  );
}
