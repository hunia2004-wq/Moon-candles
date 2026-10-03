import { Caveat } from "next/font/google";

const caveat = Caveat({ subsets: ["latin"], weight: ["600", "700"] });

export default function HandmadeNote({ accent = "#D8A1AF" }: { accent?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="mb-3 flex items-center justify-center gap-4">
        <span
          className="h-px w-10 md:w-16"
          style={{ backgroundColor: `${accent}` }}
        />
        
        <span
          className="h-px w-10 md:w-16"
          style={{ backgroundColor: `${accent}` }}
        />
      </div>

      <p
        className="text-sm italic leading-relaxed md:text-base"
        style={{
          color: "rgba(0,0,0,0.7)",
          fontFamily: "Georgia, serif",
        }}
      >
        Every piece is truly one-of-a-kind. While the designs may be similar,
        no two items will be exactly the same. That's the artisanal quality
        you won't find in mass-produced goods.
      </p>
    </div>
  );
}