import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ProductDetailView from "@/app/components/ProductDetailView";
import BloomWandBuilder from "@/app/components/BloomWandBuilder";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select("name, description")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  return pageMeta(
    data?.name ?? "Handmade Candle",
        data?.description
      ? data.description.length > 155
        ? data.description.slice(0, data.description.lastIndexOf(" ", 155)) + "…"
        : data.description
      : "Handmade candle from The Moon Candle Shop.",
    `/product/${id}`
  );
}

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