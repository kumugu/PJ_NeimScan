import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { imageData } = await request.json();

    if (!imageData) {
      return NextResponse.json(
        { error: '이미지 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    // Base64에서 헤더 제거 (data:image/jpeg;base64, 부분)
    const base64Image = imageData.replace(/^data:image\/[a-z]+;base64,/, '');

    // 클로바 OCR API 요청 준비
    const ocrRequestBody = {
      images: [
        {
          format: 'jpg',
          name: 'axesImage',
          data: base64Image,
        }
      ],
      requestId: `ocr_${Date.now()}`,
      version: 'V2',
      timestamp: Date.now(),
    };

    // 클로바 OCR API 호출
    const response = await fetch(process.env.NEXT_PUBLIC_CLOVA_OCR_INVOKE_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-OCR-SECRET': process.env.CLOVA_OCR_SECRET_KEY!,
      },
      body: JSON.stringify(ocrRequestBody),
    });

    if (!response.ok) {
      throw new Error(`OCR API 호출 실패: ${response.status}`);
    }

    const result = await response.json();

    // OCR 결과 파싱
    const extractedData = parseOCRResult(result);

    return NextResponse.json({
      success: true,
      data: extractedData,
      raw: result, // 디버깅용
    });

  } catch (error) {
    console.error('OCR 처리 중 오류:', error);
    return NextResponse.json(
      { 
        error: 'OCR 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// OCR 결과에서 이름과 금액 추출
function parseOCRResult(ocrResult: any) {
  const extractedText: string[] = [];
  
  try {
    if (ocrResult.images && ocrResult.images[0] && ocrResult.images[0].fields) {
      const fields = ocrResult.images[0].fields;
      
      fields.forEach((field: any) => {
        if (field.inferText) {
          extractedText.push(field.inferText.trim());
        }
      });
    }

    // 텍스트 파싱 로직
    let name = '';
    let amount = 0;
    const allText = extractedText.join(' ');

    // 금액 추출 (숫자 + 원, 만원 등)
    const amountRegex = /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:원|만원|천원)?/g;
    const amountMatches = allText.match(amountRegex);
    
    if (amountMatches && amountMatches.length > 0) {
      const amountStr = amountMatches[0].replace(/[^\d,]/g, '');
      amount = parseInt(amountStr.replace(/,/g, '')) || 0;
      
      // 만원 단위 처리
      if (amountMatches[0].includes('만원')) {
        amount *= 10000;
      }
    }

    // 이름 추출 (한글 이름 패턴)
    const nameRegex = /[가-힣]{2,4}/g;
    const nameMatches = allText.match(nameRegex);
    
    if (nameMatches && nameMatches.length > 0) {
      // 가장 긴 한글 문자열을 이름으로 추정
      name = nameMatches.reduce((longest, current) => 
        current.length > longest.length ? current : longest, ''
      );
    }

    return {
      name,
      amount,
      extractedText,
      confidence: calculateConfidence(name, amount),
    };

  } catch (error) {
    console.error('OCR 결과 파싱 오류:', error);
    return {
      name: '',
      amount: 0,
      extractedText,
      confidence: 0,
    };
  }
}

// 신뢰도 계산
function calculateConfidence(name: string, amount: number): number {
  let confidence = 0;
  
  if (name && name.length >= 2) confidence += 50;
  if (amount > 0) confidence += 50;
  
  return confidence;
}