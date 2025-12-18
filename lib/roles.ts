
// Fix: Corrected imported member name and logic based on Role type in types.ts
import { Role } from '../types';

export const canAccessCoordinator = (role: Role) => role === 'KOORDINATOR';
export const canAccessGuru = (role: Role) => role === 'GURU';
