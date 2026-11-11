import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet/dist/leaflet.css';


const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `<div class="user-location-wrapper"><div class="user-location-pulse"></div><div class="user-location-dot"></div></div>`,
  iconSize: [20, 20], iconAnchor: [10, 10],
});

function PopupCloser() {
  const map = useMap();
  useEffect(() => {
    const handleClose = () => map.closePopup();
    window.addEventListener('close-map-popups', handleClose);
    return () => window.removeEventListener('close-map-popups', handleClose);
  }, [map]);
  return null;
}

function ActiveLocationCenter({ activeLocationId, routePoints }) {
  const map = useMap();
  const routePointsRef = useRef(routePoints);
  const lastFlownId = useRef(null);

  useEffect(() => {
    routePointsRef.current = routePoints;
  }, [routePoints]);

  useEffect(() => {
    if (activeLocationId && activeLocationId !== lastFlownId.current) {
      lastFlownId.current = activeLocationId;
      
      if (!window.__isMapMarkerClick) {
        const point = routePointsRef.current.find(p => p.id === activeLocationId);
        if (point) {
          const currentCenter = map.getCenter();
          const isAlreadyCentered = Math.abs(currentCenter.lat - point.lat) < 0.0005 && Math.abs(currentCenter.lng - point.lng) < 0.0005;
          
          if (!isAlreadyCentered) {
            map.flyTo([point.lat, point.lng], map.getZoom(), { animate: true, duration: 0.5 });
          }
        }
      }
    } else if (!activeLocationId) {
      lastFlownId.current = null;
    }
  }, [activeLocationId, map]);

  return null;
}

function LocateControl({ isDarkMode }) {
  const map = useMap();
  const [position, setPosition] = useState(null);
  const isFirstLocationRef = useRef(true);

  useEffect(() => {
    map.locate({ watch: true, enableHighAccuracy: true });
    map.on('locationfound', (e) => {
      setPosition(e.latlng);
      if (isFirstLocationRef.current) { map.flyTo(e.latlng, 15); isFirstLocationRef.current = false; }
    });
    return () => map.stopLocate();
  }, [map]);

  return (
    <>
      <button onClick={() => position ? map.flyTo(position, 15) : map.locate()} style={{ position: 'absolute', top: '80px', left: '10px', zIndex: 1000, backgroundColor: isDarkMode ? '#2d2d2d' : 'white', color: isDarkMode ? '#e0e0e0' : 'black', border: `2px solid ${isDarkMode ? '#444' : 'rgba(0,0,0,0.2)'}`, borderRadius: '4px', width: '34px', height: '34px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px', boxShadow: '0 1px 5px rgba(0,0,0,0.65)' }}>📍</button>
      {position && <Marker position={position} icon={userIcon}><Popup autoPan={false}>Jesteś tutaj!</Popup></Marker>}
    </>
  );
}

function MapInteraction({ isSelectingOnMap, onMapSelect, setActiveLocationId }) {
  const map = useMap();
  useMapEvents({ 
    click(e) { 
      if (isSelectingOnMap) {
        onMapSelect(e.latlng); 
      } else if (setActiveLocationId) {
        setActiveLocationId(null);
      }
    } 
  });
  useEffect(() => { map.getContainer().style.cursor = isSelectingOnMap ? 'crosshair' : ''; }, [isSelectingOnMap, map]);
  return null;
}

