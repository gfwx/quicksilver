import dotenv from 'dotenv'
dotenv.config();
import express from 'express';
import cors from 'cors';
import uploadRouter from './routes/upload';
import authRouter from "./routes/auth"
import queryRouter from "./routes/query"
import userRouter from "./routes/user"
import projectRouter from "./routes/project"
import cookieParser from 'cookie-parser';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(cookieParser())

app.use('/api/upload', uploadRouter);
app.use('/api/auth', authRouter)
app.use('/api/query', queryRouter)
app.use('/api/user', userRouter)
app.use('/api/project', projectRouter)

app.listen(PORT, () => {
  console.log(`Port listening on ${PORT}`);
})
