import Link from "next/link";
import Tag from "./Tag";
import ScrollReveal from "./ScrollReveal";
import MeditatingMascot from "./MeditatingMascot";

export default function Hero() {
  return (
    <section className="mx-auto flex w-full max-w-[1200px] flex-col gap-16 px-6 pb-20 pt-8 lg:flex-row lg:items-center lg:gap-8">
      <ScrollReveal as="div" className="flex flex-1 flex-col items-start gap-8">
        <Tag>RAG-powered chat</Tag>

        <h1 className="font-display text-heading-lg uppercase text-carbon-black sm:text-display lg:text-display-xl">
          Sab tayyari ho gayi,
          <br />

          <span className="inline-block bg-voltage-yellow px-2 py-1">
            <span className="block leading-none">padhna</span>
            <span className="block leading-none">reh gaya</span>
          </span>
        </h1>

        <p className="max-w-md text-subheading-lg text-slate">
          Create a workspace, drop in your PDFs, and ask questions in plain
          language. padhle retrieves the exact passage behind every answer —
          then helps you turn it into a short note.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/auth/sign-up"
            className="rounded-lg bg-carbon-black px-6 py-4 text-body font-medium text-paper-white transition-opacity hover:opacity-80"
          >
            Create a workspace
          </Link>
          <Link
            href="#how-it-works"
            className="rounded border-[1.5px] border-slate px-6 py-4 text-body font-medium text-slate transition-colors hover:border-carbon-black hover:text-carbon-black"
          >
            See how it works
          </Link>
        </div>
      </ScrollReveal>

      <ScrollReveal as="div" className="flex flex-1 justify-center" delay={150}>
        <MeditatingMascot className="w-64 animate-levitate sm:w-80" />
      </ScrollReveal>
    </section>
  );
}
