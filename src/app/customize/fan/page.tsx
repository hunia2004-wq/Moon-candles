import { pageMeta } from '@/lib/seo'
import FanClient from './FanClient'

export const metadata = pageMeta('Custom Fan', 'Design a hand-decorated fan with your own layers and colors.', '/customize/fan')

export default function Page() {
  return <FanClient />
}
