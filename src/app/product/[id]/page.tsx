import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ProductDetailView from "@/app/components/ProductDetailView";
import BloomWandBuilder from "@/app/components/BloomWandBuilder";

export const dynamic = "force-dynamic";

export default async function ProductDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !product) {
    notFound();
  }

  if (product.name === "Bloom Wand") {
    return <BloomWandBuilder product={product} />;
  }

  return <ProductDetailView key={product.id} product={product} />;
}