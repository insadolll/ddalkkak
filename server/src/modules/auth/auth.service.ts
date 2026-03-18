import bcrypt from 'bcrypt';
import crypto from 'crypto';
import prisma from '../../utils/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';

const BCRYPT_ROUNDS = 10;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function login(email: string, password: string) {
  const employee = await prisma.employee.findUnique({
    where: { email },
    include: { ourCompany: true },
  });

  if (!employee || !employee.isActive) {
    throw new AuthError('이메일 또는 비밀번호가 올바르지 않습니다', 401);
  }

  // Check lockout
  if (employee.lockedUntil && employee.lockedUntil > new Date()) {
    const remaining = Math.ceil((employee.lockedUntil.getTime() - Date.now()) / 60000);
    throw new AuthError(`계정이 잠겼습니다. ${remaining}분 후 다시 시도해주세요`, 423);
  }

  const valid = await bcrypt.compare(password, employee.passwordHash);
  if (!valid) {
    const attempts = employee.failedLoginAttempts + 1;
    const update: Record<string, unknown> = { failedLoginAttempts: attempts };
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      update.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
    }
    await prisma.employee.update({ where: { id: employee.id }, data: update });

    await prisma.auditLog.create({
      data: { action: 'LOGIN_FAILED', actorId: employee.id, detail: `attempt ${attempts}` },
    });

    throw new AuthError('이메일 또는 비밀번호가 올바르지 않습니다', 401);
  }

  // Reset failed attempts
  await prisma.employee.update({
    where: { id: employee.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });

  const accessToken = signAccessToken({
    id: employee.id,
    email: employee.email,
    role: employee.role,
    ourCompanyId: employee.ourCompanyId,
  });

  const refreshToken = signRefreshToken({ id: employee.id });
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  await prisma.refreshToken.create({
    data: {
      token: tokenHash,
      employeeId: employee.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.auditLog.create({
    data: { action: 'LOGIN', actorId: employee.id },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: employee.id,
      email: employee.email,
      name: employee.name,
      role: employee.role,
      position: employee.position,
      ourCompanyId: employee.ourCompanyId,
      ourCompanyCode: employee.ourCompany.code,
      ourCompanyName: employee.ourCompany.name,
    },
  };
}

export async function logout(refreshToken: string) {
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const stored = await prisma.refreshToken.findUnique({ where: { token: tokenHash } });
  if (stored) {
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
  }
}

export async function refreshAccessToken(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  const stored = await prisma.refreshToken.findUnique({ where: { token: tokenHash } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new AuthError('유효하지 않은 리프레시 토큰입니다', 401);
  }

  const employee = await prisma.employee.findUnique({ where: { id: payload.id } });
  if (!employee || !employee.isActive) {
    throw new AuthError('비활성 계정입니다', 401);
  }

  const accessToken = signAccessToken({
    id: employee.id,
    email: employee.email,
    role: employee.role,
    ourCompanyId: employee.ourCompanyId,
  });

  return { accessToken };
}

export async function changePassword(employeeId: string, currentPassword: string, newPassword: string) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) throw new AuthError('사용자를 찾을 수 없습니다', 404);

  const valid = await bcrypt.compare(currentPassword, employee.passwordHash);
  if (!valid) throw new AuthError('현재 비밀번호가 올바르지 않습니다', 401);

  // Check password history (last 10)
  const history = await prisma.passwordHistory.findMany({
    where: { employeeId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  for (const h of history) {
    if (await bcrypt.compare(newPassword, h.passwordHash)) {
      throw new AuthError('최근 사용한 비밀번호는 재사용할 수 없습니다', 400);
    }
  }

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await prisma.$transaction([
    prisma.employee.update({ where: { id: employeeId }, data: { passwordHash: newHash } }),
    prisma.passwordHistory.create({ data: { employeeId, passwordHash: newHash } }),
  ]);

  await prisma.auditLog.create({
    data: { action: 'PASSWORD_CHANGE', actorId: employeeId, targetId: employeeId },
  });
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
