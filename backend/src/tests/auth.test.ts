import request from 'supertest';
import express, { Express, Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import authRouter from '../routes/auth';
import { generateToken } from '../utils/jwt';
import { jest } from '@jest/globals';

jest.mock('../services/user.service');
jest.mock('../utils/jwt');
jest.mock('../middleware/validationMiddleware', () => ({
  validateRequest: (req: Request, res: Response, next: NextFunction) => next()
}));

const mockUserService = UserService as jest.Mocked<typeof UserService>;
const mockGenerateToken = generateToken as jest.MockedFunction<typeof generateToken>;

describe('Auth Router', () => {
  let app: Express;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    const validRegisterData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };

    it('should register a new user and return a token', async () => {
      const createdUser = { id: 1, ...validRegisterData };
      const mockToken = 'generated.jwt.token';
      
      mockUserService.getUserByEmail.mockResolvedValue(null);
      mockUserService.createUser.mockResolvedValue(createdUser);
      mockGenerateToken.mockReturnValue(mockToken);
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegisterData);
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual({ token: mockToken });
      expect(mockUserService.getUserByEmail).toHaveBeenCalledWith(validRegisterData.email);
      expect(mockUserService.createUser).toHaveBeenCalledWith(validRegisterData);
      expect(mockGenerateToken).toHaveBeenCalledWith(createdUser);
    });
    
    it('should return 400 if email already exists', async () => {
      const existingUser = { id: 1, name: 'Existing User', email: validRegisterData.email };
      
      mockUserService.getUserByEmail.mockResolvedValue(existingUser);
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegisterData);
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Email already registered.' });
      expect(mockUserService.createUser).not.toHaveBeenCalled();
      expect(mockGenerateToken).not.toHaveBeenCalled();
    });

    // In a real-world scenario, we would test validation failures here,
    // but we've mocked the validation middleware for simplicity.
    // A more comprehensive test would mock the express-validator to return errors
    
    it('should handle server errors during registration', async () => {
      mockUserService.getUserByEmail.mockResolvedValue(null);
      mockUserService.createUser.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegisterData);
      
      expect(response.status).toBe(500);
      expect(mockGenerateToken).not.toHaveBeenCalled();
    });
  });
  
  describe('POST /api/auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123'
    };
    
    it('should login successfully and return a token', async () => {
      const validUser = {
        id: 1,
        name: 'Test User',
        email: validLoginData.email
      };
      const mockToken = 'generated.jwt.token';
      
      mockUserService.verifyCredentials.mockResolvedValue(validUser);
      mockGenerateToken.mockReturnValue(mockToken);
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ token: mockToken });
      expect(mockUserService.verifyCredentials).toHaveBeenCalledWith(
        validLoginData.email,
        validLoginData.password
      );
      expect(mockGenerateToken).toHaveBeenCalledWith(validUser);
    });
    
    it('should return 400 for invalid credentials', async () => {
      mockUserService.verifyCredentials.mockResolvedValue(null);
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid credentials.' });
      expect(mockGenerateToken).not.toHaveBeenCalled();
    });
    
    it('should handle server errors during login', async () => {
      mockUserService.verifyCredentials.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);
      
      expect(response.status).toBe(500);
      expect(mockGenerateToken).not.toHaveBeenCalled();
    });
  });
});