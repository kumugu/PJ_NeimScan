import { NextApiRequest, NextApiResponse } from 'next';

interface OCRRequest {
  imageUrl: string;
}

interface OCRResponse {
  text: string;
  confidence: number;
  success: boolean;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OCRResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      text: '', 
      confidence: 0, 
      success: false, 
      error: '허용되지 않는 메소드입니다' 
    });
  }

  try {
    const { imageUrl }: OCRRequest = req.body;

    if (!imageUrl) {
      return res.status(400).json({ 
        text: '', 
        confidence: 0, 
        success: false, 
        error: '이미지 URL이 필요합니다' 
      });
    }

    // Base64 이미지를 버퍼로 변환
    const base64Data = imageUrl.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // 네이버 클로바 OCR API 호출
    const ocrResponse = await fetch(`${process.env.CLOVA_OCR_INVOKE_URL}`, {
      method: 'POST',
      headers: {
        'X-OCR-SECRET': process.env.CLOVA_OCR_SECRET_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        images: [
          {
            format: 'png',
            name: 'contribution-envelope',
            data: base64Data,
          },
        ],
        requestId: `ocr-${Date.now()}`,
        version: 'V2',
        timestamp: Date.now(),
      }),
    });

    if (!ocrResponse.ok) {
      throw new Error('네이버 클로바 OCR API 호출 실패');
    }

    const ocrResult = await ocrResponse.json();
    
    // OCR 결과에서 텍스트 추출
    let extractedText = '';
    let totalConfidence = 0;
    let fieldCount = 0;

    if (ocrResult.images && ocrResult.images[0] && ocrResult.images[0].fields) {
      ocrResult.images[0].fields.forEach((field: any) => {
        extractedText += field.inferText + ' ';
        totalConfidence += field.inferConfidence;
        fieldCount++;
      });
    }

    const averageConfidence = fieldCount > 0 ? totalConfidence / fieldCount : 0;

    return res.status(200).json({
      text: extractedText.trim(),
      confidence: averageConfidence,
      success: true,
    });

  } catch (error) {
    console.error('OCR API Error:', error);
    return res.status(500).json({
      text: '',
      confidence: 0,
      success: false,
      error: error instanceof Error ? error.message : 'OCR 처리 중 오류가 발생했습니다',
    });
  }
}