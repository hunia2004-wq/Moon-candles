import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ProductDetailView from "@/app/components/ProductDetailView";
import BloomWandBuilder from "@/app/components/BloomWandBuilder";

export const dynamic = "force-dynamic";

export default async function ProductByName({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const supabase = await createClient();

  const { data: product, error } = await supabase
  .from("products")
  .select("*")
  .eq("name", decodedName)
  .eq("is_active", true)
  .single();

  if (error || !product) {
    notFound();
  }

  if (product.name === "Bloom Wand") {
    return <BloomWandBuilder product={product} />;
  }
return <ProductDetailView key={product.id} product={product} />;
}