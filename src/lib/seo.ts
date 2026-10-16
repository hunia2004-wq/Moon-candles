export const SITE_URL = 'https://www.themooncandlesshop.com'
export const SITE_NAME = 'The Moon Candle Shop'
export const SITE_DESCRIPTION =
  'Handmade candles, custom label candles, and giveaways. Design your own candle at The Moon Candle Shop.'

export function pageMeta(title: string, description: string, path = '') {
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
    },
  }
}