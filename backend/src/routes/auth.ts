import express from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validationMiddleware';
import { generateToken } from '../utils/jwt';
import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

const router = express.Router();

// Register
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required').trim().escape(),
  body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], validateRequest, async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const existingUser = await UserService.getUserByEmail(email);
  if (existingUser) {
    res.status(400).json({ error: 'Email already registered.' });
    return;
  }

  const newUser = await UserService.createUser({ name, email, password });

  const token = generateToken(newUser);
  res.status(201).json({ token });
});

// Login
router.post('/login', [
  body('email').isEmail(),
  body('password').exists()
], validateRequest, async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const validUser = await UserService.verifyCredentials(email, password);
  if (!validUser) {
    res.status(400).json({ error: 'Invalid credentials.' });
    return;
  }

  const token = generateToken(validUser);
  res.json({ token });
});

export default router;
