import { notFound, permanentRedirect } from "next/navigation";
import { getProductByName } from "@/lib/products";

export const dynamic = "force-dynamic";

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

  permanentRedirect(`/product/${product.id}`);
}