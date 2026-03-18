import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { companyContext } from '../../middleware/company-context';
import {
  listProjects, getProject, createProject, updateProject, deleteProject, updateStage,
} from './project.controller';
import { bulkUploadProjects, downloadBulkTemplate } from './project-bulk.controller';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

router.get('/', authenticate, companyContext, listProjects);
router.get('/bulk-template', authenticate, downloadBulkTemplate);
router.get('/:id', authenticate, companyContext, getProject);
router.post('/', authenticate, companyContext, requireRole('ADMIN', 'MANAGER'), createProject);
router.post('/bulk-upload', authenticate, companyContext, requireRole('ADMIN'), upload.single('file'), bulkUploadProjects);
router.put('/:id', authenticate, companyContext, requireRole('ADMIN', 'MANAGER'), updateProject);
router.delete('/:id', authenticate, requireRole('ADMIN'), deleteProject);
router.put('/:id/stage', authenticate, requireRole('ADMIN', 'MANAGER'), updateStage);

export default router;
