// FILE: src/components/MovieCard.tsx

import React from 'react';
import { useAuth, type Movie } from '../context/AuthContext';
import { StarRating } from './StarRating';

interface MovieCardProps {
    movie: Movie;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
    const { userData, updateUserData, showNotification } = useAuth();
    
    // CORRECTED: Added extra checks to ensure items are valid before accessing properties.
    const seenItem = userData.seenList?.find(item => 
        item && item.movie && item.movie.id === movie.id
    );
    const isSeen = !!seenItem;
    const isWatchlist = userData.watchlist?.some(m => 
        m && m.id === movie.id
    );
    
    const onAddToSeen = () => {
        const newSeenList = [...userData.seenList, { movie, userRating: 0 }];
        const newWatchlist = userData.watchlist.filter(m => m.id !== movie.id);
        updateUserData({ seenList: newSeenList, watchlist: newWatchlist });
        showNotification(`${movie.title} toegevoegd aan 'Gezien'`);
    };

    const onAddToWatchlist = () => {
        const newWatchlist = [...userData.watchlist, movie];
        updateUserData({ watchlist: newWatchlist });
        showNotification(`${movie.title} toegevoegd aan kijklijst`);
    };

    const onRemoveFromSeen = () => {
        const newSeenList = userData.seenList.filter(item => item.movie.id !== movie.id);
        updateUserData({ seenList: newSeenList });
        showNotification(`${movie.title} verwijderd`);
    };

    const onRemoveFromWatchlist = () => {
        const newWatchlist = userData.watchlist.filter(m => m.id !== movie.id);
        updateUserData({ watchlist: newWatchlist });
        showNotification(`${movie.title} verwijderd van kijklijst`);
    };
    
    const onNotInterested = () => {
        const newNotInterestedList = [...userData.notInterestedList, movie];
        updateUserData({ notInterestedList: newNotInterestedList });
        showNotification(`${movie.title} verborgen`);
    }

    const onRateMovie = (rating: number) => {
        const newSeenList = userData.seenList.map(item => 
            item.movie.id === movie.id ? { ...item, userRating: rating } : item
        );
        updateUserData({ seenList: newSeenList });
        showNotification(`Waardering voor ${movie.title} aangepast`);
    };

    return (
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg flex flex-col text-white">
             <div className="relative group">
                <img src={movie.poster} alt={`Poster van ${movie.title}`} className="w-full h-64 object-cover" />
                <div className="absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-80 text-white p-4 overflow-y-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <p>{movie.overview}</p>
                </div>
                 {!isSeen && (
                     <button onClick={onNotInterested} className="absolute top-2 right-2 z-10 bg-black bg-opacity-40 text-white rounded-full w-7 h-7 hover:bg-opacity-75">&times;</button>
                 )}
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-bold">{movie.title}</h3>
                <p className="text-yellow-400">⭐ {movie.rating}</p>
                <p className="text-gray-400 text-sm mb-4">{movie.genre}</p>
                
                {isSeen && seenItem && (
                    <div className="my-2">
                        <p className="text-sm text-center text-gray-300 mb-1">Jouw cijfer:</p>
                        <StarRating rating={seenItem.userRating} onRate={onRateMovie} />
                    </div>
                )}

                <div className="mt-auto pt-4 border-t border-gray-700">
                    {isSeen ? (
                        <button onClick={onRemoveFromSeen} className="w-full bg-red-600 text-white py-2 rounded-lg">Verwijder</button>
                    ) : (
                        <div className="space-y-2">
                             <button onClick={onAddToSeen} className="w-full bg-green-600 text-white py-2 rounded-lg">Gezien</button>
                             {isWatchlist ? 
                                <button onClick={onRemoveFromWatchlist} className="w-full bg-orange-600 text-white py-2 rounded-lg">Verwijder van Kijklijst</button> :
                                <button onClick={onAddToWatchlist} className="w-full bg-blue-600 text-white py-2 rounded-lg">Kijklijst</button>
                             }
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MovieCard;
