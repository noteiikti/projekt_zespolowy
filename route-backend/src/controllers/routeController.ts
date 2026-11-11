import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { optimizeRoute, Point } from '../services/routeOptimizer';

const prisma = new PrismaClient();

export async function calculateRouteHandler(req: Request, res: Response) {
  try {
    // Pobieramy listę punktów, np. z treści żądania lub bazy danych.
    const points: Point[] = req.body.points; 

    if (!points || points.length === 0) {
      return res.status(400).json({ error: 'Lista punktów jest pusta' });
    }

    // Uruchamiamy algorytm optymalizacji.
    const sortedRoute = optimizeRoute(points);

    return res.json({
      success: true,
      route: sortedRoute,
    });
  } catch (error) {
    console.error('Błąd podczas obliczania trasy:', error);
    return res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
  }
}

export async function saveRouteHandler(req: Request, res: Response) {
  try {
    // Pobieranie danych z żądania (dodano email!)
    const { points, userId, email = "brak@email.com", name = "Moja trasa po Łodzi" } = req.body;

    if (!points || points.length === 0 || !userId) {
      return res.status(400).json({ error: 'Brak punktów trasy lub ID użytkownika' });
    }

    // 1. Wyszukiwanie użytkownika w bazie po googleId
    let dbUser = await prisma.user.findUnique({ 
      where: { googleId: userId } 
    });
    
    // Tworzenie nowego użytkownika, jeśli nie istnieje (wymaga email)
    if (!dbUser) {
      dbUser = await prisma.user.create({ 
        data: { 
          googleId: userId,
          email: email // TypeScript rozpoznaje tę zmienną.
        } 
      });
    }

    // 2. Zapisywanie nowej trasy w bazie danych
    const newRoute = await prisma.route.create({
      data: {
        name: name,
        pathData: JSON.stringify(points), // Konwersja tablicy na ciąg znaków
        userId: dbUser.id
      }
    });

    // Zwracanie wygenerowanego ID trasy
    return res.json({ success: true, id: newRoute.id });
  } catch (error) {
    console.error('Błąd zapisu trasy:', error);
    return res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
  }
}

export async function getRouteHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const route = await prisma.route.findUnique({
      where: { id: id }
    });

    if (!route) {
      return res.status(404).json({ error: 'Nie znaleziono trasy' });
    }

    // Parsujemy ciąg JSON z powrotem do tablicy punktów.
    const parsedPoints = route.pathData ? JSON.parse(route.pathData) : [];

    return res.json({ success: true, route: { ...route, waypoints: parsedPoints } });
  } catch (error) {
    console.error('Błąd wczytywania trasy:', error);
    return res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
  }
}