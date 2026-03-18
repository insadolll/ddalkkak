import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

const FONT_REGULAR = '/usr/share/fonts/truetype/nanum/NanumGothic.ttf';
const FONT_BOLD = '/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf';
const LOGO_DIR = path.join(__dirname, '../../assets/logos');

function fmtKRW(v: number): string { return v ? `₩${v.toLocaleString('ko-KR')}` : ''; }
function fmtDate(d: Date | string | null): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

interface PdfQuotation {
  quotationNo: string;
  revision: number;
  direction: string;
  quotationDate: Date | string | null;
  validUntil: Date | string | null;
  paymentTerms: string | null;
  title: string | null;
  // Company
  companyCode: string;
  companyName: string;
  companyBizNumber: string | null;
  companyRepresentative: string | null;
  companyAddress: string | null;
  companyPhone: string | null;
  companyFax: string | null;
  // Counterpart
  counterpartName: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  // Author
  authorName: string | null;
  authorPosition: string | null;
  authorPhone: string | null;
  authorEmail: string | null;
  // Amounts
  supplyAmount: number;
  taxAmount: number;
  totalAmount: number;
  // Items
  items: Array<{ name: string; spec: string | null; unit: string | null; quantity: number; unitPrice: number; amount: number; remark: string | null; }>;
  memo?: string | null;
}

