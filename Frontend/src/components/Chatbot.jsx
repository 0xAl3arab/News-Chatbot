import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Bot, User, Loader2, Newspaper, ExternalLink, LogOut, Bookmark, Check } from 'lucide-react';

// Input Component defined OUTSIDE to prevent re-renders and focus loss
const ChatInput = ({ input, setInput, handleKeyPress, sendMessage, isLoading, centered = false }) => (
    <div className={`relative flex items-end gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50 focus-within:border-slate-300 focus-within:shadow-xl focus-within:shadow-slate-200/60 transition-all duration-300 ${centered ? 'w-full max-w-2xl' : 'w-full'}`}>
        <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Message News Chatbot..."
            className="w-full bg-transparent border-none focus:ring-0 p-3 min-h-[44px] max-h-[120px] resize-none text-slate-800 placeholder:text-slate-400 text-[15px] leading-relaxed"
            disabled={isLoading}
            rows={1}
            style={{ height: 'auto', minHeight: '44px' }}
            onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
            }}
            autoFocus={centered}
        />
        <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mb-1"
        >
            <Send className="w-4 h-4" />
        </button>
    </div>
);

function Chatbot() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [showToast, setShowToast] = useState(false);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    const handleReset = () => {
        setMessages([]);
        setInput('');
        setIsLoading(false);
    };

    const handleSave = async (msg) => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/save_news', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user.id,
                    question: msg.question,
                    summary: msg.content,
                    sources: msg.sources
                })
            });

            if (response.ok) {
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            }
        } catch (error) {
            console.error('Error saving news:', error);
        }
    };

    const parseResponseAndSources = (responseText) => {
        const sourcesIndex = responseText.indexOf('📚 **Sources:**');

        if (sourcesIndex === -1) {
            return { content: responseText };
        }

        const content = responseText.substring(0, sourcesIndex).trim();

        return { content };
    };

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = {
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:5000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: currentInput })
            });

            const data = await response.json();

            const { content } = parseResponseAndSources(
                data.response || 'I apologize, but I could not process your request.'
            );

            const botMessage = {
                role: 'assistant',
                content: content,
                sources: data.articles || [],
                timestamp: new Date(),
                question: currentInput
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Connection error. Please ensure the backend is running.',
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white font-sans text-slate-900">
            {/* Toast Notification */}
            {showToast && (
                <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
                        <div className="bg-white/20 p-1 rounded-full">
                            <Check className="w-4 h-4" />
                        </div>
                        <span className="font-medium">News saved successfully!</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={handleReset}
                    title="Start New Chat"
                >
                    <div className="bg-slate-900 p-2 rounded-lg">
                        <Newspaper className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
                        News Chatbot
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-700 hidden sm:block">
                                {user.username}
                            </span>
                            <button
                                onClick={() => navigate('/saved')}
                                className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                                title="Saved News"
                            >
                                <Bookmark className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/login')}
                                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                Log In
                            </button>
                            <button
                                onClick={() => navigate('/signup')}
                                className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
                            >
                                Sign Up
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto scroll-smooth bg-slate-50/50 relative">
                {messages.length === 0 ? (
                    // Empty State (Centered Input)
                    <div className="flex flex-col items-center justify-center h-full px-4">
                        <div className="bg-slate-900 p-4 rounded-2xl mb-6 shadow-xl shadow-slate-900/10">
                            <Newspaper className="w-12 h-12 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                            How can I help you today?
                        </h2>
                        <p className="text-slate-500 mb-8 text-center max-w-md">
                            Ask me about the latest news, technology trends, or global events.
                        </p>
                        <ChatInput
                            input={input}
                            setInput={setInput}
                            handleKeyPress={handleKeyPress}
                            sendMessage={sendMessage}
                            isLoading={isLoading}
                            centered={true}
                        />
                    </div>
                ) : (
                    // Chat State
                    <div className="p-4 sm:p-8 space-y-6 pb-32">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex gap-4 max-w-3xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <Bot className="w-5 h-5 text-slate-600" />
                                    </div>
                                )}

                                <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${msg.role === 'user'
                                        ? 'bg-slate-900 text-white rounded-tr-sm'
                                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                                        }`}>
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                        {msg.role === 'assistant' && (
                                            <div className="mt-2 flex justify-end border-t border-slate-100 pt-2">
                                                <button
                                                    onClick={() => handleSave(msg)}
                                                    className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                                                >
                                                    <Bookmark className="w-3.5 h-3.5" />
                                                    Save Response
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Sources Section */}
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-2 w-full max-w-md">
                                            <div className="bg-white border border-slate-200 rounded-lg p-3">
                                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                                                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                                        Sources
                                                    </p>
                                                </div>
                                                <div className="grid gap-2">
                                                    {msg.sources.map((source, i) => (
                                                        <a
                                                            key={i}
                                                            href={source.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-md transition-colors group"
                                                        >
                                                            <div className="flex-shrink-0 w-5 h-5 bg-slate-100 rounded flex items-center justify-center text-[10px] font-medium text-slate-500 group-hover:bg-slate-200">
                                                                {i + 1}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-sm font-medium text-slate-700 group-hover:text-slate-900 line-clamp-1">
                                                                    {source.title}
                                                                </h4>
                                                                <div className="flex items-center gap-1 mt-0.5">
                                                                    <img
                                                                        src={`https://www.google.com/s2/favicons?domain=${new URL(source.url).hostname}&sz=16`}
                                                                        alt=""
                                                                        className="w-3 h-3 opacity-50"
                                                                    />
                                                                    <p className="text-[10px] text-slate-400">
                                                                        {new URL(source.url).hostname.replace('www.', '')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                        ))}


                        {isLoading && (
                            <div className="flex gap-4 max-w-3xl mx-auto justify-start">
                                <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-5 h-5 text-slate-600" />
                                </div>
                                <div className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm">
                                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                                    <span className="text-sm text-slate-500">Thinking...</span>
                                </div>
                            </div>

                        )}
                        <div ref={messagesEndRef} className="h-4" />
                    </div>
                )}
            </main>

            {/* Footer Input (Only visible when chat has started) */}
            {messages.length > 0 && (
                <footer className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-white/80 backdrop-blur-sm border-t border-slate-200/50">
                    <div className="max-w-3xl mx-auto">
                        <ChatInput
                            input={input}
                            setInput={setInput}
                            handleKeyPress={handleKeyPress}
                            sendMessage={sendMessage}
                            isLoading={isLoading}
                        />
                        <p className="text-center text-[11px] text-slate-400 mt-3 font-medium">
                            AI generated content. Verify important information.
                        </p>
                    </div>
                </footer>
            )}
        </div>
    );
}

export default Chatbot;
