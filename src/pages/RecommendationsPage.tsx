// FILE: src/pages/RecommendationsPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, type MediaItem, type SeenMovie } from '../context/AuthContext';
import { MovieCard } from '../components/MovieCard';
import ReactSlider from 'react-slider';
// De CSS-import is hier niet meer nodig als je het via de handmatige kopieer-stap hebt gedaan.
// Als je de JS-import methode werkend hebt gekregen, laat je de volgende regel staan.
// import 'react-slider/styles.css'; 

const TMDB_API_KEY_REC = "3223e3fb3a787e27ce5ca70cccbdb3bd";

// De genre-maps blijven nuttig om genre-namen te tonen op de MovieCards
const movieGenreMap: { [key: string]: number } = { "Actie": 28, "Avontuur": 12, "Animatie": 16, "Komedie": 35, "Misdaad": 80, "Documentaire": 99, "Drama": 18, "Familie": 10751, "Fantasy": 14, "Geschiedenis": 36, "Horror": 27, "Muziek": 10402, "Mysterie": 9648, "Romantiek": 10749, "Sciencefiction": 878, "TV Film": 10770, "Thriller": 53, "Oorlog": 10752, "Western": 37 };
const tvGenreMap: { [key: string]: number } = { "Actie & Avontuur": 10759, "Animatie": 16, "Komedie": 35, "Misdaad": 80, "Documentaire": 99, "Drama": 18, "Familie": 10751, "Kids": 10762, "Mysterie": 9648, "Nieuws": 10763, "Reality": 10764, "Sci-Fi & Fantasy": 10765, "Soap": 10766, "Talk": 10767, "War & Politics": 10768, "Western": 37 };

// De formatteer-functie is licht aangepast voor meer robuustheid
const formatApiResultsRec = (results: any[], media_type: 'movie' | 'tv'): MediaItem[] => {
    // 1. Combineer beide genre-maps in één object
    const allGenres: { [key: string]: number } = { ...movieGenreMap, ...tvGenreMap };

    // 2. Draai de gecombineerde map om, zodat we kunnen opzoeken op ID (nummer)
    const reversedGenreMap: { [key: number]: string } = Object.fromEntries(
        Object.entries(allGenres).map(([name, id]) => [id, name])
    );

    // 3. Gebruik de correcte, omgedraaide map om de resultaten te formatteren
    return results.filter(item => item && item.poster_path && item.vote_count > 10).map(item => ({
        id: item.id,
        title: item.title || item.name,
        rating: item.vote_average.toFixed(1),
        poster: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
        genre: item.genre_ids.map((id: number) => reversedGenreMap[id]).filter(Boolean).join(', '),
        overview: item.overview,
        media_type: item.media_type || media_type,
        release_year: (item.release_date || item.first_air_date || "N/A").substring(0, 4),
    }));
};

