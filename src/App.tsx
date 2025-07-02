// FILE: src/App.tsx
import React, { useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import SearchPage from './pages/SearchPage';
import ListsPage from './pages/ListsPage';
import RecommendationsPage from './pages/RecommendationsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  const { user, loading, login, logout, userData, notification } = useAuth();
  const location = useLocation();

  useEffect(() => {
    document.body.className = '';
    document.body.classList.add(userData.preferences.backgroundColor || 'bg-gray-900');
  }, [userData.preferences.backgroundColor]);

  if (loading) {
    return <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">Laden...</div>;
  }
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4 text-center">
        <h1 className="text-4xl font-bold mb-2">🎬 The Movie App</h1>
        <p className="text-lg text-gray-400 mb-8">Jouw persoonlijke filmassistent. Log in om je lijsten op te slaan en te synchroniseren.</p>
        <button onClick={login} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center">
          Inloggen met Google
        </button>
      </div>
    );
  }

  // Desktop navigation button
  const NavButton = ({ to, label }: { to: string, label: string }) => (
    <Link to={to} className={`px-4 py-2 rounded-lg transition-colors ${location.pathname === to ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
        {label}
    </Link>
  );
  
  // Mobile navigation button
  const MobileNavButton = ({ to, label, icon }: { to: string, label: string, icon: React.ReactNode }) => {
    const isActive = location.pathname === to;
    return (
        <Link to={to} className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors ${isActive ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}>
            {icon}
            <span className="text-xs font-medium">{label}</span>
        </Link>
    );
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500`}>
      {/* Unified Header for all devices */}
      <header className="bg-gray-800 shadow-md sticky top-0 z-20">
        {/* Top part with title, with safe-area padding for mobile status bar */}
        <div className="container mx-auto flex justify-between items-center p-4 pt-6 md:pt-4">
          <div className="text-2xl font-bold text-white">The Movie App</div>
          {/* Desktop-only navigation and logout button */}
          <nav className="hidden md:flex items-center space-x-4">
            <NavButton to="/" label="Zoeken" />
            <NavButton to="/lists" label="Mijn Lijsten" />
            <NavButton to="/recommendations" label="Aanbevelingen" />
            <NavButton to="/settings" label="Instellingen" />
            <button onClick={logout} className="text-gray-300 hover:text-white ml-4">Uitloggen</button>
          </nav>
        </div>
        
        {/* Mobile-only navigation bar, now at the top */}
        <nav className="border-t border-gray-700 flex justify-around md:hidden">
          <MobileNavButton to="/" label="Zoeken" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>} />
          <MobileNavButton to="/lists" label="Lijsten" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>} />
          <MobileNavButton to="/recommendations" label="Voor Jou" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0" /></svg>} />
          <MobileNavButton to="/settings" label="Instellingen" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
        </nav>
      </header>

      {notification && (
        <div className="fixed top-24 right-5 bg-green-500 text-white py-2 px-5 rounded-lg shadow-lg z-30 animate-pulse">
            {notification}
        </div>
      )}
      
      {/* Main content, no extra padding needed at the bottom */}
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