

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuthStore } from '../store/authStore';
import ParticlesBackground from '../components/ParticlesBackground';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // -----------------------------
  // BACKEND URL (No frontend .env needed)
  // -----------------------------
  const API_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:10000" // Local backend
      : "https://ai-suite-9bvf.onrender.com"; // Production backend

  // -----------------------------
  // SOCIAL LOGIN POPUP HANDLER
  // -----------------------------
  const handleSocialLogin = (provider) => {
    const popup = window.open(
      `${API_URL}/auth/${provider}`,
      "authPopup",
      "width=500,height=600,left=200,top=100"
    );

    const listener = (event) => {
      if (event.data?.type === "SOCIAL_LOGIN_SUCCESS") {
        const { token, role, user } = event.data;

        localStorage.setItem("token", token);
        localStorage.setItem("role", role);
        localStorage.setItem("user", JSON.stringify(user));

        // Update auth store so UI reacts immediately
        try {
          const loginFn = useAuthStore.getState().login;
          if (typeof loginFn === 'function') loginFn({ token, user, role });
        } catch (e) {}

        window.removeEventListener("message", listener);

        if (role === "admin") navigate("/admin");
        else if (role === "teamAdmin") navigate("/team");
        else navigate("/dashboard");
      }
    };

    window.addEventListener("message", listener);
  };

  // -----------------------------
  // NORMAL EMAIL/PASSWORD LOGIN
  // -----------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await API.post('/auth/login', { email, password });
      const { token, role, user } = res.data;

      // Persist in localStorage (existing behavior)
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('user', JSON.stringify(user));

      // Update global auth store so components (AdminSidebar) react immediately
      try {
        const loginFn = useAuthStore.getState().login;
        if (typeof loginFn === 'function') {
          loginFn({ token, user, role });
        }
      } catch (e) {
        // ignore
      }

      if (role === 'admin') navigate('/admin');
      else if (role === 'teamAdmin') navigate('/team');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden px-4">
      <ParticlesBackground />

      <div className="relative z-10 w-full max-w-md p-10 rounded-3xl bg-black/20 backdrop-blur-md 
                      border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)] 
                      hover:shadow-[0_0_30px_rgba(59,130,246,0.8)] animate-float transition duration-500">

        <h1 className="text-3xl font-bold text-white text-center mb-6">Welcome Back!</h1>
        <p className="text-center text-white/70 mb-6">Enter your credentials to access your account.</p>

        {/* LOGIN FORM */}
        <form className="flex flex-col gap-4" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email Address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 
                       focus:ring-2 focus:ring-blue-500 transition duration-300"
          />

          <div>
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 
                         focus:ring-2 focus:ring-blue-500 transition duration-300"
            />

            <div className="text-right mt-2">
              <Link 
                to="/forgot-password" 
                className="text-xs text-blue-400 hover:text-blue-300 transition"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl 
                       transform hover:-translate-y-1 transition-transform duration-300"
          >
            {loading ? 'Please wait...' : 'Login'}
          </button>
        </form>

        {/* ERROR */}
        {error && (
          <p className="text-red-500 text-center mt-4 font-medium animate-pulse">{error}</p>
        )}

        {/* SOCIAL LOGIN */}
        <div className="flex flex-col gap-3 mt-6">

          {/* GOOGLE BUTTON */}
          <button
            onClick={() => handleSocialLogin("google")}
            className="w-full py-2 bg-white text-black font-semibold rounded-xl flex items-center 
                       justify-center gap-3 hover:bg-gray-200 transition"
          >
            {/* Google SVG */}
            <svg width="22" height="22" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.4 1.2 8.8 3.4l6.6-6.6C35.8 2.2 30.5 0 24 0 14.6 0 6.6 5.4 2.6 13.2l7.7 6c1.8-5.5 7-9.7 13.7-9.7z"/>
              <path fill="#34A853" d="M46.1 24.5c0-1.6-.1-2.8-.4-4.2H24v8.1h12.7c-.5 3.1-2 5.7-4.3 7.5l6.6 5.1c4-3.7 7.1-9.2 7.1-16.5z"/>
              <path fill="#4A90E2" d="M10.3 28.7C9.4 26.7 9 24.4 9 22s.4-4.7 1.3-6.7l-7.7-6C.7 13.2 0 17.4 0 22c0 4.6.7 8.8 2.6 12.8l7.7-6.1z"/>
              <path fill="#FBBC05" d="M24 44c6.5 0 11.8-2.1 15.7-5.8L33 33.1c-2.2 1.7-5 2.8-8 2.8-6.7 0-11.9-4.3-13.7-9.7l-7.7 6c4 7.8 12 13.2 20.4 13.2z"/>
            </svg>

            Continue with Google
          </button>

          {/* GITHUB BUTTON */}
          <button
            onClick={() => handleSocialLogin("github")}
            className="w-full py-2 bg-gray-900 text-white font-semibold rounded-xl flex items-center 
                       justify-center gap-3 hover:bg-gray-800 transition"
          >
            {/* GitHub SVG */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M12 0.297c-6.63 0-12 5.373-12 12 
                0 5.303 3.438 9.8 8.205 11.385 
                0.6 0.113 0.82-0.258 0.82-0.577 
                0-0.285-0.01-1.04-0.015-2.04 
                -3.338 0.724-4.042-1.61-4.042-1.61 
                -0.546-1.387-1.333-1.757-1.333-1.757 
                -1.089-0.745 0.084-0.73 0.084-0.73 
                1.205 0.084 1.84 1.236 1.84 1.236 
                1.07 1.835 2.807 1.305 3.492 0.998 
                0.108-0.776 0.417-1.305 0.76-1.605 
                -2.665-0.3-5.466-1.332-5.466-5.93 
                0-1.31 0.469-2.38 1.235-3.22 
                -0.135-0.303-0.54-1.523 0.105-3.176 
                0 0 1.005-0.322 3.3 1.23 
                0.96-0.267 1.98-0.399 3-0.405 
                1.02 0.006 2.04 0.138 3 0.405 
                2.28-1.552 3.285-1.23 3.285-1.23 
                0.645 1.653 0.24 2.873 0.12 3.176 
                0.765 0.84 1.23 1.91 1.23 3.22 
                0 4.61-2.805 5.625-5.475 5.92 
                0.42 0.36 0.81 1.096 0.81 2.22 
                0 1.606-0.015 2.896-0.015 3.286 
                0 0.315 0.21 0.69 0.825 0.57 
                C20.565 22.092 24 17.592 24 12.297 
                c0-6.627-5.373-12-12-12"/>
            </svg>

            Continue with GitHub
          </button>

        </div>

        {/* SIGNUP REDIRECT */}
        <p className="text-center text-white/70 mt-4 text-sm">
          Don’t have an account? <Link to="/signup" className="text-blue-400 hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
