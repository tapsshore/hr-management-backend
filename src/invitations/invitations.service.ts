import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Invitation } from './entities/invitation.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,
  ) {}

  async create(createInvitationDto: CreateInvitationDto): Promise<Invitation> {
    const { email } = createInvitationDto;
    
    // Check if there's an active invitation for this email
    const existingInvitation = await this.invitationRepository.findOne({
      where: { 
        email,
        isAccepted: false,
        isExpired: false,
        expiresAt: { $gt: new Date() }
      }
    });
    
    if (existingInvitation) {
      throw new BadRequestException('An active invitation already exists for this email');
    }

    // Generate a unique token
    const token = uuidv4();
    
    // Set expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Set default roles if not provided
    const roles = createInvitationDto.roles || [Role.EMPLOYEE];

    const invitation = this.invitationRepository.create({
      ...createInvitationDto,
      token,
      expiresAt,
      roles,
    });

    await this.invitationRepository.save(invitation);

    // In a real application, you would send an email with the invitation link
    // For this example, we'll just return the invitation with the token
    return invitation;
  }

  async findAll(): Promise<Invitation[]> {
    return this.invitationRepository.find();
  }

  async findOne(id: number): Promise<Invitation> {
    const invitation = await this.invitationRepository.findOne({ where: { id } });
    if (!invitation) {
      throw new NotFoundException(`Invitation with ID ${id} not found`);
    }
    return invitation;
  }

  async findByToken(token: string): Promise<Invitation> {
    const invitation = await this.invitationRepository.findOne({ where: { token } });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    return invitation;
  }

  async remove(id: number): Promise<void> {
    const invitation = await this.findOne(id);
    await this.invitationRepository.remove(invitation);
  }

  async resend(id: number): Promise<Invitation> {
    const invitation = await this.findOne(id);
    
    if (invitation.isAccepted) {
      throw new BadRequestException('Invitation has already been accepted');
    }
    
    // Generate a new token
    invitation.token = uuidv4();
    
    // Reset expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    invitation.expiresAt = expiresAt;
    
    // Reset expired flag
    invitation.isExpired = false;
    
    await this.invitationRepository.save(invitation);
    
    // In a real application, you would send a new email with the invitation link
    // For this example, we'll just return the updated invitation
    return invitation;
  }
}