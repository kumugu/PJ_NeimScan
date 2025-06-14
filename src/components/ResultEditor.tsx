'use client';

import React, { useState } from 'react';
import type { ContributionRecord } from '../types/index';

interface ResultEditorProps {
  initialData?: Partial<ContributionRecord>;
  onSave: (record: Omit<ContributionRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ResultEditor({ 
  initialData, 
  onSave, 
  onCancel, 
  isLoading = false 
}: ResultEditorProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    amount: initialData?.amount?.toString() || '',
    memo: initialData?.memo || '',
    date: initialData?.date ? 
      new Date(initialData.date).toISOString().split('T')[0] : 
      new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }

    if (!formData.amount.trim()) {
      newErrors.amount = '금액을 입력해주세요.';
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = '올바른 금액을 입력해주세요.';
    }

    if (!formData.date) {
      newErrors.date = '날짜를 선택해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const record: Omit<ContributionRecord, 'id' | 'createdAt' | 'updatedAt'> = {
      name: formData.name.trim(),
      amount: Number(formData.amount),
      memo: formData.memo.trim() || undefined,
      date: new Date(formData.date),
      imageData: initialData?.imageData
    };

    onSave(record);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 에러 상태 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatAmount = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^0-9]/g, '');
    
    // 천단위 콤마 추가
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-6 text-center text-gray-900">축의금 정보 편집</h2>
        
        {/* OCR 결과 미리보기 */}
        {initialData?.imageData && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">촬영된 이미지</h3>
            <img 
              src={initialData.imageData} 
              alt="촬영된 축의금 봉투"
              className="w-full h-32 object-cover rounded border"
            />
            {initialData.memo && (
              <p className="text-xs text-gray-500 mt-2">{initialData.memo}</p>
            )}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이름 입력 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              이름 *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 placeholder-gray-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="홍길동"
              maxLength={20}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* 금액 입력 */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              금액 *
            </label>
            <div className="relative">
              <input
                type="text"
                id="amount"
                value={formatAmount(formData.amount)}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/[^0-9]/g, '');
                  handleInputChange('amount', rawValue);
                }}
                className={`w-full px-3 py-2 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 placeholder-gray-500 ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="50,000"
              />
              <span className="absolute right-3 top-2.5 text-gray-600 text-sm">원</span>
            </div>
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>

          {/* 메모 입력 */}
          <div>
            <label htmlFor="memo" className="block text-sm font-medium text-gray-700 mb-1">
              메모
            </label>
            <input
              type="text"
              id="memo"
              value={formData.memo}
              onChange={(e) => handleInputChange('memo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 placeholder-gray-500"
              placeholder="결혼 축하, 개업 축하 등"
              maxLength={50}
            />
            <p className="text-xs text-gray-500 mt-1">
              OCR로 추출된 메모는 수정하거나 추가할 수 있습니다.
            </p>
          </div>

          {/* 날짜 입력 */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              날짜 *
            </label>
            <input
              type="date"
              id="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 ${
                errors.date ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
          </div>

          {/* 버튼 그룹 */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}