function RoutingMachine({ routePoints, isDarkMode, onMapRouteUpdate, setActiveLocationId }) {
  const map = useMap();
  const routingControlRef = useRef(null);
  const routePointsRef = useRef(routePoints);
  const onMapRouteUpdateRef = useRef(onMapRouteUpdate);
  const setActiveLocationIdRef = useRef(setActiveLocationId);

  useEffect(() => { routePointsRef.current = routePoints; }, [routePoints]);
  useEffect(() => { onMapRouteUpdateRef.current = onMapRouteUpdate; }, [onMapRouteUpdate]);
  useEffect(() => { setActiveLocationIdRef.current = setActiveLocationId; }, [setActiveLocationId]);

  useEffect(() => {
    if (!map) return;

    const control = L.Routing.control({
      waypoints: routePoints.map(p => L.latLng(p.lat, p.lng)),
      router: L.Routing.osrmv1({ serviceUrl: 'https://routing.openstreetmap.de/routed-foot/route/v1', profile: 'foot' }),
      routeWhileDragging: false, addWaypoints: true, show: false, fitSelectedRoutes: false,
      lineOptions: { styles: [{ color: isDarkMode ? '#10b981' : '#28a745', weight: 5, opacity: 0.8, dashArray: '10, 10' }] },
      
      createMarker: function(i, waypoint, n) {
        const rp = routePointsRef.current;
        const pointInfo = rp.find(p => Math.abs(p.lat - waypoint.latLng.lat) < 0.001 && Math.abs(p.lng - waypoint.latLng.lng) < 0.001);
        const pointId = pointInfo ? pointInfo.id : `temp-${i}`;

        const marker = L.marker(waypoint.latLng, {
          draggable: true,
          icon: L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconAnchor: [12, 41], popupAnchor: [1, -34], // Przesunięcie jest już uwzględnione.
            className: `route-marker-${pointId}`
          })
        });

        const title = pointInfo ? pointInfo.name : `Punkt ${i + 1}`;
        const div = document.createElement('div');
        div.innerHTML = `
          <div style="text-align:center;">
            <div style="font-weight:bold; margin-bottom:8px; font-size:14px;">${title}</div>
            <button class="remove-btn" style="background:#ff4d4d; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Usuń z mapy</button>
          </div>
        `;
        div.querySelector('.remove-btn').addEventListener('click', () => {
          const wps = control.getWaypoints();
          wps.splice(i, 1);
          control.setWaypoints(wps);
          map.closePopup();
        });
        
        // 1. Powiązujemy okno z markerem, aby poruszało się razem z nim.
        marker.bindPopup(div, { autoPan: false });
        
        // 2. Wyłączamy standardową obsługę kliknięcia Leaflet, aby nie kolidowała z Reactem.
        marker.off('click');
        
        marker.on('dragstart', () => {
          if (pointInfo && setActiveLocationIdRef.current) {
            window.__isMapMarkerClick = true;
            setActiveLocationIdRef.current(pointInfo.id);
            marker.closePopup(); // Zamykamy okno na czas przeciągania.
            setTimeout(() => { window.__isMapMarkerClick = false; }, 100);
          }
        });
        
        // 3. Samodzielnie zarządzamy oknem podręcznym.
        marker.on('click', () => {
          if (pointInfo && setActiveLocationIdRef.current) {
            window.__isMapMarkerClick = true;
            setActiveLocationIdRef.current(prev => {
              if (prev === pointInfo.id) {
                marker.closePopup();
                return null;
              } else {
                marker.openPopup();
                return pointInfo.id;
              }
            });
            setTimeout(() => { window.__isMapMarkerClick = false; }, 100);
          }
        });

        return marker;
      }
    }).addTo(map);

    control.on('waypointschanged', (e) => {
      const validWps = e.waypoints.filter(w => w.latLng);
      if (validWps.length > 0) onMapRouteUpdateRef.current(validWps);
    });

    routingControlRef.current = control;
    
    return () => {
      try {
        if (map && control) {
          // Czyścimy punkty przed usunięciem, aby anulować oczekujące żądania
          // XMLHttpRequest i zapobiec asynchronicznym błędom rysowania tras.
          control.getPlan().setWaypoints([]);
          map.removeControl(control);
        }
      } catch (error) {
        // Błędy czyszczenia nie wpływają na działanie aplikacji.
      }
    };
  }, [map]);

  useEffect(() => {
    if (!routingControlRef.current) return;
    
    const timer = setTimeout(() => {
      const currentWps = routingControlRef.current.getWaypoints().filter(w => w.latLng);
      const isDifferent = routePoints.length !== currentWps.length || routePoints.some((p, i) => {
        const wp = currentWps[i].latLng;
        return Math.abs(p.lat - wp.lat) > 0.001 || Math.abs(p.lng - wp.lng) > 0.001;
      });
      
      if (isDifferent) {
        routingControlRef.current.setWaypoints(routePoints.map(p => L.latLng(p.lat, p.lng)));
      }
    }, 800); 

    return () => clearTimeout(timer); 
  }, [routePoints]);

  useEffect(() => {
    if (routingControlRef.current) {
      const container = routingControlRef.current.getContainer();
      if (container) container.style.display = 'none';
    }
  });

  return null;
}

