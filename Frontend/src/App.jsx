import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Newspaper, ExternalLink } from 'lucide-react';

function App() {
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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = {
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:5000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: userMessage.content })
            });

            const data = await response.json();

            const botMessage = {
                role: 'assistant',
                content: data.response || 'I apologize, but I could not process your request.',
                timestamp: new Date(),
                sources: data.articles || []
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered a connection error. Please ensure the backend server is running.',
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 font-sans text-gray-900">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 shadow-sm z-10">
                <div className="bg-blue-600 p-2 rounded-lg">
                    <Newspaper className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">News Chatbot</h1>
                    <p className="text-xs text-gray-500 font-medium">Powered by Hybrid AI</p>
                </div>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 max-w-3xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <Bot className="w-5 h-5 text-blue-600" />
                            </div>
                        )}

                        <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`px-5 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-sm'
                                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                                }`}>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>

                            {/* Sources Section */}
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-3 bg-white border border-gray-200 rounded-xl p-3 w-full shadow-sm">
                                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Sources</p>
                                    <div className="space-y-2">
                                        {msg.sources.map((source, i) => (
                                            <a
                                                key={i}
                                                href={source.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors group"
                                            >
                                                <div className="mt-0.5 text-gray-400 group-hover:text-blue-500">
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-xs font-medium text-gray-700 truncate group-hover:text-blue-600">
                                                        {source.title}
                                                    </h4>
                                                    <p className="text-[10px] text-gray-400 truncate">
                                                        {new URL(source.url).hostname}
                                                    </p>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <span className="text-[10px] text-gray-400 mt-1 px-1">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>

                        {msg.role === 'user' && (
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <User className="w-5 h-5 text-gray-600" />
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-4 max-w-3xl mx-auto justify-start">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <Bot className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            <span className="text-sm text-gray-500">Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>

            {/* Input Area */}
            <footer className="bg-white border-t border-gray-200 p-4 sm:p-6">
                <div className="max-w-3xl mx-auto">
                    <form onSubmit={sendMessage} className="relative flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            className="w-full pl-5 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                    <p className="text-center text-xs text-gray-400 mt-3">
                        AI can make mistakes. Please verify important information.
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default App;
