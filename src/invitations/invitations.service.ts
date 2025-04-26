import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invitation } from './entities/invitation.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { Role } from '../common/enums/role.enum';
import { v4 as uuidv4 } from 'uuid';
import { Employee } from '../employees/entities/employee.entity';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async create(
    createInvitationDto: CreateInvitationDto,
    user: any,
  ): Promise<Invitation> {
    if (![Role.ADMIN, Role.HR_MANAGER].includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const existingEmployee = await this.employeeRepository.findOne({
      where: { email: createInvitationDto.email },
    });
    if (existingEmployee) {
      throw new BadRequestException('Email already registered');
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const invitation = this.invitationRepository.create({
      ...createInvitationDto,
      token,
      expiresAt,
    });

    const savedInvitation = await this.invitationRepository.save(invitation);

    // TODO: Send email with invitation link (e.g., http://frontend.com/register?token=token)
    console.log(
      `Invitation link: http://localhost:3000/auth/register?token=${token}`,
    );

    return savedInvitation;
  }

  async validateToken(token: string): Promise<Invitation> {
    const invitation = await this.invitationRepository.findOne({
      where: { token },
    });
    if (!invitation || invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired invitation token');
    }
    return invitation;
  }
}
