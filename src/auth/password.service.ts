import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

/**
 * Service to handle password hashing and comparison
 * Supports both bcrypt and a simpler fixed-salt SHA-256 algorithm
 */
@Injectable()
export class PasswordService {
  private readonly fixedSalt = 'hr-management-fixed-salt';
  private readonly useSimpleHash = true; // Set to true to use simple hashing

  /**
   * Hash a password
   * @param password Plain text password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    if (this.useSimpleHash) {
      return this.simpleHash(password);
    } else {
      return bcrypt.hash(password, 10);
    }
  }

  /**
   * Compare a plain text password with a hashed password
   * @param plainPassword Plain text password
   * @param hashedPassword Hashed password from database
   * @returns Boolean indicating if passwords match
   */
  async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    // First try simple hash comparison
    if (this.simpleHash(plainPassword) === hashedPassword) {
      return true;
    }

    // If that fails, try bcrypt (for backward compatibility)
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      return false;
    }
  }

  /**
   * Simple hash function using SHA-256 with a fixed salt
   * @param password Plain text password
   * @returns Hashed password
   */
  private simpleHash(password: string): string {
    return crypto
      .createHash('sha256')
      .update(this.fixedSalt + password)
      .digest('hex');
  }
}