// FILE: src/pages/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth, type UserPreferences, type MediaItem } from '../context/AuthContext';

const allGenres = ["Actie", "Avontuur", "Animatie", "Komedie", "Misdaad", "Documentaire", "Drama", "Familie", "Fantasy", "Geschiedenis", "Horror", "Muziek", "Mysterie", "Romantiek", "Sciencefiction", "TV Film", "Thriller", "Oorlog", "Western"];

// Component voor de uitklapbare secties
interface AccordionItemProps {
    title: string;
    children: React.ReactNode;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-700">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="w-full flex justify-between items-center text-left py-4"
            >
                <span className="font-semibold">{title}</span>
                <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {isOpen && (
                <div className="p-4 bg-gray-900 rounded-b-lg">
                    {children}
                </div>
            )}
        </div>
    );
};

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
                <p className="text-sm text-gray-400 mb-4">Selecteer de genres die je over het algemeen leuk vindt. Dit wordt gebruikt als een filter door de hele app.</p>
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

            <div className="flex justify-end">
                <button onClick={handleSave} className="bg-green-600 hover:bg-green-700 font-bold py-3 px-6 rounded-lg">Instellingen Opslaan</button>
            </div>
            
            <div className="border-t border-gray-700 pt-8">
                <h3 className="text-2xl font-bold mb-4">Uitleg over de App</h3>
                <AccordionItem title="Hoe werken de 'Voorkeursgenres'?">
                    <p className="text-sm text-gray-300">
                        De genres die je hierboven selecteert, worden een "algemeen filter" voor de hele app. Als je bijvoorbeeld alleen 'Actie' en 'Thriller' selecteert, zul je op de 'Zoeken'-pagina en in de 'Aanbevelingen' standaard alleen films en series te zien krijgen die minimaal een van deze genres hebben.
                    </p>
                </AccordionItem>
                <AccordionItem title="Hoe werken de Aanbevelingen?">
                     <p className="text-sm text-gray-300 space-y-2">
                         <span>De aanbevelingenpagina is je persoonlijke filmcurator. Het werkt als volgt:</span>
                         <ul className="list-disc list-inside">
                             <li><strong>Jouw Smaak is de Basis:</strong> Het algoritme analyseert je 'Gezien'-lijst en geeft een 'boost' aan genres die jij hoge cijfers (7 of hoger) geeft.</li>
                             <li><strong>Jouw Filters:</strong> De app zoekt naar films en series die passen binnen de periode die je instelt met de jaartal-sliders.</li>
                             <li><strong>Tijdelijk Overschrijven:</strong> Als je op de aanbevelingenpagina zelf een genre selecteert (bv. 'Komedie'), wordt je algemene voorkeur uit de instellingen voor die ene zoekopdracht genegeerd. Dit geeft je de vrijheid om even buiten je comfortzone te zoeken.</li>
                         </ul>
                     </p>
                </AccordionItem>
                {/* DE NIEUWE 'UITLEG KNOPPEN' SECTIE */}
                <AccordionItem title="Hoe werken de knoppen op een kaart?">
                    <div className="text-sm text-gray-300 space-y-4">
                        <div>
                            <h4 className="font-bold">Het Kruisje (×) - Verbergen</h4>
                            <p>Als je op het kruisje klikt, verdwijnt de kaart direct en wordt de film/serie niet meer aangeraden. Je kunt dit ongedaan maken in de "Verborgen Items"-lijst hieronder.</p>
                        </div>
                        <div>
                            <h4 className="font-bold">De Info-knop (ℹ️) - Waar te Kijken?</h4>
                            <p>Klik hierop om te zien op welke streamingdienst (Netflix, Disney+, etc.) een titel te zien is, of dat deze nu in de bioscoop draait.</p>
                        </div>
                        <div>
                            <h4 className="font-bold">De 'Gezien'-knop</h4>
                            <p>Voegt de titel toe aan je 'Gezien'-lijst en geeft je direct de mogelijkheid om een sterren-rating te geven.</p>
                        </div>
                        <div>
                            <h4 className="font-bold">De 'Kijklijst'-knop</h4>
                            <p>Voegt de titel toe aan je persoonlijke 'Kijklijst', zodat je deze niet vergeet.</p>
                        </div>
                        <div>
                            <h4 className="font-bold">De Sterren-rating</h4>
                            <p>Nadat een item op 'Gezien' staat, kun je het een persoonlijke score van 1 tot 10 geven. Deze score wordt gebruikt om je aanbevelingen nog slimmer te maken.</p>
                        </div>
                    </div>
                </AccordionItem>
                <AccordionItem title="Over ons">
                    <div className="text-sm text-gray-300 space-y-3">
                        <p>Deze app is ontworpen om je te helpen navigeren door de eindeloze wereld van films en series, zodat je altijd iets vindt dat bij je past.</p>
                        <p><strong>Versie:</strong> 1.0.2</p>
                        <p><strong>Ontwikkelaar:</strong> Gemaakt door NK Dutch Labs</p>
                        <p><em>Alle film- en seriedata wordt geleverd door The Movie Database (TMDB). Hartelijk dank aan hun geweldige community en API.</em></p>
                    </div>
                </AccordionItem>
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
                <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:bg-gray-500">{isSubmitting ? 'Versturen...' : 'Verstuur Feedback'}</button>
            </form>

            {/* DE 'VERBORGEN ITEMS' SECTIE IS NU INKLAPBAAR */}
            <div className="border-t border-gray-700 pt-8">
                 <AccordionItem title={`Verborgen Items (${userData.notInterestedList?.length || 0})`}>
                    <div className="space-y-2">
                         {(userData.notInterestedList || []).map(item => (
                            <div key={item.id} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                                <span>{item.title} ({item.media_type === 'movie' ? 'Film' : 'Serie'})</span>
                                <button onClick={() => handleRestoreMovie(item)} className="text-sm bg-green-600 px-2 py-1 rounded">Herstellen</button>
                            </div>
                        ))}
                        {(userData.notInterestedList?.length || 0) === 0 && <p className="text-gray-400">Je hebt geen films of series verborgen.</p>}
                    </div>
                 </AccordionItem>
             </div>
        </div>
    );
};

export default SettingsPage;