import express, { Request, Response } from 'express';
import cors from 'cors'; // 1. Импортируем cors
import { calculateRouteHandler } from './controllers/routeController';

const app = express();
const PORT = process.env.PORT || 5000;

// 2. Включаем CORS для всех запросов (или можно настроить конкретный origin фронтенда)
app.use(cors());

// Middleware для чтения JSON-запросов
app.use(express.json());

// Тестовый роут
app.get('/', (req: Request, res: Response) => {
  res.send({ message: 'Lodz Backend is running!' });
});

// Главный эндпоинт для расчета маршрута
app.post('/api/optimize-route', calculateRouteHandler);

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});