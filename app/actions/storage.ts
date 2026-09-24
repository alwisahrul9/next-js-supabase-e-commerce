"use server";

import { supabase } from "../lib/db";

function extractStoragePath(url: string, bucketName: string): string | null {
  if (!url || typeof url !== "string") return null;

  // Pattern pencarian URL public Supabase
  const searchPattern = `/storage/v1/object/public/${bucketName}/`;
  const index = url.indexOf(searchPattern);

  if (index !== -1) {
    // Ambil string setelah nama bucket dan bersihkan jika ada query params (misal ?t=123)
    const relativePath = url.substring(index + searchPattern.length);
    return relativePath.split("?")[0];
  }

  return null;
}

export async function deleteProductImagesOnUpdate(
  imageUrls: string[],
  bucketName: string = "product-images",
) {
  if (!imageUrls || imageUrls.length === 0) return;

  // Ekstrak path untuk tiap URL
  const pathsToDelete = imageUrls
    .map((url) => extractStoragePath(url, bucketName))
    .filter((path): path is string => path !== null && path.length > 0);

  if (pathsToDelete.length === 0) {
    console.warn(
      "Tidak ada path gambar valid yang dapat diekstrak untuk dihapus.",
    );
    return;
  }

  try {
    // Panggil method remove milik Supabase SDK
    const { data, error } = await supabase.storage
      .from(bucketName)
      .remove(pathsToDelete);

    if (error) {
      console.error(
        "Error dari Supabase Storage saat menghapus file:",
        error.message,
      );
    } else {
      console.log(
        `Berhasil menghapus ${data?.length || 0} file dari bucket '${bucketName}':`,
        pathsToDelete,
      );
    }
  } catch (err) {
    console.error("Failed to execute remove image command:", err);
  }
}

export async function uploadImage(formData: FormData): Promise<{ success: boolean; url?: string; message?: string }> {
  try {
    const file = formData.get("file") as File;
    const bucket = (formData.get("bucket") as string) || "stores";

    if (!file) {
      return { success: false, message: "No file provided" };
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `uploads/${crypto.randomUUID()}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type || 'image/jpeg',
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return { success: false, message: error.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return { success: true, url: publicUrlData.publicUrl };
  } catch (err: any) {
    console.error("Upload failed:", err);
    return { success: false, message: err.message };
  }
}
