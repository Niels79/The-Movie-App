// FILE: src/pages/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth, type UserPreferences, type MediaItem } from '../context/AuthContext';

const allGenres = ["Actie", "Avontuur", "Animatie", "Komedie", "Misdaad", "Documentaire", "Drama", "Familie", "Fantasy", "Geschiedenis", "Horror", "Muziek", "Mysterie", "Romantiek", "Sciencefiction", "TV Film", "Thriller", "Oorlog", "Western"];

// =======================================================================
// DE AANPASSING ZIT HIER: Het nieuwe, door jou gekozen kleurenpalet.
// =======================================================================
const darkThemes = [
    { name: 'Antraciet', bg: 'bg-gray-800', text: 'text-white' },
    { name: 'Nachtblauw', bg: 'bg-slate-900', text: 'text-slate-200' },
    { name: 'Woudgroen', bg: 'bg-emerald-950', text: 'text-emerald-100' },
    { name: 'Marineblauw', bg: 'bg-blue-950', text: 'text-blue-200' }, // Vertaald van #063970
];

const lightThemes = [
    { name: 'Zeeblauw', bg: 'bg-cyan-100', text: 'text-cyan-900' }, // Vertaald van #2694b9
    { name: 'Goudgeel', bg: 'bg-amber-400', text: 'text-white' }, // Vertaald van #F3B408
    { name: 'Zachtgroen', bg: 'bg-teal-50', text: 'text-teal-900' },
    { name: 'Lichtgrijs', bg: 'bg-slate-200', text: 'text-slate-800' },
];

const SettingsPage: React.FC = () => {
    const { userData, updateUserData, showNotification } = useAuth();
    const [prefs, setPrefs] = useState<UserPreferences>(userData.preferences);

    useEffect(() => {
        setPrefs(userData.preferences);
    }, [userData.preferences]);

    const handleSave = () => {
        updateUserData({ preferences: prefs });
        showNotification("Instellingen opgeslagen!");
    };

    const handleRestoreMovie = (itemToRestore: MediaItem) => {
        const newNotInterestedList = userData.notInterestedList.filter(m => m.id !== itemToRestore.id);
        updateUserData({ notInterestedList: newNotInterestedList });
        showNotification(`${itemToRestore.title} is weer zichtbaar.`);
    };

    return (
        <div className="bg-gray-800 p-8 rounded-lg shadow-2xl text-white max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold mb-6">⚙️ Instellingen</h2>
            
            <div className="mb-8">
                <label className="block text-xl font-semibold text-white mb-3">Minimale Score</label>
                <div className="flex items-center">
                    <input type="range" min="1" max="10" step="0.1" value={prefs.imdbScore}
                        onChange={e => setPrefs({...prefs, imdbScore: parseFloat(e.target.value)})}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                    <span className="ml-4 text-2xl font-bold text-yellow-400 w-20 text-center">
                        {prefs.imdbScore.toFixed(1)}
                    </span>
                </div>
            </div>
            
            <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Favoriete Genres</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {allGenres.map(genre => (
                        <button key={genre} onClick={() => {
                            const newGenres = prefs.genres.includes(genre) ? prefs.genres.filter(g => g !== genre) : [...prefs.genres, genre];
                            setPrefs({ ...prefs, genres: newGenres });
                        }} className={`py-2 px-4 rounded-lg font-medium transition-all ${prefs.genres.includes(genre) ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
                            {genre}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">Thema (Achtergrond & Tekst)</h3>
                
                <p className="text-sm text-gray-400 mb-3">Donkere Thema's</p>
                <div className="flex flex-wrap justify-center sm:justify-around items-center gap-4">
                    {darkThemes.map(theme => (
                        <div key={theme.name} className="flex flex-col items-center gap-2">
                            <button 
                                onClick={() => setPrefs({...prefs, backgroundColor: theme.bg, textColor: theme.text})} 
                                className={`w-12 h-12 rounded-full ${theme.bg} border-2 transition-all ${prefs.backgroundColor === theme.bg ? 'border-green-400 scale-110' : 'border-gray-600'}`}
                                title={theme.name}
                            />
                            <span className="text-xs">{theme.name}</span>
                        </div>
                    ))}
                </div>

                <p className="text-sm text-gray-400 mt-6 mb-3">Lichte Thema's</p>
                <div className="flex flex-wrap justify-center sm:justify-around items-center gap-4">
                    {lightThemes.map(theme => (
                        <div key={theme.name} className="flex flex-col items-center gap-2">
                            <button 
                                onClick={() => setPrefs({...prefs, backgroundColor: theme.bg, textColor: theme.text})} 
                                className={`w-12 h-12 rounded-full ${theme.bg} border-2 transition-all ${prefs.backgroundColor === theme.bg ? 'border-green-400 scale-110' : 'border-gray-900'}`}
                                title={theme.name}
                            />
                             <span className="text-xs">{theme.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end">
                <button onClick={handleSave} className="bg-green-600 hover:bg-green-700 font-bold py-3 px-6 rounded-lg">Instellingen Opslaan</button>
            </div>
            
            <div className="border-t border-gray-700 pt-8">
                <h3 className="text-xl font-semibold mb-4">Verborgen Items ({userData.notInterestedList.length})</h3>
                <div className="space-y-2">
                     {userData.notInterestedList.map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                            <span>{item.title} ({item.media_type === 'movie' ? 'Film' : 'Serie'})</span>
                            <button onClick={() => handleRestoreMovie(item)} className="text-sm bg-green-600 px-2 py-1 rounded">Herstellen</button>
                        </div>
                    ))}
                    {userData.notInterestedList.length === 0 && <p className="text-gray-400">Je hebt geen films of series verborgen.</p>}
                </div>
             </div>
        </div>
    );
};

export default SettingsPage;