import { pageMeta } from '@/lib/seo'
import TambourineClient from './TambourineClient'

export const metadata = pageMeta('Custom Tambourine', 'Design a hand-decorated tambourine with your own layers and colors.', '/customize/tambourine')

export default function Page() {
  return <TambourineClient />
}
