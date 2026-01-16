import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Bot, User, Loader2, Newspaper, ExternalLink, Sparkles, MessageSquare, LogOut } from 'lucide-react';

function Chatbot() {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hello! I am your AI News Assistant. Ask me about current events, technology, or any topic you\'re interested in.',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
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
        navigate('/login');
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
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, connection error. Make sure the backend is running on http://localhost:5000',
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
        <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
                        <Newspaper className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                            News Chatbot
                        </h1>
                        <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <p className="text-xs font-medium text-slate-500">Online & Ready</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-medium text-slate-600">Powered by Hybrid AI</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Messages Area */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 scroll-smooth">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex gap-4 max-w-4xl mx-auto group ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.role === 'assistant' && (
                            <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                                <Bot className="w-6 h-6 text-indigo-600" />
                            </div>
                        )}

                        <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`relative px-6 py-4 rounded-2xl shadow-sm text-[15px] leading-relaxed transition-all duration-200 ${msg.role === 'user'
                                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-sm shadow-blue-500/20'
                                : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-slate-200/50'
                                }`}>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                <span className={`text-[10px] absolute bottom-2 ${msg.role === 'user' ? 'right-3 text-blue-100/70' : 'right-3 text-slate-400'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {/* Sources Section */}
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-3 w-full animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="bg-white/50 border border-slate-200/60 rounded-xl p-4 backdrop-blur-sm">
                                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                                            <ExternalLink className="w-4 h-4 text-indigo-500" />
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                Referenced Sources
                                            </p>
                                            <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto">
                                                {msg.sources.length}
                                            </span>
                                        </div>
                                        <div className="grid gap-2 sm:grid-cols-1">
                                            {msg.sources.map((source, i) => (
                                                <a
                                                    key={i}
                                                    href={source.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-200 group/card"
                                                >
                                                    <div className="flex-shrink-0 w-6 h-6 bg-slate-50 rounded-md flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200 group-hover/card:bg-indigo-50 group-hover/card:text-indigo-600 group-hover/card:border-indigo-200 transition-colors">
                                                        {i + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-semibold text-slate-800 group-hover/card:text-indigo-600 line-clamp-1 transition-colors">
                                                            {source.title}
                                                        </h4>
                                                        {source.description && (
                                                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                                                {source.description}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-1 mt-1.5">
                                                            <img
                                                                src={`https://www.google.com/s2/favicons?domain=${new URL(source.url).hostname}&sz=16`}
                                                                alt=""
                                                                className="w-3 h-3 opacity-60"
                                                            />
                                                            <p className="text-[10px] font-medium text-slate-400">
                                                                {new URL(source.url).hostname.replace('www.', '')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover/card:text-indigo-400 flex-shrink-0 transition-colors" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {msg.role === 'user' && (
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-slate-500/20 mt-1 text-white">
                                <User className="w-5 h-5" />
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-4 max-w-4xl mx-auto justify-start animate-pulse">
                        <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Bot className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="bg-white border border-slate-200 px-6 py-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-3">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-slate-700">Analyzing sources...</span>
                                <span className="text-xs text-slate-400">This might take a moment</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
            </main>

            {/* Input Area */}
            <footer className="bg-white border-t border-slate-200 p-4 sm:p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="relative flex items-end gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all duration-300 shadow-inner">
                        <div className="p-2 text-slate-400">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask about any news topic..."
                            className="w-full bg-transparent border-none focus:ring-0 p-2 min-h-[44px] max-h-[120px] resize-none text-slate-700 placeholder:text-slate-400 text-[15px] leading-relaxed"
                            disabled={isLoading}
                            rows={1}
                            style={{ height: 'auto', minHeight: '44px' }}
                            onInput={(e) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || isLoading}
                            className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 mb-0.5"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-center text-xs text-slate-400 mt-4">
                        AI can make mistakes. Please verify important information.
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default Chatbot;
