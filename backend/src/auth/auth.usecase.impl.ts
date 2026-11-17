// auth.usecase.impl.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthUseCase } from './auth.usecase';
import { AuthRepository } from './auth.repository';
import { User } from '@prisma/client';
import {
  AuthRegisterDto,
  AuthLoginDto,
  AuthTokens,
  AuthChangePasswordDto,
  AuthForgotPasswordDto,
  AuthResetPasswordDto,
  AuthVerifyEmailDto,
  AuthMfaDto,
  AuthSession,
  AuthRequestPasswordResetDto,
} from './auth.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { IResponse } from '../common/types';
import { uploadToSpaces } from '../config/cloudinary/upload';
import { sendSms } from '../utils/sendSms';
import { randomInt, randomUUID } from 'crypto';

/**
 * How long a sign-in lasts.
 *  - admin web app: access 30 min, refresh 1 hour. Every refresh gives a new
 *    1-hour refresh token, so an admin who keeps working stays signed in and
 *    is signed out after 1 hour without using the app.
 *  - mobile app (customers + suppliers): access 30 min, refresh 30 days.
 */
const SESSION = {
  admin: { access: '30m', refresh: '1h', refreshMs: 60 * 60 * 1000 },
  app: { access: '30m', refresh: '30d', refreshMs: 30 * 24 * 60 * 60 * 1000 },
} as const;
type SessionClient = keyof typeof SESSION;

/**
 * Generate a 6-digit numeric OTP as a string (e.g. "012345")
 */
export function generateOtp6(): string {
  const num = randomInt(0, 1_000_000); // 0..999999
  return num.toString().padStart(6, '0');
}
@Injectable()
export class AuthUseCaseImpl {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: AuthRegisterDto, uploadedFiles: any): Promise<any> {
    const roleName = data.role;
    if (!roleName) {
      throw new RpcException(`Invalid role`);
    }
    // Public sign-up: customers (GUEST) and suppliers (HOST) only.
    // Staff / admin accounts are created from the admin panel.
    if (roleName !== 'GUEST' && roleName !== 'HOST') {
      throw new RpcException(`Invalid role`);
    }
    const role = await this.authRepository.findRoleByName(roleName!);
    if (!role) {
      throw new RpcException(`Invalid role`);
    }
    data.role = role.id;
    const exists = await this.authRepository.findByPhone(data.phone);
    if (exists) {
      throw new RpcException('You are already registered. Please log in.');
    }

    if (role.name == 'HOST') {
      // Supplier sign-up: email + phone + password only
      data.email = data.email?.trim().toLowerCase();
      if (!data.email) {
        throw new RpcException('Email is required');
      }
      if (await this.authRepository.findByEmail(data.email)) {
        throw new RpcException(
          'This email is already used by another account. Please log in or use another email.',
        );
      }
      data.firstName = data.firstName?.trim() || '';
      data.lastName = data.lastName?.trim() || '';
    } else if (!data.firstName?.trim() || !data.lastName?.trim()) {
      throw new RpcException('First and last name are required');
    }
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // const uploadedFiles: any = {};
    // try {
    //   console.log('spacesssssssssssssssssssssss');
    //   if (data.profilePhotoFile) {
    //     console.log('profilePhotoFile: ', data.profilePhotoFile);
    //     uploadedFiles.profilePhoto = await uploadToSpaces(
    //       data.profilePhotoFile,
    //       'users/profilePhotos',
    //     );
    //     console.log('uploadedFiles: ', uploadedFiles);
    //   }
    //   if (data.driverLicenseFile && role.name == 'GUEST') {
    //     uploadedFiles.driverLicenseId = await uploadToSpaces(
    //       data.driverLicenseFile,
    //       'users/driverLicenses',
    //     );
    //   }
    //   if (data.nationalIdFile && role.name == 'GUEST') {
    //     uploadedFiles.nationalId = await uploadToSpaces(
    //       data.nationalIdFile,
    //       'users/nationalIds',
    //     );
    //   }
    // } catch (err) {
    //   console.log('space error: ', err);
    //   throw new RpcException('Error uploading files to space');
    // }
    const nums = generateOtp6();

    let user;

    if (role.name == 'GUEST') {
      user = await this.authRepository.createGust(
        data,
        hashedPassword,
        uploadedFiles,
        nums,
      );
    } else {
      user = await this.authRepository.createUser(
        data,
        hashedPassword,
        uploadedFiles,
        nums,
        role.name == 'HOST',
      );
    }

