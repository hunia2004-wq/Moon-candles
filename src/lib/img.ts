export function optimized(url: string | null | undefined, width = 640) {
  if (!url) return "";
  if (process.env.NODE_ENV === "development") return url;
  if (!url.includes("/storage/v1/object/public/")) return url;
  return `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=75`;
}