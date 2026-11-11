import { Request, Response } from 'express';
import { optimizeRoute, Point } from '../services/routeOptimizer';

export async function calculateRouteHandler(req: Request, res: Response) {
  try {
    // Получаем список точек (например, из тела запроса или базы данных)
    const points: Point[] = req.body.points; 

    if (!points || points.length === 0) {
      return res.status(400).json({ error: 'Список точек пуст' });
    }

    // Запускаем алгоритм оптимизации
    const sortedRoute = optimizeRoute(points);

    return res.json({
      success: true,
      route: sortedRoute,
    });
  } catch (error) {
    console.error('Ошибка при расчете маршрута:', error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}