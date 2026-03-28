import { Role } from './index';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: Role;
    }
  }
}

export {};
