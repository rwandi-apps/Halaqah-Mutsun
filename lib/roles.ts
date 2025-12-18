
import { UserRole } from '../types';

export const canAccessCoordinator = (role: UserRole) => role === UserRole.COORDINATOR || role === UserRole.ADMIN;
export const canAccessGuru = (role: UserRole) => role === UserRole.GURU || role === UserRole.ADMIN;
