// FILE: src/pages/RecommendationsPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth, type Movie } from '../context/AuthContext';
import { MovieCard } from '../components/MovieCard';

const TMDB_API_KEY_REC = "3223e3fb3a787e27ce5ca70cccbdb3bd";
const genreMapRec: { [key: number]: string } = { 28: "Actie", 12: "Avontuur", 16: "Animatie", 35: "Komedie", 80: "Misdaad", 99: "Documentaire", 18: "Drama", 10751: "Familie", 14: "Fantasy", 36: "Geschiedenis", 27: "Horror", 10402: "Muziek", 9648: "Mysterie", 10749: "Romantiek", 878: "Sciencefiction", 10770: "TV Film", 53: "Thriller", 10752: "Oorlog", 37: "Western" };

const formatApiResultsRec = (results: any[]): Movie[] => {
    return results.filter(movie => movie && movie.poster_path && movie.vote_count > 20).map(movie => ({
        id: movie.id, title: movie.title, rating: movie.vote_average.toFixed(1),
        poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
        genre: movie.genre_ids.map((id: number) => genreMapRec[id]).filter(Boolean).join(', ') || 'Onbekend',
        overview: movie.overview
    }));
};

const RecommendationsPage: React.FC = () => {
    const { userData } = useAuth();
    const [recommendations, setRecommendations] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [moviePool, setMoviePool] = useState<Movie[]>([]);

    useEffect(() => {
        const fetchMoviePool = async () => {
            const responses = await Promise.all([
                fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY_REC}&language=nl-NL&page=1`),
                fetch(`https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_API_KEY_REC}&language=nl-NL&page=1`)
            ]);
            const data = await Promise.all(responses.map(res => res.json()));
            const combinedResults = [...data[0].results, ...data[1].results];
            const uniqueMovies = Array.from(new Map(formatApiResultsRec(combinedResults).map(movie => [movie.id, movie])).values());
            setMoviePool(uniqueMovies);
        };
        fetchMoviePool();
    }, []);

    const findRecommendations = () => {
        setIsLoading(true);
        
        // CORRECTED: Added checks to ensure items are valid before accessing properties.
        const seenIds = new Set(userData.seenList?.filter(m => m && m.movie).map(m => m.movie.id) || []);
        const watchlistIds = new Set(userData.watchlist?.filter(m => m && m.id).map(m => m.id) || []);
        const notInterestedIds = new Set(userData.notInterestedList?.filter(m => m && m.id).map(m => m.id) || []);

        const filteredRecs = moviePool.filter(movie => 
            movie && parseFloat(movie.rating) >= userData.preferences.imdbScore &&
            !seenIds.has(movie.id) &&
            !watchlistIds.has(movie.id) &&
            !notInterestedIds.has(movie.id)
        );

        const shuffled = filteredRecs.sort(() => 0.5 - Math.random());
        setRecommendations(shuffled.slice(0, 12));
        
        setIsLoading(false);
    };

    return (
        <div className="text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Jouw Aanbevelingen</h2>
            <p className="text-gray-400 mb-6">Vind films met een minimale score van {userData.preferences.imdbScore.toFixed(1)} die je nog niet hebt gezien.</p>
            <button onClick={findRecommendations} disabled={isLoading || moviePool.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg disabled:bg-gray-500">
                {isLoading ? 'Analyseren...' : 'Vind Nieuwe Films'}
            </button>

            {recommendations.length > 0 && (
                <div className="mt-8 text-left">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {recommendations.map(movie => <MovieCard key={movie.id} movie={movie} />)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecommendationsPage;