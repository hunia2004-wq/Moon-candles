import { createClient } from "@/lib/supabase/server";
import ShopGrid from "../components/ShopGrid";

export default async function Shop() {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch products:", error.message);
  }

  return (
    <div
      className="flex flex-1 flex-col items-center font-sans"
      style={{
        background: "linear-gradient(to bottom, #C77486 0%, #F4E1D2 40%, #F4E1D2 100%)",
      }}
    >
      <main className="w-full max-w-4xl px-6 py-16 md:px-16">
        <h1
          className="mb-10 text-3xl font-bold tracking-wide"
          style={{ color: "#5E3A4D" }}
        >
          Shop All
        </h1>

        <ShopGrid products={products ?? []} />
      </main>
    </div>
  );
}