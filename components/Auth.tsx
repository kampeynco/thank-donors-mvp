import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Loader2, AlertCircle, Heart, ArrowRight, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useToast } from './ToastContext';

interface AuthProps {
  onLogin: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast(`Error with Google Login: ${error.message}`, 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        onLogin();
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        toast('Registration successful! Please check your email.', 'success');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setFormData({ email: '', password: '' });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-stone-50 text-stone-900 font-sans">
      {/* Left Side - Hero Section */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-stone-800 to-rose-900 flex flex-col justify-center px-8 md:px-16 py-12 text-white order-2 md:order-1 relative overflow-hidden">

        {/* Abstract shapes/texture overlay */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 bg-rose-400 rounded-full blur-3xl mix-blend-screen animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-orange-300 rounded-full blur-3xl mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-md mx-auto relative z-10">
          <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-rose-900/40">
            <Heart className="w-6 h-6 text-white text-fill-white" />
          </div>

          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 leading-tight">
            Automate your donor gratitude.
          </h1>

          <p className="text-lg text-rose-100/90 mb-8 leading-relaxed">
            Connect ActBlue, create branded postcards, and thank your donors with a personal touch automatically.
          </p>

          <div className="grid grid-cols-2 gap-6 border-t border-white/10 pt-8">
            <div>
              <p className="text-2xl font-bold mb-1">100%</p>
              <p className="text-sm text-rose-200">Automated Workflow</p>
            </div>
            <div>
              <p className="text-2xl font-bold mb-1">Instant</p>
              <p className="text-sm text-rose-200">Campaign Setup</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 order-1 md:order-2 bg-stone-50">
        <div className="w-full max-w-sm">

          {/* Mobile Logo (Visible only on small screens) */}
          <div className="md:hidden mb-8 text-center bg-white p-4 rounded-2xl border border-stone-100 shadow-sm mx-auto w-fit">
            <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center mx-auto mb-2 text-white">
              <Heart size={20} />
            </div>
            <span className="font-serif font-bold text-stone-800">Thank Donors</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-stone-900 font-serif">
              {isLogin ? 'Welcome back' : 'Start your journey'}
            </h2>
            <p className="text-stone-500 mt-2 text-sm">
              {isLogin
                ? 'Enter your details to access your dashboard'
                : 'Create an account to start thanking donors'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-rose-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">


            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700 uppercase tracking-wide ml-1">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-stone-400" />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-stone-200 rounded-xl leading-5 bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (error) setError(null);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700 uppercase tracking-wide ml-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-stone-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="block w-full pl-10 pr-10 py-2.5 border border-stone-200 rounded-xl leading-5 bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    placeholder={isLogin ? "••••••••" : "Create a password"}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (error) setError(null);
                    }}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-stone-300 text-rose-600 focus:ring-rose-500 transition-colors" />
                    <span className="text-stone-500 group-hover:text-stone-700 transition-colors">Remember me</span>
                  </label>
                  <a href="#" className="font-medium text-rose-600 hover:text-rose-700 hover:underline">
                    Forgot password?
                  </a>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-rose-500/20 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative mt-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-stone-50 text-stone-500">Or continue with</span>
              </div>
            </div>

            {/* Google Login Button */}
            <div className="mt-6">
              <button
                onClick={handleGoogleLogin}
                type="button"
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-stone-200 shadow-sm bg-white text-sm font-bold text-stone-700 rounded-xl hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-all hover:border-stone-300"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </button>
            </div>

            {/* Toggle Login/Signup */}
            <div className="text-center mt-6">
              <p className="text-sm text-stone-500">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={toggleMode}
                  className="font-bold text-rose-600 hover:text-rose-700 hover:underline transition-colors"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;