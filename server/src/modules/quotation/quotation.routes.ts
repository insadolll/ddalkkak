import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { companyContext } from '../../middleware/company-context';
import {
  listQuotations, getQuotation, createQuotation, updateQuotation, deleteQuotation,
  confirmQuotation, voidQuotation, createRevision, getRevisions,
  duplicateQuotation, generateSalesFromPurchase,
} from './quotation.controller';
import { downloadQuotationExcel } from './quotation-export.controller';

const router = Router();

// CRUD
router.get('/', authenticate, companyContext, listQuotations);
router.get('/:id', authenticate, getQuotation);
router.post('/', authenticate, companyContext, createQuotation);
router.put('/:id', authenticate, updateQuotation);
router.delete('/:id', authenticate, requireRole('ADMIN'), deleteQuotation);

// Actions
router.post('/:id/confirm', authenticate, requireRole('ADMIN', 'MANAGER'), confirmQuotation);
router.post('/:id/void', authenticate, requireRole('ADMIN', 'MANAGER'), voidQuotation);
router.post('/:id/revision', authenticate, createRevision);
router.get('/:id/revisions', authenticate, getRevisions);
router.post('/:id/duplicate', authenticate, duplicateQuotation);
router.post('/:id/generate-sales', authenticate, requireRole('ADMIN', 'MANAGER'), generateSalesFromPurchase);

// Export
router.get('/:id/excel', authenticate, downloadQuotationExcel);

export default router;
