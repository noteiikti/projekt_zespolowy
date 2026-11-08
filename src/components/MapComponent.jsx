import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `
    <div class="user-location-wrapper">
      <div class="user-location-pulse"></div>
      <div class="user-location-dot"></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function LocateControl({ isDarkMode }) {
  const map = useMap();
  const [position, setPosition] = useState(null);
  const isFirstLocationRef = useRef(true);

  useEffect(() => {
    map.locate({ watch: true, enableHighAccuracy: true });

    map.on('locationfound', (e) => {
      setPosition(e.latlng);
      if (isFirstLocationRef.current) {
        map.flyTo(e.latlng, 15);
        isFirstLocationRef.current = false;
      }
    });

    map.on('locationerror', (e) => {
      console.warn("Помилка доступу до геолокації:", e.message);
    });

    return () => map.stopLocate();
  }, [map]);

  const handleCenterClick = () => {
    if (position) {
      map.flyTo(position, 15);
    } else {
      map.locate({ watch: true, enableHighAccuracy: true });
    }
  };

  return (
    <>
      <button
        onClick={handleCenterClick}
        title="Центрувати на моїй позиції"
        style={{
          position: 'absolute',
          top: '80px',
          left: '10px',
          zIndex: 1000,
          backgroundColor: isDarkMode ? '#2d2d2d' : 'white',
          color: isDarkMode ? '#e0e0e0' : 'black',
          border: `2px solid ${isDarkMode ? '#444' : 'rgba(0,0,0,0.2)'}`,
          borderRadius: '4px',
          width: '34px',
          height: '34px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '18px',
          boxShadow: '0 1px 5px rgba(0,0,0,0.65)',
          transition: 'background-color 0.2s'
        }}
      >
        📍
      </button>

      {position && (
        <Marker position={position} icon={userIcon}>
          <Popup>Ви знаходитесь тут!</Popup>
        </Marker>
      )}
    </>
  );
}

export default function MapComponent({ routePoints, isDarkMode }) {
  const centerPosition = [51.7592, 19.4559];
  const polylineColor = isDarkMode ? "#ffffff" : "blue";
  
  // Новий стан для зберігання складної геометрії доріг
  const [routeGeometry, setRouteGeometry] = useState([]);

  // Ефект, який викликає OSRM API щоразу, коли змінюються точки маршруту
  useEffect(() => {
    if (!routePoints || routePoints.length < 2) {
      setRouteGeometry([]); // Очищаємо лінію, якщо точок менше двох
      return;
    }

    // OSRM вимагає координати у форматі "довгота,широта" (lng,lat), розділені крапкою з комою
    const coordinatesString = routePoints
      .map(loc => `${loc.lng},${loc.lat}`)
      .join(';');

    // Формуємо URL запиту. overview=full дає максимальну деталізацію поворотів, geometries=geojson - зручний формат даних
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinatesString}?overview=full&geometries=geojson`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.routes && data.routes.length > 0) {
          // GeoJSON повертає координати як [lng, lat], а Leaflet Polyline вимагає [lat, lng]. Тому перевертаємо їх.
          const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          setRouteGeometry(coords);
        }
      })
      .catch(err => console.error("Помилка побудови маршруту:", err));
  }, [routePoints]);

  return (
    <>
      <style>
        {`
          ${isDarkMode ? `
            .leaflet-tile {
              filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
            }
          ` : ''}

          .user-location-wrapper { position: relative; width: 20px; height: 20px; }
          .user-location-dot {
            width: 14px; height: 14px; background-color: #4285F4; border: 2px solid white;
            border-radius: 50%; position: absolute; top: 50%; left: 50%;
            transform: translate(-50%, -50%); box-shadow: 0 0 4px rgba(0,0,0,0.4); z-index: 2;
          }
          .user-location-pulse {
            width: 40px; height: 40px; background-color: rgba(66, 133, 244, 0.4);
            border-radius: 50%; position: absolute; top: 50%; left: 50%;
            transform: translate(-50%, -50%); animation: pulse-animation 2s infinite ease-in-out;
            pointer-events: none; z-index: 1;
          }
          @keyframes pulse-animation {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0; }
          }
        `}
      </style>
      
      <MapContainer center={centerPosition} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        
        {routePoints && routePoints.map((loc) => (
          <Marker key={loc.id} position={[loc.lat, loc.lng]}>
            <Popup>{loc.name}</Popup>
          </Marker>
        ))}

        {/* Тепер малюємо лінію не напрястець, а по масиву routeGeometry, який повернув сервер */}
        {routeGeometry.length > 1 && (
          <Polyline 
            key={isDarkMode ? "dark" : "light"} 
            positions={routeGeometry} 
            color={polylineColor} 
            weight={4} 
            opacity={0.7} 
          />
        )}

        <LocateControl isDarkMode={isDarkMode} />
      </MapContainer>
    </>
  );
}