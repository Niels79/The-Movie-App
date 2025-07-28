import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, type MediaItem } from '../context/AuthContext';
import { MovieCard } from '../components/MovieCard';

const TMDB_API_KEY = "3223e3fb3a787e27ce5ca70cccbdb3bd";
const genreMap: { [key: number]: string } = { 28: "Actie", 12: "Avontuur", 16: "Animatie", 35: "Komedie", 80: "Misdaad", 99: "Documentaire", 18: "Drama", 10751: "Familie", 14: "Fantasy", 36: "Geschiedenis", 27: "Horror", 10402: "Muziek", 9648: "Mysterie", 10749: "Romantiek", 878: "Sciencefiction", 10770: "TV Film", 53: "Thriller", 10752: "Oorlog", 37: "Western", 10759: "Actie & Avontuur", 10762: "Kids", 10763: "Nieuws", 10764: "Reality", 10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk", 10768: "War & Politics" };

// Deze functie blijft ongewijzigd, het formatteert film/serie data
const formatApiResults = (results: any[], media_type: 'movie' | 'tv'): MediaItem[] => {
    return results.filter(item => item && item.poster_path && item.vote_count > 10).map(item => ({
        id: item.id,
        title: item.title || item.name,
        rating: item.vote_average.toFixed(1),
        poster: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
        genre: item.genre_ids.map((id: number) => genreMap[id]).filter(Boolean).join(', ') || 'Onbekend',
        overview: item.overview,
        media_type: item.media_type || media_type, // Gebruik de item's media_type indien beschikbaar
        release_year: (item.release_date || item.first_air_date || "N/A").substring(0, 4),
    }));
};
const formatDiscoverResults = (results: any[], media_type: 'movie' | 'tv'): MediaItem[] => {
    return results.filter(item => item && item.poster_path).map(item => ({
        id: item.id,
        title: item.title || item.name,
        rating: item.vote_average.toFixed(1),
        poster: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
        genre: item.genre_ids.map((id: number) => genreMap[id]).filter(Boolean).join(', ') || 'Onbekend',
        overview: item.overview,
        media_type: item.media_type || media_type,
        release_year: (item.release_date || item.first_air_date || "N/A").substring(0, 4),
    }));
};

const SearchPage: React.FC = () => {
    const { userData, mediaType } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState<MediaItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [activeSearchTerm, setActiveSearchTerm] = useState('');
    
    // --- NIEUWE STATE: Houdt bij of we in "acteur-zoekmodus" zijn ---
    const [actorSearchId, setActorSearchId] = useState<number | null>(null);

    // Initial load and switching between movie/tv
    useEffect(() => {
        const storageKey = `searchPageState_${mediaType}`;
        const savedState = localStorage.getItem(storageKey);
        if (savedState) {
            try {
                const { savedItems, savedPage, savedHasMore, savedActiveSearchTerm, savedActorSearchId } = JSON.parse(savedState);
                setItems(savedItems || []);
                setPage(savedPage || 1);
                setHasMore(savedHasMore !== false);
                setActiveSearchTerm(savedActiveSearchTerm || '');
                setSearchTerm(savedActiveSearchTerm || '');
                setActorSearchId(savedActorSearchId || null);
            } catch (e) { fetchPopular(); }
        } else { fetchPopular(); }
    }, [mediaType]);

    // Save state to localStorage
    useEffect(() => {
        const storageKey = `searchPageState_${mediaType}`;
        const stateToSave = { savedItems: items, savedPage: page, savedHasMore: hasMore, savedActiveSearchTerm: activeSearchTerm, savedActorSearchId: actorSearchId };
        if (items.length > 0 || activeSearchTerm) {
            localStorage.setItem(storageKey, JSON.stringify(stateToSave));
        }
    }, [items, page, hasMore, activeSearchTerm, mediaType, actorSearchId]);

const fetchPopular = async () => {
    setIsLoading(true);
    const apiUrl = `https://api.themoviedb.org/3/${mediaType}/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`;
    try {
        const res = await fetch(apiUrl);
        const data = await res.json();
        
        // CORRECTIE: Gebruik hier 'data' en de originele, strengere 'formatApiResults'
        setItems(formatApiResults(data.results || [], mediaType));
        
        setPage(1);
        setHasMore(data.page < data.total_pages);
        setActorSearchId(null); // Zorg dat we niet in acteur-modus zijn
    } catch (error) { console.error("Fout bij ophalen populaire items:", error); }
    setIsLoading(false);
};

    // --- DEZE FUNCTIE IS NU DE 'INTELLIGENTE' ORCHESTRATOR ---
const handleSearch = async () => {
    if (!searchTerm.trim()) {
        fetchPopular();
        setActiveSearchTerm('');
        return;
    }

    setIsLoading(true);
    setActiveSearchTerm(searchTerm);
    setActorSearchId(null); 
    
    // Stap 1: Voer een multi-search uit
    const multiSearchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchTerm)}&language=en-US&page=1`;
    
    try {
        const multiRes = await fetch(multiSearchUrl);
        const multiData = await multiRes.json();
        const topResult = multiData.results?.[0];

        // Stap 2: Controleer of het topresultaat een persoon is
        if (topResult && topResult.media_type === 'person') {
            // Als het een acteur is, haal de films van die acteur op
            const personId = topResult.id;
            setActorSearchId(personId);
            const discoverUrl = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${TMDB_API_KEY}&with_cast=${personId}&language=en-US&page=1&sort_by=popularity.desc`;
            
            const discoverRes = await fetch(discoverUrl);
            // 'discoverData' wordt hier aangemaakt en is alleen hier binnen geldig
            const discoverData = await discoverRes.json();
            
            // Gebruik de nieuwe, soepele formatter
            setItems(formatDiscoverResults(discoverData.results || [], mediaType));
            
            setPage(1);
            setHasMore(discoverData.page < discoverData.total_pages);
        } else {
            // Als het geen acteur is, verwerk de normale film/serie resultaten
            const movieTvResults = (multiData.results || []).filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv');
            setItems(formatApiResults(movieTvResults, mediaType));
            setPage(1);
            setHasMore(multiData.page < multiData.total_pages);
        }
    } catch (error) { 
        console.error("Fout bij het zoeken:", error); 
    }
    
    setIsLoading(false);
};

    // --- DEZE FUNCTIE IS AANGEPAST OM TE WERKEN MET ACTEUR-ZOEKMODUS ---
    const handleLoadMore = async () => {
        if (isLoading || !hasMore) return;
        setIsLoading(true);
        const nextPage = page + 1;

        let apiUrl = '';
        if (actorSearchId) {
            // We zijn aan het pagineren door de films van een acteur
            apiUrl = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${TMDB_API_KEY}&with_cast=${actorSearchId}&language=en-US&page=${nextPage}&sort_by=popularity.desc`;
        } else if (activeSearchTerm.trim() !== '') {
            // We zijn aan het pagineren door een normale zoekopdracht
            apiUrl = `https://api.themoviedb.org/3/search/${mediaType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(activeSearchTerm)}&language=en-US&page=${nextPage}`;
        } else {
            // We zijn aan het pagineren door de populaire lijst
            apiUrl = `https://api.themoviedb.org/3/${mediaType}/popular?api_key=${TMDB_API_KEY}&language=en-US&page=${nextPage}`;
        }

        try {
            const res = await fetch(apiUrl);
            const data = await res.json();
            const newItems = formatApiResults(data.results || [], mediaType);
            setItems(prevItems => [...prevItems, ...newItems]);
            setPage(nextPage);
            setHasMore(data.page < data.total_pages);
        } catch (error) { console.error("Fout bij laden van meer items:", error); }
        setIsLoading(false);
    };

    const itemsToShow = useMemo(() => {
        const notInterestedIds = new Set(userData.notInterestedList?.filter(i => i).map(i => i.id));
        const seenIds = new Set(userData.seenList?.filter(i => i?.movie).map(i => i.movie.id));
        const watchlistIds = new Set(userData.watchlist?.filter(i => i).map(i => i.id));
        const excludedIds = new Set([...seenIds, ...watchlistIds, ...notInterestedIds]);

        let preferredGenres = userData.preferences?.genres || [];
        if (mediaType === 'tv' && preferredGenres.length > 0) {
            const translationMap: { [movieGenre: string]: string } = { 'Actie': 'Actie & Avontuur', 'Avontuur': 'Actie & Avontuur', 'Sciencefiction': 'Sci-Fi & Fantasy', 'Fantasy': 'Sci-Fi & Fantasy', 'Oorlog': 'War & Politics', 'Familie': 'Kids', };
            const tvPreferences = new Set<string>();
            preferredGenres.forEach(g => tvPreferences.add(translationMap[g] || g));
            preferredGenres = [...tvPreferences];
        }
        
        return items.filter(item => {
            if (!item || excludedIds.has(item.id)) return false;
            if (preferredGenres.length > 0) {
                const itemGenres = item.genre.split(', ').filter(g => g);
                if (itemGenres.length === 0) return true;
                const hasPreferredGenre = itemGenres.some(genre => preferredGenres.includes(genre));
                if (!hasPreferredGenre) return false;
            }
            return true;
        });
    }, [items, userData, mediaType]);

    return (
        <div>
            <div className="mb-8 flex space-x-2">
                <div className="relative w-full">
                    <input type="text" placeholder={`Zoek een ${mediaType === 'movie' ? 'film' : 'serie'} of acteur...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSearch()} className="w-full p-4 pr-10 bg-gray-800 border-2 border-gray-700 rounded-lg text-white" />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    )}
                </div>
                <button onClick={handleSearch} className="bg-blue-600 text-white p-4 rounded-lg flex-shrink-0">Zoek</button>
            </div>
            {itemsToShow.length === 0 && !isLoading ? (<p className="text-white text-center">Geen resultaten gevonden.</p>) : (<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">{itemsToShow.map(item => <MovieCard key={item.id} movie={item} />)}</div>)}
            <div className="text-center mt-8 pb-16">{isLoading && items.length > 0 ? (<p className="text-white">Meer resultaten laden...</p>) : (hasMore && <button onClick={handleLoadMore} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg">Laad Meer</button>)}</div>
        </div>
    );
};
export default SearchPage;