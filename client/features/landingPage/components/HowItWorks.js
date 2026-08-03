import ScrollReveal from "./ScrollReveal";

const STEPS = [
  {
    number: "01",
    title: "Create a workspace",
    description: "Spin up a workspace for a class, project, or topic.",
  },
  {
    number: "02",
    title: "Upload your PDFs",
    description: "Add documents — they're chunked and embedded automatically.",
  },
  {
    number: "03",
    title: "Ask anything",
    description:
      "RAG retrieves the relevant chunks and grounds the answer in your own documents.",
  },
  {
    number: "04",
    title: "Save it as a note",
    description: "Turn any answer into a short note stored next to its source.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="w-full bg-carbon-black py-20 text-paper-white">
      <div className="mx-auto w-full max-w-[1200px] px-6">
        <ScrollReveal as="h2" className="mb-16 font-display text-heading uppercase sm:text-heading-lg">
          How it works
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <ScrollReveal
              as="div"
              key={step.number}
              delay={index * 120}
              className="flex flex-col gap-3"
            >
              <span className="font-mono text-caption uppercase text-mint-chip">
                {step.number}
              </span>
              <h3 className="text-subheading-lg font-medium uppercase">
                {step.title}
              </h3>
              <p className="text-body-sm text-smoke">{step.description}</p>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
