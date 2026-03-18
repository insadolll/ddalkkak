import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { companyContext } from '../../middleware/company-context';
import { getSummary, getMonthly } from './report.controller';

const router = Router();

router.get('/summary', authenticate, companyContext, getSummary);
router.get('/monthly', authenticate, companyContext, getMonthly);

export default router;
