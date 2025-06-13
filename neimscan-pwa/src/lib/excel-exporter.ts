import * as XLSX from 'xlsx';
import type { ContributionRecord, ExportOptions } from '@/types';

export class ExcelExporter {
  static async exportToExcel(
    records: ContributionRecord[], 
    options: ExportOptions = { format: 'xlsx' }
  ): Promise<void> {
    try {
      // 데이터 필터링 (날짜 범위가 있는 경우)
      let filteredRecords = records;
      if (options.dateRange) {
        filteredRecords = records.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate >= options.dateRange!.start && 
                 recordDate <= options.dateRange!.end;
        });
      }

      // Excel 데이터 형식으로 변환
      const excelData = filteredRecords.map((record, index) => ({
        '번호': index + 1,
        '이름': record.name,
        '금액': record.amount,
        '메모': record.memo || '',
        '날짜': this.formatDate(record.date),
        '등록일': this.formatDate(record.createdAt)
      }));

      // 통계 정보 추가
      const totalAmount = filteredRecords.reduce((sum, record) => sum + record.amount, 0);
      const summaryData = [
        {},
        { '번호': '총계', '이름': `${filteredRecords.length}건`, '금액': totalAmount },
        { '번호': '평균', '이름': '', '금액': Math.round(totalAmount / filteredRecords.length) || 0 }
      ];

      const allData = [...excelData, ...summaryData];

      // 워크시트 생성
      const worksheet = XLSX.utils.json_to_sheet(allData);
      
      // 컬럼 너비 설정
      const columnWidths = [
        { wch: 8 },  // 번호
        { wch: 15 }, // 이름
        { wch: 15 }, // 금액
        { wch: 20 }, // 메모
        { wch: 12 }, // 날짜
        { wch: 12 }  // 등록일
      ];
      worksheet['!cols'] = columnWidths;

      // 금액 컬럼에 숫자 형식 적용
      const range = XLSX.utils.decode_range(worksheet['!ref']!);
      for (let row = 1; row <= range.e.r; row++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: 2 }); // 금액 컬럼 (C)
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].t = 'n'; // 숫자 타입으로 설정
          worksheet[cellAddress].z = '#,##0'; // 천단위 콤마 형식
        }
      }

      // 워크북 생성
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '축의금 목록');

      // 파일명 생성
      const fileName = options.fileName || 
        `축의금목록_${new Date().toISOString().slice(0, 10)}.${options.format}`;

      // 파일 다운로드
      if (options.format === 'csv') {
        XLSX.writeFile(workbook, fileName, { bookType: 'csv' });
      } else {
        XLSX.writeFile(workbook, fileName, { bookType: 'xlsx' });
      }

    } catch (error) {
      console.error('Excel export error:', error);
      throw new Error('파일 내보내기에 실패했습니다.');
    }
  }

  private static formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  static async exportToCSV(records: ContributionRecord[]): Promise<void> {
    return this.exportToExcel(records, { format: 'csv' });
  }
}