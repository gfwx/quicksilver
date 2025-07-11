import express from 'express';
import cors from 'cors';
import uploadRouter from './routes/upload';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use('/api/upload', uploadRouter);

app.listen(PORT, () => {
  console.log(`Port listening on ${PORT}`);
})
