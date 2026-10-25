// Renders the simple text format used in content/terms.ts.
export default function LegalText({ text }: { text: string }) {
  const blocks = text.trim().split(/\n{2,}/);
  let n = 0;

  return (
    <div className="space-y-4 text-neutral-700">
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) {
          n += 1;
          return (
            <h2 key={i} className="pt-4 text-xl font-semibold text-neutral-900">
              {n}. {block.slice(3)}
            </h2>
          );
        }
        const lines = block.split("\n");
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-6">
              {lines.map((l, j) => (
                <li key={j}>{l.slice(2)}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{lines.join(" ")}</p>;
      })}
    </div>
  );
}
