import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import prisma from '../../utils/prisma';
import { success, error } from '../../utils/response';
import { calculateTaxSummary } from '../../utils/tax';

/**
 * Upload Excel file to bulk-create projects.
 * Expected columns: 프로젝트명, 고객사, 매입처, 담당자, 시작일, 종료일, 매출공급가, 매입공급가, 세율, 메모
 */
export async function bulkUploadProjects(req: Request, res: Response) {
  try {
    const companyId = req.companyContext?.ourCompanyId;
    if (!companyId || companyId === 'all') {
      return error(res, 'VALIDATION', '회사를 선택해주세요', 400);
    }

    if (!req.file) {
      return error(res, 'VALIDATION', '엑셀 파일을 업로드해주세요', 400);
    }

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(req.file.buffer as unknown as ArrayBuffer);
    const ws = wb.worksheets[0];

    if (!ws || ws.rowCount < 2) {
      return error(res, 'VALIDATION', '데이터가 없습니다', 400);
    }

    const results: Array<{ row: number; name: string; status: string; error?: string }> = [];
    const rows: Array<Record<string, unknown>> = [];

    // Parse rows (skip header row 1)
    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const name = String(row.getCell(1).value || '').trim();
      if (!name) continue;

      rows.push({
        row: r,
        name,
        clientName: String(row.getCell(2).value || '').trim(),
        supplierName: String(row.getCell(3).value || '').trim(),
        managerName: String(row.getCell(4).value || '').trim(),
        startDate: row.getCell(5).value,
        endDate: row.getCell(6).value,
        salesAmount: Number(row.getCell(7).value) || 0,
        purchaseAmount: Number(row.getCell(8).value) || 0,
        taxRate: Number(row.getCell(9).value) || 10,
        memo: String(row.getCell(10).value || '').trim(),
      });
    }

    // Process each row
    for (const data of rows) {
      try {
        // Find or create client
        let clientId: string | null = null;
        if (data.clientName) {
          const client = await prisma.company.upsert({
            where: { name: data.clientName as string },
            update: {},
            create: { name: data.clientName as string, createdById: req.user!.id },
          });
          clientId = client.id;
        }

        // Find or create supplier
        let supplierId: string | null = null;
        if (data.supplierName) {
          const supplier = await prisma.company.upsert({
            where: { name: data.supplierName as string },
            update: {},
            create: { name: data.supplierName as string, createdById: req.user!.id },
          });
          supplierId = supplier.id;
        }

        // Find manager by name
        let managerId: string | null = null;
        if (data.managerName) {
          const manager = await prisma.employee.findFirst({
            where: { name: data.managerName as string, ourCompanyId: companyId },
          });
          managerId = manager?.id || null;
        }

        const salesAmount = data.salesAmount as number;
        const purchaseAmount = data.purchaseAmount as number;
        const taxRate = data.taxRate as number;
        const salesTax = calculateTaxSummary(salesAmount, taxRate);
        const purchaseTax = calculateTaxSummary(purchaseAmount, taxRate);

        const startDate = data.startDate instanceof Date ? data.startDate : data.startDate ? new Date(data.startDate as string) : null;
        const endDate = data.endDate instanceof Date ? data.endDate : data.endDate ? new Date(data.endDate as string) : null;

        await prisma.project.create({
          data: {
            ourCompanyId: companyId,
            name: data.name as string,
            clientId,
            supplierId,
            managerId,
            startDate,
            endDate,
            confirmedSalesAmount: salesAmount,
            confirmedSalesTax: salesTax.taxAmount,
            confirmedPurchaseAmount: purchaseAmount,
            confirmedPurchaseTax: purchaseTax.taxAmount,
            status: 'COMPLETED',
            stage: 'DONE',
            memo: (data.memo as string) || null,
          },
        });

        results.push({ row: data.row as number, name: data.name as string, status: 'OK' });
      } catch (e) {
        results.push({
          row: data.row as number,
          name: data.name as string,
          status: 'ERROR',
          error: e instanceof Error ? e.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.status === 'OK').length;
    const errorCount = results.filter(r => r.status === 'ERROR').length;

    return success(res, {
      total: results.length,
      success: successCount,
      errors: errorCount,
      details: results,
    }, 201);
  } catch (e) {
    console.error('bulkUploadProjects error:', e);
    return error(res, 'INTERNAL', '업로드 처리에 실패했습니다', 500);
  }
}

/**
 * Download Excel template for bulk upload.
 */
export async function downloadBulkTemplate(_req: Request, res: Response) {
  try {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('프로젝트 일괄등록');

    // Headers
    const headers = ['프로젝트명', '고객사', '매입처', '담당자', '시작일', '종료일', '매출공급가', '매입공급가', '세율(%)', '메모'];
    ws.addRow(headers);

    // Style header
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5F0' } };

    // Column widths
    ws.columns = [
      { width: 25 }, { width: 20 }, { width: 20 }, { width: 12 },
      { width: 14 }, { width: 14 }, { width: 15 }, { width: 15 },
      { width: 10 }, { width: 30 },
    ];

    // Sample row
    ws.addRow(['A사 장비 납품', '고객사A', '매입처B', '홍길동', '2026-01-15', '2026-06-30', 15000000, 11000000, 10, '과거 프로젝트']);

    const buffer = await wb.xlsx.writeBuffer();
    const filename = encodeURIComponent('프로젝트_일괄등록_양식.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
    res.send(Buffer.from(buffer));
  } catch {
    return error(res, 'INTERNAL', '템플릿 생성에 실패했습니다', 500);
  }
}
