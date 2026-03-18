import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import {
  createLeave,
  listLeaves,
  getLeaveById,
  updateLeaveStatus,
  cancelLeave,
  getLeaveBalance,
} from './controller';

const router = Router();

// /balance must be before /:id to avoid route collision
router.get('/balance', authenticate, getLeaveBalance);
router.get('/', authenticate, listLeaves);
router.post('/', authenticate, createLeave);
router.get('/:id', authenticate, getLeaveById);
router.patch('/:id/status', authenticate, requireRole('MANAGER', 'ADMIN'), updateLeaveStatus);
router.delete('/:id', authenticate, cancelLeave);

export default router;
