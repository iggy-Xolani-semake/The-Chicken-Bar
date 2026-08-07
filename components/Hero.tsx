import Image from "next/image";
import HeroFeatureStrip from "./HeroFeatureStrip";

export default function Hero() {
  return (
    <section className="texture-wood texture-wood-hero texture-wood-overlay relative min-h-[92vh] flex flex-col justify-center px-6 md:px-12 py-16 overflow-hidden border-b-4 border-flame">
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(circle at 50% 35%, rgba(232,121,31,0.22) 0%, transparent 55%)",
        }}
        aria-hidden="true"
      />

      <div
        className="absolute top-0 left-0 right-0 h-6 bg-flame"
        style={{
          clipPath:
            "polygon(0% 0%, 3% 100%, 7% 20%, 12% 100%, 18% 10%, 24% 100%, 30% 30%, 36% 100%, 42% 0%, 48% 100%, 54% 15%, 60% 100%, 66% 5%, 72% 100%, 78% 25%, 84% 100%, 90% 0%, 96% 100%, 100% 20%, 100% 0%)",
        }}
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto w-full relative z-10 grid md:grid-cols-2 gap-10 md:gap-14 items-center">
        <div>
          <div className="flex items-center gap-4 mb-6 justify-center md:justify-start">
            <div className="shrink-0 relative">
              <div
                className="absolute inset-0 rounded-full blur-xl opacity-50"
                style={{ background: "var(--color-flame)" }}
                aria-hidden="true"
              />
              <Image
                src="/logo/badge-final.png"
                alt="The Chicken Bar — Best Kasi Flame Grilled Chicken & Meat, established 2019"
                width={140}
                height={140}
                priority
                className="relative w-20 h-20 md:w-24 md:h-24 drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
              />
            </div>
            <p className="font-utility text-char text-sm tracking-[0.2em] uppercase text-left">
              Est. 2019
              <br />
              Tsakane, Ekurhuleni
            </p>
          </div>

          <div className="text-center md:text-left">
            <h1 className="font-display text-flame text-[11vw] md:text-[3.75rem] leading-[0.95] tracking-tight mb-6 drop-shadow-[3px_3px_0_rgba(0,0,0,0.4)]">
              Kasi Flame-Grilled Chicken and Meat
            </h1>

            <p className="font-body text-bone/80 text-lg md:text-xl max-w-xl mb-8">
              Made fresh in Tsakane. Come for the chicken, stay for the vibes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <a
                href="/menu"
                className="shine-on-hover font-body font-bold text-lg uppercase tracking-wide bg-flame text-bone px-10 py-4 rounded-sm shadow-[4px_4px_0_rgba(0,0,0,0.5)] hover:shadow-[2px_2px_0_rgba(0,0,0,0.5)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all focus-visible:outline focus-visible:outline-3 focus-visible:outline-char focus-visible:outline-offset-2"
              >
                View Menu
              </a>
            </div>
          </div>
        </div>

        <HeroFeatureStrip />
      </div>
    </section>
  );
}
