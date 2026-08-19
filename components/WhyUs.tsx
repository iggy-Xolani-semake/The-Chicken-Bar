const reasons = [
  {
    title: "Flame-Grilled, Always",
    body: "Real flavour, grilled the kasi way, every time.",
  },
  {
    title: "Est. 2019",
    body: "Been serving Tsakane since 2019. We know what the neighborhood actually wants to eat.",
  },
  {
    title: "Food + Vibes",
    body: "We're not just a takeaway spot. Majita Monday, events, community — come for the chicken, stay for the vibes.",
  },
  {
    title: "Car Wash On-Site",
    body: "Get your car washed while you wait for your order.",
  },
];

export default function WhyUs() {
  return (
    <section className="texture-wood texture-wood-events texture-wood-overlay px-6 md:px-12 py-20 md:py-28">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-display text-bone text-5xl md:text-6xl text-center mb-14">
          Why The Chicken Bar
        </h2>
        <div className="flex flex-col md:flex-row gap-10 items-center">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 flex-1">
            {reasons.map((r) => (
              <div key={r.title} className="text-center">
                <h3 className="font-body font-bold text-flame text-xl mb-2">{r.title}</h3>
                <p className="font-body text-bone/70">{r.body}</p>
              </div>
            ))}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/food/why-choose-meat.jpg"
            alt="A plate of food at The Chicken Bar"
            className="w-full md:w-64 h-48 object-cover rounded-sm shadow-lg shrink-0"
          />
        </div>
      </div>
    </section>
  );
}