export async function generateQuotationPdf(q: PdfQuotation): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 40, bottom: 30, left: 34, right: 34 } });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.registerFont('Regular', FONT_REGULAR);
    doc.registerFont('Bold', FONT_BOLD);
    doc.font('Regular');

    const pageW = doc.page.width;
    const mL = doc.page.margins.left;
    const cW = pageW - mL - doc.page.margins.right;
    let y = doc.page.margins.top;

    const displayNo = q.revision > 0 ? `${q.quotationNo}-R${String(q.revision).padStart(2, '0')}` : q.quotationNo;
    const logoPath = path.join(LOGO_DIR, `${q.companyCode}_logo.png`);

    // ── Header ──
    if (fs.existsSync(logoPath)) doc.image(logoPath, mL, y, { height: 38 });
    doc.font('Regular').fontSize(7).fillColor('#888888');
    doc.text(displayNo, mL, y, { width: cW, align: 'right' });
    doc.fontSize(7).fillColor('#555555');
    doc.text(q.companyAddress || '', mL, y + 12, { width: cW, align: 'right' });
    doc.text(`Tel. ${q.companyPhone || ''} Fax. ${q.companyFax || ''}`, mL, y + 23, { width: cW, align: 'right' });
    y += 44;

    // ── Title ──
    doc.moveTo(mL, y).lineTo(mL + cW, y).lineWidth(1.5).stroke('#333333');
    y += 4;
    doc.font('Bold').fontSize(16).fillColor('#222222');
    doc.text('견   적   서', mL, y, { width: cW, align: 'center' });
    y += 22;
    doc.moveTo(mL, y).lineTo(mL + cW, y).lineWidth(1.5).stroke('#333333');
    y += 10;

    // ── Info section ──
    const colW = cW / 2 - 4;
    const lblW = 62;
    const fs7 = 7.5;
    const lnH = 14;
    const authorDisplay = [q.authorName, q.authorPosition].filter(Boolean).join(' ');

    const leftInfo = [
      ['견적번호', displayNo],
      ['견적일', fmtDate(q.quotationDate)],
      ['수신', q.counterpartName || ''],
      ['담당자', q.contactName || ''],
      ['TEL / FAX', q.contactPhone || ''],
      ['결제조건', q.paymentTerms || ''],
      ['유효기간', q.validUntil ? fmtDate(q.validUntil) : ''],
    ];
    const rightInfo = [
      ['사업자번호', q.companyBizNumber || ''],
      ['회사명/대표', `${q.companyName}${q.companyRepresentative ? ' / ' + q.companyRepresentative : ''}`],
      ['주소', q.companyAddress || ''],
      ['TEL / FAX', `${q.companyPhone || ''} / ${q.companyFax || ''}`],
      ['견적담당자', authorDisplay],
      ['연락처', q.authorPhone || ''],
      ['이메일', q.authorEmail || ''],
    ];

    const infoY = y;
    doc.fontSize(fs7);
    for (let i = 0; i < leftInfo.length; i++) {
      const ry = infoY + i * lnH;
      doc.font('Bold').text(leftInfo[i][0], mL, ry, { width: lblW });
      doc.font('Regular').text(leftInfo[i][1], mL + lblW + 4, ry, { width: colW - lblW - 4 });
    }
    const rX = mL + colW + 8;
    for (let i = 0; i < rightInfo.length; i++) {
      const ry = infoY + i * lnH;
      doc.font('Bold').text(rightInfo[i][0], rX, ry, { width: lblW });
      doc.font('Regular').text(rightInfo[i][1], rX + lblW + 4, ry, { width: colW - lblW - 4 });
    }

    y = infoY + leftInfo.length * lnH + 4;
    doc.moveTo(mL, y).lineTo(mL + cW, y).lineWidth(0.5).stroke('#999999');
    y += 8;

    // ── Greeting ──
    doc.font('Regular').fontSize(7.5).fillColor('#222222');
    doc.text('귀사의 일익 번창하심을 기원합니다. 하기와 같이 견적드리오니 검토하여 주시기바랍니다.', mL, y, { width: cW, align: 'center' });
    y += 18;

    // ── Items table ──
    const cols = [
      { h: '번호', w: 26, a: 'center' as const },
      { h: '품명', w: 0, a: 'left' as const },
      { h: '규격', w: 70, a: 'left' as const },
      { h: '수량', w: 36, a: 'center' as const },
      { h: '단위', w: 32, a: 'center' as const },
      { h: '단가', w: 72, a: 'right' as const },
      { h: '공급금액', w: 78, a: 'right' as const },
      { h: '비고', w: 48, a: 'left' as const },
    ];
    const fixedW = cols.reduce((s, c) => s + c.w, 0);
    cols[1].w = cW - fixedW;

    const hH = 16;
    const rH = 15;
    const pad = 3;

    // Header row
    doc.rect(mL, y, cW, hH).fill('#e8e8e8').stroke('#999999');
    doc.fillColor('#222222').font('Bold').fontSize(7);
    let cx = mL;
    for (const c of cols) { doc.text(c.h, cx + pad, y + 4, { width: c.w - pad * 2, align: 'center' }); cx += c.w; }
    y += hH;

    // Data rows
    doc.font('Regular').fontSize(7);
    for (let i = 0; i < q.items.length; i++) {
      const item = q.items[i];
      const vals = [String(i + 1), item.name, item.spec || '', String(item.quantity), item.unit || '', fmtKRW(item.unitPrice), fmtKRW(item.amount), item.remark || ''];

      if (y + rH > doc.page.height - doc.page.margins.bottom - 80) {
        doc.addPage();
        y = doc.page.margins.top;
        doc.rect(mL, y, cW, hH).fill('#e8e8e8').stroke('#999999');
        doc.fillColor('#222222').font('Bold').fontSize(7);
        cx = mL;
        for (const c of cols) { doc.text(c.h, cx + pad, y + 4, { width: c.w - pad * 2, align: 'center' }); cx += c.w; }
        y += hH;
        doc.font('Regular').fontSize(7);
      }

      doc.rect(mL, y, cW, rH).stroke('#bbbbbb');
      cx = mL;
      for (let j = 0; j < cols.length; j++) {
        doc.fillColor('#222222').text(vals[j], cx + pad, y + 4, { width: cols[j].w - pad * 2, align: cols[j].a });
        if (j > 0) doc.moveTo(cx, y).lineTo(cx, y + rH).lineWidth(0.3).stroke('#bbbbbb');
        cx += cols[j].w;
      }
      y += rH;
    }

    y += 10;

    // ── Summary ──
    const sW = 190;
    const sX = mL + cW - sW;
    const sLbl = 64;
    const sVal = sW - sLbl;
    const sH = 18;
    const summary = [['총 금 액', fmtKRW(q.supplyAmount)], ['부 가 세', fmtKRW(q.taxAmount)], ['총 합 계', fmtKRW(q.totalAmount)]];

    // Memo
    doc.font('Bold').fontSize(7.5).fillColor('#222222');
    doc.text('비고', mL, y);
    if (q.memo) { doc.font('Regular').fontSize(7).text(q.memo, mL, y + 14, { width: cW - sW - 20 }); }

    for (let i = 0; i < summary.length; i++) {
      const ry = y + i * sH;
      doc.rect(sX, ry, sLbl, sH).stroke('#999999');
      doc.rect(sX + sLbl, ry, sVal, sH).stroke('#999999');
      doc.font('Bold').fontSize(7.5).fillColor('#222222');
      doc.text(summary[i][0], sX + 4, ry + 5, { width: sLbl - 8, align: 'center' });
      doc.font('Bold').fontSize(i === 2 ? 9 : 7.5);
      doc.text(summary[i][1], sX + sLbl + 4, ry + (i === 2 ? 4 : 5), { width: sVal - 8, align: 'right' });
    }

    y += summary.length * sH + 10;

    // ── Footer ──
    doc.moveTo(mL, y).lineTo(mL + cW, y).lineWidth(0.5).stroke('#999999');
    y += 6;
    doc.font('Regular').fontSize(7).fillColor('#555555');
    doc.text('◆ 상기 견적에 문의사항이 있으시면 견적 담당자에게 문의 바랍니다.', mL, y);
    doc.font('Bold').fontSize(9).fillColor('#222222');
    doc.text(q.companyName, mL, y, { width: cW, align: 'right' });

    doc.end();
  });
}

export type { PdfQuotation };
