import { Role } from '../enums/role.enum';

export interface User {
  id: string;
  email: string;
  role: Role;
  employeeNumber: string;
}
