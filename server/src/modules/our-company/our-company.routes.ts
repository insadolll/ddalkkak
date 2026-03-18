import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { listOurCompanies, getOurCompany, updateOurCompany } from './our-company.controller';

const router = Router();

router.get('/', authenticate, listOurCompanies);
router.get('/:id', authenticate, getOurCompany);
router.put('/:id', authenticate, requireRole('ADMIN'), updateOurCompany);

export default router;
