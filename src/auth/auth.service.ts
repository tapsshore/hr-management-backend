import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Employee } from '../employees/entities/employee.entity';
import { Invitation } from '../invitations/entities/invitation.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    
    const employee = await this.employeeRepository.findOne({ where: { email } });
    if (!employee) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!employee.isActive) {
      throw new UnauthorizedException('Your account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(password, employee.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { 
      sub: employee.id, 
      email: employee.email,
      roles: employee.roles 
    };
    
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: employee.id,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        roles: employee.roles,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const { email, password, passwordConfirm, firstName, lastName, token } = registerDto;

    if (password !== passwordConfirm) {
      throw new BadRequestException('Passwords do not match');
    }

    const invitation = await this.invitationRepository.findOne({ 
      where: { token, email, isAccepted: false, isExpired: false } 
    });

    if (!invitation) {
      throw new BadRequestException('Invalid or expired invitation token');
    }

    if (new Date() > invitation.expiresAt) {
      invitation.isExpired = true;
      await this.invitationRepository.save(invitation);
      throw new BadRequestException('Invitation has expired');
    }

    const existingEmployee = await this.employeeRepository.findOne({ where: { email } });
    if (existingEmployee) {
      throw new BadRequestException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = this.employeeRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      roles: invitation.roles,
      position: invitation.position,
      department: invitation.department,
      isActive: true,
    });

    await this.employeeRepository.save(employee);

    invitation.isAccepted = true;
    invitation.acceptedAt = new Date();
    await this.invitationRepository.save(invitation);

    const payload = { 
      sub: employee.id, 
      email: employee.email,
      roles: employee.roles 
    };
    
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: employee.id,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        roles: employee.roles,
      },
    };
  }

  async requestPasswordReset(email: string) {
    const employee = await this.employeeRepository.findOne({ where: { email } });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // In a real application, you would generate a token, save it, and send an email
    // For this example, we'll just return a success message
    return { message: 'Password reset instructions sent to your email' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password, passwordConfirm } = resetPasswordDto;

    if (password !== passwordConfirm) {
      throw new BadRequestException('Passwords do not match');
    }

    // In a real application, you would validate the token and find the employee
    // For this example, we'll just return a success message
    return { message: 'Password has been reset successfully' };
  }
}