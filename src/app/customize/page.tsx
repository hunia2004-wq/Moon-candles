import { pageMeta } from '@/lib/seo'
import CustomizeClient from './CustomizeClient'

export const metadata = pageMeta('Custom Photo Candle', 'Make a personalized candle gift. Add your photo and a message to the label and preview it on the jar before you order.', '/customize')

export default function Page() {
  return <CustomizeClient />
}
