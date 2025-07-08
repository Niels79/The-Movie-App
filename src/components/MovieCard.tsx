// FILE: src/components/MovieCard.tsx
import React, { useState } from 'react';
import { useAuth, type MediaItem } from '../context/AuthContext';
import { StarRating } from './StarRating';

const TMDB_API_KEY = "3223e3fb3a787e27ce5ca70cccbdb3bd";

interface Provider {
    provider_id: number;
    provider_name: string;
    logo_path: string;
}

type AvailabilityStatus = 'idle' | 'loading' | 'streaming' | 'cinema' | 'unavailable';

interface MovieCardProps {
    movie: MediaItem;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
    const { userData, updateUserData, showNotification } = useAuth();
    const [availability, setAvailability] = useState<{ status: AvailabilityStatus, data: Provider[] }>({ status: 'idle', data: [] });

    const seenItem = userData.seenList?.find(item => item && item.movie && item.movie.id === movie.id);
    const isSeen = !!seenItem;
    const isWatchlist = userData.watchlist?.some(m => m.id === movie.id);

    const fetchAvailability = async () => {
        if (availability.status !== 'idle' || isSeen) return;
        setAvailability({ status: 'loading', data: [] });

        const type = movie.media_type || 'movie';
        const providersRes = await fetch(`https://api.themoviedb.org/3/${type}/${movie.id}/watch/providers?api_key=${TMDB_API_KEY}`);
        const providersData = await providersRes.json();
        
        if (providersData.results && providersData.results.NL && providersData.results.NL.flatrate && providersData.results.NL.flatrate.length > 0) {
            setAvailability({ status: 'streaming', data: providersData.results.NL.flatrate });
            return;
        }

        if (type === 'movie') {
            const releaseDatesRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/release_dates?api_key=${TMDB_API_KEY}`);
            const releaseDatesData = await releaseDatesRes.json();
            const nlRelease = releaseDatesData.results?.find((r: any) => r.iso_3166_1 === 'NL');
            const hasTheatricalRelease = nlRelease?.release_dates.some((d: any) => d.type === 3);

            if (hasTheatricalRelease) {
                setAvailability({ status: 'cinema', data: [] });
                return;
            }
        }

        setAvailability({ status: 'unavailable', data: [] });
    };

    const onAddToSeen = () => {
        const newSeenList = [{ movie, userRating: 0 }, ...(userData.seenList || [])];
        const newWatchlist = (userData.watchlist || []).filter(m => m.id !== movie.id);
        updateUserData({ seenList: newSeenList, watchlist: newWatchlist });
        showNotification(`${movie.title} toegevoegd aan 'Gezien'`);
    };

    const onRateMovie = (rating: number) => {
        const newSeenList = (userData.seenList || []).map(item => {
            if (item && item.movie && item.movie.id === movie.id) {
                return { ...item, userRating: rating };
            }
            return item;
        }).filter(Boolean);
        updateUserData({ seenList: newSeenList });
        showNotification(`Waardering voor ${movie.title} aangepast`);
    };

    const onAddToWatchlist = () => {
        const newWatchlist = [...(userData.watchlist || []), movie];
        updateUserData({ watchlist: newWatchlist });
        showNotification(`${movie.title} toegevoegd aan kijklijst`);
    };
    const onRemoveFromSeen = () => {
        const newSeenList = (userData.seenList || []).filter(item => item?.movie?.id !== movie.id);
        updateUserData({ seenList: newSeenList });
        showNotification(`${movie.title} verwijderd`);
    };
    const onRemoveFromWatchlist = () => {
        const newWatchlist = (userData.watchlist || []).filter(m => m.id !== movie.id);
        updateUserData({ watchlist: newWatchlist });
        showNotification(`${movie.title} verwijderd van kijklijst`);
    };
    const onNotInterested = () => {
        const newNotInterestedList = [...(userData.notInterestedList || []), movie];
        updateUserData({ notInterestedList: newNotInterestedList });
        showNotification(`${movie.title} verborgen`);
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
                <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="text-lg font-bold flex-grow">{movie.title} ({movie.release_year})</h3>
                    {availability.status === 'idle' && !isSeen && (
                        <button onClick={fetchAvailability} title="Toon beschikbaarheid" className="flex-shrink-0 p-1 rounded-full hover:bg-gray-700 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                </div>

                <p className="text-yellow-400">⭐ {movie.rating}</p>
                <p className="text-gray-400 text-sm mb-2">{movie.genre}</p>
                
                {/* ======================================================================= */}
                {/* DE AANPASSING ZIT HIER: De container wordt nu alleen getoond indien nodig. */}
                {/* De 'min-h-[50px]' is behouden voor een soepele laad-ervaring.        */}
                {/* ======================================================================= */}
                {availability.status !== 'idle' && (
                    <div className="mb-4 min-h-[50px]">
                        {availability.status === 'loading' && <p className="text-xs text-gray-400">Zoeken...</p>}
                        {availability.status === 'streaming' && (
                            <div>
                                <p className="text-xs text-gray-400 mb-1">Te zien op:</p>
                                <div className="flex flex-wrap gap-2">
                                    {availability.data.map(provider => (
                                        <img key={provider.provider_id} src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`} alt={provider.provider_name} title={provider.provider_name} className="w-8 h-8 rounded-md" />
                                    ))}
                                </div>
                            </div>
                        )}
                        {availability.status === 'cinema' && (
                            <div>
                                <p className="text-xs text-gray-400 mb-1">Beschikbaarheid:</p>
                                <p className="text-sm font-semibold">Draait (of draaide recent) in de bioscoop</p>
                            </div>
                        )}
                        {availability.status === 'unavailable' && (
                            <div>
                                <p className="text-xs text-gray-400 mb-1">Beschikbaarheid:</p>
                                <p className="text-sm font-semibold">Momenteel nergens te zien</p>
                            </div>
                        )}
                    </div>
                )}
                
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