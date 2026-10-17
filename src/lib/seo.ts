export const SITE_URL = 'https://www.themooncandlesshop.com'
export const SITE_NAME = 'The Moon Candle Shop'
export const SITE_DESCRIPTION =
  'Handmade candles, custom photo candles with your own message, and candle giveaways. Design a personalized candle gift at The Moon Candle Shop.'

export function pageMeta(
  title: string,
  description: string,
  path = '',
  image?: string
) {
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}${path}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${path}`,
      siteName: SITE_NAME,
      type: 'website' as const,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? ('summary_large_image' as const) : ('summary' as const),
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

function shorten(text: string, max = 155) {
  if (text.length <= max) return text
  const cut = text.lastIndexOf(' ', max)
  return text.slice(0, cut > 0 ? cut : max) + '…'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function firstImage(product: any): string | undefined {
  const urls = Array.isArray(product?.image_urls) ? product.image_urls : []
  const fromUrls = urls.find((u: unknown) => typeof u === 'string' && u)
  if (fromUrls) return fromUrls

  const c = Array.isArray(product?.colors) ? product.colors[0] : undefined
  const fromColor =
    c?.image_url ??
    c?.image ??
    (Array.isArray(c?.image_urls) ? c.image_urls[0] : undefined) ??
    (Array.isArray(c?.images) ? c.images[0] : undefined)
  return typeof fromColor === 'string' ? fromColor : undefined
}
function shareImage(url?: string) {
  if (!url) return undefined
  return `${SITE_URL}/_next/image?url=${encodeURIComponent(url)}&w=640&q=75`
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function productMeta(product: any, path: string) {
  return pageMeta(
    product?.name ?? 'Handmade Candle',
    product?.description
      ? shorten(product.description)
      : 'Handmade candle from The Moon Candle Shop.',
    path,
      product ? shareImage(firstImage(product)) : undefined
  )
}