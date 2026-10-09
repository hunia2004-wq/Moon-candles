export async function shrinkImage(
  file: File,
  maxSide = 2000,
  quality = 0.85
): Promise<File> {
  try {
    let bitmap: ImageBitmap;

    try {
      bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Some browsers don't accept the options argument
      bitmap = await createImageBitmap(file);
    }

    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));

    // Already small: keep the original
    if (scale === 1 && file.size < 800 * 1024) {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }

    // White behind the photo, in case a PNG has transparent areas
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );

    if (!blob) return file;

    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", {
      type: "image/jpeg",
    });
  } catch {
    // If anything goes wrong, upload the original photo as before
    return file;
  }
}