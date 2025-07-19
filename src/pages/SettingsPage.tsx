// FILE: src/pages/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth, type UserPreferences, type MediaItem } from '../context/AuthContext';

const allGenres = ["Actie", "Avontuur", "Animatie", "Komedie", "Misdaad", "Documentaire", "Drama", "Familie", "Fantasy", "Geschiedenis", "Horror", "Muziek", "Mysterie", "Romantiek", "Sciencefiction", "TV Film", "Thriller", "Oorlog", "Western"];

const SettingsPage: React.FC = () => {
    const { user, userData, updateUserData, showNotification } = useAuth();
    const [prefs, setPrefs] = useState<UserPreferences>(userData.preferences);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFeedbackSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedbackMessage.trim()) {
            showNotification("Voer eerst een bericht in.");
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await fetch('https://formspree.io/f/xanjgkyg', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: user?.email || 'Niet ingelogd',
                    message: feedbackMessage 
                }),
            });
            if (response.ok) {
                showNotification("Bedankt voor je feedback!");
                setFeedbackMessage('');
            } else { throw new Error('Form submission failed'); }
        } catch (error) {
            showNotification("Er ging iets mis. Probeer het later opnieuw.");
        }
        setIsSubmitting(false);
    };

    useEffect(() => {
        setPrefs(userData.preferences);
    }, [userData.preferences]);

    const handleSave = () => {
        updateUserData({ preferences: prefs });
        showNotification("Instellingen opgeslagen!");
    };

    const handleRestoreMovie = (itemToRestore: MediaItem) => {
        const newNotInterestedList = (userData.notInterestedList || []).filter(m => m.id !== itemToRestore.id);
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
                        {prefs.imdbScore?.toFixed(1) || '7.0'}
                    </span>
                </div>
            </div>
            
            <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Mijn Voorkeursgenres</h3>
                <p className="text-sm text-gray-400 mb-4">Selecteer de genres die je over het algemeen leuk vindt. Dit wordt gebruikt om de resultaten op de 'Zoeken'-pagina te filteren.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {allGenres.map(genre => (
                        <button key={genre} onClick={() => {
                            const currentGenres = prefs.genres || [];
                            const newGenres = currentGenres.includes(genre) ? currentGenres.filter(g => g !== genre) : [...currentGenres, genre];
                            setPrefs({ ...prefs, genres: newGenres });
                        }} className={`py-2 px-4 rounded-lg font-medium transition-all ${(prefs.genres || []).includes(genre) ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
                            {genre}
                        </button>
                    ))}
                </div>
            </div>

            {/* DE SECTIE VOOR THEMA'S IS HIER VERWIJDERD */}

            <div className="flex justify-end">
                <button onClick={handleSave} className="bg-green-600 hover:bg-green-700 font-bold py-3 px-6 rounded-lg">Instellingen Opslaan</button>
            </div>
            
            <form onSubmit={handleFeedbackSubmit} className="border-t border-gray-700 pt-8 space-y-4">
                <h3 className="text-xl font-semibold mb-2">Laat feedback achter</h3>
                <p className="text-sm text-gray-400">Ideeën voor nieuwe functies of een bug gevonden? Ik hoor het graag!</p>
                <textarea 
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="Jouw opmerkingen..."
                    className="w-full p-3 rounded bg-gray-700 text-white min-h-[120px] border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
                <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:bg-gray-500">
                    {isSubmitting ? 'Versturen...' : 'Verstuur Feedback'}
                </button>
            </form>

            <div className="border-t border-gray-700 pt-8">
                <h3 className="text-xl font-semibold mb-4">Verborgen Items ({userData.notInterestedList?.length || 0})</h3>
                <div className="space-y-2">
                     {(userData.notInterestedList || []).map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                            <span>{item.title} ({item.media_type === 'movie' ? 'Film' : 'Serie'})</span>
                            <button onClick={() => handleRestoreMovie(item)} className="text-sm bg-green-600 px-2 py-1 rounded">Herstellen</button>
                        </div>
                    ))}
                    {(userData.notInterestedList?.length || 0) === 0 && <p className="text-gray-400">Je hebt geen films of series verborgen.</p>}
                </div>
             </div>
        </div>
    );
};
export default SettingsPage;