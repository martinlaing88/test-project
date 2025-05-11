import jwt, { JwtPayload } from 'jsonwebtoken';
import { User } from '../types/user';

const JWT_SECRET = 'jwt_secret';

export function generateToken(user: User): string {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
}

export function verifyToken(token: string): string | JwtPayload {
  return jwt.verify(token, JWT_SECRET);
}
