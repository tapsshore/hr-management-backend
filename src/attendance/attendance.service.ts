import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
  ) {}

  async create(
    createAttendanceDto: CreateAttendanceDto,
    employeeId: string,
  ): Promise<Attendance> {
    // Check if there's already a check-in/out for the same day and type
    const existingAttendance = await this.attendanceRepository.findOne({
      where: {
        employeeId,
        date: createAttendanceDto.date,
        type: createAttendanceDto.type,
      },
    });

    if (existingAttendance) {
      throw new BadRequestException(
        `Already have a ${createAttendanceDto.type.toLowerCase()} record for this date`,
      );
    }

    const attendance = this.attendanceRepository.create({
      ...createAttendanceDto,
      employeeId,
    });

    return this.attendanceRepository.save(attendance);
  }

  async findAll(
    user: any,
    page: number = 1,
    limit: number = 10,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ data: Attendance[]; total: number }> {
    const queryBuilder =
      this.attendanceRepository.createQueryBuilder('attendance');

    if (user.role === Role.EMPLOYEE) {
      queryBuilder.where('attendance.employeeId = :employeeId', {
        employeeId: user.employeeNumber,
      });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('attendance.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('attendance.date', 'DESC')
      .addOrderBy('attendance.time', 'DESC')
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string, user: any): Promise<Attendance> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id },
    });

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    if (
      user.role === Role.EMPLOYEE &&
      attendance.employeeId !== user.employeeNumber
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return attendance;
  }

  async approveAttendance(id: string, user: any): Promise<Attendance> {
    if (![Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER].includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const attendance = await this.findOne(id, user);
    attendance.isApproved = true;
    attendance.approvedBy = user.employeeNumber;

    return this.attendanceRepository.save(attendance);
  }

  async getEmployeeAttendance(
    employeeId: string,
    startDate: Date,
    endDate: Date,
    user: any,
  ): Promise<Attendance[]> {
    if (user.role === Role.EMPLOYEE && user.employeeNumber !== employeeId) {
      throw new ForbiddenException('You can only view your own attendance');
    }

    return this.attendanceRepository.find({
      where: {
        employeeId,
        date: Between(startDate, endDate),
      },
      order: {
        date: 'DESC',
        time: 'DESC',
      },
    });
  }

  async getAttendanceStats(
    startDate: Date,
    endDate: Date,
    user: any,
  ): Promise<any> {
    if (![Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER].includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const attendance = await this.attendanceRepository.find({
      where: {
        date: Between(startDate, endDate),
      },
    });

    const stats = {
      total: attendance.length,
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      onLeave: 0,
      approved: 0,
      pending: 0,
    };

    attendance.forEach((record) => {
      stats[record.status.toLowerCase()]++;
      if (record.isApproved) {
        stats.approved++;
      } else {
        stats.pending++;
      }
    });

    return stats;
  }
}
