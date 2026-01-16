import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, ExternalLink, Newspaper, Loader2 } from 'lucide-react';

function SavedNews() {
    const [savedNews, setSavedNews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchSavedNews();
    }, [user, navigate]);

    const fetchSavedNews = async () => {
        try {
            const response = await fetch(`http://localhost:5000/saved_news/${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setSavedNews(data);
            }
        } catch (error) {
            console.error('Error fetching saved news:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`http://localhost:5000/delete_news/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setSavedNews(prev => prev.filter(item => item.id !== id));
            }
        } catch (error) {
            console.error('Error deleting news:', error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => navigate('/chat')}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <h1 className="text-xl font-semibold text-slate-900">Saved News</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-6">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    </div>
                ) : savedNews.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="bg-white p-4 rounded-full inline-block mb-4 shadow-sm border border-slate-100">
                            <Newspaper className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 mb-1">No saved news yet</h3>
                        <p className="text-slate-500">Articles you bookmark will appear here.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {savedNews.map((item) => (
                            <div key={item.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start gap-4 mb-4">
                                    <div className="flex-1">
                                        {item.question && (
                                            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                                {item.question}
                                            </h3>
                                        )}
                                        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap mb-4">
                                            {item.summary}
                                        </p>

                                        {item.sources && item.sources.length > 0 && (
                                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                                                    Sources
                                                </p>
                                                <div className="grid gap-2">
                                                    {item.sources.map((source, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={source.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 text-sm text-blue-600 hover:underline truncate"
                                                        >
                                                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                                            <span className="truncate">{source.title}</span>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-4">
                                            <Newspaper className="w-3 h-3" />
                                            <span>Saved on {new Date(item.saved_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                        title="Remove from saved"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default SavedNews;
