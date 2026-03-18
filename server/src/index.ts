import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './modules/auth/auth.routes';
import ourCompanyRoutes from './modules/our-company/our-company.routes';
import companyRoutes from './modules/company/company.routes';
import projectRoutes from './modules/project/project.routes';
import quotationRoutes from './modules/quotation/quotation.routes';
import purchaseOrderRoutes from './modules/purchase-order/purchase-order.routes';
import singleTransactionRoutes from './modules/single-transaction/single-transaction.routes';
import reportRoutes from './modules/report/report.routes';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '2.0.0' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/our-companies', ourCompanyRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/single-transactions', singleTransactionRoutes);
app.use('/api/reports', reportRoutes);

// Serve static files (client build) in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, HOST, () => {
  console.log(`[DDalKKak v2] Server running on http://${HOST}:${PORT}`);
});

export default app;
