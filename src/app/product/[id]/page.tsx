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
        .select("*")
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
    `/product/${id}`,
       (() => {
      const fromUrls = Array.isArray(data?.image_urls)
        ? data.image_urls.find((u: unknown) => typeof u === "string" && u)
        : undefined;
      if (fromUrls) return fromUrls as string;

      const c = Array.isArray(data?.colors) ? data.colors[0] : undefined;
      const fromColor =
        c?.image_url ??
        c?.image ??
        (Array.isArray(c?.image_urls) ? c.image_urls[0] : undefined) ??
        (Array.isArray(c?.images) ? c.images[0] : undefined);
      return typeof fromColor === "string" ? fromColor : undefined;
    })()
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