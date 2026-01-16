// App.jsx or App.js
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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 shadow-sm">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Newspaper className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">News Chatbot</h1>
          <p className="text-xs text-gray-500">Powered by Hybrid AI</p>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 max-w-3xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

            {msg.role === 'assistant' && (
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
            )}

            <div className={`flex flex-col max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-5 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-800'
                }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>

              {/* Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 bg-white border border-gray-200 rounded-xl p-4 w-full shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                    <p className="text-xs font-semibold text-gray-700 uppercase">
                      Sources ({msg.sources.length})
                    </p>
                  </div>
                  <div className="space-y-2">
                    {msg.sources.map((source, i) => (
                      <a
                        key={i}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-2.5 hover:bg-blue-50 rounded-lg transition-colors group border border-transparent hover:border-blue-200"
                      >
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs group-hover:bg-blue-600 group-hover:text-white">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-gray-800 group-hover:text-blue-700 line-clamp-2">
                            {source.title}
                          </h4>
                          {source.description && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                              {source.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {new URL(source.url).hostname}
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <span className="text-xs text-gray-400 mt-1.5 px-1">
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
            <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm text-gray-500">Searching news...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <footer className="bg-white border-t border-gray-200 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about any news topic..."
              className="w-full pl-5 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;