import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { companyContext } from '../../middleware/company-context';
import { listSingleTransactions, createSingleTransaction, updateSingleTransaction, deleteSingleTransaction } from './single-transaction.controller';

const router = Router();

router.get('/', authenticate, companyContext, listSingleTransactions);
router.post('/', authenticate, companyContext, requireRole('ADMIN', 'MANAGER'), createSingleTransaction);
router.put('/:id', authenticate, requireRole('ADMIN', 'MANAGER'), updateSingleTransaction);
router.delete('/:id', authenticate, requireRole('ADMIN'), deleteSingleTransaction);

export default router;
