
import { User, Role } from '../types';

export const login = async (email: string, pass: string): Promise<User> => {
  // Skeleton logic
  console.log("Login requested for", email);
  return { id: '1', email, name: 'User Sample', role: 'KOORDINATOR' };
};

export const mockLogin = async (email: string, role: Role): Promise<User> => {
  // Demo mode login logic
  console.log("Mock login requested for role:", role);
  return { 
    id: `mock-${role.toLowerCase()}`, 
    email: email || `demo@sdq.com`, 
    name: `Ustadz ${role === 'GURU' ? 'Ahmad' : 'Umar'} (Demo)`, 
    role 
  };
};

export const logout = async () => {
  console.log("Logout triggered");
};
