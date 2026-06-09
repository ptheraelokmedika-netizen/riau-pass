import { supabase } from "./supabase";

export async function uploadFile(bucket: string, path: string, file: File) {
  if (!supabase) throw new Error("Supabase belum terhubung.");

  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: true
  });

  if (error) {
    if (error.message.toLowerCase().includes("bucket")) {
      throw new Error(`Bucket belum dibuat di Supabase Storage: ${bucket}.`);
    }
    throw new Error(error.message);
  }

  return data;
}

export function getPublicUrl(bucket: string, path: string) {
  if (!supabase) throw new Error("Supabase belum terhubung.");
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteFile(bucket: string, path: string) {
  if (!supabase) throw new Error("Supabase belum terhubung.");
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(error.message);
}
