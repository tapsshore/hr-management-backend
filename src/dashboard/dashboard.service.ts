import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Employee } from '../employees/entities/employee.entity';
import { Department } from '../departments/entities/department.entity';
import { Leave, LeaveStatus } from '../leaves/entities/leave.entity';
import {
  PerformanceReview,
  ReviewStatus,
} from '../performance-reviews/entities/performance-review.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Payroll } from '../payroll/entities/payroll.entity';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
    @InjectRepository(Leave)
    private leaveRepository: Repository<Leave>,
    @InjectRepository(PerformanceReview)
    private performanceReviewRepository: Repository<PerformanceReview>,
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(Payroll)
    private payrollRepository: Repository<Payroll>,
  ) {}

  async getDashboardStats(user: any) {
    if (![Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER].includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const currentDate = new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    );

    // Get employee statistics
    const totalEmployees = await this.employeeRepository.count();
    const activeEmployees = await this.employeeRepository.count({
      where: { isActive: true },
    });

    // Get department statistics
    const totalDepartments = await this.departmentRepository.count();
    const departmentsWithHead = await this.departmentRepository.count({
      where: { headId: Not(IsNull()) },
    });

    // Get leave statistics
    const pendingLeaves = await this.leaveRepository.count({
      where: { status: LeaveStatus.PENDING },
    });
    const approvedLeaves = await this.leaveRepository.count({
      where: { status: LeaveStatus.APPROVED },
    });

    // Get performance review statistics
    const pendingReviews = await this.performanceReviewRepository.count({
      where: { status: ReviewStatus.PENDING },
    });
    const completedReviews = await this.performanceReviewRepository.count({
      where: { status: ReviewStatus.COMPLETED },
    });

    // Get attendance statistics for current month
    const attendanceStats = await this.attendanceRepository
      .createQueryBuilder('attendance')
      .select('attendance.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('attendance.date BETWEEN :startDate AND :endDate', {
        startDate: startOfMonth,
        endDate: endOfMonth,
      })
      .groupBy('attendance.status')
      .getRawMany();

    // Get payroll statistics for current month
    const payrollStats = await this.payrollRepository
      .createQueryBuilder('payroll')
      .select('payroll.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(payroll.netSalary)', 'totalAmount')
      .where('payroll.month = :month AND payroll.year = :year', {
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
      })
      .groupBy('payroll.status')
      .getRawMany();

    // Get department-wise employee count
    const departmentStats = await this.departmentRepository
      .createQueryBuilder('department')
      .select('department.name', 'departmentName')
      .addSelect('COUNT(employee.id)', 'employeeCount')
      .leftJoin('department.employees', 'employee')
      .groupBy('department.id')
      .getRawMany();

    return {
      employeeStats: {
        total: totalEmployees,
        active: activeEmployees,
        inactive: totalEmployees - activeEmployees,
      },
      departmentStats: {
        total: totalDepartments,
        withHead: departmentsWithHead,
        withoutHead: totalDepartments - departmentsWithHead,
        departmentWiseCount: departmentStats,
      },
      leaveStats: {
        pending: pendingLeaves,
        approved: approvedLeaves,
      },
      performanceStats: {
        pending: pendingReviews,
        completed: completedReviews,
      },
      attendanceStats: {
        monthly: attendanceStats,
      },
      payrollStats: {
        monthly: payrollStats,
      },
    };
  }

  async getDepartmentDashboard(departmentId: string, user: any) {
    if (![Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER].includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const currentDate = new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    );

    // Get department details
    const department = await this.departmentRepository.findOne({
      where: { id: departmentId },
      relations: ['employees'],
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    // Get employee statistics
    const totalEmployees = department.employees.length;
    const activeEmployees = department.employees.filter(
      (emp) => emp.isActive,
    ).length;

    // Get leave statistics
    const leaveStats = await this.leaveRepository
      .createQueryBuilder('leave')
      .select('leave.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('leave.employeeId IN (:...employeeIds)', {
        employeeIds: department.employees.map((emp) => emp.id),
      })
      .groupBy('leave.status')
      .getRawMany();

    // Get performance review statistics
    const performanceStats = await this.performanceReviewRepository
      .createQueryBuilder('review')
      .select('review.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('review.employeeId IN (:...employeeIds)', {
        employeeIds: department.employees.map((emp) => emp.id),
      })
      .groupBy('review.status')
      .getRawMany();

    // Get attendance statistics
    const attendanceStats = await this.attendanceRepository
      .createQueryBuilder('attendance')
      .select('attendance.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('attendance.employeeId IN (:...employeeIds)', {
        employeeIds: department.employees.map((emp) => emp.id),
      })
      .andWhere('attendance.date BETWEEN :startDate AND :endDate', {
        startDate: startOfMonth,
        endDate: endOfMonth,
      })
      .groupBy('attendance.status')
      .getRawMany();

    // Get payroll statistics
    const payrollStats = await this.payrollRepository
      .createQueryBuilder('payroll')
      .select('payroll.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(payroll.netSalary)', 'totalAmount')
      .where('payroll.employeeId IN (:...employeeIds)', {
        employeeIds: department.employees.map((emp) => emp.id),
      })
      .andWhere('payroll.month = :month AND payroll.year = :year', {
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
      })
      .groupBy('payroll.status')
      .getRawMany();

    return {
      department: {
        id: department.id,
        name: department.name,
        description: department.description,
        headId: department.headId,
      },
      employeeStats: {
        total: totalEmployees,
        active: activeEmployees,
        inactive: totalEmployees - activeEmployees,
      },
      leaveStats: {
        byStatus: leaveStats,
      },
      performanceStats: {
        byStatus: performanceStats,
      },
      attendanceStats: {
        monthly: attendanceStats,
      },
      payrollStats: {
        monthly: payrollStats,
      },
    };
  }
}
