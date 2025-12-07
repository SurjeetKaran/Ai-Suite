// src/pages/SignupPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import ParticlesBackground from '../components/ParticlesBackground';

const SignupPage = () => {
  const navigate = useNavigate();
  const [signupType, setSignupType] = useState('user'); // 'user' or 'team'
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = signupType === 'team' ? '/team/register' : '/auth/signup';
      const res = await API.post(endpoint, {
        name,
        description: signupType === 'team' ? description : undefined,
        email,
        password,
        signupType,
      });

      if (signupType === 'user') {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/dashboard');
      } else {
        navigate('/team');
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden px-4">

      {/* Particle Background */}
      <ParticlesBackground />

      {/* Signup Card */}
      <div className="relative z-10 w-full max-w-md p-10 rounded-3xl bg-black/40 backdrop-blur-md 
                      border-2 border-blue-500 shadow-[0_0_20px_0_rgba(59,130,246,0.6)] 
                      hover:shadow-[0_0_30px_0_rgba(59,130,246,0.8)] animate-float transition duration-500">
        <h1 className="text-3xl font-bold text-white text-center mb-6">Create Account</h1>
        <p className="text-center text-white/70 mb-6">Fill in the details to get started</p>

        {/* Signup Type */}
        <div className="flex justify-center gap-6 mb-6">
          {['user', 'team'].map((type) => (
            <label key={type} className="flex items-center gap-2 text-white/70 hover:text-white transition cursor-pointer">
              <input
                type="radio"
                value={type}
                checked={signupType === type}
                onChange={(e) => setSignupType(e.target.value)}
                className="accent-blue-500"
              />
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </label>
          ))}
        </div>

        {/* Signup Form */}
        <form className="flex flex-col gap-4" onSubmit={handleSignup}>
          <input
            type="text"
            placeholder={signupType === 'team' ? 'Team Name' : 'Full Name'}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50
                       focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-300"
          />

          {signupType === 'team' && (
            <input
              type="text"
              placeholder="Team Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50
                         focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-300"
            />
          )}

          <input
            type="email"
            placeholder="Email Address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50
                       focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-300"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50
                       focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-300"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl
                       transform hover:-translate-y-1 transition-transform duration-300"
          >
            {loading ? 'Please wait...' : 'Sign Up'}
          </button>
        </form>

        {error && (
          <p className="text-red-500 text-center mt-4 font-medium animate-pulse">{error}</p>
        )}

        <p className="text-center text-white/70 mt-4 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;

