import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUser } from '../../store/userSlice';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  LogIn, 
  Sparkles, 
  Shield,
  BookOpen,
  GraduationCap,
  Users,
  ArrowRight,
  CheckCircle,
  Award,
  Target,
  Globe,
  TrendingUp
} from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from "../../firebase";
import axios from 'axios';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:7000/api/auth/manual-login', {
        email:email,
        password:password,
      });

      if (res.data.success) {
        localStorage.setItem('token', res.data.token);

        dispatch(setUser({
          email: res.data.user.email,
          role: res.data.user.role,
        }));

        if (res.data.user.role === "admin") {
          navigate('/admindashboard');
        } else if (res.data.user.role === "faculty") {
          navigate('/facultydashboard');
        } else {
          navigate('/');
        }
      } else {
        alert(res.data.message || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Error during manual login:', err);
      alert('Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const res = await axios.post('http://localhost:7000/api/auth/check-user', {
        email: user.email,
      });

      // Change this condition from res.data.exists to res.data.success
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);

        // The user object is nested, so use res.data.user
        dispatch(setUser({
          email: res.data.user.email,
          role: res.data.user.role
        }));

        // Check the role from the nested user object
        if (res.data.user.role === 'admin') {
          navigate('/admindashboard');
        } else if (res.data.user.role === 'faculty') {
          navigate('/facultydashboard');
        }
      } else {
        // This part is now correctly reached only when the backend says the user is not found.
        alert('You are not registered. Please contact the administrator.');
      }
    } catch (error) {
      // This will catch network errors or if the user is truly not in the DB (404 from backend)
      console.error("Google sign-in error:", error);
      if (error.response && error.response.status === 404) {
        alert('You are not registered. Please contact the administrator.');
      } else {
        alert('Google login failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-200/20 to-transparent rounded-full -translate-y-48 translate-x-48 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-indigo-200/20 to-transparent rounded-full translate-y-40 -translate-x-40 animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-gradient-to-r from-blue-300/10 to-purple-300/10 rounded-full animate-bounce delay-700" />
        <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-gradient-to-r from-pink-300/10 to-orange-300/10 rounded-full animate-bounce delay-500" />
        
        {/* Floating Particles */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400/40 rounded-full animate-bounce delay-300" />
        <div className="absolute top-40 right-32 w-1.5 h-1.5 bg-purple-400/40 rounded-full animate-bounce delay-700" />
        <div className="absolute bottom-32 left-1/3 w-2.5 h-2.5 bg-indigo-400/40 rounded-full animate-bounce delay-1000" />
      </div>

      <div className={`relative w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 items-stretch h-full max-h-[95vh] transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        
        {/* Left Side - Welcome Section */}
        <div className="hidden lg:flex flex-col justify-center space-y-6 px-6 h-full">

          {/* Brand Section */}
          <div className={`space-y-4 transition-all duration-700 delay-300 ${mounted ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <GraduationCap size={20} className="text-white" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <div className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Sparkles size={10} className="text-white" />
                  </div>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  QB Generator
                </h1>
                <p className="text-gray-600 text-sm flex items-center gap-2">
                  <Award size={14} className="text-yellow-500" />
                  Next-Gen Question Bank System
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-gray-800 leading-tight">
                Transform Your
                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent">
                  Academic Excellence
                </span>
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm">
                Experience the future of education with our AI-powered platform designed 
                to revolutionize question bank creation and academic assessment.
              </p>
            </div>
          </div>

          {/* Features Showcase */}
          <div className={`bg-gradient-to-r from-white/80 to-blue-50/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 shadow-xl transition-all duration-700 delay-500 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
                <Target size={16} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Key Features</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-gray-200 hover:bg-blue-50 transition-all duration-300">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm">Smart Question Banks</h4>
                  <p className="text-xs text-gray-600">AI-powered organization</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-gray-200 hover:bg-purple-50 transition-all duration-300">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl text-white">
                  <Shield size={16} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm">Advanced Security</h4>
                  <p className="text-xs text-gray-600">Enterprise-grade protection</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-gray-200 hover:bg-emerald-50 transition-all duration-300">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm">Analytics Dashboard</h4>
                  <p className="text-xs text-gray-600">Real-time insights</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className={`flex items-center justify-center gap-6 transition-all duration-700 delay-700 ${mounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <Shield size={16} className="text-green-500" />
              <span className="font-medium">SSL Secured</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <CheckCircle size={16} className="text-blue-500" />
              <span className="font-medium">GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <Award size={16} className="text-yellow-500" />
              <span className="font-medium">5-Star Rated</span>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className={`flex flex-col justify-center h-full transition-all duration-700 delay-200 ${mounted ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}>
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-gray-200/50 p-8 relative overflow-hidden w-full max-w-md mx-auto">
            
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-200/20 to-transparent rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-200/20 to-transparent rounded-full translate-y-12 -translate-x-12" />

            {/* Mobile Header */}
            <div className="lg:hidden mb-6 text-center">
              <div className="inline-flex items-center gap-3 mb-4 p-3 bg-white/80 rounded-xl border border-gray-200/50 shadow-lg">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                  <GraduationCap size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-lg font-bold text-gray-800">QB Generator</h1>
                  <p className="text-xs text-gray-600">Academic Platform</p>
                </div>
              </div>
              <div className="bg-white/70 rounded-xl p-4 border border-gray-200/50 shadow-lg">
                <img
                  className="w-full h-12 object-contain"
                  src="/bitbanner.png"
                  alt="BIT LOGO"
                />
              </div>
            </div>

            <div className="relative z-10 space-y-6">
              {/* Header */}
              <div className="text-center space-y-3">
                <div className="hidden lg:block">
                  <img
                    className="w-full h-16 object-contain mb-3"
                    src="/bitbanner.png"
                    alt="BIT LOGO"
                  />
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleManualLogin} className="space-y-4">
                {/* Email Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-2">
                    <Mail size={14} className="text-blue-500" />
                    Email Address
                  </label>
                  <div className="relative group">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@domain.com"
                      required
                      className="w-full px-4 py-3 pl-12 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 group-hover:shadow-md"
                    />
                    <Mail size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors duration-300 group-focus-within:text-blue-500" />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-2">
                    <Lock size={14} className="text-blue-500" />
                    Password
                  </label>
                  <div className="relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your secure password"
                      required
                      className="w-full px-4 py-3 pl-12 pr-12 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 group-hover:shadow-md"
                    />
                    <Lock size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors duration-300 group-focus-within:text-blue-500" />
                    <button
                      type="button"
                      onClick={handleTogglePassword}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all duration-200 p-1 rounded-lg hover:bg-gray-100"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-800 text-white font-bold py-4 px-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-400 flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={20} className="group-hover:rotate-12 transition-transform duration-400" />
                      <span>Sign In to Dashboard</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-300"></div>
                <div className="flex-shrink mx-4 px-3 py-1 bg-gradient-to-r from-gray-50 to-blue-50 rounded-full border border-gray-200 shadow-sm">
                  <span className="text-gray-500 font-medium text-xs tracking-wide">OR CONTINUE WITH</span>
                </div>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>
              
              {/* Google Login */}
              <button
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-md"
              >
                {googleLoading ? (
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <img className="w-5 h-5" src="/google.png" alt="Google Logo" />
                )}
                <span>
                  {googleLoading ? "Authenticating..." : "Continue with Google"}
                </span>
                {!googleLoading && (
                  <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
                )}
              </button>

              {/* Footer */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-gray-600 text-sm mb-3">
                  Need assistance? Contact your system administrator
                </p>
                <div className="flex justify-center gap-3 text-xs text-gray-500">
                  <span>Privacy Policy</span>
                  <span>•</span>
                  <span>Terms of Service</span>
                  <span>•</span>
                  <span>Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .rounded-4xl {
          border-radius: 2rem;
        }
        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }
        .border-3 {
          border-width: 3px;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
