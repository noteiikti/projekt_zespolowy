import express from 'express';
import cors from 'cors';
// Importujemy nowe funkcje.
import { calculateRouteHandler, saveRouteHandler, getRouteHandler } from './controllers/routeController';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Istniejący endpoint.
app.post('/api/optimize-route', calculateRouteHandler);

// === NOWE ENDPOINTY ===
app.post('/api/routes', saveRouteHandler);          // Zapisywanie (POST)
app.get('/api/routes/:id', getRouteHandler);        // Pobieranie (GET)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});