import prisma from './prisma';

/**
 * Generate next document number using NumberSequence table.
 * Format: {prefix}-{year}-{paddedNumber}
 * Example: HB-2026-001, BT-PO-2026-001
 */
export async function generateDocNumber(
  ourCompanyId: string,
  docType: string,
  prefix: string,
): Promise<string> {
  const year = new Date().getFullYear();

  const seq = await prisma.numberSequence.upsert({
    where: {
      ourCompanyId_docType_year: { ourCompanyId, docType, year },
    },
    update: {
      lastNumber: { increment: 1 },
    },
    create: {
      ourCompanyId,
      docType,
      year,
      lastNumber: 1,
    },
  });

  const padded = String(seq.lastNumber).padStart(3, '0');
  return `${prefix}-${year}-${padded}`;
}
