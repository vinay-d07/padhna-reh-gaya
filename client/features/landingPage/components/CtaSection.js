import Link from "next/link";
import Tag from "./Tag";
import ScrollReveal from "./ScrollReveal";

export default function CtaSection() {
  return (
    <section id="notes" className="mx-auto w-full max-w-[1200px] px-6 py-20">
      <ScrollReveal
        as="div"
        className="flex flex-col items-start gap-8 rounded-hero bg-paper-white p-10 sm:p-16"
      >
        <Tag>Start free</Tag>
        <h2 className="font-display text-heading uppercase text-carbon-black sm:text-heading-lg lg:text-display">
          Stop re-reading.
          <br />
          Start asking.
        </h2>
        <p className="max-w-md text-subheading text-slate">
          Your first workspace is free to create. Upload a PDF and ask it
          your first question in under a minute.
        </p>
        <Link
          href="/auth/sign-up"
          className="rounded-lg bg-carbon-black px-6 py-4 text-body font-medium text-paper-white transition-opacity hover:opacity-80"
        >
          Create a workspace
        </Link>
      </ScrollReveal>
    </section>
  );
}
