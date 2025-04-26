import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('invitations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.HR)
  create(@Body() createInvitationDto: CreateInvitationDto) {
    return this.invitationsService.create(createInvitationDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.HR)
  findAll() {
    return this.invitationsService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.HR)
  findOne(@Param('id') id: string) {
    return this.invitationsService.findOne(+id);
  }

  @Get('token/:token')
  findByToken(@Param('token') token: string) {
    return this.invitationsService.findByToken(token);
  }

  @Post(':id/resend')
  @Roles(Role.ADMIN, Role.HR)
  resend(@Param('id') id: string) {
    return this.invitationsService.resend(+id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.HR)
  remove(@Param('id') id: string) {
    return this.invitationsService.remove(+id);
  }
}