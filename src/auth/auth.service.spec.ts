import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Employee } from '../employees/entities/employee.entity';
import { Invitation } from '../invitations/entities/invitation.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Role } from '../common/enums/role.enum';

describe('AuthService', () => {
  let service: AuthService;
  let employeeRepository: Repository<Employee>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Employee),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Invitation),
          useClass: Repository,
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn(() => 'mockToken') },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => (key === 'JWT_SECRET' ? 'secret' : '7d')),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    employeeRepository = module.get<Repository<Employee>>(
      getRepositoryToken(Employee),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register an admin successfully', async () => {
    const registerDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      employeeNumber: 'EMP001',
      phoneNumber: '+1234567890',
      password: 'password123',
      role: Role.ADMIN,
    };

    jest.spyOn(employeeRepository, 'findOne').mockResolvedValue(null);
    jest
      .spyOn(employeeRepository, 'create')
      .mockReturnValue(registerDto as any);
    jest
      .spyOn(employeeRepository, 'save')
      .mockResolvedValue(registerDto as any);

    const result = await service.register(registerDto);
    expect(result).toEqual(registerDto);
  });
});
