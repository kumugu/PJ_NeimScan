import { useState, useCallback } from 'react';
import type { UseOCRReturn, OCRResult } from '../types/index';

export const useOCR = (): UseOCRReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processOCR = useCallback(async (imageData: string): Promise<OCRResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // Base64 데이터에서 실제 이미지 데이터 추출
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');

      // 네이버 클로바 OCR API 호출
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: base64Data,
          format: 'png'
        }),
      });

      if (!response.ok) {
        throw new Error(`OCR API 호출 실패: ${response.status}`);
      }

      const result = await response.json();
      
      // OCR 결과에서 이름과 금액 추출
      const extractedData = extractNameAndAmount(result.extractedText);

      return {
        extractedText: result.extractedText || '',
        name: extractedData.name,
        amount: extractedData.amount,
        confidence: result.confidence || 0
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

// 텍스트에서 이름과 금액을 추출하는 헬퍼 함수
function extractNameAndAmount(text: string): { name?: string; amount?: number } {
  if (!text) return {};

  let name: string | undefined;
  let amount: number | undefined;

  // 한글 이름 패턴 (2-4글자)
  const namePattern = /([가-힣]{2,4})\s*(?:님|씨|드림|올림)?/g;
  const nameMatch = namePattern.exec(text);
  if (nameMatch) {
    name = nameMatch[1];
  }

  // 금액 패턴 (숫자 + 원, 만원 등)
  const amountPatterns = [
    /(\d{1,3}(?:,\d{3})*)\s*원/g,
    /(\d{1,3}(?:,\d{3})*)\s*만\s*원/g,
    /(\d+)\s*만원/g,
    /(\d{1,3}(?:,\d{3})*)/g
  ];

  for (const pattern of amountPatterns) {
    const match = pattern.exec(text);
    if (match) {
      let amountStr = match[1].replace(/,/g, '');
      let parsedAmount = parseInt(amountStr, 10);
      
      // "만원" 단위 처리
      if (text.includes('만')) {
        parsedAmount *= 10000;
      }
      
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        amount = parsedAmount;
        break;
      }
    }
  }

  return { name, amount };
}