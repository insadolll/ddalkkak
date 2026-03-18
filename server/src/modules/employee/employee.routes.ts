import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { companyContext } from '../../middleware/company-context';
import { listEmployees, getEmployee, createEmployee, updateEmployee, listDepartments } from './employee.controller';

const router = Router();

router.get('/', authenticate, companyContext, listEmployees);
router.get('/departments', authenticate, listDepartments);
router.get('/:id', authenticate, getEmployee);
router.post('/', authenticate, requireRole('ADMIN'), createEmployee);
router.put('/:id', authenticate, requireRole('ADMIN'), updateEmployee);

export default router;
