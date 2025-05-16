import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { Enable2faDto } from './dto/enable-2fa.dto';
import { Verify2faDto } from './dto/verify-2fa.dto';
import { DebugLoginDto } from './dto/debug-login.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { AdminRehashDto } from './dto/admin-rehash.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user account in the system. The registration data including name, email, password, and other required fields are provided in the request body. The first user to register will automatically be assigned the ADMIN role. Subsequent users will be assigned the EMPLOYEE role by default if no role is specified.',
  })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @ApiOperation({
    summary: 'Login with email and password',
    description:
      'Authenticates a user with their email and password. If successful, returns an access token (JWT) and a refresh token. The access token is used for authenticating subsequent API requests and contains encoded user information. The refresh token can be used to obtain a new access token when the current one expires.',
  })
  @HttpCode(200)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiOperation({
    summary: 'Refresh JWT token',
    description:
      'Generates a new access token (JWT) using a valid refresh token. This endpoint is used when the original access token has expired but the user should remain authenticated. The refresh token is provided in the request body. If the refresh token is valid and has not expired, a new access token and refresh token pair is returned.',
  })
  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @ApiOperation({
    summary: 'Request password reset',
    description:
      "Initiates the password reset process for a user. The email address of the user is provided in the request body. If the email corresponds to a registered user, a password reset token is generated and sent to the user's email address. This token is required to complete the password reset process using the reset-password endpoint.",
  })
  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto.email);
    return {
      message:
        'If your email is registered, you will receive password reset instructions',
    };
  }

  @ApiOperation({
    summary: 'Reset password with token',
    description:
      "Completes the password reset process by setting a new password for the user. The request body must include the reset token that was sent to the user's email (from the forgot-password endpoint) and the new password. If the token is valid and has not expired, the user's password is updated to the new value.",
  })
  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return { message: 'Password has been successfully reset' };
  }

  @ApiOperation({
    summary: 'Logout and invalidate token',
    description:
      'Logs out the user by invalidating their current access token. This endpoint requires authentication using the JWT token (provided in the Authorization header). The token is extracted from the request headers and added to a blacklist, preventing its use for future API requests. This is important for security when a user explicitly logs out before their token expires.',
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

  @ApiOperation({
    summary: 'Generate 2FA secret and QR code',
    description:
      'Generates a new 2FA secret for the authenticated user and returns the secret along with a QR code that can be scanned with authenticator apps. This is the first step in enabling 2FA for a user account. The secret is stored but not activated until the user verifies it with a valid code using the enable-2fa endpoint.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('2fa/generate')
  async generate2fa(@Req() req) {
    return this.authService.generate2faSecret(req.user.sub);
  }

  @ApiOperation({
    summary: 'Enable 2FA for user',
    description:
      'Enables 2FA for the authenticated user after verifying the provided authentication code. The user must have previously generated a 2FA secret using the generate-2fa endpoint. The code provided in the request body must be valid for the stored secret. If successful, 2FA will be enabled for the user account, requiring an additional verification step during future login attempts.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  async enable2fa(@Req() req, @Body() dto: Enable2faDto) {
    return this.authService.enable2fa(req.user.sub, dto);
  }

  @ApiOperation({
    summary: 'Disable 2FA for user',
    description:
      'Disables 2FA for the authenticated user. This removes the 2FA requirement for future login attempts. The user will only need their email and password to authenticate after this endpoint is called successfully.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  async disable2fa(@Req() req) {
    return this.authService.disable2fa(req.user.sub);
  }

  @ApiOperation({
    summary: 'Verify 2FA code during login',
    description:
      "Verifies the 2FA code provided during login for a user with 2FA enabled. This endpoint is called after a successful password authentication when the user has 2FA enabled. The request body must include the temporary token received from the login endpoint and a valid authentication code from the user's authenticator app. If successful, returns the final access and refresh tokens that can be used for API access.",
  })
  @HttpCode(200)
  @Post('2fa/verify')
  async verify2fa(@Body() dto: Verify2faDto) {
    return this.authService.verify2fa(dto);
  }

  @ApiOperation({
    summary: 'Debug login issues (DEV ONLY)',
    description:
      'Development-only endpoint to debug login issues. Provides detailed information about the login attempt.',
  })
  @HttpCode(200)
  @Post('debug-login')
  async debugLogin(@Body() debugLoginDto: DebugLoginDto) {
    return this.authService.debugLogin(debugLoginDto);
  }

  @ApiOperation({
    summary: 'Update user password (DEV ONLY)',
    description:
      'Development-only endpoint to update a user password directly.',
  })
  @HttpCode(200)
  @Post('update-password')
  async updatePassword(@Body() updatePasswordDto: UpdatePasswordDto) {
    await this.authService.updateUserPassword(
      updatePasswordDto.email,
      updatePasswordDto.newPassword,
    );
    return { message: 'Password updated successfully' };
  }
  
  @ApiOperation({
    summary: 'Rehash all passwords (ADMIN ONLY)',
    description:
      'Administrative endpoint to rehash all passwords using the new hashing method. All passwords will be reset to a default value.',
  })
  @HttpCode(200)
  @Post('rehash-all-passwords')
  async rehashAllPasswords(@Body() adminRehashDto: AdminRehashDto) {
    return this.authService.rehashAllPasswords(adminRehashDto.adminSecret);
  }
}
