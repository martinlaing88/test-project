import request from 'supertest';
import express, { Express } from 'express';
import { User } from '../types/user';
import { UserService } from '../services/user.service';
import userRouter from '../routes/users';
import { jest } from '@jest/globals';

jest.mock('../middleware/authMiddlware', () => ({
    authenticateToken: jest.fn((req: express.Request, res: express.Response, next: express.NextFunction) => next()),
  }));

jest.mock('../services/user.service');
const mockUserService = UserService as jest.Mocked<typeof UserService>;

describe('User Router', () => {
  let app: Express;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/users', userRouter);
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('should return all users', async () => {
      const mockUsers: User[] = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
      ];
      
      mockUserService.getUsers.mockResolvedValue(mockUsers);
      
      const response = await request(app).get('/api/users');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUsers);
      expect(mockUserService.getUsers).toHaveBeenCalledTimes(1);
    });
    
    it('should handle errors', async () => {
      mockUserService.getUsers.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/api/users');
      
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to retrieve users' });
    });
  });
  
  describe('GET /api/users/:id', () => {
    it('should return a user when found', async () => {
      const mockUser: User = { id: 1, name: 'John Doe', email: 'john@example.com' };
      mockUserService.getUserById.mockResolvedValue(mockUser);
      
      const response = await request(app).get('/api/users/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
      expect(mockUserService.getUserById).toHaveBeenCalledWith(1);
    });
    
    it('should return 404 when user not found', async () => {
      mockUserService.getUserById.mockResolvedValue(null);
      
      const response = await request(app).get('/api/users/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
      expect(mockUserService.getUserById).toHaveBeenCalledWith(999);
    });
    
    it('should validate user ID format', async () => {
      const response = await request(app).get('/api/users/invalid');
      
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
    
    it('should handle server errors', async () => {
      mockUserService.getUserById.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/api/users/1');
      
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to retrieve user' });
    });
  });
  
  describe('POST /api/users', () => {
    const validUserData = {
      name: 'New User',
      email: 'newuser@example.com',
      password: 'password123'
    };
    
    it('should create a new user', async () => {
      const createdUser = { id: 3, ...validUserData };
      mockUserService.getUserByEmail.mockResolvedValue(null);
      mockUserService.createUser.mockResolvedValue(createdUser);
      
      const response = await request(app)
        .post('/api/users')
        .send(validUserData);
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdUser);
      expect(mockUserService.getUserByEmail).toHaveBeenCalledWith(validUserData.email);
      expect(mockUserService.createUser).toHaveBeenCalledWith(validUserData);
    });
    
    it('should return 409 if email already exists', async () => {
      mockUserService.getUserByEmail.mockResolvedValue({ id: 1, name: 'Existing User', email: validUserData.email });
      
      const response = await request(app)
        .post('/api/users')
        .send(validUserData);
      
      expect(response.status).toBe(409);
      expect(response.body).toEqual({ error: 'Email already exists' });
      expect(mockUserService.createUser).not.toHaveBeenCalled();
    });
    
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: 'Missing Fields' });
      
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
    
    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          name: 'Invalid Email',
          email: 'not-an-email',
          password: 'password123'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
    
    it('should validate password length', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          name: 'Short Password',
          email: 'valid@example.com',
          password: 'short'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
    
    it('should handle server errors', async () => {
      mockUserService.getUserByEmail.mockResolvedValue(null);
      mockUserService.createUser.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app)
        .post('/api/users')
        .send(validUserData);
      
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to create user' });
    });
  });
  
  describe('PUT /api/users/:id', () => {
    const existingUser = {
      id: 1,
      name: 'Original Name',
      email: 'original@example.com'
    };
    
    const updateData = {
      name: 'Updated Name',
      email: 'updated@example.com'
    };
    
    it('should update a user successfully', async () => {
      const updatedUser = { ...existingUser, ...updateData };
      
      mockUserService.getUserById.mockResolvedValue(existingUser);
      mockUserService.getUserByEmail.mockResolvedValue(null);
      mockUserService.updateUser.mockResolvedValue(updatedUser);
      
      const response = await request(app)
        .put('/api/users/1')
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedUser);
      expect(mockUserService.getUserById).toHaveBeenCalledWith(1);
      expect(mockUserService.getUserByEmail).toHaveBeenCalledWith(updateData.email);
      expect(mockUserService.updateUser).toHaveBeenCalledWith(1, updateData);
    });
    
    it('should return 404 if user not found', async () => {
      mockUserService.getUserById.mockResolvedValue(null);
      
      const response = await request(app)
        .put('/api/users/999')
        .send(updateData);
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
      expect(mockUserService.updateUser).not.toHaveBeenCalled();
    });
    
    it('should return 409 if email already exists', async () => {
      const anotherUser = {
        id: 2,
        name: 'Another User',
        email: updateData.email
      };
      
      mockUserService.getUserById.mockResolvedValue(existingUser);
      mockUserService.getUserByEmail.mockResolvedValue(anotherUser);
      
      const response = await request(app)
        .put('/api/users/1')
        .send(updateData);
      
      expect(response.status).toBe(409);
      expect(response.body).toEqual({ error: 'Email already exists' });
      expect(mockUserService.updateUser).not.toHaveBeenCalled();
    });
    
    it('should not check email existence if email is not being updated', async () => {
      const nameOnlyUpdate = { name: 'Just Name Update' };
      const updatedUser = { ...existingUser, ...nameOnlyUpdate };
      
      mockUserService.getUserById.mockResolvedValue(existingUser);
      mockUserService.updateUser.mockResolvedValue(updatedUser);
      
      const response = await request(app)
        .put('/api/users/1')
        .send(nameOnlyUpdate);
      
      expect(response.status).toBe(200);
      expect(mockUserService.getUserByEmail).not.toHaveBeenCalled();
      expect(mockUserService.updateUser).toHaveBeenCalledWith(1, nameOnlyUpdate);
    });
    
    it('should validate user ID format', async () => {
      const response = await request(app)
        .put('/api/users/invalid')
        .send(updateData);
      
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
    
    it('should validate email format if provided', async () => {
      const response = await request(app)
        .put('/api/users/1')
        .send({
          name: 'Valid Name',
          email: 'not-an-email'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
    
    it('should handle server errors', async () => {
      mockUserService.getUserById.mockResolvedValue(existingUser);
      mockUserService.getUserByEmail.mockResolvedValue(null);
      mockUserService.updateUser.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app)
        .put('/api/users/1')
        .send(updateData);
      
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to update user' });
    });
  });
  
  describe('DELETE /api/users/:id', () => {
    it('should delete a user successfully', async () => {
      const existingUser = {
        id: 1,
        name: 'User to Delete',
        email: 'delete@example.com'
      };
      
      mockUserService.getUserById.mockResolvedValue(existingUser);
      mockUserService.deleteUser.mockResolvedValue(true);
      
      const response = await request(app).delete('/api/users/1');
      
      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
      expect(mockUserService.getUserById).toHaveBeenCalledWith(1);
      expect(mockUserService.deleteUser).toHaveBeenCalledWith(1);
    });
    
    it('should return 404 if user not found', async () => {
      mockUserService.getUserById.mockResolvedValue(null);
      
      const response = await request(app).delete('/api/users/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
      expect(mockUserService.deleteUser).not.toHaveBeenCalled();
    });
    
    it('should validate user ID format', async () => {
      const response = await request(app).delete('/api/users/invalid');
      
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
    
    it('should handle server errors', async () => {
      mockUserService.getUserById.mockResolvedValue({ id: 1, name: 'User', email: 'user@example.com' });
      mockUserService.deleteUser.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).delete('/api/users/1');
      
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to delete user' });
    });
  });
});