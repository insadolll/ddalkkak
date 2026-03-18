import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { companyContext } from '../../middleware/company-context';
import { listPurchaseOrders, getPurchaseOrder, createFromQuotation, updatePurchaseOrder } from './purchase-order.controller';

const router = Router();

router.get('/', authenticate, companyContext, listPurchaseOrders);
router.get('/:id', authenticate, getPurchaseOrder);
router.post('/from-quotation/:quotationId', authenticate, requireRole('ADMIN', 'MANAGER'), createFromQuotation);
router.put('/:id', authenticate, requireRole('ADMIN', 'MANAGER'), updatePurchaseOrder);

export default router;
