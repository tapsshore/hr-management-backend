import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../../common/interfaces/user.interface';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      passReqToCallback: true, // Pass request to callback
    });
  }

  async validate(request: any, payload: any): Promise<User> {
    // Extract token from request
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);

    // Check if token is blacklisted
    const isBlacklisted = await this.authService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // Check if token has isTwoFactorPending flag
    if (payload.isTwoFactorPending) {
      throw new UnauthorizedException('Two-factor authentication required');
    }

    // If user has 2FA enabled, ensure it's been verified for this session
    const isTwoFactorEnabled = await this.authService.isTwoFactorEnabled(
      payload.sub,
    );

    if (isTwoFactorEnabled && !payload.isTwoFactorVerified) {
      throw new UnauthorizedException('Two-factor authentication required');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      employeeNumber: payload.employeeNumber,
    };
  }
}
