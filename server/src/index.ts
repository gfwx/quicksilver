import express from 'express';
import cors from 'cors';
import uploadRouter from './routes/upload';
import authRouter from "./routes/auth"
import queryRouter from "./routes/query"

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use('/api/upload', uploadRouter);
app.use('/api/auth', authRouter)
app.use('/api/query', queryRouter)

app.listen(PORT, () => {
  console.log(`Port listening on ${PORT}`);
})
