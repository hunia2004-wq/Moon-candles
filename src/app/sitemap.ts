import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const base = 'https://www.themooncandlesshop.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    '',
    '/shop',
    '/giveaways',
    '/bloom-wand',
    '/customize',
    '/customize/tambourine',
    '/customize/fan',
    '/customize-mini',
    '/return-policy',
  ].map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
  }))

  let productRoutes: MetadataRoute.Sitemap = []
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase
      .from('products')
         .select('id')
      .is('deleted_at', null)
      .eq('is_active', true)

    productRoutes = (data ?? []).map((p) => ({
      url: `${base}/product/${p.id}`,
      lastModified: new Date(),
    }))
  } catch {
    // sitemap still works with static routes if Supabase fails
  }

  return [...staticRoutes, ...productRoutes]
}