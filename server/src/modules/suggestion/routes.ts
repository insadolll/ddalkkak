import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import {
  createSuggestion,
  listSuggestions,
  getMySuggestions,
  getSuggestionById,
  updateSuggestionStatus,
} from './controller';

const router = Router();

// All users: create & view own
router.post('/', authenticate, createSuggestion);
router.get('/mine', authenticate, getMySuggestions);

// Admin only: list all & manage
router.get('/', authenticate, requireRole('ADMIN'), listSuggestions);
router.get('/:id', authenticate, requireRole('ADMIN'), getSuggestionById);
router.patch('/:id/status', authenticate, requireRole('ADMIN'), updateSuggestionStatus);

export default router;
