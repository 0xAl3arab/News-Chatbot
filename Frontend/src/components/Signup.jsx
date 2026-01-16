import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, User, Mail, Lock, Newspaper } from 'lucide-react';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/login');
      } else {
        setError(data.message || data.error || 'Signup failed');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
          <div className="mx-auto w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm shadow-inner">
            <Newspaper className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Create Account</h2>
          <p className="text-blue-100 font-medium">Join News Chatbot today</p>
        </div>

        <div className="p-8 bg-white">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center font-medium">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <UserPlus className="w-4 h-4" />
              Create Account
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors hover:underline">
                Sign in
              </Link>
            </p>
            <div className="mt-4">
              <Link to="/chat" className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors">
                Continue as Guest
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
