// FILE: src/pages/SearchPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, type Movie } from '../context/AuthContext';
import { MovieCard } from '../components/MovieCard';

const TMDB_API_KEY = "3223e3fb3a787e27ce5ca70cccbdb3bd";
const genreMap: { [key: number]: string } = { 28: "Actie", 12: "Avontuur", 16: "Animatie", 35: "Komedie", 80: "Misdaad", 99: "Documentaire", 18: "Drama", 10751: "Familie", 14: "Fantasy", 36: "Geschiedenis", 27: "Horror", 10402: "Muziek", 9648: "Mysterie", 10749: "Romantiek", 878: "Sciencefiction", 10770: "TV Film", 53: "Thriller", 10752: "Oorlog", 37: "Western" };

const formatApiResults = (results: any[]): Movie[] => {
    return results.filter(movie => movie.poster_path && movie.vote_count > 20).map(movie => ({
        id: movie.id, title: movie.title, rating: movie.vote_average.toFixed(1),
        poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
        genre: movie.genre_ids.map((id: number) => genreMap[id]).filter(Boolean).join(', ') || 'Onbekend',
        overview: movie.overview
    }));
};

const SearchPage: React.FC = () => {
    const { userData } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [movies, setMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPopularMovies = async () => {
            setIsLoading(true);
            const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=nl-NL&page=1`);
            const data = await res.json();
            setMovies(formatApiResults(data.results));
            setIsLoading(false);
        };
        fetchPopularMovies();
    }, []);

    const handleSearch = async () => {
        if (!searchTerm.trim()) return;
        setIsLoading(true);
        const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchTerm)}&language=nl-NL`);
        const data = await res.json();
        setMovies(formatApiResults(data.results));
        setIsLoading(false);
    };

    const moviesToShow = useMemo(() => {
        const seenIds = new Set(userData.seenList.map(m => m.movie.id));
        const watchlistIds = new Set(userData.watchlist.map(m => m.id));
        const notInterestedIds = new Set(userData.notInterestedList.map(m => m.id));
        return movies.filter(movie => !seenIds.has(movie.id) && !watchlistIds.has(movie.id) && !notInterestedIds.has(movie.id));
    }, [movies, userData]);

    return (
        <div>
            <div className="mb-8 flex space-x-2">
                <input type="text" placeholder="Zoek een film..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSearch()} className="w-full p-4 bg-gray-800 border-2 border-gray-700 rounded-lg text-white"/>
                <button onClick={handleSearch} className="bg-blue-600 text-white p-4 rounded-lg">Zoek</button>
            </div>
            {isLoading ? <p className="text-white text-center">Films laden...</p> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {moviesToShow.map(movie => <MovieCard key={movie.id} movie={movie} />)}
                </div>
            )}
        </div>
    );
};

export default SearchPage;