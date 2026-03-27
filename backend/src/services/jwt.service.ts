import { JwtPayload } from '../types';

// TODO: implement generate JWT token
export const generateToken = (payload: JwtPayload): string => {
  // TODO: use jsonwebtoken to sign payload with JWT_SECRET
  return '';
};

// TODO: implement verify JWT token
export const verifyToken = (token: string): JwtPayload => {
  // TODO: use jsonwebtoken to verify and decode token
  return {} as JwtPayload;
};
