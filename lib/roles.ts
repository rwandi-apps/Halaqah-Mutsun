export type Role = 'KOORDINATOR' | 'GURU';

export const isKoordinator = (role: Role) => role === 'KOORDINATOR';
export const isGuru = (role: Role) => role === 'GURU';
