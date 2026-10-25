import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Property photos go in a public folder.
 * ID documents go in a restricted folder with access_mode "authenticated"
 * so they cannot be viewed via a guessable public URL. Only server-side
 * requests using signed URLs (generated at review time) can read them.
 */
export async function uploadPropertyPhoto(base64: string) {
  const result = await cloudinary.uploader.upload(base64, {
    folder: "bedlisting/properties",
    // Applied BEFORE the file is stored: caps the size and strips all embedded metadata.
    // Phone photos carry GPS coordinates, and the free preview photo must never reveal
    // where the house is.
    transformation: [{ width: 2000, crop: "limit", flags: "strip_profile" }],
  });
  return result.secure_url;
}

export async function uploadIdDocument(base64: string) {
  const result = await cloudinary.uploader.upload(base64, {
    folder: "bedlisting/verification-private",
    access_mode: "authenticated",
    type: "authenticated",
  });
  return result.secure_url;
}

export function getSignedIdDocumentUrl(publicId: string, format = "jpg") {
  return cloudinary.utils.private_download_url(publicId, format, {
    resource_type: "image",
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + 60 * 10, // 10 minute expiry
  });
}

/**
 * Admin-only: turns the stored URL of a private upload into a 10-minute signed link.
 * Stored URLs look like .../image/authenticated/s--sig--/v123/folder/name.jpg
 */
export function signedUrlFromStoredUrl(storedUrl: string): string | null {
  const m = storedUrl.match(/\/v\d+\/(.+)\.([a-z0-9]+)$/i);
  if (!m) return null;
  return getSignedIdDocumentUrl(m[1], m[2].toLowerCase());
}

// ---------------------------------------------------------------------------
// Video tours. Videos are far too big to send through our own server (Vercel
// limits request bodies to about 4.5 MB), so the browser uploads straight to
// Cloudinary using a short-lived signature from /api/upload/sign. They are
// stored as "authenticated" assets: the raw link does not play, and the
// server only creates playable signed links for people who unlocked the listing.
// ---------------------------------------------------------------------------
export const VIDEO_FOLDER = "bedlisting/videos";
export const MAX_VIDEOS_PER_LISTING = 2;

export function signVideoUpload() {
  const params = {
    timestamp: Math.floor(Date.now() / 1000),
    folder: VIDEO_FOLDER,
    type: "authenticated",
    allowed_formats: "mp4,mov,webm,m4v",
  };
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET as string);
  return {
    params,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
  };
}

/** Only accept video links that really are in our own Cloudinary video folder. */
export function isOurVideoUrl(url: string) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  return (
    !!cloud &&
    url.startsWith(`https://res.cloudinary.com/${cloud}/video/authenticated/`) &&
    url.includes(`/${VIDEO_FOLDER}/`)
  );
}

/** A playable, signed MP4 link (max 1280 px wide, auto quality) for a stored video URL. */
export function signedVideoUrl(storedUrl: string): string | null {
  const m = storedUrl.match(/\/v\d+\/(.+)\.([a-z0-9]+)$/i);
  if (!m) return null;
  return cloudinary.url(m[1], {
    resource_type: "video",
    type: "authenticated",
    sign_url: true,
    secure: true,
    format: "mp4",
    transformation: [{ width: 1280, crop: "limit", quality: "auto" }],
  });
}

export default cloudinary;
