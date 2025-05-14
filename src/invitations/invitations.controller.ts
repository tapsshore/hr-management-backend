import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('invitations')
@ApiBearerAuth()
@Controller('invitations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @ApiOperation({
    summary: 'Create an invitation',
    description:
      'Creates a new invitation to join the organization. This operation is restricted to administrators and HR managers. The invitation details including email, role, department, and expiration date are provided in the request body. An email with a registration link containing the invitation token will be sent to the specified email address. The user information is extracted from the JWT token to track who created the invitation.',
  })
  @Roles(Role.ADMIN, Role.HR_MANAGER)
  @Post()
  create(@Body() createInvitationDto: CreateInvitationDto, @Request() req) {
    return this.invitationsService.create(createInvitationDto, req.user);
  }

  @ApiOperation({
    summary: 'Validate an invitation token',
    description:
      'Validates an invitation token and returns information about the invitation if it is valid. This endpoint is used during the registration process to verify that the invitation token is valid and has not expired. The token is provided as a query parameter. If valid, the response includes details about the invitation such as the associated email, role, and department.',
  })
  @Get('validate')
  validateToken(@Query('token') token: string) {
    return this.invitationsService.validateToken(token);
  }
}
