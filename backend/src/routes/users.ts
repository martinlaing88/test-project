import express from 'express';
import { body, param } from 'express-validator';
import { authenticateToken } from '../middleware/authMiddlware';
import { validateRequest } from '../middleware/validationMiddleware';
import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

const router = express.Router();

router.use(authenticateToken);

/**
 * Get all users with pagination
 * @route GET /api/users
 */
router.get('/', [
], validateRequest, 
  async (req: Request, res: Response) => {
    try {
      const result = await UserService.getUsers();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve users' });
    }
  }
);

/**
 * Get single user by ID
 * @route GET /api/users/:id
 */
router.get('/:id', [
  param('id').isInt().withMessage('Invalid user ID format').toInt()
], validateRequest, 
  async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await UserService.getUserById(userId);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve user' });
    }
  }
);

/**
 * Create a new user
 * @route POST /api/users
 */
router.post('/', [
  body('name').notEmpty().withMessage('Name is required').trim().escape(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().trim().escape()
], validateRequest, 
  async (req: Request, res: Response) => {
    try {
      const { name, email, password, role } = req.body;
      
      const existingUser = await UserService.getUserByEmail(email);
      if (existingUser) {
        res.status(409).json({ error: 'Email already exists' });
        return;
      }
      
      const newUser = await UserService.createUser({ name, email, password, role });
      
      res.status(201).json(newUser);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
);

/**
 * Update an existing user
 * @route PUT /api/users/:id
 */
router.put('/:id', [
  param('id').isInt().withMessage('Invalid user ID format').toInt(),
  body('name').optional().notEmpty().withMessage('Name cannot be empty').trim().escape(),
  body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('role').optional().trim().escape()
], validateRequest, 
  async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { name, email, role } = req.body;
      
      // Check if user exists
      const existingUser = await UserService.getUserById(userId);
      if (!existingUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      // If email is being updated, check if it already exists
      if (email && email !== existingUser.email) {
        const emailExists = await UserService.getUserByEmail(email);
        if (emailExists) {
          res.status(409).json({ error: 'Email already exists' });
          return;
        }
      }
      
      const updatedUser = await UserService.updateUser(userId, { name, email, role });
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
);

/**
 * Delete a user
 * @route DELETE /api/users/:id
 */
router.delete('/:id', [
  param('id').isInt().withMessage('Invalid user ID format').toInt()
], validateRequest, 
  async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user exists before deletion
      const user = await UserService.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      await UserService.deleteUser(userId);
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
);

export default router;
