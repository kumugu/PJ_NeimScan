// 'use client';

// import React from 'react';
// import Image from 'next/image';
// import type { CameraCapture } from '../types/';

// interface ImagePreviewProps {
//   capture: CameraCapture;
//   onConfirm: () => void;
//   onRetake: () => void;
//   isProcessing?: boolean;
// }

// export default function ImagePreview({ 
//   capture, 
//   onConfirm, 
//   onRetake, 
//   isProcessing = false 
// }: ImagePreviewProps) {
//   return (
//     <div className="flex flex-col h-full bg-gray-100">
//       {/* 헤더 */}
//       <div className="bg-white shadow-sm px-4 py-3">
//         <h2 className="text-lg font-semibold text-center">촬영 결과 확인</h2>
//         <p className="text-sm text-gray-600 text-center mt-1">
//           축의금 봉투가 선명하게 촬영되었는지 확인해주세요
//         </p>
//       </div>

//       {/* 이미지 미리보기 */}
//       <div className="flex-1 flex items-center justify-center p-4">
//         <div className="relative w-full max-w-sm bg-white rounded-lg shadow-lg overflow-hidden">
//           <div className="aspect-[3/4] relative">
//             <Image
//               src={capture.imageData}
//               alt="촬영된 축의금 봉투"
//               fill
//               className="object-cover"
//               priority
//             />
            
//             {/* 안내 오버레이 */}
//             <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
//               <div className="bg-white bg-opacity-90 rounded-lg p-3 mx-4">
//                 <p className="text-sm font-medium text-gray-800 text-center">
//                   손글씨가 선명하게 보이나요?
//                 </p>
//               </div>
//             </div>
//           </div>
          
//           {/* 촬영 정보 */}
//           <div className="p-3 bg-gray-50">
//             <div className="flex justify-between text-xs text-gray-600">
//               <span>크기: {capture.width} × {capture.height}</span>
//               <span>촬영: {capture.timestamp.toLocaleTimeString()}</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* 버튼 영역 */}
//       <div className="bg-white border-t border-gray-200 p-4">
//         <div className="flex space-x-3">
//           <button
//             onClick={onRetake}
//             disabled={isProcessing}
//             className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             다시 촬영
//           </button>
          
//           <button
//             onClick={onConfirm}
//             disabled={isProcessing}
//             className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {isProcessing ? '처리 중...' : '텍스트 인식'}
//           </button>
//         </div>
        
//         {/* 안내 메시지 */}
//         <div className="mt-3 text-center">
//           <p className="text-xs text-gray-500">
//             💡 봉투의 손글씨가 흐릿하다면 다시 촬영해주세요
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }