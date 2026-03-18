import ExcelJS from 'exceljs';
import path from 'path';

const TEMPLATE_DIR = path.join(__dirname, '../../../doc_templates');

function fmt(n: number): string {
  return n.toLocaleString('ko-KR');
}

function dateStr(d: Date | string | null): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// ─── Quotation Data Types ───────────────────────────────────────────────────

interface QuotationData {
  quotationNo: string;
  quotationDate: Date | string | null;
  validUntil: Date | string | null;
  paymentTerms: string | null;
  revision: number;
  // Counterpart (receiver)
  counterpartName: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  // Author (our side)
  authorName: string | null;
  authorPhone: string | null;
  authorEmail: string | null;
  // Amounts
  supplyAmount: number;
  taxAmount: number;
  totalAmount: number;
  // Items
  items: {
    name: string;
    spec: string | null;
    unit: string | null;
    quantity: number;
    unitPrice: number;
    amount: number;
    remark: string | null;
  }[];
}

interface PurchaseOrderData extends QuotationData {
  poNo: string;
  deliveryDate: Date | string | null;
  deliveryPlace: string | null;
  memo: string | null;
}

interface TransactionStatementData {
  statementNo: string;
  issueDate: Date | string | null;
  // Supplier (공급자 = us)
  supplierName: string;
  supplierBizNumber: string | null;
  supplierAddress: string | null;
  supplierPhone: string | null;
  supplierFax: string | null;
  supplierRepresentative: string | null;
  // Receiver (공급받는자)
  receiverName: string;
  receiverAddress: string | null;
  receiverPhone: string | null;
  // Amounts
  totalAmount: number;
  // Items
  items: {
    date: Date | string | null;
    name: string;
    spec: string | null;
    quantity: number;
    unitPrice: number;
    supplyAmount: number;
    taxAmount: number;
  }[];
}

// ─── BTMS Quotation ─────────────────────────────────────────────────────────

export async function generateBtmsQuotation(data: QuotationData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(TEMPLATE_DIR, 'BTM써비스 견적서 양식.xlsx'));
  const ws = wb.getWorksheet('종합')!;

  // Left side (receiver info)
  ws.getCell('D9').value = data.quotationNo + (data.revision > 0 ? `-R${String(data.revision).padStart(2, '0')}` : '');
  ws.getCell('D10').value = dateStr(data.quotationDate);
  ws.getCell('D11').value = data.counterpartName || '';
  ws.getCell('D12').value = data.contactName || '';
  ws.getCell('D13').value = data.contactPhone || '';
  ws.getCell('D14').value = data.paymentTerms || '';
  ws.getCell('D15').value = data.validUntil ? dateStr(data.validUntil) : '';

  // Right side (our author info)
  ws.getCell('H13').value = data.authorName || '';
  ws.getCell('H14').value = data.authorPhone || '';
  ws.getCell('H15').value = data.authorEmail || '';

  // Items (rows 21~31, max 11 items)
  const itemStartRow = 21;
  const maxItems = Math.min(data.items.length, 11);
  for (let i = 0; i < maxItems; i++) {
    const r = itemStartRow + i;
    const item = data.items[i];
    ws.getCell(`B${r}`).value = i + 1;
    ws.getCell(`C${r}`).value = item.spec || '';      // 분류
    ws.getCell(`D${r}`).value = item.name;            // 상세내역
    ws.getCell(`E${r}`).value = item.quantity;
    ws.getCell(`F${r}`).value = item.unitPrice;       // 소비자단가 (same as supply for now)
    ws.getCell(`G${r}`).value = item.unitPrice;       // 공급단가
    // H column has formula =G*E, keep it
  }

  // Summary formulas should auto-calculate
  // Force values as fallback
  ws.getCell('H36').value = data.supplyAmount;
  ws.getCell('H37').value = data.taxAmount;
  ws.getCell('H38').value = data.totalAmount;

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// ─── HUBIOCEM Quotation ─────────────────────────────────────────────────────

export async function generateHubiocemQuotation(data: QuotationData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(TEMPLATE_DIR, '휴바이오켐_견적서_양식.xlsx'));
  const ws = wb.getWorksheet('견적서_양식')!;

  // Left side
  ws.getCell('C8').value = data.quotationNo + (data.revision > 0 ? `-R${String(data.revision).padStart(2, '0')}` : '');
  ws.getCell('C9').value = dateStr(data.quotationDate);
  ws.getCell('C10').value = data.counterpartName || '';
  ws.getCell('C11').value = data.contactName || '';
  ws.getCell('C12').value = data.contactPhone || '';
  ws.getCell('C13').value = data.paymentTerms || '';
  ws.getCell('C14').value = data.validUntil ? dateStr(data.validUntil) : '';

  // Right side (author)
  ws.getCell('G13').value = data.authorName || '';
  ws.getCell('G14').value = data.authorPhone || '';

  // Items (rows 21~33, max 13)
  const itemStartRow = 21;
  const maxItems = Math.min(data.items.length, 13);
  for (let i = 0; i < maxItems; i++) {
    const r = itemStartRow + i;
    const item = data.items[i];
    ws.getCell(`A${r}`).value = i + 1;
    ws.getCell(`B${r}`).value = item.name;           // 품목명
    ws.getCell(`C${r}`).value = item.spec || '';      // 제조원
    ws.getCell(`D${r}`).value = item.quantity;
    ws.getCell(`E${r}`).value = item.unit || 'EA';
    ws.getCell(`F${r}`).value = item.unitPrice;
    ws.getCell(`G${r}`).value = item.amount;
  }

  // Summary
  ws.getCell('H34').value = data.supplyAmount;
  ws.getCell('H35').value = data.taxAmount;
  ws.getCell('H36').value = data.totalAmount;

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// ─── BTMS Purchase Order ────────────────────────────────────────────────────

export async function generateBtmsPurchaseOrder(data: PurchaseOrderData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(TEMPLATE_DIR, 'BTM써비스_발주서_양식.xlsx'));
  const ws = wb.getWorksheet('발주서')!;

  // Left side (supplier info)
  ws.getCell('D8').value = data.poNo;
  ws.getCell('D9').value = dateStr(data.quotationDate);
  ws.getCell('D10').value = data.counterpartName || '';
  ws.getCell('D11').value = data.contactName || '';
  ws.getCell('D12').value = data.contactPhone || '';
  ws.getCell('D13').value = data.paymentTerms || '';
  ws.getCell('D14').value = data.validUntil ? dateStr(data.validUntil) : '';

  // Right side (author)
  ws.getCell('I13').value = data.authorName || '';
  ws.getCell('I14').value = data.authorPhone || '';
  ws.getCell('I15').value = data.authorEmail || '';

  // Items (rows 21~30, max 10)
  const itemStartRow = 21;
  const maxItems = Math.min(data.items.length, 10);
  for (let i = 0; i < maxItems; i++) {
    const r = itemStartRow + i;
    const item = data.items[i];
    ws.getCell(`B${r}`).value = i + 1;
    ws.getCell(`C${r}`).value = item.spec || '';      // 품번
    ws.getCell(`D${r}`).value = item.name;            // 품명
    ws.getCell(`G${r}`).value = item.quantity;
    ws.getCell(`H${r}`).value = item.unitPrice;
    // I column has formula
  }

  // Memo
  if (data.memo) {
    ws.getCell('C35').value = data.memo;
  }
  if (data.deliveryDate) {
    ws.getCell('C34').value = `전달사항: 납품일 ${dateStr(data.deliveryDate)}${data.deliveryPlace ? ' / ' + data.deliveryPlace : ''}`;
  }

  // Summary
  ws.getCell('J35').value = data.supplyAmount;
  ws.getCell('J36').value = data.taxAmount;
  ws.getCell('J37').value = data.totalAmount;

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// ─── HUBIOCEM Purchase Order (English) ──────────────────────────────────────

export async function generateHubiocemPurchaseOrder(data: PurchaseOrderData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(TEMPLATE_DIR, '휴바이오켐_발주서_양식.xlsx'));
  const ws = wb.getWorksheet('AMI')!;

  // PO info
  ws.getCell('A8').value = `PO No. : ${data.poNo}`;
  ws.getCell('A9').value = `DATE   : ${dateStr(data.quotationDate)}`;

  // Supplier (To)
  ws.getCell('A11').value = `To : ${data.counterpartName || ''}`;

  // Items (rows 19~22, max 4 for this template)
  const itemStartRow = 19;
  const maxItems = Math.min(data.items.length, 4);
  for (let i = 0; i < maxItems; i++) {
    const r = itemStartRow + i;
    const item = data.items[i];
    ws.getCell(`A${r}`).value = i + 1;
    ws.getCell(`B${r}`).value = item.name;
    ws.getCell(`E${r}`).value = item.quantity;
    ws.getCell(`G${r}`).value = item.amount;
  }

  // Total
  ws.getCell('G23').value = data.supplyAmount;

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// ─── Transaction Statement (공통) ───────────────────────────────────────────

export async function generateTransactionStatement(data: TransactionStatementData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(TEMPLATE_DIR, '거래명세서-양식-엑셀.xlsx'));
  const ws = wb.getWorksheet('거래명세서1')!;

  // 공급받는자 (top-left, B4 area) — receiver info
  ws.getCell('G4').value = data.receiverName;       // 상호(법인명) - merged G4:P5
  ws.getCell('G6').value = data.receiverAddress || ''; // 사업장주소 - merged G6:P7
  ws.getCell('G8').value = data.receiverPhone || '';   // 전화번호 - merged G8:P9

  // 공급자 (top-right, R4 area)
  ws.getCell('R4').value = data.supplierBizNumber || '';  // 등록번호
  ws.getCell('V6').value = data.supplierName;             // 상호
  ws.getCell('AB6').value = data.supplierRepresentative || ''; // 성명
  ws.getCell('V8').value = data.supplierAddress || '';    // 사업장주소
  ws.getCell('R10').value = data.supplierPhone || '';     // 전화
  ws.getCell('AB10').value = data.supplierFax || '';      // 팩스

  // 합계금액 (VAT포함)
  ws.getCell('G10').value = data.totalAmount;

  // Items (rows 13~24, max 12)
  // Columns: B=년, C=월, D=일, E~L=품목, M~Q=규격, R~U=수량, V~Y=단가, Z~AD=공급가액, AE~AH=세액
  const itemStartRow = 13;
  const maxItems = Math.min(data.items.length, 12);
  for (let i = 0; i < maxItems; i++) {
    const r = itemStartRow + i;
    const item = data.items[i];
    const date = item.date ? new Date(item.date as string) : null;
    if (date) {
      ws.getCell(`B${r}`).value = date.getFullYear();
      ws.getCell(`C${r}`).value = date.getMonth() + 1;
      ws.getCell(`D${r}`).value = date.getDate();
    }
    ws.getCell(`E${r}`).value = item.name;
    ws.getCell(`M${r}`).value = item.spec || '';
    ws.getCell(`R${r}`).value = item.quantity;
    ws.getCell(`V${r}`).value = item.unitPrice;
    ws.getCell(`Z${r}`).value = item.supplyAmount;
    ws.getCell(`AE${r}`).value = item.taxAmount;
  }

  // The bottom half (공급자용) auto-copies from top via formulas

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export { QuotationData, PurchaseOrderData, TransactionStatementData };
