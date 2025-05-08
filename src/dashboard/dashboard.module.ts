import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Employee } from '../employees/entities/employee.entity';
import { Department } from '../departments/entities/department.entity';
import { Leave } from '../leaves/entities/leave.entity';
import { PerformanceReview } from '../performance-reviews/entities/performance-review.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Payroll } from '../payroll/entities/payroll.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Employee,
      Department,
      Leave,
      PerformanceReview,
      Attendance,
      Payroll,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {} 