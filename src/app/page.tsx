'use client';

import { useState, useLayoutEffect } from 'react';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import type { ContributionRecord, CameraCapture } from '../types/index';

const CameraCapture = dynamic(() => import('../components/CameraCapture'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <p className="text-gray-600">카메라 준비 중...</p>
      </div>
    </div>
  )
});

export default function HomePage() {
  const [isClient, setIsClient] = useState(false);
  const [currentStep, setCurrentStep] = useState<'camera' | 'edit' | 'records'>('camera');

  useLayoutEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Suspense fallback={<div>페이지 로딩 중...</div>}>
        {currentStep === 'camera' && (
          <CameraCapture 
            onCapture={(data) => console.log(data)}
            onError={(error) => console.error(error)}
          />
        )}
      </Suspense>
    </main>
  );
}
