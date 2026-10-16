import { pageMeta } from '@/lib/seo'
import MiniClient from './MiniClient'

export const metadata = pageMeta('Custom Mini Candle', 'Make a mini candle with your own label design.', '/customize-mini')

export default function Page() {
  return <MiniClient />
}
