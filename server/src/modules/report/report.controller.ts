import { Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { success, error } from '../../utils/response';

export async function getSummary(req: Request, res: Response) {
  try {
    const companyId = req.companyContext?.ourCompanyId;
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const month = Number(req.query.month) || now.getMonth() + 1;

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);
    const startOfPrevMonth = new Date(year, month - 2, 1);
    const endOfPrevMonth = new Date(year, month - 1, 0, 23, 59, 59);

    const companyFilter = companyId && companyId !== 'all' ? { ourCompanyId: companyId } : {};

    // Active projects
    const activeProjects = await prisma.project.count({
      where: { ...companyFilter, status: 'ACTIVE' },
    });

    // Monthly confirmed quotations (sales/purchase)
    const monthlyQuotations = await prisma.quotation.findMany({
      where: {
        ...companyFilter,
        isConfirmed: true,
        confirmedAt: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    const prevMonthQuotations = await prisma.quotation.findMany({
      where: {
        ...companyFilter,
        isConfirmed: true,
        confirmedAt: { gte: startOfPrevMonth, lte: endOfPrevMonth },
      },
    });

    const monthlySales = monthlyQuotations
      .filter(q => q.direction === 'SALES')
      .reduce((sum, q) => sum + q.totalAmount, 0);
    const monthlyPurchase = monthlyQuotations
      .filter(q => q.direction === 'PURCHASE')
      .reduce((sum, q) => sum + q.totalAmount, 0);

    const prevSales = prevMonthQuotations
      .filter(q => q.direction === 'SALES')
      .reduce((sum, q) => sum + q.totalAmount, 0);
    const prevPurchase = prevMonthQuotations
      .filter(q => q.direction === 'PURCHASE')
      .reduce((sum, q) => sum + q.totalAmount, 0);

    // Single transactions for the month
    const monthlySingleTx = await prisma.singleTransaction.findMany({
      where: {
        ...companyFilter,
        tradeDate: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    const singleSales = monthlySingleTx.filter(t => t.direction === 'SALES').reduce((s, t) => s + t.totalAmount, 0);
    const singlePurchase = monthlySingleTx.filter(t => t.direction === 'PURCHASE').reduce((s, t) => s + t.totalAmount, 0);

    const totalSales = monthlySales + singleSales;
    const totalPurchase = monthlyPurchase + singlePurchase;
    const profit = totalSales - totalPurchase;
    const profitRate = totalSales > 0 ? Math.round((profit / totalSales) * 1000) / 10 : 0;

    const salesDelta = prevSales > 0 ? Math.round(((monthlySales - prevSales) / prevSales) * 1000) / 10 : 0;
    const purchaseDelta = prevPurchase > 0 ? Math.round(((monthlyPurchase - prevPurchase) / prevPurchase) * 1000) / 10 : 0;

    // Pending quotations (DRAFT)
    const pendingQuotations = await prisma.quotation.count({
      where: { ...companyFilter, status: 'DRAFT' },
    });

    // Recent projects
    const recentProjects = await prisma.project.findMany({
      where: { ...companyFilter, status: 'ACTIVE' },
      include: {
        client: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    return success(res, {
      activeProjects,
      monthlySales: totalSales,
      monthlySalesDelta: salesDelta,
      monthlyPurchase: totalPurchase,
      monthlyPurchaseDelta: purchaseDelta,
      profit,
      profitRate,
      pendingQuotations,
      recentProjects,
    });
  } catch (e) {
    console.error('getSummary error:', e);
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function getMonthly(req: Request, res: Response) {
  try {
    const companyId = req.companyContext?.ourCompanyId;
    const year = Number(req.query.year) || new Date().getFullYear();
    const companyFilter = companyId && companyId !== 'all' ? { ourCompanyId: companyId } : {};

    const months = [];
    for (let m = 1; m <= 12; m++) {
      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 0, 23, 59, 59);

      const quotations = await prisma.quotation.findMany({
        where: { ...companyFilter, isConfirmed: true, confirmedAt: { gte: start, lte: end } },
      });

      const singleTx = await prisma.singleTransaction.findMany({
        where: { ...companyFilter, tradeDate: { gte: start, lte: end } },
      });

      const sales = quotations.filter(q => q.direction === 'SALES').reduce((s, q) => s + q.totalAmount, 0)
        + singleTx.filter(t => t.direction === 'SALES').reduce((s, t) => s + t.totalAmount, 0);
      const purchase = quotations.filter(q => q.direction === 'PURCHASE').reduce((s, q) => s + q.totalAmount, 0)
        + singleTx.filter(t => t.direction === 'PURCHASE').reduce((s, t) => s + t.totalAmount, 0);

      months.push({ month: m, sales, purchase, profit: sales - purchase });
    }

    return success(res, { year, months });
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}