    await sendSms(`${nums} is your verification code`, data.phone);

    // const tokens = await this.generateTokens(user,'1y','1y');
    const tokens = await this.generateTokens(user, 'app');

    await this.authRepository.saveRefreshToken(
      user.id,
      tokens.refreshToken,
      this.refreshExpiry('app'),
    );
    return { user, tokens };
  }

  async login(data: AuthLoginDto): Promise<{ user: User; tokens: AuthTokens }> {
    const user = await this.authRepository.findByPhone(data.phone);

    if (!user) {
      throw new RpcException({
        statusCode: 400,
        message: 'Invalid credentials',
      });
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new RpcException({
        statusCode: 404,
        message: 'Invalid credentials',
      });
    }

    // Mobile app: customers and suppliers (suppliers get their own area in the app)
    if (user?.role?.name !== 'GUEST' && user?.role?.name !== 'HOST') {
      throw new RpcException({
        statusCode: 404,
        message: 'Invalid credentials',
      });
    }

    if (!user.isVerified) {
      const nums = generateOtp6();

      await sendSms(`${nums} is your verification code`, user.phone!);
      await this.authRepository.changeUserOtp(user.id, nums);
      throw new RpcException({
        statusCode: 400,
        message: 'verify first', //+ ` (${nums})`,
      });
    }
    if (!user.isActive) {
      throw new RpcException({
        statusCode: 400,
        message:
          'Your account is not active. Please contact wheellol support for assistance.',
      });
    }
    // const tokens = await this.generateTokens(user,'1y','1y');
    const tokens = await this.generateTokens(user, 'app');

    await this.authRepository.saveRefreshToken(
      user.id,
      tokens.refreshToken,
      this.refreshExpiry('app'),
    );
    // delete user.password;

    return { user, tokens };
  }

  async loginAdmin(
    data: AuthLoginDto,
  ): Promise<{ user: User; tokens: AuthTokens }> {
    const user = await this.authRepository.findByPhone(data.phone);

    if (!user) {
      throw new RpcException({
        statusCode: 400,
        message: 'Invalid credentials',
      });
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new RpcException({
        statusCode: 404,
        message: 'Invalid credentials',
      });
    }
    if (user?.role?.name == 'GUEST') {
      throw new RpcException({
        statusCode: 404,
        message: 'Invalid credentials',
      });
    }

    console.log(
      'aksldkaskdaskdmlaksdk',
      user,
      !user?.isSuperAdmin && !user.isVerified,
    );
    if (!user?.isSuperAdmin && !user.isVerified) {
      const nums = generateOtp6();

      await sendSms(`${nums} is your verification code`, user.phone!);
      await this.authRepository.changeUserOtp(user.id, nums);
      throw new RpcException({
        statusCode: 400,
        message: 'verify first', //+ ` (${nums})`,
      });
    }
    if (!user.isActive) {
      throw new RpcException({
        statusCode: 400,
        message:
          'Your account is not active. Please contact wheellol support for assistance.',
      });
    }

    // const tokens = await this.generateTokens(user,'30m','1h');
    const tokens = await this.generateTokens(user, 'admin');

    await this.authRepository.saveRefreshToken(
      user.id,
      tokens.refreshToken,
      this.refreshExpiry('admin'),
    );
    // delete user.password;

    return { user, tokens };
  }

  async requestPasswordReset(data: AuthRequestPasswordResetDto) {
    const user = await this.authRepository.findByPhone(data.phoneNumber);
    if (!user)
      throw new RpcException('This phone number does not match any account.');

    const nums = generateOtp6();
    await this.authRepository.changeUserOtp(user.id, nums);

    await sendSms(`${nums} is your verification code`, user.phone!);
    return new IResponse(true, 'OTP sent successfully');
  }

  // Step 2: Verify OTP & reset password
  async resetPassword(data: AuthResetPasswordDto) {
    const user = await this.authRepository.findByPhone(data.phoneNumber);
    if (!user) throw new RpcException('User not found');

    if (user.otp !== data.otp) {
      throw new RpcException({
        statusCode: 400,
        message: 'The OTP you entered is incorrect. Please try again.',
      });
    }
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);
    await this.authRepository.updatePassword(user.id, hashedPassword);

    return new IResponse(true, 'Password reset successfully');
  }

  async logout(userId: string, sessionId?: string): Promise<void> {
    await this.authRepository.removeRefreshToken(userId, sessionId);
  }

  async refreshToken(
    userId: string,
    refreshToken: string,
    claims?: { typ?: string; client?: string },
  ) {
    const expired = (message: string) =>
      new RpcException({ statusCode: 401, message });

    // New refresh tokens carry typ=refresh; an access token can't be used here
    if (claims?.typ && claims.typ !== 'refresh') {
      throw expired('Invalid refresh token');
    }
    const session = await this.authRepository.findSessionByRefreshToken(
      userId,
      refreshToken,
    );
    if (!session) throw expired('Your session has ended. Please sign in again.');

    const user = await this.authRepository.findById(session.userId);
    if (!user) throw expired('User not found');
    if (user.isActive === false) throw expired('Your account is not active.');

    // Same app as the sign-in. Old tokens without the claim: customers and
    // suppliers use the mobile app, everyone else the admin app.
    const client: SessionClient =
      claims?.client === 'admin' || claims?.client === 'app'
        ? claims.client
        : ['GUEST', 'HOST'].includes((user as any)?.role?.name)
          ? 'app'
          : 'admin';

    // const tokens = await this.generateTokens(user,'30m','1h');
    const tokens = await this.generateTokens(user, client);
    await this.authRepository.updateRefreshToken(
      user.id,
      tokens.refreshToken,
      session.id,
      this.refreshExpiry(client),
    );

    const { password, ...safeUser } = user as any;
    return { user: safeUser, tokens };
  }

  // ----------------- Password Management -----------------
  async changePassword(
    userId: string,
    data: AuthChangePasswordDto,
  ): Promise<any> {
    console.log('-----------------------: ', data, userId);
    const user = await this.authRepository.findById(userId);

    if (!user) throw new RpcException('User not found');

    const isOldPasswordValid = await bcrypt.compare(
      data.oldPassword,
      user.password,
    );
    if (!isOldPasswordValid)
      throw new RpcException('Old password is incorrect');

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);
    await this.authRepository.updatePassword(userId, hashedPassword);
    // { message: 'Password changed successfully' }; // ✅ return success info
  }

  // ----------------- Email Verification -----------------

  async verifyEmail(data: AuthVerifyEmailDto): Promise<void> {
    const userId = await this.authRepository.verifyEmailToken(data.token);
    if (!userId) throw new RpcException('Invalid verification token');

    await this.authRepository.markEmailAsVerified(userId);
  }

  async resendVerification(email: string): Promise<void> {
    const user = await this.authRepository.findByEmail(email);
    if (!user) return;

    // if (user.emailVerified) return; // already verified

    await this.authRepository.sendVerificationEmail(user.id, email);
  }

  async verifyPhone(otp: string, phone: string) {
    const user = await this.authRepository.findByPhone(phone);

    if (!user) {
      throw new RpcException({
        statusCode: 400,
        message: 'Please register again',
      });
    }

    console.log('======================================1', user);

    if (user.otp !== otp) {
      throw new RpcException({
        statusCode: 400,
        message: 'The OTP you entered is incorrect. Please try again.',
      });
    }

    console.log('======================================3', user);

    return this.authRepository.changeUserStatus(user.id);

    // TODO: Integrate real email sending service
    // console.log(`Send verification email to ${emaphoneil} for user ${userId}`);
  }
  async verifyPhoneResend(phone: string) {
    const user = await this.authRepository.findByPhone(phone);

    if (!user) {
      throw new RpcException({
        statusCode: 400,
        message: 'Please register again',
      });
    }

    const nums = generateOtp6();
    await sendSms(`${nums} is your verification code`, phone);

    return this.authRepository.changeUserOtp(user.id, nums);

    // TODO: Integrate real email sending service
    // console.log(`Send verification email to ${emaphoneil} for user ${userId}`);
  }
  // ----------------- Helper -----------------
  private refreshExpiry(client: SessionClient) {
    return new Date(Date.now() + SESSION[client].refreshMs);
  }

  private async generateTokens(
    user: User,
    client: SessionClient,
  ): Promise<AuthTokens> {
    const payload = { sub: user.id, email: user.email, client };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: SESSION[client].access,
    });
    // jti makes every refresh token unique (needed for rotation)
    const refreshToken = this.jwtService.sign(
      { ...payload, typ: 'refresh', jti: randomUUID() },
      { expiresIn: SESSION[client].refresh },
    );
    /* Old:
    const accessToken = this.jwtService.sign(payload, { expiresIn:  time });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: time2 });
    */
 //as
    return { accessToken, refreshToken };
  }

  async createSuperAdmin() {
    const user = await this.authRepository.createSuperAdmin();
  }
}
