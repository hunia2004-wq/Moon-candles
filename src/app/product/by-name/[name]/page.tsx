import { notFound } from "next/navigation";
import ProductDetailView from "@/app/components/ProductDetailView";
import BloomWandBuilder from "@/app/components/BloomWandBuilder";
import { productMeta } from "@/lib/seo";
import { getProductByName } from "@/lib/products";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const product = await getProductByName(decodeURIComponent(name));
  return productMeta(product, product ? `/product/${product.id}` : "/shop");
}

export default async function ProductByName({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const product = await getProductByName(decodeURIComponent(name));

  if (!product) {
    notFound();
  }

  if (product.name === "Bloom Wand") {
    return <BloomWandBuilder product={product} />;
  }

  return <ProductDetailView key={product.id} product={product} />;
}