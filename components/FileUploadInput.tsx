"use client";

import { useState } from "react";

// Vercel rejects request bodies over ~4.5 MB. Base64 adds ~33%, so we keep the
// compressed image under 2.5 MB (about 3.4 MB once encoded) to stay safely below.
const MAX_BYTES = 2_500_000;

// Photos: plenty sharp for listings. ID documents: larger and higher quality so text stays readable.
const PRESETS = {
  photo: { maxSide: 1600, quality: 0.8 },
  id_document: { maxSide: 2200, quality: 0.88 },
} as const;

async function loadBitmap(file: File): Promise<{ source: CanvasImageSource; width: number; height: number }> {
  // createImageBitmap applies EXIF rotation, so phone photos are not sideways.
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bmp, width: bmp.width, height: bmp.height };
    } catch {
      // fall through to <img>
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("decode"));
      i.src = url;
    });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/jpeg", quality);
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Resizes and re-encodes as JPEG, lowering quality/size until it fits under MAX_BYTES. */
async function compressImage(file: File, kind: "photo" | "id_document"): Promise<string> {
  const { maxSide, quality } = PRESETS[kind];
  const { source, width, height } = await loadBitmap(file);

  let side: number = maxSide;
  let q: number = quality;

  for (let attempt = 0; attempt < 6; attempt++) {
    const scale = Math.min(1, side / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    // PNGs with transparency would turn black as JPEG, so paint white first.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

    const blob = await canvasToBlob(canvas, q);
    if (blob.size <= MAX_BYTES) return blobToDataUrl(blob);

    q = Math.max(0.5, q - 0.1);
    side = Math.round(side * 0.85);
  }
  throw new Error("too-large");
}

export default function FileUploadInput({
  label,
  kind,
  multiple = false,
  onUploaded,
}: {
  label: string;
  kind: "photo" | "id_document";
  multiple?: boolean;
  onUploaded: (urls: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [previewCount, setPreviewCount] = useState(0);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const files = Array.from(input.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setError("");
    const urls: string[] = [];

    try {
      for (const file of files) {
        let base64: string;
        try {
          base64 = await compressImage(file, kind);
        } catch (err) {
          if (err instanceof Error && err.message === "too-large") {
            throw new Error("That image is too large even after shrinking. Try a smaller one.");
          }
          throw new Error(
            "We couldn't read that image. Please use a JPG or PNG (iPhone users: set Camera to \"Most Compatible\" or screenshot the photo)."
          );
        }

        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64, kind }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || "Upload failed.");
        }
        const data = await res.json();
        urls.push(data.url);
      }
      setPreviewCount(urls.length);
      onUploaded(urls);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Try again.");
    } finally {
      setUploading(false);
      input.value = ""; // lets the same file be picked again after an error
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleChange}
        className="w-full text-sm"
      />
      {uploading && <p className="mt-1 text-xs text-neutral-500">Preparing and uploading...</p>}
      {previewCount > 0 && !uploading && (
        <p className="mt-1 text-xs text-brand-700">{previewCount} file(s) uploaded.</p>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
