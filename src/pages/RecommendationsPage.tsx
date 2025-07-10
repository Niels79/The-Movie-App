// FILE: src/pages/RecommendationsPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth, type MediaItem } from '../context/AuthContext';
import { MovieCard } from '../components/MovieCard';

const TMDB_API_KEY_REC = "3223e3fb3a787e27ce5ca70cccbdb3bd";
const movieGenreMap: { [key: string]: number } = { "Actie": 28, "Avontuur": 12, "Animatie": 16, "Komedie": 35, "Misdaad": 80, "Documentaire": 99, "Drama": 18, "Familie": 10751, "Fantasy": 14, "Geschiedenis": 36, "Horror": 27, "Muziek": 10402, "Mysterie": 9648, "Romantiek": 10749, "Sciencefiction": 878, "TV Film": 10770, "Thriller": 53, "Oorlog": 10752, "Western": 37 };
const tvGenreMap: { [key: string]: number } = { "Actie & Avontuur": 10759, "Animatie": 16, "Komedie": 35, "Misdaad": 80, "Documentaire": 99, "Drama": 18, "Familie": 10751, "Kids": 10762, "Mysterie": 9648, "Nieuws": 10763, "Reality": 10764, "Sci-Fi & Fantasy": 10765, "Soap": 10766, "Talk": 10767, "War & Politics": 10768, "Western": 37 };

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
    
    // =======================================================================
    // 1. STATE AANGEPAST: minYear is nu startYear en endYear is toegevoegd.
    // =======================================================================
    const currentYear = new Date().getFullYear();
    const [startYear, setStartYear] = useState(1970);
    const [endYear, setEndYear] = useState(currentYear);


    useEffect(() => {
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

        const DESIRED_RESULTS = 8;
        let finalRecs: MediaItem[] = [];
        let currentPage = 1;

        const seenIds = new Set(userData.seenList?.filter(item => item && item.movie).map(item => item.movie.id));
        const watchlistIds = new Set(userData.watchlist?.filter(item => item).map(item => item.id));
        const notInterestedIds = new Set(userData.notInterestedList?.filter(item => item).map(item => item.id));
        const excludedIds = new Set([...seenIds, ...watchlistIds, ...notInterestedIds]);

        try {
            while (finalRecs.length < DESIRED_RESULTS && currentPage < 15) { 
                const currentGenreNameMap = mediaType === 'movie' ? movieGenreMap : tvGenreMap;
                const genreIds = selectedGenres.map(name => currentGenreNameMap[name]).filter(Boolean).join(',');
                
                let apiUrl = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${TMDB_API_KEY_REC}&language=nl-NL&sort_by=popularity.desc&vote_count.gte=100&page=${currentPage}`;

                if (genreIds) apiUrl += `&with_genres=${genreIds}`;
                
                // =======================================================================
                // 3. LOGICA AANGEPAST: Zoekt nu met een begin- én einddatum.
                // =======================================================================
                const releaseDateGteParam = mediaType === 'movie' ? 'primary_release_date.gte' : 'first_air_date.gte';
                const releaseDateLteParam = mediaType === 'movie' ? 'primary_release_date.lte' : 'first_air_date.lte';
                apiUrl += `&${releaseDateGteParam}=${startYear}-01-01`;
                apiUrl += `&${releaseDateLteParam}=${endYear}-12-31`;

                const res = await fetch(apiUrl);
                if (!res.ok) break;

                const data = await res.json();
                const fetchedItems = formatApiResultsRec(data.results, mediaType, currentGenreNameMap);

                const validItems = fetchedItems.filter(item => {
                    return !excludedIds.has(item.id) && parseFloat(item.rating) >= userData.preferences.imdbScore;
                });

                finalRecs.push(...validItems);

                if (data.page >= data.total_pages) {
                    break;
                }
                currentPage++;
            }
        } catch (error) {
            console.error("Fout bij het ophalen van aanbevelingen:", error);
        } finally {
            const shuffledRecs = finalRecs.sort(() => 0.5 - Math.random());
            setRecommendations(shuffledRecs.slice(0, DESIRED_RESULTS));
            setIsLoading(false);
        }
    };

    const availableGenres = mediaType === 'movie' ? Object.keys(movieGenreMap) : Object.keys(tvGenreMap);

    return (
        <div className="text-white">
            <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">Jouw Aanbevelingen</h2>
                <p className="text-gray-400 mb-6">Gebruik de filters om je volgende favoriete {mediaType === 'movie' ? 'film' : 'serie'} te vinden.</p>
            </div>
            
            <div className="my-8 p-6 bg-gray-800 rounded-lg space-y-6">
                <div>
                    <h3 className="text-xl font-semibold mb-4 text-center">1. Kies Genres (optioneel)</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                        {availableGenres.map(genre => (
                            <button key={genre} onClick={() => handleGenreToggle(genre)} className={`py-2 px-4 rounded-lg font-medium transition-all ${selectedGenres.includes(genre) ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'}`}>{genre}</button>
                        ))}
                    </div>
                </div>

                {/* ======================================================================= */}
                {/* 2. UI AANGEPAST: Twee sliders voor een periode.                       */}
                {/* ======================================================================= */}
                <div>
                    <h3 className="text-xl font-semibold mb-4 text-center">2. Selecteer Periode</h3>
                    {/* Startjaar Slider */}
                    <div className="flex items-center max-w-lg mx-auto mb-4">
                        <span className="w-16 text-right mr-4">Vanaf:</span>
                        <input type="range" min="1950" max={currentYear} value={startYear} onChange={e => setStartYear(parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                        <span className="ml-4 text-2xl font-bold text-yellow-400 w-24 text-center">{startYear}</span>
                    </div>
                    {/* Eindjaar Slider */}
                    <div className="flex items-center max-w-lg mx-auto">
                        <span className="w-16 text-right mr-4">Tot:</span>
                        <input type="range" min="1950" max={currentYear} value={endYear} onChange={e => setEndYear(parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                        <span className="ml-4 text-2xl font-bold text-yellow-400 w-24 text-center">{endYear}</span>
                    </div>
                </div>

                <div className="text-center pt-4">
                    <h3 className="text-xl font-semibold mb-4 text-center">3. Vind Aanbevelingen</h3>
                    <button onClick={findRecommendations} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg disabled:bg-gray-500">{isLoading ? 'Zoeken...' : `Vind Aanbevelingen`}</button>
                </div>
            </div>

            {recommendations.length > 0 && !isLoading && (
                <div className="mt-8 text-left">
                     <h3 className="text-2xl font-bold mb-4 text-white">Speciaal voor jou ({recommendations.length} resultaten):</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {recommendations.map(item => <MovieCard key={item.id} movie={item} />)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecommendationsPage;