import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { companyContext } from '../../middleware/company-context';
import {
  listProjects, getProject, createProject, updateProject, deleteProject, updateStage,
} from './project.controller';

const router = Router();

router.get('/', authenticate, companyContext, listProjects);
router.get('/:id', authenticate, companyContext, getProject);
router.post('/', authenticate, companyContext, requireRole('ADMIN', 'MANAGER'), createProject);
router.put('/:id', authenticate, companyContext, requireRole('ADMIN', 'MANAGER'), updateProject);
router.delete('/:id', authenticate, requireRole('ADMIN'), deleteProject);
router.put('/:id/stage', authenticate, requireRole('ADMIN', 'MANAGER'), updateStage);

export default router;
