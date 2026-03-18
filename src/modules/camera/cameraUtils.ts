/**
 * cameraUtils.ts
 * ─────────────────────────────────────────────────────────────
 * PURPOSE:
 *   Pure utility functions for processing captured images before
 *   they are passed to the OCR module. Keeps business logic out
 *   of the UI layer (CameraScreen.tsx).
 *
 * PATTERN:  Pure functions — no hooks, no side effects.
 * ─────────────────────────────────────────────────────────────
 */

import { PhotoFile } from 'react-native-vision-camera';

// ─── Types ────────────────────────────────────────────────────

/** Normalised image descriptor passed between modules */
export interface CapturedImage {
  uri: string;       // local file:// path to the photo
  width: number;
  height: number;
  timestamp: number; // ms epoch — useful for ordering multi-page scans
}

// ─── Helpers ──────────────────────────────────────────────────

/**
 * normaliseCapturedPhoto
 * Maps the raw PhotoFile from react-native-vision-camera to our
 * internal CapturedImage shape so the rest of the app never
 * depends directly on the camera library's types.
 */
export function normaliseCapturedPhoto(photo: PhotoFile): CapturedImage {
  return {
    // Vision Camera gives a path without the scheme on iOS — add it
    uri: photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`,
    width: photo.width,
    height: photo.height,
    timestamp: Date.now(),
  };
}

/**
 * isUsableImage
 * Basic sanity check: reject blurry / tiny captures before OCR.
 * Expand this with blur-detection logic later if needed.
 */
export function isUsableImage(image: CapturedImage): boolean {
  const MIN_DIMENSION = 400; // px — anything smaller is unlikely readable
  return image.width >= MIN_DIMENSION && image.height >= MIN_DIMENSION;
}
