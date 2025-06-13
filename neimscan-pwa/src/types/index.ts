// 기본 타입 정의
export interface CameraCapture {
  id: string;
  imageData: string; // base64
  timestamp: Date;
  width: number;
  height: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ContributionRecord {
  id: string;
  name: string;
  amount: number;
  memo?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  imageData?: string;
  ocrResults?: OCRResult[];
}

export interface CameraState {
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  currentFacingMode: 'user' | 'environment';
}

export interface ExportOptions {
  format: 'xlsx' | 'csv';
  fileName?: string;
  includeImages?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}