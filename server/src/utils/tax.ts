/**
 * Tax calculation utilities.
 * Rule: taxAmount = Math.floor(supplyAmount * taxRate / 100)
 * Calculated once on the total, not per item.
 */

export interface AmountSummary {
  supplyAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export function calculateItemAmount(quantity: number, unitPrice: number): number {
  return quantity * unitPrice;
}

export function calculateTaxSummary(supplyAmount: number, taxRate: number): AmountSummary {
  const taxAmount = Math.floor(supplyAmount * taxRate / 100);
  return {
    supplyAmount,
    taxAmount,
    totalAmount: supplyAmount + taxAmount,
  };
}
