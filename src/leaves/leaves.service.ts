import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Leave, LeaveStatus } from './entities/leave.entity';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class LeavesService {
  constructor(
    @InjectRepository(Leave)
    private leaveRepository: Repository<Leave>,
  ) {}

  async create(
    createLeaveDto: CreateLeaveDto,
    employeeId: string,
  ): Promise<Leave> {
    const leave = this.leaveRepository.create({
      ...createLeaveDto,
      employeeId,
      status: LeaveStatus.PENDING,
    });

    return this.leaveRepository.save(leave);
  }

  async findAll(
    user: any,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Leave[]; total: number }> {
    const queryBuilder = this.leaveRepository.createQueryBuilder('leave');

    if (user.role === Role.EMPLOYEE) {
      queryBuilder.where('leave.employeeId = :employeeId', {
        employeeId: user.employeeNumber,
      });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string, user: any): Promise<Leave> {
    const leave = await this.leaveRepository.findOne({
      where: { id },
    });

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    if (
      user.role === Role.EMPLOYEE &&
      leave.employeeId !== user.employeeNumber
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return leave;
  }

  async updateStatus(
    id: string,
    status: LeaveStatus,
    user: any,
    rejectionReason?: string,
  ): Promise<Leave> {
    if (![Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER].includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const leave = await this.findOne(id, user);

    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Leave request is not in pending status');
    }

    leave.status = status;
    if (status === LeaveStatus.REJECTED && rejectionReason) {
      leave.rejectionReason = rejectionReason;
    }
    leave.approvedBy = user.employeeNumber;

    return this.leaveRepository.save(leave);
  }

  async cancelLeave(id: string, user: any): Promise<Leave> {
    const leave = await this.findOne(id, user);

    if (leave.employeeId !== user.employeeNumber) {
      throw new ForbiddenException('You can only cancel your own leave requests');
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only pending leave requests can be cancelled');
    }

    leave.status = LeaveStatus.CANCELLED;
    return this.leaveRepository.save(leave);
  }
} 