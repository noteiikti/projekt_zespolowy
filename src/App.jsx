import { useState, useRef, useEffect } from 'react';
import MapComponent from './components/MapComponent';

const mockLocations = [
  { id: 1, name: "Galeria Manufaktura", lat: 51.7784, lng: 19.4493 },
  { id: 2, name: "Ulica Piotrkowska", lat: 51.7645, lng: 19.4578 },
  { id: 3, name: "Galeria Łódzka", lat: 51.7584, lng: 19.4623 },
  { id: 4, name: "Księży Młyn", lat: 51.7534, lng: 19.4812 }
];

function LocationCard({ loc, isAdded, onToggle, isDarkMode }) {
  const [isHovered, setIsHovered] = useState(false);

  let buttonContent = "＋";
  let buttonBg = isDarkMode ? "#333" : "#f0f0f0"; 

  if (isAdded) {
    if (isHovered) {
      buttonContent = "✕";
      buttonBg = isDarkMode ? "#444" : "#e0e0e0"; 
    } else {
      buttonContent = "✓";
      buttonBg = isDarkMode ? "#222" : "#ffffff"; 
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      border: `1px solid ${isDarkMode ? '#444' : '#ccc'}`,
      borderRadius: '4px',
      marginBottom: '10px',
      backgroundColor: isDarkMode ? '#2d2d2d' : '#fff',
      overflow: 'hidden'
    }}>
      <span style={{ padding: '12px', fontWeight: '500', color: isDarkMode ? '#e0e0e0' : '#333' }}>
        {loc.name}
      </span>
      
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onToggle(loc)}
        style={{
          width: '48px',
          height: '48px',
          borderLeft: `1px solid ${isDarkMode ? '#444' : '#ccc'}`,
          backgroundColor: buttonBg,
          color: isDarkMode ? '#e0e0e0' : '#333',
          fontSize: '20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s ease'
        }}
      >
        <div style={{
          width: '28px',
          height: '28px',
          border: `1px solid ${isDarkMode ? '#888' : '#333'}`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px'
        }}>
          {buttonContent}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  // 1. Ініціалізуємо маршрут з localStorage (якщо він там є)
  const [selectedRoute, setSelectedRoute] = useState(() => {
    const savedRoute = localStorage.getItem('app-route');
    return savedRoute ? JSON.parse(savedRoute) : [];
  });
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // 2. Зберігаємо маршрут у localStorage при будь-якій зміні
  useEffect(() => {
    localStorage.setItem('app-route', JSON.stringify(selectedRoute));
  }, [selectedRoute]);

  useEffect(() => {
    localStorage.setItem('app-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      if (!localStorage.getItem('app-theme')) {
        setIsDarkMode(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);
  
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const toggleLocation = (location) => {
    const isAlreadyAdded = selectedRoute.find(loc => loc.id === location.id);
    if (isAlreadyAdded) {
      setSelectedRoute(selectedRoute.filter(loc => loc.id !== location.id));
    } else {
      setSelectedRoute([...selectedRoute, location]);
    }
  };

  const handleSort = () => {
    let routeClone = [...selectedRoute];
    const draggedLoc = routeClone[dragItem.current];
    routeClone.splice(dragItem.current, 1);
    routeClone.splice(dragOverItem.current, 0, draggedLoc);
    setSelectedRoute(routeClone);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleOptimize = () => {
    if (selectedRoute.length < 2) {
      alert("Додайте хоча б дві точки для побудови маршруту!");
      return;
    }
    console.log("Відправляємо на бекенд:", selectedRoute);
  };

  const appBg = isDarkMode ? '#121212' : '#fdfdfd';
  const sidebarBg = isDarkMode ? '#1e1e1e' : '#f8f9fa';
  const textColor = isDarkMode ? '#e0e0e0' : '#333';
  const borderColor = isDarkMode ? '#333' : '#ddd';

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', backgroundColor: appBg }}>
      
      <div style={{ width: '320px', padding: '20px', backgroundColor: sidebarBg, borderRight: `1px solid ${borderColor}`, overflowY: 'auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: textColor, margin: 0 }}>Каталог локацій</h2>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{
              background: 'none', border: `1px solid ${borderColor}`, borderRadius: '4px',
              padding: '6px 10px', cursor: 'pointer', fontSize: '16px', color: textColor
            }}
            title="Перемкнути тему"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
        
        {mockLocations.map(loc => {
          const isAdded = selectedRoute.some(r => r.id === loc.id);
          return (
            <LocationCard 
              key={loc.id} 
              loc={loc} 
              isAdded={isAdded} 
              onToggle={toggleLocation} 
              isDarkMode={isDarkMode} 
            />
          );
        })}

        <hr style={{ margin: '24px 0', borderTop: `1px solid ${isDarkMode ? '#444' : '#eee'}` }} />

        <h2 style={{ color: textColor }}>Мій маршрут ({selectedRoute.length})</h2>
        <p style={{ fontSize: '12px', color: '#888', marginTop: '-10px' }}>
          Перетягніть елементи, щоб змінити порядок
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {selectedRoute.map((loc, index) => (
            <div 
              key={loc.id}
              draggable
              onDragStart={(e) => (dragItem.current = index)}
              onDragEnter={(e) => (dragOverItem.current = index)}
              onDragEnd={handleSort}
              onDragOver={(e) => e.preventDefault()}
              style={{ 
                padding: '10px 12px', 
                backgroundColor: isDarkMode ? '#2d2d2d' : '#fff', 
                border: `1px dashed ${isDarkMode ? '#555' : '#ccc'}`, 
                cursor: 'grab',
                color: textColor,
                borderRadius: '4px'
              }}
            >
              <span style={{ marginRight: '10px', color: '#888' }}>{index + 1}.</span>
              {loc.name}
            </div>
          ))}
        </div>

        {selectedRoute.length > 0 && (
          <button 
            onClick={handleOptimize}
            style={{ 
              marginTop: '20px', padding: '12px', width: '100%', 
              backgroundColor: isDarkMode ? '#e0e0e0' : '#333', 
              color: isDarkMode ? '#121212' : 'white', 
              border: 'none', borderRadius: '4px', cursor: 'pointer', 
              fontWeight: 'bold', fontSize: '15px', transition: 'background-color 0.2s' 
            }}
          >
            Відправити на бекенд
          </button>
        )}
      </div>

      <div style={{ flexGrow: 1 }}>
        <MapComponent routePoints={selectedRoute} isDarkMode={isDarkMode} />
      </div>
      
    </div>
  );
}