import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  createMeeting,
  listMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  addWorkItem,
  updateWorkItem,
  deleteWorkItem,
  addPlanItem,
  updatePlanItem,
  deletePlanItem,
  addIssue,
  updateIssue,
  deleteIssue,
  addDecision,
  updateDecision,
  deleteDecision,
  upsertReport,
  deleteReport,
} from './controller';

const router = Router();

// ─── Meeting CRUD ───────────────────────────────────────────────────────────

router.get('/', authenticate, listMeetings);
router.post('/', authenticate, createMeeting);
router.get('/:id', authenticate, getMeetingById);
router.patch('/:id', authenticate, updateMeeting);
router.delete('/:id', authenticate, deleteMeeting);

// ─── Work Items ─────────────────────────────────────────────────────────────

router.post('/:id/work-items', authenticate, addWorkItem);
router.patch('/:id/work-items/:itemId', authenticate, updateWorkItem);
router.delete('/:id/work-items/:itemId', authenticate, deleteWorkItem);

// ─── Plan Items ─────────────────────────────────────────────────────────────

router.post('/:id/plan-items', authenticate, addPlanItem);
router.patch('/:id/plan-items/:itemId', authenticate, updatePlanItem);
router.delete('/:id/plan-items/:itemId', authenticate, deletePlanItem);

// ─── Issues ─────────────────────────────────────────────────────────────────

router.post('/:id/issues', authenticate, addIssue);
router.patch('/:id/issues/:itemId', authenticate, updateIssue);
router.delete('/:id/issues/:itemId', authenticate, deleteIssue);

// ─── Decisions ──────────────────────────────────────────────────────────────

router.post('/:id/decisions', authenticate, addDecision);
router.patch('/:id/decisions/:itemId', authenticate, updateDecision);
router.delete('/:id/decisions/:itemId', authenticate, deleteDecision);

// ─── Monthly Reports ────────────────────────────────────────────────────────

router.post('/:id/reports', authenticate, upsertReport);
router.delete('/:id/reports/:itemId', authenticate, deleteReport);

export default router;
