"use client";

import { useState } from "react";

const MAX_MB = 80;

export default function VideoUploadInput({
  label,
  disabled,
  onUploaded,
}: {
  label: string;
  disabled?: boolean;
  onUploaded: (url: string) => void;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the same file be chosen again later
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setError("Choose a video file (MP4, MOV or WebM).");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`That video is over ${MAX_MB} MB. Trim it or record a shorter clip.`);
      return;
    }

    setError("");
    setProgress(0);
    try {
      const sigRes = await fetch("/api/upload/sign", { method: "POST" });
      const sig = await sigRes.json().catch(() => ({}));
      if (!sigRes.ok) throw new Error(sig.error || "Could not start the upload.");

      const form = new FormData();
      form.append("file", file);
      Object.entries(sig.params).forEach(([k, v]) => form.append(k, String(v)));
      form.append("api_key", sig.apiKey);
      form.append("signature", sig.signature);

      const url = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => {
          try {
            const body = JSON.parse(xhr.responseText);
            if (xhr.status < 300 && body.secure_url) resolve(body.secure_url);
            else reject(new Error(body.error?.message || "Upload failed."));
          } catch {
            reject(new Error("Upload failed."));
          }
        };
        xhr.onerror = () => reject(new Error("Network error during the upload."));
        xhr.send(form);
      });

      onUploaded(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setProgress(null);
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        onChange={handleChange}
        disabled={disabled || progress !== null}
        className="w-full text-sm disabled:opacity-50"
      />
      {progress !== null && (
        <div className="mt-2">
          <div className="h-2 overflow-hidden rounded bg-neutral-200">
            <div className="h-2 bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-xs text-neutral-500">Uploading {progress}%. Keep this page open.</p>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
