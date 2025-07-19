// FILE: src/App.tsx
import React, { useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import SearchPage from './pages/SearchPage';
import ListsPage from './pages/ListsPage';
import RecommendationsPage from './pages/RecommendationsPage';
import SettingsPage from './pages/SettingsPage';

const MediaTypeToggle = () => {
    const { mediaType, setMediaType } = useAuth();
    const activeClass = 'bg-blue-600 text-white';
    const inactiveClass = 'bg-gray-700 text-gray-300 hover:bg-gray-600';
    return (
        <div className="flex items-center p-1 bg-gray-900 rounded-full">
            <button onClick={() => setMediaType('movie')} className={`px-4 py-1 rounded-full text-sm font-semibold transition-colors ${mediaType === 'movie' ? activeClass : inactiveClass}`}>Films</button>
            <button onClick={() => setMediaType('tv')} className={`px-4 py-1 rounded-full text-sm font-semibold transition-colors ${mediaType === 'tv' ? activeClass : inactiveClass}`}>Series</button>
        </div>
    );
};

function App() {
  const { user, loading, login, logout, notification, mediaType } = useAuth();
  const location = useLocation();

  // AANGEPAST: De useEffect voor thema's is verwijderd om een vast thema te gebruiken.
  useEffect(() => {
    document.body.className = 'bg-gray-900 text-white';
  }, []);

  if (loading) { return ( <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center"><svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><p className="mt-4">Laden...</p></div> ); }
  if (!user) { return ( <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4 text-center"><h1 className="text-4xl font-bold mb-2">🎬 The Movie & Series App</h1><p className="text-lg text-gray-400 mb-8">Jouw persoonlijke assistent. Log in om je lijsten op te slaan en te synchroniseren.</p><button onClick={login} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center">Inloggen met Google</button></div> ); }

  const NavButton = ({ to, label }: { to: string, label: string }) => ( <Link to={to} className={`px-4 py-2 rounded-lg transition-colors ${location.pathname === to ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>{label}</Link> );
  const TopNavButtonMobile = ({ to, label, icon }: { to: string, label: string, icon: React.ReactNode }) => { const isActive = location.pathname === to; return ( <Link to={to} className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors ${isActive ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}>{icon}<span className="text-xs font-medium">{label}</span></Link> ); };
  const appTitle = mediaType === 'movie' ? 'The Movie App' : 'The Series App';

  return (
    <div className="pt-8 min-h-screen font-sans">
      <header className="bg-gray-800 p-4 shadow-md sticky top-0 z-20">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-xl md:text-2xl font-bold text-white">{appTitle}</div>
          <MediaTypeToggle />
          <nav className="hidden md:flex items-center space-x-4">
            <NavButton to="/" label="Zoeken" />
            <NavButton to="/lists" label="Mijn Lijsten" />
            <NavButton to="/recommendations" label="Aanbevelingen" />
            <NavButton to="/settings" label="Instellingen" />
            <button onClick={logout} className="text-gray-300 hover:text-white ml-4">Uitloggen</button>
          </nav>
        </div>
      </header>
      <nav className="bg-gray-800 border-b border-gray-700 flex justify-around md:hidden sticky top-[72px] z-10">
        <TopNavButtonMobile to="/" label="Zoeken" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>} />
        <TopNavButtonMobile to="/lists" label="Lijsten" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>} />
        <TopNavButtonMobile to="/recommendations" label="Voor Jou" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0" /></svg>} />
        <TopNavButtonMobile to="/settings" label="Meer" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>} />
      </nav>
      {notification && ( <div className="fixed top-20 right-5 bg-green-500 text-white py-2 px-5 rounded-lg shadow-lg z-30 animate-pulse">{notification}</div> )}
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