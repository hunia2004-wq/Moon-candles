import { createClient } from "@/lib/supabase/client";

const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
};

export async function uploadCustomerImage(file: File, folder: string): Promise<string> {
  const ext = ALLOWED[file.type];
  if (!ext) throw new Error("Only JPG and PNG images are supported.");

  const supabase = createClient();
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