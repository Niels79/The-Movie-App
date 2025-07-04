// FILE: src/pages/ListsPage.tsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { MovieCard } from '../components/MovieCard';

const ListsPage: React.FC = () => {
    const { userData } = useAuth();

    return (
        <div className="text-white space-y-12">
            <div>
                <h2 className="text-3xl font-bold mb-6">Mijn Kijklijst ({userData.watchlist.length})</h2>
                {userData.watchlist.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {userData.watchlist.map(movie => <MovieCard key={movie.id} movie={movie} />)}
                    </div>
                ) : <p className="text-gray-400">Je kijklijst is leeg. Voeg films toe via de zoekpagina.</p>}
            </div>
            <div>
                <h2 className="text-3xl font-bold mb-6">Films die ik heb gezien ({userData.seenList.length})</h2>
                 {userData.seenList.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {userData.seenList.map(item => <MovieCard key={item.movie.id} movie={item.movie} />)}
                    </div>
                ) : <p className="text-gray-400">Je hebt nog geen films als 'gezien' gemarkeerd.</p>}
            </div>
        </div>
    );
};

export default ListsPage;