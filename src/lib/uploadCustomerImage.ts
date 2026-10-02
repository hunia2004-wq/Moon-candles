import { createClient } from "@/lib/supabase/client";

export async function uploadCustomerImage(file: File, folder: string): Promise<string> {
  const supabase = createClient();
  const ext = file.type === "image/png" ? "png" : "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("customer-uploads")
    .upload(path, file, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) throw error;

  return supabase.storage.from("customer-uploads").getPublicUrl(path).data.publicUrl;
}