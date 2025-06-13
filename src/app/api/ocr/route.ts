import { NextRequest, NextResponse } from 'next/server';

// Clova OCR API 타입 정의
interface ClovaOCRRequest {
  version: string;
  requestId: string;
  timestamp: number;
  lang: string;
  images: Array<{
    format: string;
    name: string;
    data?: string;
    url?: string;
  }>;
}

interface ClovaOCRResponse {
  version: string;
  requestId: string;
  timestamp: number;
  images: Array<{
    inferResult: string;
    message: string;
    fields: Array<{
      inferText: string;
      inferConfidence: number;
      type: string;
      boundingPoly: {
        vertices: Array<{
          x: number;
          y: number;
        }>;
      };
    }>;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { imageData, imageUrl } = await request.json();

    if (!imageData && !imageUrl) {
      return NextResponse.json(
        { error: '이미지 데이터 또는 URL이 필요합니다.' },
        { status: 400 }
      );
    }

    // Clova OCR API 요청 구성
    const ocrRequest: ClovaOCRRequest = {
      version: 'V2',
      requestId: `req_${Date.now()}`,
      timestamp: Date.now(),
      lang: 'ko',
      images: [{
        format: 'jpg',
        name: 'envelope_image',
        ...(imageData ? { data: imageData.split(',')[1] } : { url: imageUrl })
      }]
    };

    // Clova OCR API 호출
    const response = await fetch(process.env.NEXT_PUBLIC_CLOVA_OCR_INVOKE_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-OCR-SECRET': process.env.CLOVA_OCR_SECRET_KEY!
      },
      body: JSON.stringify(ocrRequest)
    });

    if (!response.ok) {
      throw new Error(`OCR API 호출 실패: ${response.status}`);
    }

    const ocrResult: ClovaOCRResponse = await response.json();

    // OCR 결과에서 텍스트 추출 및 파싱
    const extractedData = parseOCRResult(ocrResult);

    return NextResponse.json({
      success: true,
      data: extractedData,
      rawOCR: ocrResult
    });

  } catch (error) {
    console.error('OCR API Error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'OCR 처리 중 오류가 발생했습니다.',
        success: false 
      },
      { status: 500 }
    );
  }
}

// OCR 결과 파싱 함수
function parseOCRResult(ocrResult: ClovaOCRResponse) {
  const fields = ocrResult.images[0]?.fields || [];
  
  let name = '';
  let amount = '';
  let memo = '';
  
  // 텍스트 필드들을 분석하여 이름, 금액, 메모 추출
  const texts = fields.map(field => field.inferText).filter(text => text.trim());
  
  // 정규식 패턴들
  const amountPattern = /(\d{1,3}(?:,?\d{3})*)\s*원?/;
  const namePattern = /^[가-힣]{2,4}$/;
  
  for (const text of texts) {
    // 금액 추출
    const amountMatch = text.match(amountPattern);
    if (amountMatch && !amount) {
      amount = amountMatch[1].replace(/,/g, '');
    }
    
    // 이름 추출 (한글 2-4글자)
    else if (namePattern.test(text) && !name) {
      name = text;
    }
    
    // 메모 (축하, 감사 등의 키워드 포함)
    else if (/축하|감사|건강|행복|번영|발전|성공/.test(text) && !memo) {
      memo = text;
    }
  }

  return {
    name: name || '',
    amount: amount || '',
    memo: memo || '',
    date: new Date().toISOString().split('T')[0],
    confidence: fields.length > 0 ? 
      fields.reduce((sum, field) => sum + field.inferConfidence, 0) / fields.length : 0,
    extractedTexts: texts
  };
}