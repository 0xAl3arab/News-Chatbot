import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, User, Lock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark';
    setDarkMode(isDark);
    if (isDark) {
      document.body.classList.add('dark');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/chat');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className={`max-w-md w-full rounded-2xl shadow-xl overflow-hidden border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <img src="/logo.png" alt="NewsHub" className="w-12 h-12 object-contain" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h2>
          <p className="text-slate-300 font-medium">Sign in to continue to NewsHub</p>
        </div>

        <div className={`p-8 transition-colors ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className={`p-3 border rounded-lg text-sm text-center font-medium ${darkMode ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className={`h-5 w-5 transition-colors ${darkMode ? 'text-slate-500 group-focus-within:text-slate-400' : 'text-slate-400 group-focus-within:text-slate-600'}`} />
                </div>
                <input
                  type="email"
                  required
                  className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg placeholder-slate-400 focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all shadow-sm outline-none ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 transition-colors ${darkMode ? 'text-slate-500 group-focus-within:text-slate-400' : 'text-slate-400 group-focus-within:text-slate-600'}`} />
                </div>
                <input
                  type="password"
                  required
                  className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg placeholder-slate-400 focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all shadow-sm outline-none ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          </form>

          <div className={`mt-8 pt-6 border-t text-center ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Don't have an account?{' '}
              <Link to="/signup" className={`font-bold transition-colors hover:underline cursor-pointer ${darkMode ? 'text-slate-200 hover:text-white' : 'text-slate-900 hover:text-slate-700'}`}>
                Sign up for free
              </Link>
            </p>
            <div className="mt-4">
              <Link to="/chat" className={`text-xs font-medium transition-colors cursor-pointer ${darkMode ? 'text-slate-500 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'}`}>
                Continue as Guest
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
