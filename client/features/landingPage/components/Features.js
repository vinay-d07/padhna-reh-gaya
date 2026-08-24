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
  {
    tag: "Repeat",
    title: "Spaced repetition",
    isNew: true,
    description:
      "Grade each flashcard Again, Hard, Good, or Easy and SM-2 reschedules it — you review exactly the ones about to slip.",
  },
  {
    tag: "Test",
    title: "Quiz mode",
    isNew: true,
    description:
      "Auto-generated multiple-choice quizzes per document, scored instantly with an explanation behind every answer.",
  },
  {
    tag: "Together",
    title: "Study rooms",
    isNew: true,
    description:
      "Drop into a live room, see who else is working as an avatar, and watch everyone's study timer run in real time.",
  },
  {
    tag: "Lock",
    title: "Private rooms",
    isNew: true,
    description:
      "Keep a room invite-only behind a join code — share the code or the link, either one gets a friend in.",
  },
  {
    tag: "Chat",
    title: "Room chat",
    isNew: true,
    description:
      "A lightweight group chat alongside every room, so you can ask a quick question without breaking focus.",
  },
  {
    tag: "Focus",
    title: "Personal timer",
    isNew: true,
    description:
      "Start a solo session right from the dashboard — no room required, just a clock counting your focus time.",
  },
];

export default function Features() {
  return (
    <section id="features" className="mx-auto w-full max-w-[1200px] px-6 py-20">
      <ScrollReveal as="div" className="mb-16 max-w-2xl">
        <h2 className="font-display text-heading uppercase text-carbon-black sm:text-heading-lg">
          Everything you need to actually study
        </h2>
        <p className="mt-4 text-subheading text-slate">
          Your documents, your questions, and the notes you take along the
          way — plus review, quizzes, and live study rooms to keep you
          coming back.
        </p>
      </ScrollReveal>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, index) => (
          <ScrollReveal
            as="div"
            key={feature.title}
            delay={(index % 3) * 100}
            className="relative flex flex-col gap-4 rounded-card bg-paper-white p-6"
          >
            {feature.isNew && (
              <span className="absolute right-6 top-6">
                <Tag tone="yellow">New</Tag>
              </span>
            )}
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
