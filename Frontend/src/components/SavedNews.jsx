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
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/chat')}
                        className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors group"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:text-slate-900 transition-colors" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-900 p-2 rounded-lg">
                            <Newspaper className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Saved News</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-slate-500" />
                    </div>
                ) : savedNews.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="bg-slate-900 p-5 rounded-2xl inline-block mb-6 shadow-lg">
                            <Newspaper className="w-12 h-12 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">No saved news yet</h3>
                        <p className="text-slate-500 text-lg">Articles you bookmark will appear here.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {savedNews.map((item) => (
                            <div key={item.id} className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-200">
                                <div className="flex justify-between items-start gap-6">
                                    <div className="flex-1">
                                        {item.question && (
                                            <div className="mb-4 pb-4 border-b border-slate-100">
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Your Question</p>
                                                <h3 className="text-xl font-bold text-slate-900 leading-snug">
                                                    {item.question}
                                                </h3>
                                            </div>
                                        )}

                                        <div className="mb-5">
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Summary</p>
                                            <p className="text-slate-700 text-base leading-relaxed whitespace-pre-wrap">
                                                {item.summary}
                                            </p>
                                        </div>

                                        {item.sources && item.sources.length > 0 && (
                                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                    Sources ({item.sources.length})
                                                </p>
                                                <div className="grid gap-2.5">
                                                    {item.sources.map((source, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={source.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-3 text-sm text-slate-700 hover:text-slate-900 font-medium hover:bg-white p-2.5 rounded-lg transition-all group"
                                                        >
                                                            <div className="flex-shrink-0 w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-700 group-hover:bg-slate-300 transition-colors">
                                                                {idx + 1}
                                                            </div>
                                                            <span className="truncate group-hover:underline">{source.title}</span>
                                                            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-5 pt-4 border-t border-slate-100">
                                            <Newspaper className="w-3.5 h-3.5" />
                                            <span className="font-medium">Saved on {new Date(item.saved_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex-shrink-0 group"
                                        title="Remove from saved"
                                    >
                                        <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
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
