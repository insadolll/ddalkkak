import { Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { error } from '../../utils/response';
import {
  generateBtmsQuotation, generateHubiocemQuotation,
  generateBtmsPurchaseOrder, generateHubiocemPurchaseOrder,
  generateTransactionStatement,
} from '../../utils/excel-generator';
import type { QuotationData, PurchaseOrderData } from '../../utils/excel-generator';
import { generateQuotationPdf } from '../../utils/pdf-generator';

function toQuotationData(q: Record<string, unknown>): QuotationData {
  const items = (q.items as Array<Record<string, unknown>>).map(i => ({
    name: i.name as string,
    spec: i.spec as string | null,
    unit: i.unit as string | null,
    quantity: i.quantity as number,
    unitPrice: i.unitPrice as number,
    amount: i.amount as number,
    remark: i.remark as string | null,
  }));
  return {
    quotationNo: q.quotationNo as string,
    quotationDate: q.quotationDate as Date | null,
    validUntil: q.validUntil as Date | null,
    paymentTerms: q.paymentTerms as string | null,
    revision: q.revision as number,
    counterpartName: (q.counterpart as Record<string, unknown>)?.name as string || null,
    contactName: q.contactName as string | null,
    contactPhone: q.contactPhone as string | null,
    contactEmail: q.contactEmail as string | null,
    authorName: q.authorName as string | null,
    authorPhone: q.authorPhone as string | null,
    authorEmail: q.authorEmail as string | null,
    supplyAmount: q.supplyAmount as number,
    taxAmount: q.taxAmount as number,
    totalAmount: q.totalAmount as number,
    items,
  };
}

export async function downloadQuotationExcel(req: Request, res: Response) {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: {
        ourCompany: true,
        counterpart: { select: { name: true } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!quotation) return error(res, 'NOT_FOUND', '견적서를 찾을 수 없습니다', 404);

    const data = toQuotationData(quotation as unknown as Record<string, unknown>);
    const companyCode = quotation.ourCompany.code;

    const buffer = companyCode === 'HUBIOCEM'
      ? await generateHubiocemQuotation(data)
      : await generateBtmsQuotation(data);

    const filename = encodeURIComponent(`견적서_${quotation.quotationNo}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
    res.send(buffer);
  } catch (e) {
    console.error('downloadQuotationExcel error:', e);
    return error(res, 'INTERNAL', '엑셀 생성에 실패했습니다', 500);
  }
}

export async function downloadQuotationPdf(req: Request, res: Response) {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: { ourCompany: true, counterpart: { select: { name: true } }, items: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!quotation) return error(res, 'NOT_FOUND', '견적서를 찾을 수 없습니다', 404);

    const buffer = await generateQuotationPdf({
      quotationNo: quotation.quotationNo,
      revision: quotation.revision,
      direction: quotation.direction,
      quotationDate: quotation.quotationDate,
      validUntil: quotation.validUntil,
      paymentTerms: quotation.paymentTerms,
      title: quotation.title,
      companyCode: quotation.ourCompany.code,
      companyName: quotation.ourCompany.name,
      companyBizNumber: quotation.ourCompany.bizNumber,
      companyRepresentative: quotation.ourCompany.representative,
      companyAddress: quotation.ourCompany.address,
      companyPhone: quotation.ourCompany.phone,
      companyFax: quotation.ourCompany.fax,
      counterpartName: quotation.counterpart?.name || null,
      contactName: quotation.contactName,
      contactPhone: quotation.contactPhone,
      contactEmail: quotation.contactEmail,
      authorName: quotation.authorName,
      authorPosition: quotation.authorPosition,
      authorPhone: quotation.authorPhone,
      authorEmail: quotation.authorEmail,
      supplyAmount: quotation.supplyAmount,
      taxAmount: quotation.taxAmount,
      totalAmount: quotation.totalAmount,
      items: quotation.items.map(i => ({ name: i.name, spec: i.spec, unit: i.unit, quantity: i.quantity, unitPrice: i.unitPrice, amount: i.amount, remark: i.remark })),
    });

    const filename = encodeURIComponent(`견적서_${quotation.quotationNo}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${filename}`);
    res.send(buffer);
  } catch (e) {
    console.error('downloadQuotationPdf error:', e);
    return error(res, 'INTERNAL', 'PDF 생성에 실패했습니다', 500);
  }
}

export async function downloadPurchaseOrderExcel(req: Request, res: Response) {
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: {
        ourCompany: true,
        supplier: { select: { name: true } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!po) return error(res, 'NOT_FOUND', '발주서를 찾을 수 없습니다', 404);

    const data: PurchaseOrderData = {
      quotationNo: po.poNo,
      poNo: po.poNo,
      quotationDate: po.createdAt,
      validUntil: null,
      paymentTerms: null,
      revision: 0,
      counterpartName: (po.supplier as Record<string, unknown>)?.name as string || null,
      contactName: po.contactName,
      contactPhone: null,
      contactEmail: po.contactEmail,
      authorName: null,
      authorPhone: null,
      authorEmail: null,
      supplyAmount: po.supplyAmount,
      taxAmount: po.taxAmount,
      totalAmount: po.totalAmount,
      deliveryDate: po.deliveryDate,
      deliveryPlace: po.deliveryPlace,
      memo: po.memo,
      items: po.items.map(i => ({
        name: i.name,
        spec: i.spec,
        unit: i.unit,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        amount: i.amount,
        remark: i.remark,
      })),
    };

    const companyCode = po.ourCompany.code;
    const buffer = companyCode === 'HUBIOCEM'
      ? await generateHubiocemPurchaseOrder(data)
      : await generateBtmsPurchaseOrder(data);

    const filename = encodeURIComponent(`발주서_${po.poNo}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
    res.send(buffer);
  } catch (e) {
    console.error('downloadPurchaseOrderExcel error:', e);
    return error(res, 'INTERNAL', '엑셀 생성에 실패했습니다', 500);
  }
}

export async function downloadTransactionStatementExcel(req: Request, res: Response) {
  try {
    const stmt = await prisma.transactionStatement.findUnique({
      where: { id: req.params.id },
      include: {
        ourCompany: true,
        counterpart: true,
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!stmt) return error(res, 'NOT_FOUND', '거래명세서를 찾을 수 없습니다', 404);

    const buffer = await generateTransactionStatement({
      statementNo: stmt.statementNo,
      issueDate: stmt.issueDate,
      supplierName: stmt.ourCompany.name,
      supplierBizNumber: stmt.ourCompany.bizNumber,
      supplierAddress: stmt.ourCompany.address,
      supplierPhone: stmt.ourCompany.phone,
      supplierFax: stmt.ourCompany.fax,
      supplierRepresentative: stmt.ourCompany.representative,
      receiverName: stmt.counterpart?.name || '',
      receiverAddress: stmt.counterpart?.address || '',
      receiverPhone: stmt.counterpart?.phone || '',
      totalAmount: stmt.totalAmount,
      items: stmt.items.map(i => ({
        date: stmt.issueDate,
        name: i.name,
        spec: i.spec,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        supplyAmount: i.amount,
        taxAmount: Math.floor(i.amount * 0.1),
      })),
    });

    const filename = encodeURIComponent(`거래명세서_${stmt.statementNo}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
    res.send(buffer);
  } catch (e) {
    console.error('downloadTransactionStatementExcel error:', e);
    return error(res, 'INTERNAL', '엑셀 생성에 실패했습니다', 500);
  }
}
