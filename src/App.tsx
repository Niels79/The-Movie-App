import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import SearchPage from './pages/SearchPage';
import ListsPage from './pages/ListsPage';
import RecommendationsPage from './pages/RecommendationsPage';
import SettingsPage from './pages/SettingsPage';

// De MediaTypeToggle component blijft ongewijzigd
const MediaTypeToggle = () => {
    const { mediaType, setMediaType } = useAuth();
    const activeClass = 'bg-blue-600 text-white';
    const inactiveClass = 'bg-gray-700 text-gray-300 hover:bg-gray-600';
    return (
        <div className="flex-shrink-0 flex items-center p-1 bg-gray-900 rounded-full">
            <button onClick={() => setMediaType('movie')} className={`px-4 py-1 rounded-full text-sm font-semibold transition-colors ${mediaType === 'movie' ? activeClass : inactiveClass}`}>Films</button>
            <button onClick={() => setMediaType('tv')} className={`px-4 py-1 rounded-full text-sm font-semibold transition-colors ${mediaType === 'tv' ? activeClass : inactiveClass}`}>Series</button>
        </div>
    );
};

function App() {
  const { user, loading, login, logout, notification, mediaType } = useAuth();
  const location = useLocation();
  // State voor het mobiele (hamburger) menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.body.className = 'bg-gray-900 text-white';
  }, []);
  
  // Sluit het mobiele menu als de window groter wordt dan het mobiele breakpoint
  useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth >= 768) { // 768px is Tailwind's 'md' breakpoint
            setIsMobileMenuOpen(false);
        }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Laden en Login schermen blijven ongewijzigd
  if (loading) { return ( <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center"><svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><p className="mt-4">Laden...</p></div> ); }
  if (!user) { return ( <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4 text-center"><h1 className="text-4xl font-bold mb-2">🎬 The Movie & Series App</h1><p className="text-lg text-gray-400 mb-8">Jouw persoonlijke assistent. Log in om je lijsten op te slaan en te synchroniseren.</p><button onClick={login} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center">Inloggen met Google</button></div> ); }

  // --- OPLOSSING 1: CENTRALE NAVIGATIE DATA ---
  const navItems = [
    { to: "/", label: "Zoeken", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> },
    { to: "/lists", label: "Mijn Lijsten", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg> },
    { to: "/recommendations", label: "Aanbevelingen", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0" /></svg> },
    { to: "/settings", label: "Instellingen", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ];

  const NavButton = ({ to, label }: { to: string, label: string }) => ( <Link to={to} className={`px-4 py-2 rounded-lg transition-colors ${location.pathname === to ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>{label}</Link> );
  const appTitle = mediaType === 'movie' ? 'The Movie App' : 'The Series App';

  return (
    <div className="min-h-screen font-sans">
      <header className="bg-gray-800 p-4 shadow-md sticky top-0 z-20">
        <div className="container mx-auto flex justify-between items-center gap-4">
          {/* --- OPLOSSING 3: TITEL LAYOUT FIX --- */}
          <div className="flex-grow min-w-0 text-xl md:text-2xl font-bold text-white truncate">
            {appTitle}
          </div>
          <MediaTypeToggle />

          {/* --- OPLOSSING 2B: DESKTOP NAVIGATIE DYNAMISCH GEMAAKT --- */}
          <nav className="hidden md:flex items-center space-x-2">
            {navItems.map(item => (
                <NavButton key={item.to} to={item.to} label={item.label} />
            ))}
            <button onClick={logout} className="text-gray-300 hover:text-white ml-4 px-3 py-2 rounded-lg hover:bg-gray-700">Uitloggen</button>
          </nav>
          
          {/* --- OPLOSSING 2A: HAMBURGER MENU KNOP VOOR MOBIEL --- */}
          <div className="md:hidden">
             <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-300 hover:text-white p-2 rounded-lg hover:bg-gray-700">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
             </button>
          </div>
        </div>
      </header>

      {/* --- OPLOSSING 2C: HET MOBIELE HAMBURGER MENU ZELF --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-30 flex flex-col p-4 md:hidden">
            <div className="flex justify-between items-center mb-8">
                <span className="text-2xl font-bold text-white">{appTitle}</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-300 hover:text-white p-2">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <nav className="flex flex-col items-center space-y-4">
                {navItems.map(item => (
                    <Link key={item.to} to={item.to} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center w-full p-4 rounded-lg text-lg transition-colors ${location.pathname === item.to ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                        {item.icon}
                        <span className="ml-4">{item.label}</span>
                    </Link>
                ))}
            </nav>
            <div className="mt-auto border-t border-gray-700 pt-4">
                 <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="flex items-center w-full p-4 rounded-lg text-lg text-gray-300 hover:bg-red-800">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    <span className="ml-4">Uitloggen</span>
                </button>
            </div>
        </div>
      )}

      {notification && ( <div className="fixed top-20 right-5 bg-green-500 text-white py-2 px-5 rounded-lg shadow-lg z-30 animate-pulse">{notification}</div> )}
      
      {/* De rest van de app (main, Routes) blijft ongewijzigd */}
      <main className="container mx-auto p-4 md:p-8">
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/lists" element={<ListsPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;