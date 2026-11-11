import { useState, useEffect } from 'react';
import { Reorder } from 'framer-motion';
import MapComponent from './components/MapComponent';
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { useParams, useNavigate } from 'react-router-dom';

const mockLocations = [
  { id: 1, name: "Galeria Manufaktura", lat: 51.7784, lng: 19.4493, image: "https://upload.wikimedia.org/wikipedia/commons/c/cd/Manufaktura_Lodz_01.jpg", description: "Ogromne centrum handlowo-rozrywkowe.", hours: "10:00 - 22:00" },
  { id: 2, name: "Ulica Piotrkowska", lat: 51.7645, lng: 19.4578, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Piotrkowska_noc%C4%85.jpg/320px-Piotrkowska_noc%C4%85.jpg", description: "Główna arteria Łodzi.", hours: "Całodobowo" },
  { id: 3, name: "Galeria Łódzka", lat: 51.7582, lng: 19.4646, image: "https://pl.wikipedia.org/wiki/Galeria_%C5%81%C3%B3dzka#/media/Plik:Galeria_%C5%81%C3%B3dzka_2017.jpg", description: "Nowoczesne centrum handlowe w centrum miasta.", hours: "09:30 - 21:00" },
  { id: 4, name: "Księży Młyn", lat: 51.7534, lng: 19.4812, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Ksiezy_mlyn.jpg/320px-Ksiezy_mlyn.jpg", description: "Zabytkowy kompleks fabryczno-mieszkalny.", hours: "Całodobowo" }
];

function LocationCard({ loc, isAdded, onToggle, isDarkMode }) {
  const [isHovered, setIsHovered] = useState(false);
  let buttonContent = isAdded ? (isHovered ? "✕" : "✓") : "＋";
  let buttonBg = isAdded ? (isHovered ? (isDarkMode ? "#444" : "#e0e0e0") : (isDarkMode ? "#222" : "#ffffff")) : (isDarkMode ? "#333" : "#f0f0f0"); 
  const textColor = isDarkMode ? '#e0e0e0' : '#333';
  const borderColor = isDarkMode ? '#444' : '#ccc';

  // Generujemy jasny lub ciemny obraz zastępczy, zależnie od motywu.
  const placeholderImg = isDarkMode 
    ? "https://placehold.co/100x150/2d2d2d/666666?text=📍" 
    : "https://placehold.co/100x150/f0f0f0/a0a0a0?text=📍";
    
  // Używamy zdjęcia lokalizacji lub obrazu zastępczego, jeśli zdjęcie nie jest dostępne.
  const bgImage = loc.image ? loc.image : placeholderImg;

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', border: `1px solid ${borderColor}`, borderRadius: '6px', marginBottom: '15px', backgroundColor: isDarkMode ? '#2d2d2d' : '#fff', overflow: 'hidden' }}>
      {/* Ustawiamy sprawdzony adres w background-image. */}
      <div style={{ width: '100px', flexShrink: 0, backgroundImage: `url('${bgImage}')`, backgroundSize: 'cover', backgroundPosition: 'center', borderRight: `1px solid ${borderColor}` }} />
      <div style={{ flexGrow: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: textColor }}>{loc.name}</h4>
          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: isDarkMode ? '#a0a0a0' : '#666', lineHeight: '1.4' }}>{loc.description}</p>
        </div>
        <div style={{ fontSize: '11px', color: isDarkMode ? '#a0a0a0' : '#666', fontWeight: '500' }}>🕒 {loc.hours}</div>
      </div>
      <div onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} onClick={() => onToggle(loc)} style={{ width: '50px', flexShrink: 0, borderLeft: `1px solid ${borderColor}`, backgroundColor: buttonBg, color: textColor, fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s ease' }}>
        <div style={{ width: '28px', height: '28px', border: `1px solid ${isDarkMode ? '#888' : '#333'}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{buttonContent}</div>
      </div>
    </div>
  );
}

export default function App() {
  // Przechowuje dane zalogowanego użytkownika.
  const [user, setUser] = useState(null);

  const { id } = useParams(); // Pobieramy identyfikator z adresu.
  const navigate = useNavigate(); // Służy do czyszczenia paska adresu.

  useEffect(() => {
    // Importujemy trasę, jeśli jej identyfikator znajduje się w adresie URL.
    if (id) {
      const importRoute = async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/routes/${id}`);
          const data = await response.json();

          if (data.success && data.route && data.route.waypoints) {
            // Zapisujemy wczytane punkty w stanie trasy.
            setSelectedRoute(data.route.waypoints);
            
            // Przywracamy podstawowy adres URL po imporcie.
            navigate('/', { replace: true });
          } else {
            alert("Nie udało się zaimportować trasy. Link może być nieaktualny.");
            navigate('/', { replace: true });
          }
        } catch (error) {
          console.error("Błąd importowania trasy:", error);
          alert("Błąd połączenia z serwerem podczas importowania trasy.");
          navigate('/', { replace: true });
        }
      };

      importRoute();
    }
  }, [id, navigate]);
  // ===================================

  // Logowanie przez Google.
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      
      // Pobieramy token JWT, który będzie wysyłany do backendu.
      const token = await result.user.getIdToken();
      console.log("Logowanie zakończone powodzeniem. Token JWT dla backendu:", token);
    } catch (error) {
      console.error("Błąd autoryzacji:", error);
    }
  };

  // Wylogowanie.
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Błąd wylogowania:", error);
    }
  };

  // Zapisanie trasy i utworzenie linku do udostępnienia.
  const handleSaveAndShare = async () => {
    // Sprawdzamy, czy użytkownik jest zalogowany (zmienna user z Firebase Auth).
    if (!user) {
      return alert("Zaloguj się, aby zapisać trasę.");
    }
    if (selectedRoute.length < 2) {
      return alert("Dodaj co najmniej dwa punkty do trasy!");
    }

    try {
      // Wysyłamy żądanie POST do backendu.
      const response = await fetch('http://localhost:5000/api/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          points: selectedRoute,
          userId: user.uid, 
          email: user.email,
          name: "Moja trasa po Łodzi"
        })
      });

      const data = await response.json();

      if (data.success) {
        // Tworzymy link na podstawie bieżącego adresu strony.
        const shareableLink = `${window.location.origin}/shared-route/${data.id}`;
        
        // Automatycznie kopiujemy link do schowka.
        await navigator.clipboard.writeText(shareableLink);
        
        alert("Trasa została zapisana, a link skopiowany do schowka 🔗\n\n" + shareableLink);
      } else {
        alert("Błąd zapisywania: " + data.error);
      }
    } catch (error) {
      console.error("Błąd sieci podczas zapisywania trasy:", error);
      alert("Nie udało się połączyć z serwerem.");
    }
  };

  const [selectedRoute, setSelectedRoute] = useState(() => {
    const savedRoute = localStorage.getItem('app-route');
    return savedRoute ? JSON.parse(savedRoute) : [];
  });
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('app-theme');
    return savedTheme ? savedTheme === 'dark' : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSelectingOnMap, setIsSelectingOnMap] = useState(false);
  const [activeLocationId, setActiveLocationId] = useState(null);

  useEffect(() => localStorage.setItem('app-route', JSON.stringify(selectedRoute)), [selectedRoute]);
  useEffect(() => localStorage.setItem('app-theme', isDarkMode ? 'dark' : 'light'), [isDarkMode]);

  const toggleLocation = (location) => {
    setSelectedRoute(prevRoute => {
      const isAlreadyAdded = prevRoute.find(loc => loc.id === location.id);
      if (isAlreadyAdded) {
        if (activeLocationId === location.id) setActiveLocationId(null);
        return prevRoute.filter(loc => loc.id !== location.id);
      }
      return [...prevRoute, location];
    });
  };

  const removeLocation = (id) => {
    if (activeLocationId === id) setActiveLocationId(null);
    setSelectedRoute(prev => prev.filter(loc => loc.id !== id));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const queryWithCity = `Łódź, ${searchQuery}`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryWithCity)}&viewbox=19.3,51.8,19.6,51.6&bounded=1&limit=5`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) setSearchResults(data);
      else { console.warn("API zwróciło wartość, która nie jest tablicą:", data); setSearchResults([]); }
    } catch (error) {
      console.error("Błąd wyszukiwania adresu:", error);
      setSearchResults([]);
    }
  };

  const handleAddFromSearch = (result) => {
    setSelectedRoute(prev => [...prev, {
      id: Date.now(), name: result.display_name.split(',')[0], lat: parseFloat(result.lat), lng: parseFloat(result.lon), description: result.display_name, hours: "-"
    }]);
    setIsModalOpen(false); setSearchQuery(""); setSearchResults([]);
  };

  const handleMapSelect = (latlng) => {
    setSelectedRoute(prev => [...prev, {
      id: Date.now(), name: `Punkt na mapie`, lat: latlng.lat, lng: latlng.lng, description: "Dodano ręcznie", hours: "-"
    }]);
    setIsSelectingOnMap(false);
  };

  const handleMapRouteUpdate = (leafletWaypoints) => {
    setSelectedRoute(prevRoute => {
      const usedIds = new Set(); // Zbiór do śledzenia unikalnych identyfikatorów.
      
      const updatedRoute = leafletWaypoints.map((wp, index) => {
        // 1. Sprawdzamy, czy istnieje już punkt o tych współrzędnych.
        const existing = prevRoute.find(p => Math.abs(p.lat - wp.latLng.lat) < 0.001 && Math.abs(p.lng - wp.latLng.lng) < 0.001);
        
        // 2. Jeśli punkt istnieje, a jego identyfikator nie został jeszcze użyty w tej aktualizacji.
        if (existing && !usedIds.has(existing.id)) {
          usedIds.add(existing.id);
          return existing;
        }
        
        // 3. Jeśli punkt nie istnieje lub jego identyfikator jest już użyty, tworzymy nowy.
        // Dodajemy indeks, aby zagwarantować unikalność identyfikatora.
        const newId = `wp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`;
        usedIds.add(newId);
        
        return { 
          id: newId, 
          name: existing ? existing.name : "Punkt pośredni", 
          lat: wp.latLng.lat, 
          lng: wp.latLng.lng, 
          description: existing ? existing.description : "Dodano przez przeciągnięcie trasy", 
          hours: existing ? existing.hours : "-" 
        };
      });

      // Sprawdzamy, czy tablica rzeczywiście się zmieniła, aby uniknąć zbędnych renderowań.
      const isDifferent = updatedRoute.length !== prevRoute.length || updatedRoute.some((p, i) => p.id !== prevRoute[i]?.id);
      return isDifferent ? updatedRoute : prevRoute;
    });
  };

  const handleOptimizeRoute = async () => {
    if (selectedRoute.length < 3) {
      return alert("Do optymalizacji potrzebne są co najmniej 3 punkty!");
    }

    try {
      const response = await fetch('http://localhost:5000/api/optimize-route', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Token autoryzacyjny nie jest wymagany, jeśli algorytm jest publicznie dostępny.
        },
        // Backend oczekuje tablicy w polu "points".
        body: JSON.stringify({ points: selectedRoute })
      });

      const data = await response.json();

      if (data.success) {
        // Aktualizujemy stan; Leaflet automatycznie narysuje trasę w nowej kolejności.
        setSelectedRoute(data.route);
        alert("Trasa została zoptymalizowana! 🪄");
      } else {
        alert(data.error || "Błąd optymalizacji na serwerze.");
      }
    } catch (error) {
      console.error("Błąd żądania optymalizacji:", error);
      alert("Nie udało się połączyć z serwerem. Sprawdź, czy backend jest uruchomiony.");
    }
  };

  const appBg = isDarkMode ? '#121212' : '#fdfdfd';
  const sidebarBg = isDarkMode ? '#1e1e1e' : '#f8f9fa';
  const textColor = isDarkMode ? '#e0e0e0' : '#333';
  const borderColor = isDarkMode ? '#444' : '#ddd';

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', backgroundColor: appBg }}>
      
      {/* Stałe paski przewijania zapobiegają zmianom szerokości panelu. */}
      <div style={{ width: '400px', padding: '20px', backgroundColor: sidebarBg, borderRight: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', overflowY: 'scroll', overflowX: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: textColor, margin: 0 }}>Optymalizator tras</h2>
          <button onClick={() => setIsDarkMode(!isDarkMode)} style={{ background: 'none', border: `1px solid ${borderColor}`, borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', color: textColor }}>{isDarkMode ? '☀️' : '🌙'}</button>
        </div>

        {/* Panel logowania */}
        <div style={{ marginBottom: '20px', padding: '12px 15px', backgroundColor: isDarkMode ? '#2d2d2d' : '#f8f9fa', borderRadius: '8px', border: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {user ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img 
                    src={user.photoURL} 
                    alt="avatar" 
                    referrerPolicy="no-referrer" 
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} 
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: textColor, fontSize: '13px', fontWeight: '600' }}>{user.displayName}</span>
                  <span style={{ color: isDarkMode ? '#a0a0a0' : '#666', fontSize: '11px' }}>Zalogowano</span>
                </div>
              </div>
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>Wyloguj</button>
            </>
          ) : (
            <>
              <span style={{ color: textColor, fontSize: '13px' }}>Zapisuj swoje trasy</span>
              <button onClick={handleGoogleLogin} style={{ backgroundColor: '#4285F4', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Zaloguj się przez Google
              </button>
            </>
          )}
        </div>
        
        <h3 style={{ color: textColor, margin: '0 0 15px 0' }}>Katalog</h3>
        <div style={{ flexShrink: 0 }}>
          {mockLocations.map(loc => (
            <LocationCard key={loc.id} loc={loc} isAdded={selectedRoute.some(r => r.id === loc.id)} onToggle={toggleLocation} isDarkMode={isDarkMode} />
          ))}
        </div>

        <button onClick={() => setIsModalOpen(true)} style={{ margin: '10px 0 20px 0', padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          ➕ Znajdź lub dodaj punkt
        </button>

        <hr style={{ margin: '10px 0 20px 0', borderTop: `1px solid ${borderColor}` }} />

        {selectedRoute.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 15px 0' }}>
            <h3 style={{ margin: 0, color: textColor, fontSize: '16px' }}>Twoja trasa: ({selectedRoute.length})</h3>
            
            {/* Przycisk jest widoczny dla zalogowanych użytkowników, gdy trasa ma co najmniej 2 punkty. */}
            {user && selectedRoute.length >= 2 && (
              <button
                onClick={handleSaveAndShare}
                style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                🔗 Udostępnij
              </button>
            )}
          </div>
        )}
        
        <Reorder.Group 
          axis="y" 
          values={selectedRoute} 
          onReorder={setSelectedRoute} 
          style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, padding: 0, margin: 0, listStyle: 'none' }}
        >
          {selectedRoute.map((loc, index) => {
            const isActive = activeLocationId === loc.id;
            
            return (
              <Reorder.Item 
                key={loc.id} 
                value={loc}
                onDragStart={() => {
                  setActiveLocationId(loc.id);
                  // Zamykamy okna podręczne na mapie.
                  window.dispatchEvent(new Event('close-map-popups')); 
                }}
                onClick={() => {
                  setActiveLocationId(isActive ? null : loc.id);
                  // Zamykamy okna podręczne na mapie.
                  window.dispatchEvent(new Event('close-map-popups'));
                }}
                whileDrag={{ 
                  scale: 1.02, 
                  boxShadow: isDarkMode ? '0 8px 20px rgba(0,0,0,0.5)' : '0 8px 20px rgba(0,0,0,0.15)',
                  cursor: 'grabbing'
                }}
                style={{ 
                  padding: '12px', 
                  backgroundColor: isDarkMode ? (isActive ? '#3a3a3a' : '#2d2d2d') : (isActive ? '#e6f2ff' : '#fff'), 
                  border: `1px solid ${isActive ? '#007bff' : borderColor}`, 
                  cursor: 'grab', 
                  color: textColor, 
                  borderRadius: '6px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  userSelect: 'none'
                }}
              >
                <div style={{ overflow: 'hidden', pointerEvents: 'none' }}>
                  <strong style={{ fontSize: '14px', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{index + 1}. {loc.name}</strong>
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{loc.description}</div>
                </div>
                <button 
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); removeLocation(loc.id); }}
                  style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '18px', padding: '0 0 0 10px' }}
                >✕</button>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>

        {selectedRoute.length > 0 && (
          <button 
          onClick={handleOptimizeRoute} 
          style={{ marginTop: '20px', padding: '12px', width: '100%', backgroundColor: isDarkMode ? '#e0e0e0' : '#333', color: isDarkMode ? '#121212' : 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', flexShrink: 0 }}>
            Optymalizuj trasę
          </button>
        )}
      </div>

      <div style={{ flexGrow: 1, position: 'relative' }}>
        {isSelectingOnMap && (
          <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, backgroundColor: '#333', color: 'white', padding: '12px 24px', borderRadius: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span>Kliknij dowolne miejsce na mapie, aby dodać punkt</span>
            <button onClick={() => setIsSelectingOnMap(false)} style={{ backgroundColor: '#ff4d4d', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '15px', cursor: 'pointer' }}>Anuluj</button>
          </div>
        )}
        
        <MapComponent 
          routePoints={selectedRoute} 
          isDarkMode={isDarkMode} 
          isSelectingOnMap={isSelectingOnMap}
          onMapSelect={handleMapSelect}
          onMapRouteUpdate={handleMapRouteUpdate}
          activeLocationId={activeLocationId}
          setActiveLocationId={setActiveLocationId}
        />
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: '450px', backgroundColor: sidebarBg, borderRadius: '8px', padding: '24px', border: `1px solid ${borderColor}` }}>
            <h3 style={{ margin: '0 0 20px 0', color: textColor }}>Dodaj nowy punkt</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input type="text" placeholder="Wpisz adres w Łodzi..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} style={{ flexGrow: 1, padding: '10px', borderRadius: '4px', border: `1px solid ${borderColor}`, backgroundColor: isDarkMode ? '#2d2d2d' : '#fff', color: textColor }} />
              <button onClick={handleSearch} style={{ padding: '10px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Szukaj</button>
            </div>
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '20px' }}>
              {searchResults.map((res, i) => (
                <div key={i} onClick={() => handleAddFromSearch(res)} style={{ padding: '10px', borderBottom: `1px solid ${borderColor}`, cursor: 'pointer', color: textColor }}>{res.display_name}</div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => { setIsModalOpen(false); setIsSelectingOnMap(true); }} style={{ padding: '10px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>📍 Wskaż na mapie</button>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: '10px 15px', backgroundColor: 'transparent', border: `1px solid ${borderColor}`, color: textColor, borderRadius: '4px', cursor: 'pointer' }}>Zamknij</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}