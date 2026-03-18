import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  loginHandler,
  logoutHandler,
  refreshHandler,
  changePasswordHandler,
  meHandler,
} from './auth.controller';

const router = Router();

router.post('/login', loginHandler);
router.post('/logout', authenticate, logoutHandler);
router.post('/refresh', refreshHandler);
router.patch('/password', authenticate, changePasswordHandler);
router.get('/me', authenticate, meHandler);

export default router;
