import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ProductDetailView from "@/app/components/ProductDetailView";

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
    .single();

  if (error || !product) {
    notFound();
  }

  return <ProductDetailView product={product} />;
}
export const dynamicParams = false;