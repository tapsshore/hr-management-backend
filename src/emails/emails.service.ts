import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // For development, we can use a test account from ethereal.email
    // In production, you would use real SMTP credentials
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    // Check if we have SMTP credentials in the environment
    const host = this.configService.get('SMTP_HOST');
    const port = this.configService.get('SMTP_PORT');
    const user = this.configService.get('SMTP_USER');
    const pass = this.configService.get('SMTP_PASS');
    
    if (host && port && user && pass) {
      // Use production credentials
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });
      this.logger.log('Email service initialized with production SMTP credentials');
    } else {
      // Create test account for development
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        this.logger.log(`Test email account created: ${testAccount.user}`);
        this.logger.log('Email preview URL will be logged when sending emails');
      } catch (error) {
        this.logger.error('Failed to create test email account', error);
      }
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const resetLink = `${resetUrl}/reset-password?token=${token}`;
    
    try {
      const info = await this.transporter.sendMail({
        from: '"HR Management System" <noreply@hrmanagement.com>',
        to: email,
        subject: 'Password Reset Request',
        text: `You requested a password reset. Please use the following link to reset your password: ${resetLink}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>Hello,</p>
            <p>You have requested to reset your password. Please click the link below to reset your password:</p>
            <p>
              <a href="${resetLink}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                Reset Password
              </a>
            </p>
            <p>This link will expire in 1 hour.</p>
            <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
            <p>Regards,<br>HR Management Team</p>
          </div>
        `,
      });

      // If using test account, log the URL to view the email
      if (info.messageId && this.transporter.options.host === 'smtp.ethereal.email') {
        this.logger.log(`Message sent: ${info.messageId}`);
        this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error);
      // We don't throw the error to avoid revealing email existence
    }
  }
}