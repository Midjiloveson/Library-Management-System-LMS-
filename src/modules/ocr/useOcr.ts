/**
 * useOcr.ts
 * ─────────────────────────────────────────────────────────────
 * PURPOSE:
 *   React hook that runs OCR on a given image URI.
 *   Manages loading / error / result state so the screen stays clean.
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useCallback } from 'react';
import { recogniseText, OcrResult } from './OcrService';

interface UseOcrReturn {
  result: OcrResult | null;
  isLoading: boolean;
  runOcr: (imageUri: string) => Promise<void>;
}

export function useOcr(): UseOcrReturn {
  const [result, setResult] = useState<OcrResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runOcr = useCallback(async (imageUri: string) => {
    setIsLoading(true);
    setResult(null);
    const ocrResult = await recogniseText(imageUri);
    setResult(ocrResult);
    setIsLoading(false);
  }, []);

  return { result, isLoading, runOcr };
}
