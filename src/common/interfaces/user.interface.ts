import { Role } from '../enums/role.enum';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  isActive: boolean;
}