// FILE: src/pages/SearchPage.tsx
// Trigger voor Netlify build
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, type MediaItem } from '../context/AuthContext';
import { MovieCard } from '../components/MovieCard';

const TMDB_API_KEY = "3223e3fb3a787e27ce5ca70cccbdb3bd";
const genreMap: { [key: number]: string } = { 28: "Actie", 12: "Avontuur", 16: "Animatie", 35: "Komedie", 80: "Misdaad", 99: "Documentaire", 18: "Drama", 10751: "Familie", 14: "Fantasy", 36: "Geschiedenis", 27: "Horror", 10402: "Muziek", 9648: "Mysterie", 10749: "Romantiek", 878: "Sciencefiction", 10770: "TV Film", 53: "Thriller", 10752: "Oorlog", 37: "Western" };

// UPDATED: Haalt nu ook het jaartal op
const formatApiResults = (results: any[], media_type: 'movie' | 'tv'): MediaItem[] => {
    return results.filter(item => item && item.poster_path && item.vote_count > 20).map(item => ({
        id: item.id,
        title: item.title || item.name, 
        rating: item.vote_average.toFixed(1),
        poster: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
        genre: item.genre_ids.map((id: number) => genreMap[id]).filter(Boolean).join(', ') || 'Onbekend',
        overview: item.overview,
        media_type: media_type,
        // Films hebben 'release_date', series 'first_air_date'. We pakken het jaar.
        release_year: (item.release_date || item.first_air_date || "N/A").substring(0, 4),
    }));
};

const SearchPage: React.FC = () => {
    const { userData, mediaType } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState<MediaItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPopular = async () => {
            setIsLoading(true);
            const res = await fetch(`https://api.themoviedb.org/3/${mediaType}/popular?api_key=${TMDB_API_KEY}&language=nl-NL&page=1`);
            const data = await res.json();
            setItems(formatApiResults(data.results, mediaType));
            setIsLoading(false);
        };
        
        fetchPopular();
    }, [mediaType]);

    const handleSearch = async () => {
        if (!searchTerm.trim()) return;
        setIsLoading(true);
        const res = await fetch(`https://api.themoviedb.org/3/search/${mediaType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchTerm)}&language=nl-NL`);
        const data = await res.json();
        setItems(formatApiResults(data.results, mediaType));
        setIsLoading(false);
    };

    const itemsToShow = useMemo(() => {
        const seenIds = new Set(userData.seenList?.filter(m => m && m.movie).map(m => m.movie.id) || []);
        const watchlistIds = new Set(userData.watchlist?.filter(m => m && m.id).map(m => m.id) || []);
        const notInterestedIds = new Set(userData.notInterestedList?.filter(m => m && m.id).map(m => m.id) || []);
        return items.filter(item => item && !seenIds.has(item.id) && !watchlistIds.has(item.id) && !notInterestedIds.has(item.id));
    }, [items, userData]);

    return (
        <div>
            <div className="mb-8 flex space-x-2">
                <div className="relative w-full">
                    <input 
                        type="text" 
                        placeholder={`Zoek een ${mediaType === 'movie' ? 'film' : 'serie'}...`} 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        onKeyPress={e => e.key === 'Enter' && handleSearch()} 
                        className="w-full p-4 pr-10 bg-gray-800 border-2 border-gray-700 rounded-lg text-white"
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')} 
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
                <button onClick={handleSearch} className="bg-blue-600 text-white p-4 rounded-lg flex-shrink-0">Zoek</button>
            </div>
            {isLoading ? <p className="text-white text-center">Laden...</p> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {itemsToShow.map(item => <MovieCard key={item.id} movie={item} />)}
                </div>
            )}
        </div>
    );
};

export default SearchPage;