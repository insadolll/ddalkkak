import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  createDocument,
  submitDocument,
  listDocuments,
  getDocumentById,
  updateDocument,
  approveStep,
  rejectStep,
  deleteDocument,
} from './controller';

const router = Router();

router.get('/', authenticate, listDocuments);
router.post('/', authenticate, createDocument);
router.get('/:id', authenticate, getDocumentById);
router.patch('/:id', authenticate, updateDocument);
router.delete('/:id', authenticate, deleteDocument);
router.post('/:id/submit', authenticate, submitDocument);
router.post('/:id/approve', authenticate, approveStep);
router.post('/:id/reject', authenticate, rejectStep);

export default router;