export default function MapComponent({ routePoints, isDarkMode, isSelectingOnMap, onMapSelect, onMapRouteUpdate, activeLocationId, setActiveLocationId }) {
  const centerPosition = [51.7592, 19.4559];

  return (
    <>
      <style>
        {`
          ${isDarkMode ? `.leaflet-tile { filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%); }` : ''}
          .leaflet-routing-container { display: none !important; }
          .user-location-wrapper { position: relative; width: 20px; height: 20px; }
          .user-location-dot { width: 14px; height: 14px; background-color: #4285F4; border: 2px solid white; border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); box-shadow: 0 0 4px rgba(0,0,0,0.4); z-index: 2; }
          .user-location-pulse { width: 40px; height: 40px; background-color: rgba(66, 133, 244, 0.4); border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); animation: pulse-animation 2s infinite ease-in-out; pointer-events: none; z-index: 1; }
          @keyframes pulse-animation { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0; } }
          
          ${activeLocationId ? `
            .route-marker-${activeLocationId} {
              filter: hue-rotate(140deg) saturate(3) brightness(0.9) !important;
            }
          ` : ''}
          
          .leaflet-overlay-pane path {
            stroke: ${isDarkMode ? '#10b981' : '#28a745'} !important;
            transition: stroke 0.3s ease;
          }
        `}
      </style>
      
      <MapContainer center={centerPosition} zoom={13} doubleClickZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
        
        <PopupCloser />
        <ActiveLocationCenter activeLocationId={activeLocationId} routePoints={routePoints} />
        <LocateControl isDarkMode={isDarkMode} />
        <MapInteraction 
          isSelectingOnMap={isSelectingOnMap} 
          onMapSelect={onMapSelect} 
          setActiveLocationId={setActiveLocationId}
        />
        
        {routePoints.length === 1 && (
          <Marker 
            position={[routePoints[0].lat, routePoints[0].lng]}
            eventHandlers={{ 
              click: () => {
                window.__isMapMarkerClick = true;
                setActiveLocationId(prev => {
                  if (prev === routePoints[0].id) {
                    setTimeout(() => window.dispatchEvent(new Event('close-map-popups')), 10);
                    return null;
                  }
                  return routePoints[0].id;
                });
                setTimeout(() => { window.__isMapMarkerClick = false; }, 100);
              }
            }}
            icon={L.icon({
              iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
              shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
              iconAnchor: [12, 41], popupAnchor: [1, -34],
              className: `route-marker-${routePoints[0].id}`
            })}
          >
            {/* Zachowujemy standardową obsługę pojedynczego markera i jego przesunięcia. */}
            <Popup autoPan={false}>{routePoints[0].name}</Popup>
          </Marker>
        )}

        {routePoints.length >= 2 && (
          <RoutingMachine 
            routePoints={routePoints} 
            isDarkMode={isDarkMode} 
            onMapRouteUpdate={onMapRouteUpdate} 
            setActiveLocationId={setActiveLocationId} 
          />
        )}
      </MapContainer>
    </>
  );
}