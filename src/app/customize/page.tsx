import { pageMeta } from '@/lib/seo'
import CustomizeClient from './CustomizeClient'

export const metadata = pageMeta('Design Your Own Candle', 'Add your photos and text to a custom label and see it on the jar before you order.', '/customize')

export default function Page() {
  return <CustomizeClient />
}
