export default function Loading() {
  return (
    <div
      className="flex flex-1 flex-col items-center font-sans"
      style={{ backgroundColor: "#efe3c4" }}
    >
      <div className="h-10 w-full md:h-14" style={{ backgroundColor: "#FFF4E6" }} />

      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 md:px-16 md:py-16">
        <div
          className="mb-3 h-4 w-40 animate-pulse rounded-full"
          style={{ backgroundColor: "#FFF4E6" }}
        />
        <div
          className="mb-8 h-10 w-64 animate-pulse rounded-full md:h-14"
          style={{ backgroundColor: "#FFF4E6" }}
        />

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div
                className="aspect-square w-full animate-pulse rounded-2xl"
                style={{ backgroundColor: "#FFF4E6" }}
              />
              <div
                className="h-4 w-3/4 animate-pulse rounded-full"
                style={{ backgroundColor: "#FFF4E6" }}
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}