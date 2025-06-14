import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { imageData, format = 'png' } = await request.json();

    if (!imageData) {
      return NextResponse.json(
        { error: '이미지 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    // 네이버 클로바 OCR API 설정
    const CLOVA_OCR_URL = process.env.CLOVA_OCR_URL;
    const CLOVA_SECRET_KEY = process.env.CLOVA_SECRET_KEY;

    if (!CLOVA_OCR_URL || !CLOVA_SECRET_KEY) {
      return NextResponse.json(
        { error: '네이버 클로바 OCR 설정이 필요합니다.' },
        { status: 500 }
      );
    }

    // 네이버 클로바 OCR API 요청 구성
    const requestBody = {
      images: [
        {
          format: format,
          name: 'contribution_envelope',
          data: imageData
        }
      ],
      requestId: `ocr_${Date.now()}`,
      version: 'V2',
      timestamp: Date.now(),
      lang: 'ko' // 한국어 인식
    };

    // 네이버 클로바 OCR API 호출
    const response = await fetch(CLOVA_OCR_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-OCR-SECRET': CLOVA_SECRET_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`OCR API 호출 실패: ${response.status}`);
    }

    const result = await response.json();

    // OCR 결과에서 텍스트 추출
    let extractedText = '';
    let confidence = 0;

    if (result.images && result.images.length > 0) {
      const image = result.images[0];
      
      if (image.fields) {
        // 모든 인식된 텍스트를 결합
        extractedText = image.fields
          .map((field: any) => field.inferText)
          .join(' ');
        
        // 평균 신뢰도 계산
        confidence = image.fields.reduce(
          (sum: number, field: any) => sum + (field.inferConfidence || 0),
          0
        ) / image.fields.length;
      }
    }

    return NextResponse.json({
      extractedText,
      confidence: confidence / 100, // 0-1 범위로 정규화
      originalResult: result // 디버깅용
    });

  } catch (error) {
    console.error('OCR 처리 오류:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'OCR 처리 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}