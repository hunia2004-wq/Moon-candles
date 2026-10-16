import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import BloomWandBuilder from "../components/BloomWandBuilder";
import { pageMeta } from '@/lib/seo'
export const dynamic = "force-dynamic";
export const metadata = pageMeta('Bloom Wand', 'Build your own Bloom Wand order, step by step.', '/bloom-wand')
export default async function BloomWandPage() {
  const supabase = await createClient();
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("name", "Bloom Wand")
    .single();

  if (error || !product) {
    notFound();
  }

  return <BloomWandBuilder product={product} />;
}