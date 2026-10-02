import { downloadUrl, type CustomerImage } from "@/lib/customerImages";

const ACCENT = "#DE4B33";

function ImageCard({ img, baseName }: { img: CustomerImage; baseName: string }) {
  const fileName = [baseName, img.side, img.label].filter(Boolean).join("-");

  return (
    <div className="flex flex-col gap-2">
      <img
        src={img.url}
        alt=""
        className="h-24 w-full rounded-lg object-contain"
        style={{ backgroundColor: "#F3EBD9" }}
      />
      {img.heading && (
        <p className="text-[11px] font-semibold" style={{ color: "rgba(0,0,0,0.7)" }}>
          {img.heading}
        </p>
      )}
      <a
        href={downloadUrl(img.url, fileName)}
        className="block rounded-full px-3 py-1.5 text-center text-[11px] font-semibold"
        style={{ backgroundColor: ACCENT, color: "#FFF4E6" }}
      >
        {img.heading ? "Download image" : `Download ${img.label}`}
      </a>
    </div>
  );
}

export default function CustomerImageDownloads({
  images,
  baseName,
}: {
  images: CustomerImage[];
  baseName: string;
}) {
  if (images.length === 0) return null;

  const hasSides = images.some((img) => img.side);
  const unsided = images.filter((img) => !img.side);

  return (
    <div className="mt-2 flex flex-col gap-3">
      {hasSides && (
        <div className="grid grid-cols-2 gap-3">
          {(["front", "back"] as const).map((side) => {
            const sideImages = images.filter((img) => img.side === side);

            return (
              <div
                key={side}
                className="rounded-xl p-3"
                style={{ border: "1px solid rgba(0,0,0,0.1)", backgroundColor: "#FFFFFF" }}
              >
                <p
                  className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em]"
                  style={{ color: ACCENT }}
                >
                  {side === "front" ? "Front" : "Back"}
                </p>

                {sideImages.length === 0 ? (
                  <p className="text-xs" style={{ color: "rgba(0,0,0,0.5)" }}>
                    Nothing on this side
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {sideImages.map((img, n) => (
                      <ImageCard key={n} img={img} baseName={baseName} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {unsided.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {unsided.map((img, n) => (
            <ImageCard key={n} img={img} baseName={baseName} />
          ))}
        </div>
      )}
    </div>
  );
}