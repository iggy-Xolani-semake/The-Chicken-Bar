const reasons = [
  {
    title: "Flame-Grilled, Always",
    body: "Real fire, real flavor. Not steamed, not fried — grilled the kasi way, every time.",
  },
  {
    title: "Est. 2019",
    body: "Been serving Tsakane since 2019. We know what the neighborhood actually wants to eat.",
  },
  {
    title: "Food + Vibes",
    body: "We're not just a takeaway spot. Majita Monday, events, community — come for the chicken, stay for the vibes.",
  },
];

export default function WhyUs() {
  return (
    <section className="bg-smoke-light px-6 md:px-12 py-20 md:py-28">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-display text-bone text-5xl md:text-6xl text-center mb-14">
          Why The Chicken Bar
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {reasons.map((r) => (
            <div key={r.title} className="text-center">
              <h3 className="font-body font-bold text-flame text-xl mb-2">{r.title}</h3>
              <p className="font-body text-bone/70">{r.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
