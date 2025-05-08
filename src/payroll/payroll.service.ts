import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Payroll, PayrollStatus } from './entities/payroll.entity';
import { CreatePayrollDto } from './dto/create-payroll.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(Payroll)
    private payrollRepository: Repository<Payroll>,
  ) {}

  async create(createPayrollDto: CreatePayrollDto): Promise<Payroll> {
    // Check if payroll already exists for the employee and month/year
    const existingPayroll = await this.payrollRepository.findOne({
      where: {
        employeeId: createPayrollDto.employeeId,
        month: createPayrollDto.month,
        year: createPayrollDto.year,
      },
    });

    if (existingPayroll) {
      throw new BadRequestException('Payroll already exists for this month and year');
    }

    // Calculate net salary
    const netSalary =
      createPayrollDto.basicSalary +
      (createPayrollDto.allowances || 0) +
      (createPayrollDto.overtime || 0) +
      (createPayrollDto.bonuses || 0) -
      (createPayrollDto.deductions || 0);

    const payroll = this.payrollRepository.create({
      ...createPayrollDto,
      netSalary,
      status: PayrollStatus.DRAFT,
    });

    return this.payrollRepository.save(payroll);
  }

  async findAll(
    user: any,
    page: number = 1,
    limit: number = 10,
    month?: number,
    year?: number,
  ): Promise<{ data: Payroll[]; total: number }> {
    const queryBuilder = this.payrollRepository.createQueryBuilder('payroll');

    if (user.role === Role.EMPLOYEE) {
      queryBuilder.where('payroll.employeeId = :employeeId', {
        employeeId: user.employeeNumber,
      });
    }

    if (month && year) {
      queryBuilder.andWhere('payroll.month = :month AND payroll.year = :year', {
        month,
        year,
      });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('payroll.year', 'DESC')
      .addOrderBy('payroll.month', 'DESC')
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string, user: any): Promise<Payroll> {
    const payroll = await this.payrollRepository.findOne({
      where: { id },
    });

    if (!payroll) {
      throw new NotFoundException('Payroll record not found');
    }

    if (
      user.role === Role.EMPLOYEE &&
      payroll.employeeId !== user.employeeNumber
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return payroll;
  }

  async updateStatus(
    id: string,
    status: PayrollStatus,
    user: any,
  ): Promise<Payroll> {
    if (![Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER].includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const payroll = await this.findOne(id, user);
    payroll.status = status;
    payroll.approvedBy = user.employeeNumber;

    return this.payrollRepository.save(payroll);
  }

  async getEmployeePayroll(
    employeeId: string,
    startMonth: number,
    startYear: number,
    endMonth: number,
    endYear: number,
    user: any,
  ): Promise<Payroll[]> {
    if (
      user.role === Role.EMPLOYEE &&
      user.employeeNumber !== employeeId
    ) {
      throw new ForbiddenException('You can only view your own payroll');
    }

    return this.payrollRepository.find({
      where: {
        employeeId,
        month: Between(startMonth, endMonth),
        year: Between(startYear, endYear),
      },
      order: {
        year: 'DESC',
        month: 'DESC',
      },
    });
  }

  async getPayrollStats(
    month: number,
    year: number,
    user: any,
  ): Promise<any> {
    if (![Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER].includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const payrolls = await this.payrollRepository.find({
      where: {
        month,
        year,
      },
    });

    const stats = {
      totalEmployees: payrolls.length,
      totalBasicSalary: 0,
      totalAllowances: 0,
      totalDeductions: 0,
      totalOvertime: 0,
      totalBonuses: 0,
      totalNetSalary: 0,
      statusCounts: {
        draft: 0,
        pending: 0,
        approved: 0,
        paid: 0,
        cancelled: 0,
      },
    };

    payrolls.forEach((payroll) => {
      stats.totalBasicSalary += payroll.basicSalary;
      stats.totalAllowances += payroll.allowances;
      stats.totalDeductions += payroll.deductions;
      stats.totalOvertime += payroll.overtime;
      stats.totalBonuses += payroll.bonuses;
      stats.totalNetSalary += payroll.netSalary;
      stats.statusCounts[payroll.status.toLowerCase()]++;
    });

    return stats;
  }
} 