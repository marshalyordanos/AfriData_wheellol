// auth.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Adjust path to your Prisma service
import { Prisma, Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { AuthRegisterDto } from './auth.entity';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ----------------- User Queries -----------------
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }
  // Ethiopian numbers can be stored as 09XXXXXXXX, 9XXXXXXXX, 2519XXXXXXXX or
  // +2519XXXXXXXX (admin-created vs self-signup). Match any of them.
  private phoneVariants(phone: string): string[] {
    const clean = (phone ?? '').toString().trim().replace(/[^\d+]/g, '');
    const m = clean.match(/^(?:\+?251|0)?([79]\d{8})$/);
    if (!m) return [clean];
    const core = m[1];
    return [...new Set([clean, `+251${core}`, `251${core}`, `0${core}`, core])];
  }

  async findByPhone(phone: string) {
    return this.prisma.user.findFirst({
      where: { phone: { in: this.phoneVariants(phone) } },
      include: {
        role: { include: { rolePermissions: true } },
        guestProfile: true,
        hostProfile: true,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
  }

  async findRoleById(id: string) {
    return this.prisma.role.findUnique({ where: { id } });
  }
  async findRoleByName(name: string) {
    return this.prisma.role.findUnique({ where: { name } });
  }
  async createGust(
    data: AuthRegisterDto,
    hashedPassword: string,
    files?: {
      profilePhoto?: string;
      driverLicenseId?: string;
      nationalId?: string;
    },
    nums?: string,
  ): Promise<User> {
    const { firstName, lastName, email, phone, role } = data;

    return this.prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        otp: nums,
        password: hashedPassword,
        profilePhoto: files?.profilePhoto,
        guestProfile: {
          create: {
            driverLicenseId: files?.driverLicenseId,
            nationalId: files?.nationalId,
          },
        },
        role: role ? { connect: { id: role } } : undefined,
      },
      include: { role: true, guestProfile: true },
    });
  }
  async createUser(
    data: AuthRegisterDto,
    hashedPassword: string,
    files?: {
      profilePhoto?: string;
      nationalId?: string;
    },
    nums?: string,
    isSupplier = false,
  ): Promise<User> {
    const { firstName, lastName, email, phone, role } = data;

    return this.prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        otp: nums,
        phone,
        password: hashedPassword,
        profilePhoto: files?.profilePhoto || undefined,
        role: role ? { connect: { id: role } } : undefined,
        // Supplier signing up from the mobile app
        hostProfile: isSupplier
          ? {
              create: {
                businessName: data.businessName?.trim() || null,
                nationalId: files?.nationalId || null,
              },
            }
          : undefined,
      },
      include: { role: true, guestProfile: true, hostProfile: true },
    });
  }

  // ----------------- Refresh Tokens -----------------
  // Stored as sha256 of the token. (bcrypt only reads the first 72 bytes, and
  // all JWTs of one user start the same, so bcrypt matched ANY of the user's
  // tokens.) Old bcrypt rows are still checked so nobody is signed out.
  private hashToken(token: string) {
    return 'sha256:' + createHash('sha256').update(token).digest('hex');
  }

  async saveRefreshToken(
    userId: string,
    token: string,
    expiresAt?: Date,
  ): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        token: this.hashToken(token),
        userId,
        ...(expiresAt ? { expiresAt } : {}),
      },
    });
  }

  async findSessionByRefreshToken(userId: string, token: string) {
    if (!userId || !token) return null;
    const hashed = this.hashToken(token);
    const exact = await this.prisma.refreshToken.findFirst({
      where: { userId, token: hashed, expiresAt: { gt: new Date() } },
    });
    if (exact) return exact;

    // Old sessions (bcrypt), still valid
    const sessions = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
        NOT: { token: { startsWith: 'sha256:' } },
      },
    });
    for (const session of sessions) {
      const isValid = await bcrypt.compare(token, session.token);
      if (isValid) return session;
    }

    return null; // no valid session found
  }

  async removeRefreshToken(userId: string, sessionId?: string): Promise<void> {
    if (sessionId) {
      await this.prisma.refreshToken.delete({ where: { id: sessionId } });
    } else {
      await this.prisma.refreshToken.deleteMany({ where: { userId } });
    }
  }

  /** Rotate: new token for the same session, and push its end date forward. */
  async updateRefreshToken(
    userId: string,
    newToken: string,
    sessionId: string,
    expiresAt?: Date,
  ) {
    await this.prisma.refreshToken.update({
      where: { id: sessionId },
      data: {
        token: this.hashToken(newToken),
        createdAt: new Date(),
        ...(expiresAt ? { expiresAt } : {}),
      },
    });
    // tidy up: drop this user's ended sessions
    await this.prisma.refreshToken.deleteMany({
      where: { userId, expiresAt: { lt: new Date() } },
    });
  }

  // ----------------- Password Management -----------------
  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      // user chose their own password -> drop any admin-issued temp password
      data: { password: hashedPassword, tempPassword: null },
    });
  }

  async generateResetToken(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour expiry

    return token;
  }

  // async verifyResetToken(token: string): Promise<string | null> {
  //   const resetRecord = await this.prisma.passwordReset.findFirst({
  //     where: {
  //       expiresAt: { gt: new Date() },
  //     },
  //     orderBy: { createdAt: 'desc' },
  //   });
  //   if (!resetRecord) return null;
  //   return resetRecord.userId;
  // }

  // async invalidateResetToken(token: string): Promise<void> {
  //   await this.prisma.passwordReset.deleteMany({
  //     where: { expiresAt: { gt: new Date() } },
  //   });
  // }

  // // ----------------- Email Verification -----------------
  async sendVerificationEmail(otp: string, email: string): Promise<void> {
    // TODO: Integrate real email sending service
    // console.log(`Send verification email to ${email} for user ${userId}`);
  }
  async verifyPhone(otp: string, phone: string): Promise<void> {
    // TODO: Integrate real email sending service
    // console.log(`Send verification email to ${emaphoneil} for user ${userId}`);
  }

  async verifyEmailToken(token: string): Promise<string | null> {
    // TODO: Implement proper token verification logic
    // For now, return a userId placeholder
    return null;
  }

  async markEmailAsVerified(userId: string): Promise<void> {
    // await this.prisma.user.update({
    //   where: { id: userId },
    //   data: { emailVerified: true },
    // });
  }

  // ----------------- Reset Password Email -----------------

  async sendResetPasswordEmail(email: string, token: string): Promise<void> {
    // TODO: Integrate real email service
    console.log(`Send password reset email to ${email}: token=${token}`);
  }

  async createSuperAdmin() {
    // Check if super admin already exists
    const existing = await this.prisma.user.findFirst({
      where: { isSuperAdmin: true },
    });
    if (existing) {
      return existing;
    }

    const hashedPassword = await bcrypt.hash('admin1111', 10);

    return this.prisma.user.create({
      data: {
        firstName: 'Super',
        lastName: 'Admin',
        email: 'superadmin@gmail.com',
        password: hashedPassword,
        phone: '0000000000',
        isSuperAdmin: true,
        role: {
          create: {
            name: 'SuperAdmin',
            description: 'Full access to the system',
          },
        },
      },
    });
  }

  async changeUserStatus(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isVerified: true },
    });
  }
  async changeUserOtp(id: string, otp: string) {
    return this.prisma.user.update({
      where: { id },
      data: { otp: otp },
    });
  }
}
