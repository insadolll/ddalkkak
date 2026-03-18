import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  listEvents,
  createEvent,
  getEventById,
  updateEvent,
  deleteEvent,
} from './controller';

const router = Router();

router.get('/', authenticate, listEvents);
router.post('/', authenticate, createEvent);
router.get('/:id', authenticate, getEventById);
router.patch('/:id', authenticate, updateEvent);
router.delete('/:id', authenticate, deleteEvent);

export default router;
