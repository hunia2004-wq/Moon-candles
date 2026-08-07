import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ProductDetailView from "@/app/components/ProductDetailView";

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

  return <ProductDetailView product={product} />;
}
