import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Images, ArrowLeft, Trash2, AlertCircle, Search, X } from 'lucide-react';
import axios from 'axios';
import api from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Pagination from '../components/Common/Pagination';
import { useAuth } from '../hooks/useAuth';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Album {
    name: string;
    photoCount: number;
    previewUrl: string;
    lastModified: string;
}

interface Photo {
    blobName: string;
    fileName: string;
    url: string;
    lastModified: string;
}

interface PhotosResponse {
    photos: Photo[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

const GalleryPage = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const isAdmin = user?.userRole === 'SuperAdmin' || user?.userRole === 'SchoolAdmin';

    // View state: 'albums' or 'photos'
    const [view, setView] = useState<'albums' | 'photos'>('albums');
    const [selectedAlbum, setSelectedAlbum] = useState('');

    // Albums
    const [albums, setAlbums] = useState<Album[]>([]);
    const [filteredAlbums, setFilteredAlbums] = useState<Album[]>([]);
    const [albumSearch, setAlbumSearch] = useState('');

    // Photos
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [totalPhotos, setTotalPhotos] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 24;

    // UI state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lightbox, setLightbox] = useState<Photo | null>(null);
    const [deletingBlob, setDeletingBlob] = useState<string | null>(null);

    // ── Load albums on mount ───────────────────────────────────────────────────

    useEffect(() => { loadAlbums(); }, []);

    useEffect(() => {
        if (albumSearch) {
            const s = albumSearch.toLowerCase();
            setFilteredAlbums(albums.filter(a => a.name.toLowerCase().includes(s)));
        } else {
            setFilteredAlbums(albums);
        }
    }, [albums, albumSearch]);

    const loadAlbums = async () => {
        try {
            setLoading(true); setError(null);
            const res = await api.get('/gallery/albums');
            setAlbums(res.data.data ?? []);
        } catch (err) {
            if (axios.isAxiosError(err)) setError(err.response?.data?.message ?? t('common.error'));
            else setError(t('common.error'));
        } finally { setLoading(false); }
    };

    // ── Load photos when album selected ───────────────────────────────────────

    useEffect(() => {
        if (view === 'photos' && selectedAlbum) loadPhotos(currentPage);
    }, [view, selectedAlbum, currentPage]);

    const loadPhotos = async (page: number) => {
        try {
            setLoading(true); setError(null);
            const res = await api.get('/gallery/photos', {
                params: { album: selectedAlbum, page, pageSize }
            });
            const data: PhotosResponse = res.data.data;
            setPhotos(data.photos ?? []);
            setTotalPhotos(data.total ?? 0);
            setTotalPages(data.totalPages ?? 0);
        } catch (err) {
            if (axios.isAxiosError(err)) setError(err.response?.data?.message ?? t('common.error'));
            else setError(t('common.error'));
        } finally { setLoading(false); }
    };

    // ── Navigation ────────────────────────────────────────────────────────────

    const openAlbum = (albumName: string) => {
        setSelectedAlbum(albumName);
        setCurrentPage(1);
        setView('photos');
    };

    const backToAlbums = () => {
        setView('albums');
        setSelectedAlbum('');
        setCurrentPage(1);
        setPhotos([]);
    };

    // ── Delete ────────────────────────────────────────────────────────────────

    const handleDelete = async (blobName: string) => {
        try {
            await api.delete('/gallery', { params: { blobName } });
            setDeletingBlob(null);
            // Remove from current photos list
            setPhotos(prev => prev.filter(p => p.blobName !== blobName));
            setTotalPhotos(prev => prev - 1);
            // Close lightbox if this photo was open
            if (lightbox?.blobName === blobName) setLightbox(null);
        } catch (err) {
            if (axios.isAxiosError(err)) setError(err.response?.data?.message ?? t('common.error'));
            else setError(t('common.error'));
            setDeletingBlob(null);
        }
    };

    // ── Keyboard for lightbox ─────────────────────────────────────────────────

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(null); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    if (loading && view === 'albums' && albums.length === 0) return <LoadingSpinner />;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                    <Images className="w-6 h-6 text-pink-600" />
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {view === 'albums' ? t('gallery.title') : selectedAlbum}
                    </h1>
                    <p className="text-sm text-gray-500">
                        {view === 'albums'
                            ? t('gallery.subtitle', { count: albums.length })
                            : t('gallery.photoCount', { count: totalPhotos })}
                    </p>
                </div>
                {view === 'photos' && (
                    <button
                        onClick={backToAlbums}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> {t('gallery.backToAlbums')}
                    </button>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" /><span>{error}</span>
                </div>
            )}

            {/* ── Albums view ── */}
            {view === 'albums' && (
                <>
                    {/* Search */}
                    <div className="relative mb-5 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t('gallery.searchAlbums')}
                            value={albumSearch}
                            onChange={e => setAlbumSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                    </div>

                    {filteredAlbums.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">{t('gallery.noAlbums')}</div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filteredAlbums.map(album => (
                                <button
                                    key={album.name}
                                    onClick={() => openAlbum(album.name)}
                                    className="group text-left bg-white rounded-xl shadow hover:shadow-md transition-shadow overflow-hidden"
                                >
                                    <div className="aspect-square overflow-hidden bg-gray-100">
                                        {album.previewUrl ? (
                                            <img
                                                src={album.previewUrl}
                                                alt={album.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Images className="w-10 h-10 text-gray-300" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-2">
                                        <p className="text-xs font-medium text-gray-800 truncate">{album.name}</p>
                                        <p className="text-xs text-gray-400">
                                            {t('gallery.photos', { count: album.photoCount })}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ── Photos view ── */}
            {view === 'photos' && (
                <>
                    {loading ? <LoadingSpinner /> : (
                        <>
                            {photos.length === 0 ? (
                                <div className="text-center py-16 text-gray-400">{t('gallery.noPhotos')}</div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {photos.map(photo => (
                                        <div key={photo.blobName} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                            <img
                                                src={photo.url}
                                                alt={photo.fileName}
                                                className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                                onClick={() => setLightbox(photo)}
                                            />
                                            {isAdmin && (
                                                <button
                                                    onClick={() => setDeletingBlob(photo.blobName)}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title={t('common.delete')}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {totalPages > 1 && (
                                <div className="mt-6">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        totalItems={totalPhotos}
                                        itemsPerPage={pageSize}
                                        onPageChange={setCurrentPage}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {/* ── Lightbox ── */}
            {lightbox && (
                <div
                    className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
                    onClick={() => setLightbox(null)}
                >
                    <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-white text-sm opacity-70 truncate">{lightbox.fileName}</p>
                            <div className="flex items-center gap-2">
                                {isAdmin && (
                                    <button
                                        onClick={() => setDeletingBlob(lightbox.blobName)}
                                        className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                    >
                                        <Trash2 className="w-3 h-3 inline mr-1" />{t('common.delete')}
                                    </button>
                                )}
                                <button onClick={() => setLightbox(null)} className="text-white hover:text-gray-300">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <img
                            src={lightbox.url}
                            alt={lightbox.fileName}
                            className="w-full rounded-lg max-h-[85vh] object-contain"
                        />
                    </div>
                </div>
            )}

            {/* ── Delete confirm ── */}
            {deletingBlob && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('gallery.confirmDelete')}</h3>
                        <p className="text-sm text-gray-500 mb-6">{t('gallery.confirmDeleteMsg')}</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeletingBlob(null)}
                                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100">
                                {t('common.cancel')}
                            </button>
                            <button onClick={() => handleDelete(deletingBlob)}
                                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700">
                                {t('common.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GalleryPage;