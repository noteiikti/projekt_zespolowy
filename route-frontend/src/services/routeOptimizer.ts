export interface Point {
  id: string | number;
  lat: number;
  lng: number;
  [key: string]: any; // Для других полей (адрес, название и т.д.)
}

/**
 * Вычисляет расстояние в километрах между двумя точками по формуле гаверсинусов
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Радиус Земли в км
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Алгоритм Прима для построения Минимального Остовного Дерева (MST)
 */
function findMST(points: Point[]): number[][] {
  const n = points.length;
  const parent: number[] = new Array(n).fill(-1);
  const key: number[] = new Array(n).fill(Infinity);
  const inMST: boolean[] = new Array(n).fill(false);

  key[0] = 0; // Начинаем с первой точки

  for (let i = 0; i < n - 1; i++) {
    let min = Infinity;
    let u = -1;

    // Находим вершину с минимальным весом ребра, еще не включенную в MST
    for (let v = 0; v < n; v++) {
      if (!inMST[v] && key[v] < min) {
        min = key[v];
        u = v;
      }
    }

    if (u === -1) break;
    inMST[u] = true;

    // Обновляем ключи соседних вершин
    for (let v = 0; v < n; v++) {
      if (!inMST[v]) {
        const dist = calculateDistance(points[u].lat, points[u].lng, points[v].lat, points[v].lng);
        if (dist < key[v]) {
          key[v] = dist;
          parent[v] = u;
        }
      }
    }
  }

  // Строим список смежности (граф дерева)
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (let i = 1; i < n; i++) {
    if (parent[i] !== -1) {
      adj[parent[i]].push(i);
      adj[i].push(parent[i]);
    }
  }
  
  return adj;
}

/**
 * Обход дерева в глубину (Preorder Traversal) для получения последовательности точек маршрута
 */
function getPreorderTour(adj: number[][], start: number = 0): number[] {
  const visited: boolean[] = new Array(adj.length).fill(false);
  const tour: number[] = [];

  function dfs(u: number) {
    visited[u] = true;
    tour.push(u);
    for (const v of adj[u]) {
      if (!visited[v]) {
        dfs(v);
      }
    }
  }

  dfs(start);
  return tour;
}

/**
 * Главная функция оптимизации маршрута (Приближенное решение TSP на базе MST)
 */
export function optimizeRoute(points: Point[]): Point[] {
  if (points.length <= 2) return points;

  // 1. Строим MST
  const mstAdj = findMST(points);

  // 2. Получаем порядок обхода точек из дерева
  const tourIndices = getPreorderTour(mstAdj, 0);

  // 3. Возвращаем точки в оптимизированном порядке
  const optimizedPoints = tourIndices.map(index => points[index]);

  // Опционально: можно добавить начальную точку в конец, если нужен замкнутый маршрут (кольцо)
  // optimizedPoints.push(optimizedPoints[0]);

  return optimizedPoints;
}