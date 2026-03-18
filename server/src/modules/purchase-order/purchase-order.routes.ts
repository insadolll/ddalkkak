import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { companyContext } from '../../middleware/company-context';
import { listPurchaseOrders, getPurchaseOrder, createFromQuotation, updatePurchaseOrder } from './purchase-order.controller';
import { downloadPurchaseOrderExcel } from '../quotation/quotation-export.controller';

const router = Router();

router.get('/', authenticate, companyContext, listPurchaseOrders);
router.get('/:id', authenticate, getPurchaseOrder);
router.post('/from-quotation/:quotationId', authenticate, requireRole('ADMIN', 'MANAGER'), createFromQuotation);
router.put('/:id', authenticate, requireRole('ADMIN', 'MANAGER'), updatePurchaseOrder);
router.get('/:id/excel', authenticate, downloadPurchaseOrderExcel);

export default router;
