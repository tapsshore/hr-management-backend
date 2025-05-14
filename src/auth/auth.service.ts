import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { MoreThan, LessThan } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../employees/entities/employee.entity';
import { Invitation } from '../invitations/entities/invitation.entity';
import { TokenBlacklist } from './entities/token-blacklist.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Enable2faDto } from './dto/enable-2fa.dto';
import { Verify2faDto } from './dto/verify-2fa.dto';
import { Role } from '../common/enums/role.enum';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
// Import otplib and qrcode for 2FA
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import { DepartmentsService } from '../departments/departments.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,
    @InjectRepository(TokenBlacklist)
    private tokenBlacklistRepository: Repository<TokenBlacklist>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private departmentsService: DepartmentsService,
  ) {
    // Clean up expired blacklisted tokens periodically
    setInterval(() => this.cleanupBlacklist(), 3600000); // Run every hour
  }

  async register(registerDto: RegisterDto): Promise<Employee> {
    // Check if there are any existing employees
    const employeeCount = await this.employeeRepository.count();

    // If no employees exist, this is the first registration and must be an ADMIN
    if (employeeCount === 0) {
      registerDto.role = Role.ADMIN;
    } else if (!registerDto.role) {
      // For subsequent registrations, if no role is specified, default to EMPLOYEE
      registerDto.role = Role.EMPLOYEE;
    }

    const existingEmployee = await this.employeeRepository.findOne({
      where: [
        { email: registerDto.email },
        { employeeNumber: registerDto.employeeNumber },
      ],
    });
    if (existingEmployee) {
      throw new BadRequestException('Email or employee number already exists');
    }

    // Create a default department if no departmentId is provided
    if (!registerDto.departmentId) {
      try {
        // Create a default department with the user's name
        const departmentName = `${registerDto.firstName}'s Department`;
        const department = await this.departmentsService.create({
          name: departmentName,
          description: 'Default department created during registration',
        });

        // Set the departmentId to the newly created department's id
        registerDto.departmentId = department.id;
      } catch (error) {
        // If there's an error creating the department, log it but continue with registration
        console.error('Error creating default department:', error.message);
      }
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const employee = this.employeeRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    const savedEmployee = await this.employeeRepository.save(employee);

    delete savedEmployee.password;
    return savedEmployee;
  }

  async login(loginDto: LoginDto): Promise<{
    accessToken?: string;
    refreshToken?: string;
    tempToken?: string;
    isTwoFactorEnabled?: boolean;
  }> {
    const employee = await this.employeeRepository.findOne({
      where: { email: loginDto.email },
    });
    if (
      !employee ||
      !(await bcrypt.compare(loginDto.password, employee.password))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if 2FA is enabled for this user
    if (employee.isTwoFactorEnabled) {
      // Create a temporary token with short expiration for 2FA verification
      const tempPayload = {
        sub: employee.id,
        email: employee.email,
        role: employee.role,
        employeeNumber: employee.employeeNumber,
        isTwoFactorPending: true,
      };

      const tempToken = this.jwtService.sign(tempPayload, {
        expiresIn: '5m', // Short expiration for security
      });

      // Return temporary token and 2FA flag
      return {
        tempToken,
        isTwoFactorEnabled: true,
      };
    }

    // If 2FA is not enabled, proceed with normal login
    const payload = {
      sub: employee.id,
      email: employee.email,
      role: employee.role,
      employeeNumber: employee.employeeNumber,
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
    });

    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      const employee = await this.employeeRepository.findOne({
        where: { id: payload.sub },
      });
      if (employee) {
        const newPayload = {
          sub: employee.id,
          email: employee.email,
          role: employee.role,
          employeeNumber: employee.employeeNumber,
        };
        return { accessToken: this.jwtService.sign(newPayload) };
      } else {
        throw new UnauthorizedException('Invalid refresh token');
      }
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const employee = await this.employeeRepository.findOne({
      where: { email },
    });
    if (!employee) {
      return; // Silently fail to prevent email enumeration
    }

    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.employeeRepository.update(employee.id, {
      resetToken,
      resetTokenExpiresAt: expiresAt,
    });

    // TODO: Send email with reset link (e.g., http://frontend.com/reset-password?token=resetToken)
    console.log(
      `Reset link: http://localhost:3000/auth/reset-password?token=${resetToken}`,
    );
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const employee = await this.employeeRepository.findOne({
      where: {
        resetToken: dto.token,
        resetTokenExpiresAt: MoreThan(new Date()),
      },
    });
    if (!employee) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.employeeRepository.update(employee.id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiresAt: null,
    });
  }

  async logout(token: string): Promise<void> {
    try {
      const decoded = this.jwtService.verify(token);
      const expiresAt = new Date(decoded.exp * 1000);
      await this.tokenBlacklistRepository.save({
        token,
        expiresAt,
      });
    } catch (error) {
      console.log('Invalid token provided for logout:', error.message);
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklistedToken = await this.tokenBlacklistRepository.findOne({
      where: { token },
    });
    return !!blacklistedToken;
  }

  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    const employee = await this.employeeRepository.findOne({
      where: { id: userId },
    });
    return !!employee?.isTwoFactorEnabled;
  }

  async generate2faSecret(
    userId: string,
  ): Promise<{ secret: string; otpAuthUrl: string; qrCodeDataUrl: string }> {
    const employee = await this.employeeRepository.findOne({
      where: { id: userId },
    });
    if (!employee) {
      throw new BadRequestException('User not found');
    }

    // Generate a secret
    const secret = authenticator.generateSecret();

    // Generate the OTP auth URL
    const appName = 'HR Management';
    const otpAuthUrl = authenticator.keyuri(employee.email, appName, secret);

    // Generate QR code
    const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl);

    // Save the secret temporarily (not enabled yet)
    await this.employeeRepository.update(userId, {
      twoFactorSecret: secret,
    });

    return {
      secret,
      otpAuthUrl,
      qrCodeDataUrl,
    };
  }

  async enable2fa(userId: string, dto: Enable2faDto): Promise<boolean> {
    const employee = await this.employeeRepository.findOne({
      where: { id: userId },
    });
    if (!employee || !employee.twoFactorSecret) {
      throw new BadRequestException(
        'User not found or 2FA secret not generated',
      );
    }

    // Verify the provided code
    const isCodeValid = authenticator.verify({
      token: dto.twoFactorCode,
      secret: employee.twoFactorSecret,
    });

    if (!isCodeValid) {
      throw new BadRequestException('Invalid authentication code');
    }

    // Enable 2FA
    await this.employeeRepository.update(userId, {
      isTwoFactorEnabled: true,
    });

    return true;
  }

  async disable2fa(userId: string): Promise<boolean> {
    const employee = await this.employeeRepository.findOne({
      where: { id: userId },
    });
    if (!employee) {
      throw new BadRequestException('User not found');
    }

    // Disable 2FA
    await this.employeeRepository.update(userId, {
      isTwoFactorEnabled: false,
      twoFactorSecret: null,
    });

    return true;
  }

  async verify2fa(
    dto: Verify2faDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify the temporary token
      const payload = this.jwtService.verify(dto.tempToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const employee = await this.employeeRepository.findOne({
        where: { id: payload.sub },
      });

      if (
        !(
          !employee ||
          !employee.isTwoFactorEnabled ||
          !employee.twoFactorSecret
        )
      ) {
        const isCodeValid = authenticator.verify({
          token: dto.twoFactorCode,
          secret: employee.twoFactorSecret,
        });
        if (!isCodeValid) {
          throw new UnauthorizedException('Invalid authentication code');
        }
        const newPayload = {
          sub: employee.id,
          email: employee.email,
          role: employee.role,
          employeeNumber: employee.employeeNumber,
          isTwoFactorVerified: true,
        };
        const accessToken = this.jwtService.sign(newPayload);
        const refreshToken = this.jwtService.sign(newPayload, {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
        });
        return { accessToken, refreshToken };
      } else {
        throw new UnauthorizedException('Invalid token or 2FA not enabled');
      }

      // Verify the provided code
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
      throw new UnauthorizedException('Invalid token or authentication code');
    }
  }

  private async cleanupBlacklist(): Promise<void> {
    try {
      // Remove all expired tokens from the blacklist
      const result = await this.tokenBlacklistRepository.delete({
        expiresAt: LessThan(new Date()),
      });
      console.log(
        `Cleaned up ${result.affected} expired tokens from blacklist`,
      );
    } catch (error) {
      console.error('Error cleaning up token blacklist:', error);
    }
  }
}
