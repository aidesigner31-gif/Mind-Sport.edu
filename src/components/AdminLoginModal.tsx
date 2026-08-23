import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, X, AlertCircle } from 'lucide-react';
import { verifyAdminCredentials, DEFAULT_ADMIN_USERNAME } from '../utils/adminAuth';
import { soundEngine } from '../utils/audio';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    if (!username.trim()) {
      setErrorMessage('يرجى إدخال اسم المستخدم / Please enter username');
      setIsSubmitting(false);
      soundEngine.playWrongSound();
      return;
    }

    if (!password) {
      setErrorMessage('يرجى إدخال كلمة المرور / Please enter password');
      setIsSubmitting(false);
      soundEngine.playWrongSound();
      return;
    }

    const isValid = verifyAdminCredentials(username, password);

    if (isValid) {
      soundEngine.playCorrectSound();
      setIsSubmitting(false);
      onSuccess();
    } else {
      soundEngine.playWrongSound();
      setErrorMessage('اسم المستخدم أو كلمة المرور غير صحيحة / Invalid username or password');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0a0f1d]/95 border-2 border-pink-500/40 rounded-3xl p-6 sm:p-8 text-left shadow-[0_0_60px_rgba(236,72,153,0.25)] flex flex-col select-none overflow-hidden">
        {/* Glowing Orbs */}
        <div className="absolute -top-16 -left-16 w-40 h-40 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-pink-500/15 border border-pink-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(236,72,153,0.3)]">
            <ShieldCheck className="w-6 h-6 text-pink-400" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-pink-400 uppercase tracking-[0.2em]">
              ADMIN ACCESS AUTHENTICATION
            </div>
            <h3 className="text-xl font-black text-white">تسجيل دخول الأدمن</h3>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              اسم المستخدم / User Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="User Name"
                autoComplete="username"
                className="w-full bg-white/5 border border-white/15 focus:border-pink-400/60 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              كلمة المرور / Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                className="w-full bg-white/5 border border-white/15 focus:border-pink-400/60 rounded-2xl pl-10 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-6 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(236,72,153,0.4)] hover:shadow-[0_0_35px_rgba(236,72,153,0.6)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>تسجيل الدخول / LOGIN</span>
          </button>
        </form>
      </div>
    </div>
  );
};
