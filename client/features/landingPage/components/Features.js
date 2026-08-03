import Tag from "./Tag";
import ScrollReveal from "./ScrollReveal";

const FEATURES = [
  {
    tag: "Organize",
    title: "Workspaces",
    description:
      "Group documents by subject, project, or class. Every workspace keeps its own chat history and notes.",
  },
  {
    tag: "Upload",
    title: "Add documents",
    description:
      "Drop in PDFs and they're automatically chunked and indexed, ready to be queried in seconds.",
  },
  {
    tag: "Ask",
    title: "Chat with your PDFs",
    description:
      "Ask questions in plain language. RAG retrieves the most relevant passages before the model answers.",
  },
  {
    tag: "Ground",
    title: "Source-grounded answers",
    description:
      "Every answer cites the page it came from — no rereading a 40-page PDF to check if it's true.",
  },
  {
    tag: "Capture",
    title: "Short notes",
    description:
      "Turn any answer or highlight into a bite-sized note, saved right next to its source.",
  },
  {
    tag: "Find",
    title: "Semantic search",
    description:
      "Search by meaning, not just keywords, across every document in a workspace at once.",
  },
];

export default function Features() {
  return (
    <section id="features" className="mx-auto w-full max-w-[1200px] px-6 py-20">
      <ScrollReveal as="div" className="mb-16 max-w-2xl">
        <h2 className="font-display text-heading uppercase text-carbon-black sm:text-heading-lg">
          Everything a workspace needs
        </h2>
        <p className="mt-4 text-subheading text-slate">
          One place to hold your documents, your questions, and the notes you
          take along the way.
        </p>
      </ScrollReveal>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, index) => (
          <ScrollReveal
            as="div"
            key={feature.title}
            delay={(index % 3) * 100}
            className="flex flex-col gap-4 rounded-card bg-paper-white p-6"
          >
            <Tag>{feature.tag}</Tag>
            <h3 className="font-sans text-heading-sm font-medium uppercase text-carbon-black">
              {feature.title}
            </h3>
            <p className="text-body text-slate">{feature.description}</p>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
