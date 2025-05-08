import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
    const existingDepartment = await this.departmentRepository.findOne({
      where: { name: createDepartmentDto.name },
    });

    if (existingDepartment) {
      throw new BadRequestException('Department with this name already exists');
    }

    const department = this.departmentRepository.create(createDepartmentDto);
    return this.departmentRepository.save(department);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Department[]; total: number }> {
    const [data, total] = await this.departmentRepository.findAndCount({
      where: { isActive: true },
      relations: ['head', 'parentDepartment', 'subDepartments'],
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async findOne(id: string): Promise<Department> {
    const department = await this.departmentRepository.findOne({
      where: { id, isActive: true },
      relations: ['head', 'parentDepartment', 'subDepartments', 'employees'],
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return department;
  }

  async update(
    id: string,
    updateDepartmentDto: Partial<CreateDepartmentDto>,
  ): Promise<Department> {
    const department = await this.findOne(id);

    if (updateDepartmentDto.name) {
      const existingDepartment = await this.departmentRepository.findOne({
        where: { name: updateDepartmentDto.name },
      });

      if (existingDepartment && existingDepartment.id !== id) {
        throw new BadRequestException(
          'Department with this name already exists',
        );
      }
    }

    Object.assign(department, updateDepartmentDto);
    return this.departmentRepository.save(department);
  }

  async remove(id: string): Promise<void> {
    const department = await this.findOne(id);

    // Check if department has employees
    if (department.employees && department.employees.length > 0) {
      throw new BadRequestException(
        'Cannot delete department with active employees',
      );
    }

    // Check if department has sub-departments
    if (department.subDepartments && department.subDepartments.length > 0) {
      throw new BadRequestException(
        'Cannot delete department with sub-departments',
      );
    }

    department.isActive = false;
    await this.departmentRepository.save(department);
  }

  async getDepartmentHierarchy(): Promise<Department[]> {
    return this.departmentRepository.find({
      where: { isActive: true, parentDepartmentId: null },
      relations: ['subDepartments', 'head'],
    });
  }

  async getDepartmentEmployees(
    id: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: any[]; total: number }> {
    const department = await this.departmentRepository.findOne({
      where: { id, isActive: true },
      relations: ['employees'],
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEmployees = department.employees.slice(startIndex, endIndex);

    return {
      data: paginatedEmployees,
      total: department.employees.length,
    };
  }

  async getDepartmentStats(id: string): Promise<any> {
    const department = await this.departmentRepository.findOne({
      where: { id, isActive: true },
      relations: ['employees'],
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const totalEmployees = department.employees.length;
    const activeEmployees = department.employees.filter(
      (emp) => emp.isActive,
    ).length;
    const roles = department.employees.reduce((acc, emp) => {
      acc[emp.role] = (acc[emp.role] || 0) + 1;
      return acc;
    }, {});

    return {
      totalEmployees,
      activeEmployees,
      roles,
      budget: department.budget,
    };
  }
}
