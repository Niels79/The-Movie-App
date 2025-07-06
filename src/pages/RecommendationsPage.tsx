// FILE: src/pages/RecommendationsPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth, type MediaItem } from '../context/AuthContext';
import { MovieCard } from '../components/MovieCard';

const TMDB_API_KEY_REC = "3223e3fb3a787e27ce5ca70cccbdb3bd";
const genreMapRec: { [key: number]: string } = { 28: "Actie", 12: "Avontuur", 16: "Animatie", 35: "Komedie", 80: "Misdaad", 99: "Documentaire", 18: "Drama", 10751: "Familie", 14: "Fantasy", 36: "Geschiedenis", 27: "Horror", 10402: "Muziek", 9648: "Mysterie", 10749: "Romantiek", 878: "Sciencefiction", 10770: "TV Film", 53: "Thriller", 10752: "Oorlog", 37: "Western" };

// UPDATED: Haalt nu ook het jaartal op
const formatApiResultsRec = (results: any[], media_type: 'movie' | 'tv'): MediaItem[] => {
    return results.filter(item => item && item.poster_path && item.vote_count > 20).map(item => ({
        id: item.id,
        title: item.title || item.name,
        rating: item.vote_average.toFixed(1),
        poster: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
        genre: item.genre_ids.map((id: number) => genreMapRec[id]).filter(Boolean).join(', ') || 'Onbekend',
        overview: item.overview,
        media_type: media_type,
        release_year: (item.release_date || item.first_air_date || "N/A").substring(0, 4),
    }));
};

const RecommendationsPage: React.FC = () => {
    const { userData, mediaType } = useAuth();
    const [recommendations, setRecommendations] = useState<MediaItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [moviePool, setMoviePool] = useState<MediaItem[]>([]);

    useEffect(() => {
        const fetchMoviePool = async () => {
            const responses = await Promise.all([
                fetch(`https://api.themoviedb.org/3/${mediaType}/popular?api_key=${TMDB_API_KEY_REC}&language=nl-NL&page=1`),
                fetch(`https://api.themoviedb.org/3/${mediaType}/top_rated?api_key=${TMDB_API_KEY_REC}&language=nl-NL&page=1`)
            ]);
            const data = await Promise.all(responses.map(res => res.json()));
            const combinedResults = [...data[0].results, ...data[1].results];
            const uniqueMovies = Array.from(new Map(formatApiResultsRec(combinedResults, mediaType).map(item => [item.id, item])).values());
            setMoviePool(uniqueMovies);
        };
        fetchMoviePool();
    }, [mediaType]);

    const findRecommendations = () => {
        setIsLoading(true);

        const seenIds = new Set(userData.seenList?.filter(m => m && m.movie).map(m => m.movie.id) || []);
        const watchlistIds = new Set(userData.watchlist?.filter(m => m && m.id).map(m => m.id) || []);
        const notInterestedIds = new Set(userData.notInterestedList?.filter(m => m && m.id).map(m => m.id) || []);
        const allExcludedIds = new Set([...seenIds, ...watchlistIds, ...notInterestedIds]);
        
        const genreScores: { [key: string]: number } = {};
        const highlyRatedMovies = userData.seenList.filter(item => {
            if (!item || !item.movie || item.userRating < 7) return false;
            // Zelfde logica als in ListsPage: oude items zijn films
            return item.movie.media_type ? item.movie.media_type === mediaType : mediaType === 'movie';
        });

        highlyRatedMovies.forEach(item => {
            item.movie.genre.split(', ').forEach(genre => {
                if (genre) { genreScores[genre] = (genreScores[genre] || 0) + 1; }
            });
        });
        userData.preferences.genres.forEach(genre => {
            genreScores[genre] = (genreScores[genre] || 0) + 2;
        });
        const sortedGenres = Object.keys(genreScores).sort((a, b) => genreScores[b] - genreScores[a]);

        const scoredRecommendations = moviePool
            .filter(item => item && parseFloat(item.rating) >= userData.preferences.imdbScore && !allExcludedIds.has(item.id))
            .map(item => {
                let score = 0;
                const itemGenres = item.genre.split(', ');
                itemGenres.forEach(genre => {
                    const genreIndex = sortedGenres.indexOf(genre);
                    if (genreIndex !== -1) { score += sortedGenres.length - genreIndex; }
                });
                score += parseFloat(item.rating) / 2;
                return { movie: item, score };
            });

        const finalRecommendations = scoredRecommendations
            .sort((a, b) => b.score - a.score)
            .slice(0, 12)
            .map(item => item.movie);

        setRecommendations(finalRecommendations);
        setIsLoading(false);
    };

    return (
        <div className="text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Jouw Aanbevelingen</h2>
            <p className="text-gray-400 mb-6">Vind {mediaType === 'movie' ? 'films' : 'series'} met een minimale score van {userData.preferences.imdbScore.toFixed(1)} die je nog niet hebt gezien.</p>
            <button onClick={findRecommendations} disabled={isLoading || moviePool.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg disabled:bg-gray-500">
                {isLoading ? 'Analyseren...' : `Vind Nieuwe ${mediaType === 'movie' ? 'Films' : 'Series'}`}
            </button>

            {recommendations.length > 0 && (
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