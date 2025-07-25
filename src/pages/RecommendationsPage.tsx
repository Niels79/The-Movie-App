import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, type MediaItem, type SeenMovie } from '../context/AuthContext';
import { MovieCard } from '../components/MovieCard';
import ReactSlider from 'react-slider';
import 'react-slider/styles.css';

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
    const [isLoading, setIsLoading] = useState(false);
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const currentYear = new Date().getFullYear();
    const [foundRecs, setFoundRecs] = useState<MediaItem[]>([]);
    const [years, setYears] = useState([1970, currentYear]);

    useEffect(() => {
        setSelectedGenres([]);
        setFoundRecs([]);
    }, [mediaType]);

    const handleGenreToggle = (genre: string) => {
        setSelectedGenres(prev =>
            prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
        );
    };

    const findRecommendations = async () => {
        setIsLoading(true);
        setFoundRecs([]);
        const startYear = years[0];
        const endYear = years[1];
        
        const DESIRED_RESULTS = 16;
        
        let potentialRecs: MediaItem[] = [];
        let currentPage = 1;
        const excludedIds = new Set([
            ...(userData.seenList?.filter((item: SeenMovie) => item && item.movie).map((item: SeenMovie) => item.movie.id) || []),
            ...(userData.watchlist?.filter((item: MediaItem) => item).map((item: MediaItem) => item.id) || []),
            ...(userData.notInterestedList?.filter((item: MediaItem) => item).map((item: MediaItem) => item.id) || [])
        ]);
        
        const genreScores: { [key: string]: number } = {};
        const highlyRatedItems = userData.seenList?.filter(item => item && item.userRating >= 7);
        highlyRatedItems?.forEach(item => {
            item.movie.genre.split(', ').forEach(genre => {
                if (genre) {
                    genreScores[genre] = (genreScores[genre] || 0) + (item.userRating - 6);
                }
            });
        });

        let effectiveGenreScores = genreScores;
        if (mediaType === 'tv') {
            const translationMap: { [movieGenre: string]: string } = {
                'Actie': 'Actie & Avontuur',
                'Avontuur': 'Actie & Avontuur',
                'Sciencefiction': 'Sci-Fi & Fantasy',
                'Fantasy': 'Sci-Fi & Fantasy',
                'Oorlog': 'War & Politics',
                'Familie': 'Kids',
            };
            const translatedScores: { [key: string]: number } = {};
            for (const genre in genreScores) {
                const score = genreScores[genre];
                const translatedGenre = translationMap[genre];
                if (translatedGenre) {
                    translatedScores[translatedGenre] = (translatedScores[translatedGenre] || 0) + score;
                } else if (tvGenreMap[genre]) {
                    translatedScores[genre] = (translatedScores[genre] || 0) + score;
                }
            }
            effectiveGenreScores = translatedScores;
        }
        
        // *** WIJZIGING START ***
        // Bepaal welke genres te gebruiken. Geef prioriteit aan de selectie op de pagina.
        // Als er niks is geselecteerd op de pagina, gebruik dan de genres uit de instellingen.
        const genresToUse = selectedGenres.length > 0 ? selectedGenres : (userData.preferences.genres || []);
        // *** WIJZIGING EIND ***

        try {
            while (potentialRecs.length < 150 && currentPage < 15) {
                const currentGenreNameMap = mediaType === 'movie' ? movieGenreMap : tvGenreMap;
                
                // Gebruik de nieuwe `genresToUse` variabele voor de API-aanroep
                const apiGenreIds = genresToUse.map(name => currentGenreNameMap[name]).filter(Boolean).join('|');

                let apiUrl = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${TMDB_API_KEY_REC}&language=en-US&sort_by=popularity.desc&vote_count.gte=100&page=${currentPage}`;
                if (apiGenreIds) { apiUrl += `&with_genres=${apiGenreIds}`; }
                
                const releaseDateGteParam = mediaType === 'movie' ? 'primary_release_date.gte' : 'first_air_date.gte';
                const releaseDateLteParam = mediaType === 'movie' ? 'primary_release_date.lte' : 'first_air_date.lte';
                apiUrl += `&${releaseDateGteParam}=${startYear}-01-01`;
                apiUrl += `&${releaseDateLteParam}=${endYear}-12-31`;

                const res = await fetch(apiUrl);
                if (!res.ok) break;
                const data = await res.json();
                const fetchedItems = formatApiResultsRec(data.results, mediaType, currentGenreNameMap);
                potentialRecs.push(...fetchedItems);
                if (data.page >= data.total_pages) break;
                currentPage++;
            }
            
            const scoredRecs = potentialRecs
                .filter(item => !excludedIds.has(item.id) && parseFloat(item.rating) >= userData.preferences.imdbScore)
                // *** WIJZIGING START ***
                // Het .every() filter is verwijderd. Het was te streng en onnodig,
                // omdat de API-aanroep met `with_genres` al garandeert dat de resultaten
                // minimaal één van de gewenste genres bevatten.
                // *** WIJZIGING EIND ***
                .map(item => {
                    let score = 0;
                    item.genre.split(', ').forEach(genre => {
                        if (effectiveGenreScores[genre]) {
                            score += effectiveGenreScores[genre];
                        }
                    });
                    score += parseFloat(item.rating) / 4;
                    return { ...item, relevanceScore: score };
                });

            const finalRecs = scoredRecs.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, DESIRED_RESULTS);
            setFoundRecs(finalRecs);

        } catch (error) {
            console.error("Fout bij het ophalen van aanbevelingen:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const recommendationsToShow = useMemo(() => {
        const notInterestedIds = new Set(userData.notInterestedList?.filter(i => i).map(i => i.id));
        return foundRecs.filter(item => !notInterestedIds.has(item.id));
    }, [foundRecs, userData.notInterestedList]);

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
                    <div className="flex flex-wrap justify-center gap-2">{availableGenres.map(genre => (<button key={genre} onClick={() => handleGenreToggle(genre)} className={`py-2 px-4 rounded-lg font-medium transition-all ${selectedGenres.includes(genre) ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'}`}>{genre}</button>))}</div>
                </div>
                <div>
                    <h3 className="text-xl font-semibold mb-4 text-center">2. Selecteer Periode</h3>
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
                
                <div className="text-center pt-4">
                    <h3 className="text-xl font-semibold mb-4 text-center">3. Vind Aanbevelingen</h3>
                    <button onClick={findRecommendations} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg disabled:bg-gray-500">{isLoading ? 'Zoeken...' : `Vind Aanbevelingen`}</button>
                </div>
            </div>
            {recommendationsToShow.length > 0 && !isLoading && (<div className="mt-8 text-left"><h3 className="text-2xl font-bold mb-4 text-white">Speciaal voor jou ({recommendationsToShow.length} resultaten):</h3><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">{recommendationsToShow.map(item => <MovieCard key={item.id} movie={item} />)}</div></div>)}
        </div>
    );
};

export default RecommendationsPage;