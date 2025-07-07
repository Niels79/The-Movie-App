// FILE: src/pages/RecommendationsPage.tsx (Definitieve Versie met Correcte Serie-Genres)
import React, { useState, useEffect } from 'react';
import { useAuth, type MediaItem } from '../context/AuthContext';
import { MovieCard } from '../components/MovieCard';

const TMDB_API_KEY_REC = "3223e3fb3a787e27ce5ca70cccbdb3bd";

// Correcte en geverifieerde Genre ID's voor Films
const movieGenreMap: { [key: string]: number } = { "Actie": 28, "Avontuur": 12, "Animatie": 16, "Komedie": 35, "Misdaad": 80, "Documentaire": 99, "Drama": 18, "Familie": 10751, "Fantasy": 14, "Geschiedenis": 36, "Horror": 27, "Muziek": 10402, "Mysterie": 9648, "Romantiek": 10749, "Sciencefiction": 878, "TV Film": 10770, "Thriller": 53, "Oorlog": 10752, "Western": 37 };

// =======================================================================
// DE AANPASSING ZIT HIER: Dit zijn nu de correcte, officiële Genre ID's voor Series.
// =======================================================================
const tvGenreMap: { [key: string]: number } = { "Actie & Avontuur": 10759, "Animatie": 16, "Komedie": 35, "Misdaad": 80, "Documentaire": 99, "Drama": 18, "Familie": 10751, "Kids": 10762, "Mysterie": 9648, "Nieuws": 10763, "Reality": 10764, "Sci-Fi & Fantasy": 10765, "Soap": 10766, "Talk": 10767, "War & Politics": 10768, "Western": 37 };

const allGenreNames = [...new Set([...Object.keys(movieGenreMap), ...Object.keys(tvGenreMap)])].sort();

// De 'format' functie is nu robuuster en afhankelijk van de meegegeven genre map.
const formatApiResultsRec = (results: any[], media_type: 'movie' | 'tv', genreMap: { [key: string]: number }): MediaItem[] => {
    const reversedGenreMap: { [key: number]: string } = Object.fromEntries(Object.entries(genreMap).map(([name, id]) => [id, name]));

    return results.filter(item => item && item.poster_path && item.vote_count > 20).map(item => ({
        id: item.id,
        title: item.title || item.name,
        rating: item.vote_average.toFixed(1),
        poster: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
        genre: item.genre_ids.map((id: number) => reversedGenreMap[id]).filter(Boolean).join(', '),
        overview: item.overview,
        media_type: media_type,
        release_year: (item.release_date || item.first_air_date || "N/A").substring(0, 4),
    }));
};

const RecommendationsPage: React.FC = () => {
    const { userData, mediaType } = useAuth();
    const [recommendations, setRecommendations] = useState<MediaItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    
    useEffect(() => {
        // Reset selectie als de gebruiker wisselt tussen film/serie
        setSelectedGenres([]);
        setRecommendations([]);
    }, [mediaType]);
    
    const handleGenreToggle = (genre: string) => {
        setSelectedGenres(prev => 
            prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
        );
    };

    const findRecommendations = async () => {
        setIsLoading(true);
        setRecommendations([]);

        const currentGenreNameMap = mediaType === 'movie' ? movieGenreMap : tvGenreMap;
        
        const genreIds = selectedGenres
            .map(name => currentGenreNameMap[name])
            .filter(Boolean)
            .join(',');
        
        let apiUrl = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${TMDB_API_KEY_REC}&language=nl-NL&sort_by=popularity.desc&vote_count.gte=100`;
        if (genreIds) {
            apiUrl += `&with_genres=${genreIds}`;
        }

        const res = await fetch(apiUrl);
        const data = await res.json();
        // Geef de juiste genre map mee voor de correcte 'vertaling'
        const fetchedItems = formatApiResultsRec(data.results, mediaType, currentGenreNameMap);
        
        const seenIds = new Set(userData.seenList?.filter(m => m && m.movie).map(m => m.movie.id) || []);
        const watchlistIds = new Set(userData.watchlist?.filter(m => m && m.id).map(m => m.id) || []);
        const notInterestedIds = new Set(userData.notInterestedList?.filter(m => m && m.id).map(m => m.id) || []);
        
        let finalRecs = fetchedItems.filter(item => {
            const isOnAnyList = seenIds.has(item.id) || watchlistIds.has(item.id) || notInterestedIds.has(item.id);
            const meetsMinScore = parseFloat(item.rating) >= userData.preferences.imdbScore;
            return !isOnAnyList && meetsMinScore;
        });
        
        finalRecs = finalRecs.sort(() => 0.5 - Math.random()).slice(0, 12);
        
        setRecommendations(finalRecs);
        setIsLoading(false);
    };

    // Bepaal welke genres getoond moeten worden als knop, gebaseerd op mediaType
    const availableGenres = mediaType === 'movie' ? Object.keys(movieGenreMap) : Object.keys(tvGenreMap);

    return (
        <div className="text-white">
            <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">Jouw Aanbevelingen</h2>
                <p className="text-gray-400 mb-6">Kies een of meerdere genres en vind je volgende favoriete {mediaType === 'movie' ? 'film' : 'serie'}.</p>
            </div>
            
            <div className="my-8">
                <h3 className="text-xl font-semibold mb-4 text-center">1. Kies Genres (optioneel)</h3>
                <div className="flex flex-wrap justify-center gap-2">
                    {availableGenres.map(genre => (
                        <button
                            key={genre}
                            onClick={() => handleGenreToggle(genre)}
                            className={`py-2 px-4 rounded-lg font-medium transition-all ${selectedGenres.includes(genre) ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                            {genre}
                        </button>
                    ))}
                </div>
            </div>

            <div className="text-center my-8">
                 <h3 className="text-xl font-semibold mb-4 text-center">2. Vind Aanbevelingen</h3>
                <button onClick={findRecommendations} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg disabled:bg-gray-500">
                    {isLoading ? 'Zoeken...' : `Vind ${mediaType === 'movie' ? 'Films' : 'Series'}`}
                </button>
            </div>

            {recommendations.length > 0 && !isLoading && (
                <div className="mt-8 text-left">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {recommendations.map(item => <MovieCard key={item.id} movie={item} />)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecommendationsPage;