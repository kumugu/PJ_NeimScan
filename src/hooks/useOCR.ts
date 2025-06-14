import { useState, useCallback } from 'react';
import type { UseOCRReturn, OCRResult } from '../types/index';

export const useOCR = (): UseOCRReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processOCR = useCallback(async (imageData: string): Promise<OCRResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // base64 데이터에서 헤더 제거
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Data,
          format: 'jpg',
          lang: 'ko'
        }),
      });

      if (!response.ok) {
        throw new Error(`OCR API 오류: ${response.status}`);
      }

      const result = await response.json();
      
      // 네이버 클로바 OCR 응답에서 텍스트 추출
      const extractedText = result.images?.[0]?.fields?.map((field: any) => 
        field.inferText
      ).join(' ') || '';

      // 이름과 금액 자동 추출 로직
      const nameMatch = extractedText.match(/([가-힣]{2,4})\s*(?:님|씨|군|양)?/);
      const amountMatch = extractedText.match(/(\d{1,3}(?:,\d{3})*)\s*(?:원|만원)/);
      
      let amount = 0;
      if (amountMatch) {
        const numStr = amountMatch[1].replace(/,/g, '');
        amount = parseInt(numStr, 10);
        if (extractedText.includes('만원')) {
          amount *= 10000;
        }
      }

      return {
        extractedText,
        name: nameMatch ? nameMatch[1] : undefined,
        amount: amount > 0 ? amount : undefined,
        confidence: result.images?.[0]?.inferResult === 'SUCCESS' ? 0.9 : 0.5
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OCR 처리 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    processOCR,
    isLoading,
    error
  };
};
