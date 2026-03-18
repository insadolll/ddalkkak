import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import {
  listCompanies, getCompany, createCompany, updateCompany, deleteCompany,
  createContact, updateContact, deleteContact,
} from './company.controller';
import { lookupCompanies } from './company-lookup';

const router = Router();

router.get('/lookup', authenticate, lookupCompanies);
router.get('/', authenticate, listCompanies);
router.get('/:id', authenticate, getCompany);
router.post('/', authenticate, requireRole('ADMIN', 'MANAGER'), createCompany);
router.put('/:id', authenticate, requireRole('ADMIN', 'MANAGER'), updateCompany);
router.delete('/:id', authenticate, requireRole('ADMIN'), deleteCompany);

// Contacts
router.post('/:companyId/contacts', authenticate, requireRole('ADMIN', 'MANAGER'), createContact);
router.put('/:companyId/contacts/:contactId', authenticate, requireRole('ADMIN', 'MANAGER'), updateContact);
router.delete('/:companyId/contacts/:contactId', authenticate, requireRole('ADMIN', 'MANAGER'), deleteContact);

export default router;
