import {
  Controller,
  Post,
  Body,
  Query,
  HttpCode,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ 
    summary: 'Register a new user', 
    description: 'Creates a new user account in the system. The registration data including name, email, password, and other required fields are provided in the request body. An optional invitation token can be provided as a query parameter if the registration is in response to an invitation. The invitation token determines the initial role and department assignment for the user.'
  })
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Query('invitationToken') invitationToken?: string,
  ) {
    return this.authService.register(registerDto, invitationToken);
  }

  @ApiOperation({ 
    summary: 'Login with email and password', 
    description: 'Authenticates a user with their email and password. If successful, returns an access token (JWT) and a refresh token. The access token is used for authenticating subsequent API requests and contains encoded user information. The refresh token can be used to obtain a new access token when the current one expires.'
  })
  @HttpCode(200)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ 
    summary: 'Refresh JWT token', 
    description: 'Generates a new access token (JWT) using a valid refresh token. This endpoint is used when the original access token has expired but the user should remain authenticated. The refresh token is provided in the request body. If the refresh token is valid and has not expired, a new access token and refresh token pair is returned.'
  })
  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @ApiOperation({ 
    summary: 'Request password reset', 
    description: 'Initiates the password reset process for a user. The email address of the user is provided in the request body. If the email corresponds to a registered user, a password reset token is generated and sent to the user\'s email address. This token is required to complete the password reset process using the reset-password endpoint.'
  })
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @ApiOperation({ 
    summary: 'Reset password with token', 
    description: 'Completes the password reset process by setting a new password for the user. The request body must include the reset token that was sent to the user\'s email (from the forgot-password endpoint), the user\'s email address, and the new password. If the token is valid and has not expired, the user\'s password is updated to the new value.'
  })
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @ApiOperation({ 
    summary: 'Logout and invalidate token', 
    description: 'Logs out the user by invalidating their current access token. This endpoint requires authentication using the JWT token (provided in the Authorization header). The token is extracted from the request headers and added to a blacklist, preventing its use for future API requests. This is important for security when a user explicitly logs out before their token expires.'
  })
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @Post('logout')
  async logout(@Req() req) {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await this.authService.logout(token);
    }
    return { message: 'Logged out successfully' };
  }
}
