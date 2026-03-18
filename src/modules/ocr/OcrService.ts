/**
 * OcrService.ts
 * ─────────────────────────────────────────────────────────────
 * PURPOSE:
 *   Isolates all OCR logic behind a single async function.
 *   The rest of the app never knows whether we're using:
 *     • ML Kit (on-device, free, offline)
 *     • Google Cloud Vision API (cloud, more accurate)
 *     • Tesseract.js (open-source fallback)
 *
 *   Swap the implementation here without touching any UI code.
 *
 * CURRENT STATUS:  ML Kit stub (ready to wire up)
 * LIBRARY:         `npm install @react-native-ml-kit/text-recognition`
 * ─────────────────────────────────────────────────────────────
 */

import TextRecognition from '@react-native-ml-kit/text-recognition';

// ─── Types ────────────────────────────────────────────────────

export interface OcrResult {
  text: string;        // full extracted text block
  confidence?: number; // 0–1 if the OCR engine provides it
  error?: string;      // populated if OCR failed gracefully
}

// ─── Service function ─────────────────────────────────────────

/**
 * recogniseText
 * Takes a local image URI and returns the extracted text.
 *
 * @param imageUri  file:// URI from CapturedImage.uri
 * @returns         OcrResult — always resolves, never rejects
 */
export async function recogniseText(imageUri: string): Promise<OcrResult> {
  try {
    // ML Kit processes the image on-device — no network needed
    const result = await TextRecognition.recognize(imageUri);

    // ML Kit returns blocks → lines → elements; we join everything
    const fullText = result.blocks
      .map(block => block.text)
      .join('\n')
      .trim();

    if (!fullText) {
      return { text: '', error: 'No text detected in image.' };
    }

    return { text: fullText };

  } catch (err) {
    console.error('[OcrService] Recognition failed:', err);
    return {
      text: '',
      error: 'OCR failed. Please retake the photo in better lighting.',
    };
  }
}
