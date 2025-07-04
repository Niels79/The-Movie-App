// FILE: src/pages/ListsPage.tsx
import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { MovieCard } from '../components/MovieCard';

const allGenresLists = ["Actie", "Avontuur", "Animatie", "Komedie", "Misdaad", "Documentaire", "Drama", "Familie", "Fantasy", "Geschiedenis", "Horror", "Muziek", "Mysterie", "Romantiek", "Sciencefiction", "TV Film", "Thriller", "Oorlog", "Western"];

const ListsPage: React.FC = () => {
    const { userData } = useAuth();
    const [filterTerm, setFilterTerm] = useState('');
    const [genreFilter, setGenreFilter] = useState('');
    const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
    const [isSeenListOpen, setIsSeenListOpen] = useState(false);

    const filteredWatchlist = useMemo(() => {
        return userData.watchlist
            .filter(movie => movie.title.toLowerCase().includes(filterTerm.toLowerCase()))
            .filter(movie => genreFilter ? movie.genre.includes(genreFilter) : true);
    }, [userData.watchlist, filterTerm, genreFilter]);

    const filteredSeenList = useMemo(() => {
        return userData.seenList
            .filter(item => item.movie.title.toLowerCase().includes(filterTerm.toLowerCase()))
            .filter(item => genreFilter ? item.movie.genre.includes(genreFilter) : true);
    }, [userData.seenList, filterTerm, genreFilter]);

    return (
        <div className="text-white space-y-8">
            <div className="mb-8 flex flex-col sm:flex-row gap-4">
                <div className="relative w-full sm:w-2/3">
                    <input
                        type="text"
                        placeholder="Filter op titel..."
                        value={filterTerm}
                        onChange={e => setFilterTerm(e.target.value)}
                        className="w-full p-4 pr-10 bg-gray-800 border-2 border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                    {filterTerm && (
                        <button 
                            onClick={() => setFilterTerm('')} 
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
                <select 
                    value={genreFilter} 
                    onChange={e => setGenreFilter(e.target.value)} 
                    className="w-full sm:w-1/3 p-4 bg-gray-800 border-2 border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                    <option value="">Alle Genres</option>
                    {allGenresLists.map(genre => <option key={genre} value={genre}>{genre}</option>)}
                </select>
            </div>

            <div>
                <h2 onClick={() => setIsWatchlistOpen(!isWatchlistOpen)} className="cursor-pointer text-3xl font-bold mb-6 flex items-center select-none">
                    <span className={`transform transition-transform duration-200 ${isWatchlistOpen ? 'rotate-90' : ''}`}>►</span>
                    <span className="ml-2">Mijn Kijklijst ({filteredWatchlist.length})</span>
                </h2>
                {isWatchlistOpen && (
                    userData.watchlist.length > 0 ? (
                        filteredWatchlist.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {filteredWatchlist.map(movie => <MovieCard key={movie.id} movie={movie} />)}
                            </div>
                        ) : <p className="text-gray-400">Geen films gevonden die overeenkomen met het filter.</p>
                    ) : <p className="text-gray-400">Je kijklijst is leeg.</p>
                )}
            </div>

            <div>
                <h2 onClick={() => setIsSeenListOpen(!isSeenListOpen)} className="cursor-pointer text-3xl font-bold mb-6 flex items-center select-none">
                     <span className={`transform transition-transform duration-200 ${isSeenListOpen ? 'rotate-90' : ''}`}>►</span>
                    <span className="ml-2">Films die ik heb gezien ({filteredSeenList.length})</span>
                </h2>
                {isSeenListOpen && (
                     userData.seenList.length > 0 ? (
                        filteredSeenList.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {filteredSeenList.map(item => <MovieCard key={item.movie.id} movie={item.movie} />)}
                            </div>
                        ) : <p className="text-gray-400">Geen films gevonden die overeenkomen met het filter.</p>
                    ) : <p className="text-gray-400">Je hebt nog geen films als 'gezien' gemarkeerd.</p>
                )}
            </div>
        </div>
    );
};

export default ListsPage;