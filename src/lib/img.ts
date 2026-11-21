export function optimized(url: string | null | undefined, width = 640) {
  if (!url) return "";
  if (!url.includes("/storage/v1/object/public/")) return url;
  return `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=75`;
}