import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, ExternalLink, Loader2 } from 'lucide-react';

function SavedNews() {
    const [savedNews, setSavedNews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchSavedNews();

        const savedTheme = localStorage.getItem('theme');
        const isDark = savedTheme === 'dark';
        setDarkMode(isDark);
        if (isDark) {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
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
        <div className={`min-h-screen transition-colors ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
            <header className={`border-b sticky top-0 z-10 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/chat')}
                        className={`p-2.5 rounded-xl transition-colors group cursor-pointer ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                    >
                        <ArrowLeft className={`w-5 h-5 transition-colors ${darkMode ? 'text-slate-400 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900'}`} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md">
                            <img src="/logo.png" alt="NewsHub" className="w-7 h-7 object-contain" />
                        </div>
                        <h1 className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Saved News</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className={`w-10 h-10 animate-spin ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                    </div>
                ) : savedNews.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-white p-5 rounded-2xl inline-block mb-6 shadow-lg">
                            <img src="/logo.png" alt="NewsHub" className="w-full h-full object-contain" />
                        </div>
                        <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>No saved news yet</h3>
                        <p className={`text-lg ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Articles you bookmark will appear here.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {savedNews.map((item) => (
                            <div key={item.id} className={`p-7 rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-200 ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                <div className="flex justify-between items-start gap-6">
                                    <div className="flex-1">
                                        {item.question && (
                                            <div className={`mb-4 pb-4 border-b ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                                                <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Your Question</p>
                                                <h3 className={`text-xl font-bold leading-snug ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                                    {item.question}
                                                </h3>
                                            </div>
                                        )}

                                        <div className="mb-5">
                                            <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Summary</p>
                                            <p className={`text-base leading-relaxed whitespace-pre-wrap ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                                {item.summary}
                                            </p>
                                        </div>

                                        {item.sources && item.sources.length > 0 && (
                                            <div className={`rounded-xl p-4 border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                                <p className={`text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
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
                                                            className={`flex items-center gap-3 text-sm font-medium p-2.5 rounded-lg transition-all group cursor-pointer ${darkMode ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-700 hover:text-slate-900 hover:bg-white'}`}
                                                        >
                                                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${darkMode ? 'bg-slate-800 text-slate-400 group-hover:bg-slate-700' : 'bg-slate-200 text-slate-700 group-hover:bg-slate-300'}`}>
                                                                {idx + 1}
                                                            </div>
                                                            <span className="truncate group-hover:underline">{source.title}</span>
                                                            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className={`flex items-center gap-2 text-xs mt-5 pt-4 border-t ${darkMode ? 'text-slate-500 border-slate-700' : 'text-slate-400 border-slate-100'}`}>
                                            <img src="/logo.png" alt="NewsHub" className="w-3.5 h-3.5" />
                                            <span className="font-medium">Saved on {new Date(item.saved_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className={`p-3 rounded-xl transition-all flex-shrink-0 group cursor-pointer ${darkMode ? 'text-slate-500 hover:text-red-400 hover:bg-red-900/20' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
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
