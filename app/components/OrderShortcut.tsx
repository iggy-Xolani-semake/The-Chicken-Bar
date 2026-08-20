import Image from "next/image";
import Link from "next/link";

const ORDER_PATHS = [
  {
    title: "Flame-grilled chicken & meat",
    detail: "The Chicken Bar classics, hot off the fire.",
    image: "/food/why-choose-meat.jpg",
    alt: "Flame-grilled chicken and meat platter",
  },
  {
    title: "Burgers, kota & wraps",
    detail: "Big flavour when you want something different.",
    image: "/food/burger.jpg",
    alt: "Chicken Bar burger and fries",
  },
  {
    title: "Majita Monday",
    detail: "Kasi favourites, food and proper vibes.",
    image: "/food/fofo-special.jpg",
    alt: "Chicken Bar Fofo Special meal",
    href: "/majita-monday",
  },
];

export default function OrderShortcut() {
  return (
    <section className="border-y-4 border-flame bg-char-black px-5 py-12 sm:px-6 md:px-12 md:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-col gap-3 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-utility text-xs font-bold uppercase tracking-[0.26em] text-char">
              Hungry now?
            </p>
            <h2 className="mt-2 font-display text-4xl leading-none text-bone sm:text-5xl">
              Pick your craving.
            </h2>
          </div>
          <Link
            href="/menu"
            className="inline-flex min-h-11 items-center justify-center border border-flame px-4 py-2 font-body text-sm font-bold uppercase tracking-wide text-char transition-colors hover:bg-flame hover:text-bone sm:self-auto"
          >
            See the full menu
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {ORDER_PATHS.map((path) => (
            <Link
              key={path.title}
              href={path.href ?? "/menu"}
              className="group relative min-h-44 overflow-hidden border border-bone/15 bg-smoke-light focus-visible:outline focus-visible:outline-3 focus-visible:outline-char"
            >
              <Image
                src={path.image}
                alt={path.alt}
                fill
                sizes="(max-width: 639px) 100vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <h3 className="font-display text-2xl leading-none text-bone">{path.title}</h3>
                <p className="mt-2 max-w-xs font-body text-sm text-bone/85">{path.detail}</p>
                <span className="mt-3 inline-flex font-utility text-xs font-bold uppercase tracking-[0.18em] text-char">
                  Choose this
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
