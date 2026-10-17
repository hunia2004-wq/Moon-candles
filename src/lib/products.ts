import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getProductById = cache(async (id: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();
  return data;
});

export const getProductByName = cache(async (name: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("name", name)
    .eq("is_active", true)
    .single();
  return data;
});