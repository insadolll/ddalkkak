import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { companyContext } from '../../middleware/company-context';
import { listInvoices, getInvoice, updateInvoiceStatus, createCreditNote, listCreditNotes } from './invoice.controller';
import { sendInvoiceRequest } from '../quotation/quotation-mail.controller';

const router = Router();

router.get('/', authenticate, companyContext, listInvoices);
router.get('/:id', authenticate, getInvoice);
router.put('/:id/status', authenticate, requireRole('ADMIN', 'MANAGER', 'ACCOUNTANT'), updateInvoiceStatus);
router.post('/:id/request', authenticate, sendInvoiceRequest);
router.get('/:invoiceId/credit-notes', authenticate, listCreditNotes);
router.post('/:invoiceId/credit-notes', authenticate, requireRole('ADMIN', 'MANAGER', 'ACCOUNTANT'), createCreditNote);

export default router;
