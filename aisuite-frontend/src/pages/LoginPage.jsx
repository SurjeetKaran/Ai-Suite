// // src/pages/LoginPage.jsx
// import React, { useState } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import API from '../api/axios';
// import ParticlesBackground from '../components/ParticlesBackground';

// const LoginPage = () => {
//   const navigate = useNavigate();
  
//   // ❌ Removed 'role' state. We don't need it anymore.
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');

//     try {
//       // ✅ 1. Always hit the Unified Login endpoint
//       const res = await API.post('/auth/login', { email, password });

//       // ✅ 2. Extract data from response
//       const { token, role, user } = res.data;

//       // ✅ 3. Store in LocalStorage
//       localStorage.setItem('token', token);
//       localStorage.setItem('role', role); // Store the role returned by server
//       localStorage.setItem('user', JSON.stringify(user));

//       // ✅ 4. Dynamic Navigation based on Server Role
//       if (role === 'admin') {
//         navigate('/admin');
//       } else if (role === 'teamAdmin') {
//         navigate('/team');
//       } else {
//         navigate('/dashboard'); // Standard User
//       }

//     } catch (err) {
//       setError(err.response?.data?.msg || 'Login failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden px-4">
      
//       {/* Particle Background */}
//       <ParticlesBackground />

//       {/* Login Card */}
//       <div className="relative z-10 w-full max-w-md p-10 rounded-3xl bg-black/20 backdrop-blur-md border-2 border-blue-500 
//                       shadow-[0_0_20px_0_rgba(59,130,246,0.6)] hover:shadow-[0_0_30px_0_rgba(59,130,246,0.8)] 
//                       animate-float transition duration-500">
        
//         <h1 className="text-3xl font-bold text-white text-center mb-6">Welcome Back!</h1>
//         <p className="text-center text-white/70 mb-6">
//           Enter your credentials to access your account.
//         </p>

//         {/* ❌ REMOVED: Role Selection Radio Buttons (Backend handles this now) */}

//         {/* Login Form */}
//         <form className="flex flex-col gap-4" onSubmit={handleLogin}>
//           <input
//             type="email"
//             placeholder="Email Address"
//             required
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50
//                        focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-300"
//           />
//           <input
//             type="password"
//             placeholder="Password"
//             required
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50
//                        focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-300"
//           />

//           <button
//             type="submit"
//             disabled={loading}
//             className="mt-2 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl
//                        transform hover:-translate-y-1 transition-transform duration-300"
//           >
//             {loading ? 'Please wait...' : 'Login'}
//           </button>
//         </form>

//         {/* Error Message */}
//         {error && (
//           <p className="text-red-500 text-center mt-4 font-medium animate-pulse">
//             {error}
//           </p>
//         )}

//         {/* Signup Link */}
//         <p className="text-center text-white/70 mt-4 text-sm">
//           Don’t have an account?{' '}
//           <Link to="/signup" className="text-blue-400 hover:underline">
//             Sign Up
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default LoginPage;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import ParticlesBackground from '../components/ParticlesBackground';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // ✅ 1. Always hit the Unified Login endpoint
      const res = await API.post('/auth/login', { email, password });

      // ✅ 2. Extract data from response
      const { token, role, user } = res.data;

      // ✅ 3. Store in LocalStorage
      localStorage.setItem('token', token);
      localStorage.setItem('role', role); // Store the role returned by server
      localStorage.setItem('user', JSON.stringify(user));

      // ✅ 4. Dynamic Navigation based on Server Role
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'teamAdmin') {
        navigate('/team');
      } else {
        navigate('/dashboard'); // Standard User
      }

    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden px-4">
      
      {/* Particle Background */}
      <ParticlesBackground />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md p-10 rounded-3xl bg-black/20 backdrop-blur-md border-2 border-blue-500 
                      shadow-[0_0_20px_0_rgba(59,130,246,0.6)] hover:shadow-[0_0_30px_0_rgba(59,130,246,0.8)] 
                      animate-float transition duration-500">
        
        <h1 className="text-3xl font-bold text-white text-center mb-6">Welcome Back!</h1>
        <p className="text-center text-white/70 mb-6">
          Enter your credentials to access your account.
        </p>

        {/* Login Form */}
        <form className="flex flex-col gap-4" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email Address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50
                       focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-300"
          />
          <div>
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50
                         focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-300"
            />
            {/* 🆕 Forgot Password Link */}
            <div className="text-right mt-2">
              <Link 
                to="/forgot-password" 
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
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

        {/* Error Message */}
        {error && (
          <p className="text-red-500 text-center mt-4 font-medium animate-pulse">
            {error}
          </p>
        )}

        {/* Signup Link */}
        <p className="text-center text-white/70 mt-4 text-sm">
          Don’t have an account?{' '}
          <Link to="/signup" className="text-blue-400 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;