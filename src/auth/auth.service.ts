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
import { Role } from '../common/enums/role.enum';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

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
  ) {
    // Clean up expired blacklisted tokens periodically
    setInterval(() => this.cleanupBlacklist(), 3600000); // Run every hour
  }

  async register(
    registerDto: RegisterDto,
    invitationToken?: string,
  ): Promise<Employee> {
    if (registerDto.role !== Role.ADMIN && !invitationToken) {
      throw new BadRequestException(
        'Invitation token required for non-admin registration',
      );
    }

    if (invitationToken) {
      const invitation = await this.invitationRepository.findOne({
        where: { token: invitationToken },
      });
      if (!invitation || invitation.expiresAt < new Date()) {
        throw new BadRequestException('Invalid or expired invitation token');
      }
      if (invitation.email !== registerDto.email) {
        throw new BadRequestException('Email does not match invitation');
      }
      registerDto.role = invitation.role;
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

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const employee = this.employeeRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    const savedEmployee = await this.employeeRepository.save(employee);
    if (invitationToken) {
      await this.invitationRepository.delete({ token: invitationToken });
    }

    delete savedEmployee.password;
    return savedEmployee;
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const employee = await this.employeeRepository.findOne({
      where: { email: loginDto.email },
    });
    if (
      !employee ||
      !(await bcrypt.compare(loginDto.password, employee.password))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

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
      if (!employee) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload = {
        sub: employee.id,
        email: employee.email,
        role: employee.role,
        employeeNumber: employee.employeeNumber,
      };
      return { accessToken: this.jwtService.sign(newPayload) };
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
