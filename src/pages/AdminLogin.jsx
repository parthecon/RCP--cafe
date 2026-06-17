import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Lock, Mail, LogIn, AlertCircle } from 'lucide-react';
import { signInAdmin, subscribeToAuth } from '../firebase/dbService';
import { isFirebaseConfigured } from '../firebase/config';
import toast from 'react-hot-toast';

export const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      if (user) {
        navigate('/admin/dashboard', { replace: true });
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter email and password');
      return;
    }

    setIsSubmitting(true);
    try {
      await signInAdmin(email.trim(), password.trim());
      toast.success('Admin login successful!');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed. Check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#3C2F2F] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background soft glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#F7ECE6]/60 blur-3xl rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#EFEAE4]/50 blur-3xl rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md bg-white border border-[#EFEAE4] rounded-3xl p-8 shadow-xl relative z-10">
        
        {/* Logo and Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-3.5 bg-[#F7ECE6] border border-[#EFEAE4] rounded-2xl text-[#A87C5C] mb-3.5 shadow-sm">
            <Gamepad2 className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black tracking-wider bg-gradient-to-r from-[#3C2F2F] to-[#5D4037] bg-clip-text text-transparent">
            Cafe Admin
          </h1>
          <p className="text-xs text-[#7C6C6C] font-semibold uppercase tracking-widest mt-1">Admin Portal</p>
        </div>

        {/* Mock Mode Alert */}
        {!isFirebaseConfigured && (
          <div className="mb-6 p-4 rounded-xl bg-[#F7ECE6]/40 border border-[#EFEAE4] text-xs text-[#7C6C6C] flex items-start gap-2.5 leading-relaxed">
            <AlertCircle className="w-4.5 h-4.5 text-[#A87C5C] shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-[#3C2F2F] block mb-0.5">Running in Local Mock Mode</span>
              Firebase is not configured. Log in using the developer credentials:<br/>
              <span className="font-mono font-bold text-[#3C2F2F]">admin@rcp.com</span> / <span className="font-mono font-bold text-[#3C2F2F]">admin123</span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#7C6C6C] uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#7C6C6C]" />
              <input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#FAF7F2]/40 border border-[#EFEAE4] rounded-xl text-[#3C2F2F] text-sm focus:outline-none focus:border-[#A87C5C] transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#7C6C6C] uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#7C6C6C]" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#FAF7F2]/40 border border-[#EFEAE4] rounded-xl text-[#3C2F2F] text-sm focus:outline-none focus:border-[#A87C5C] transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#3C2F2F] hover:bg-[#4E3629] active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-6"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign In to Dashboard
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default AdminLogin;