const RecommendationsPage: React.FC = () => {
    const { userData, mediaType } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [foundRecs, setFoundRecs] = useState<MediaItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const currentYear = new Date().getFullYear();
    const [years, setYears] = useState([1970, currentYear]);

    // Reset de resultaten als het mediaType (films/series) verandert
    useEffect(() => {
        setFoundRecs([]);
        setError(null);
    }, [mediaType]);

    // --- DEZE FUNCTIE IS VOLLEDIG VERVANGEN DOOR DE NIEUWE LOGICA ---
    const findRecommendations = async () => {
        setIsLoading(true);
        setFoundRecs([]);
        setError(null);

        // 1. Vind de top 3 best beoordeelde items (minimaal cijfer 8)
        const topRatedItems = (userData.seenList || [])
            .filter((item): item is SeenMovie => !!item && !!item.movie && item.userRating >= 8 && item.movie.media_type === mediaType)
            .sort((a, b) => b.userRating - a.userRating)
            .slice(0, 5);
        
        if (topRatedItems.length === 0) {
            setError(`Je hebt nog geen ${mediaType === 'movie' ? 'films' : 'series'} een score van 8 of hoger gegeven. Voeg eerst wat beoordelingen toe!`);
            setIsLoading(false);
            return;
        }

        // 2. Haal aanbevelingen op voor elk top item
        const recommendationPromises = topRatedItems.map(item => {
            const url = `https://api.themoviedb.org/3/${item.movie.media_type}/${item.movie.id}/recommendations?api_key=${TMDB_API_KEY_REC}&language=en-US`;
            return fetch(url).then(res => res.json());
        });

        try {
            const results = await Promise.all(recommendationPromises);
            
            // 3. Combineer en filter de resultaten
            const allRecsRaw = results.flatMap(result => result.results || []);
            const formattedRecs = formatApiResultsRec(allRecsRaw, mediaType);
            const uniqueRecs = Array.from(new Map(formattedRecs.map(item => [item.id, item])).values());

            const excludedIds = new Set([
                ...(userData.seenList?.map(item => item.movie.id) || []),
                ...(userData.watchlist?.map(item => item.id) || []),
                ...(userData.notInterestedList?.map(item => item.id) || [])
            ]);

            // 4. Pas het jaartal-filter toe
            const finalRecs = uniqueRecs
                .filter(item => !excludedIds.has(item.id))
                .filter(item => {
                    const itemYear = parseInt(item.release_year, 10);
                    return !isNaN(itemYear) && itemYear >= years[0] && itemYear <= years[1];
                });
            
            setFoundRecs(finalRecs);

            if (finalRecs.length === 0) {
                setError("Geen nieuwe aanbevelingen gevonden die voldoen aan je criteria. Probeer een andere periode.");
            }

        } catch (err) {
            console.error("Fout bij het ophalen van aanbevelingen:", err);
            setError("Er is iets misgegaan. Controleer je internetverbinding en probeer het opnieuw.");
        } finally {
            setIsLoading(false);
        }
    };

    const recommendationsToShow = useMemo(() => {
        const notInterestedIds = new Set(userData.notInterestedList?.filter(i => i).map(i => i.id));
        return foundRecs.filter(item => !notInterestedIds.has(item.id));
    }, [foundRecs, userData.notInterestedList]);

    // --- DE JSX IS AANGEPAST OM DE GENRE-SELECTIE TE VERWIJDEREN ---
    return (
        <div className="text-white">
            <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">Jouw Aanbevelingen</h2>
                <p className="text-gray-400 max-w-2xl mx-auto mb-6">
                    Krijg aanbevelingen op basis van je top-titels en filter ze op de gewenste periode.
                </p>
            </div>
            
            <div className="my-8 p-6 bg-gray-800 rounded-lg space-y-8">
                <div>
                    <h3 className="text-xl font-semibold mb-4 text-center">1. Selecteer Periode</h3>
                    <div className="max-w-xl mx-auto px-4">
                        <div className="flex justify-between items-center text-2xl font-bold text-yellow-400 mb-2">
                           <span>{years[0]}</span>
                           <span>{years[1]}</span>
                        </div>
                        <ReactSlider
                            className="horizontal-slider"
                            thumbClassName="thumb"
                            trackClassName="track"
                            value={years}
                            onChange={setYears}
                            min={1950}
                            max={currentYear}
                            ariaLabel={['Start jaar', 'Eind jaar']}
                            pearling
                            minDistance={1}
                        />
                    </div>
                </div>
                
                <div className="text-center">
                    <h3 className="text-xl font-semibold mb-4 text-center">2. Vind Aanbevelingen</h3>
                    <button 
                        onClick={findRecommendations} 
                        disabled={isLoading} 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg disabled:bg-gray-500 transition-colors"
                    >
                        {isLoading ? 'Zoeken...' : `Vind Aanbevelingen`}
                    </button>
                </div>
            </div>

            <div className="mt-8">
                {error && !isLoading && <p className="text-center text-yellow-400 bg-yellow-900/50 p-4 rounded-lg">{error}</p>}
                
                {recommendationsToShow.length > 0 && !isLoading && (
                    <div>
                        <h3 className="text-2xl font-bold mb-4 text-white">Speciaal voor jou:</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {recommendationsToShow.map(item => <MovieCard key={item.id} movie={item} />)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecommendationsPage;