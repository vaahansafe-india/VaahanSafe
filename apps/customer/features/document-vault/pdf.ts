let modulePromise: Promise<typeof import("pdfjs-dist")> | undefined;
// Vendor assets stay on the customer origin, including on a shared-document page.
export const pdfAssets = {
  cMapUrl: "/pdfjs/6.4.299/cmaps/",
  cMapPacked: true,
  standardFontDataUrl: "/pdfjs/6.4.299/standard_fonts/",
  wasmUrl: "/pdfjs/6.4.299/wasm/",
};
export async function pdfLibrary() {
  modulePromise ??= import("pdfjs-dist");
  const pdf = await modulePromise;
  pdf.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker-6.4.299.min.mjs";
  return pdf;
}
export async function thumbnail(file: File): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  if (file.type === "application/pdf") {
    const pdf = await pdfLibrary();
    const task = pdf.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      ...pdfAssets,
      enableXfa: false,
    });
    let document;
    try {
      document = await task.promise;
      const page = await document.getPage(1);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({
        scale: Math.min(400 / base.width, 400 / base.height),
      });
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    } catch {
      return null;
    } finally {
      await task.destroy();
    }
  } else {
    let image: ImageBitmap;
    try {
      image = await createImageBitmap(file);
    } catch {
      return null;
    }
    const scale = Math.min(1, 400 / image.width, 400 / image.height);
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.close();
  }
  return new Promise((resolve) =>
    canvas.toBlob(
      (blob) => resolve(blob && blob.size <= 131072 ? blob : null),
      "image/webp",
      0.75,
    ),
  );
}
