import { useState, useCallback } from 'react';

interface OCRResult {
  name: string;
  amount: number;
  extractedText: string[];
  confidence: number;
}

interface UseOCRReturn {
  processOCR: (imageData: string) => Promise<OCRResult>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useOCR(): UseOCRReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processOCR = useCallback(async (imageData: string): Promise<OCRResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'OCR 처리에 실패했습니다.');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'OCR 처리에 실패했습니다.');
      }

      return result.data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OCR 처리 중 알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    processOCR,
    isLoading,
    error,
    clearError,
  };
}