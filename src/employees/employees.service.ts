import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async create(
    createEmployeeDto: CreateEmployeeDto,
    user: any,
  ): Promise<Employee> {
    if (![Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER].includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const existingEmployee = await this.employeeRepository.findOne({
      where: [
        { email: createEmployeeDto.email },
        { employeeNumber: createEmployeeDto.employeeNumber },
      ],
    });
    if (existingEmployee) {
      throw new ForbiddenException('Email or employee number already exists');
    }

    const employee = this.employeeRepository.create(createEmployeeDto);
    return this.employeeRepository.save(employee);
  }

  async findAll(
    user: any,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Employee[]; total: number }> {
    if (![Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER].includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const [data, total] = await this.employeeRepository.findAndCount({
      where: { isActive: true },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async findOne(employeeNumber: string, user: any): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { employeeNumber, isActive: true },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (user.role === Role.EMPLOYEE && user.employeeNumber !== employeeNumber) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return employee;
  }

  async update(
    employeeNumber: string,
    updateEmployeeDto: UpdateEmployeeDto,
    user: any,
  ): Promise<Employee> {
    if (![Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER].includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const employee = await this.findOne(employeeNumber, user);

    Object.assign(employee, updateEmployeeDto);

    return this.employeeRepository.save(employee);
  }

  async remove(employeeNumber: string, user: any): Promise<void> {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const employee = await this.findOne(employeeNumber, user);
    employee.isActive = false;
    await this.employeeRepository.save(employee);
  }
}
