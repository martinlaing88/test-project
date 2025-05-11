import express from 'express';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import cors from 'cors';

const app = express();

// CORS middleware - allow Angular frontend at localhost:4200
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
