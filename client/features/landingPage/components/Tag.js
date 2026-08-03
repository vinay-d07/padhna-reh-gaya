export default function Tag({ children, tone = "mint" }) {
  const tones = {
    mint: "bg-mint-chip text-carbon-black",
    yellow: "bg-voltage-yellow text-carbon-black",
    dark: "bg-carbon-black text-paper-white",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-4 py-1.5 font-mono text-caption uppercase ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
