import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, Sparkles, ShieldCheck, AlertCircle, ArrowRight, Gamepad2, GraduationCap, Settings } from 'lucide-react';
import { verifyStudentLogin, verifyAdminLogin, setAppAuthenticated, UserRole } from '../utils/appAuth';
import { soundEngine } from '../utils/audio';

interface AppLoginGateProps {
  onLoginSuccess: (role: UserRole) => void;
}

export const AppLoginGate: React.FC<AppLoginGateProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    if (!username.trim()) {
      setErrorMessage('يرجى إدخال اسم المستخدم / Please enter User Name');
      setIsLoading(false);
      soundEngine.playWrongSound();
      return;
    }

    if (!password.trim()) {
      setErrorMessage('يرجى إدخال كلمة المرور / Please enter Password');
      setIsLoading(false);
      soundEngine.playWrongSound();
      return;
    }

    const isValid = selectedRole === 'admin'
      ? verifyAdminLogin(username, password)
      : verifyStudentLogin(username, password);

    if (isValid) {
      soundEngine.playVictorySound();
      setAppAuthenticated(true, selectedRole);
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess(selectedRole);
      }, 350);
    } else {
      soundEngine.playWrongSound();
      setErrorMessage(
        selectedRole === 'admin'
          ? 'بيانات دخول الأدمن غير صحيحة! يرجى التحقق من اسم المستخدم وكلمة المرور.'
          : 'اسم المستخدم أو كلمة المرور غير صحيحة! يرجى التحقق من البيانات والمحاولة مجدداً.'
      );
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center p-4 select-none overflow-hidden"
      style={{ background: 'radial-gradient(circle at center, #1e0b3c 0%, #080312 100%)' }}
    >
      {/* Frosted Ambient Glow Background Orbs */}
      <div className="fixed top-[-15%] left-[-15%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-pink-600/20 blur-[140px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-15%] right-[-15%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-purple-600/20 blur-[140px] rounded-full pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] max-w-[450px] max-h-[450px] bg-cyan-600/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-md bg-[#0a0f1d]/90 backdrop-blur-2xl border-2 border-pink-500/30 hover:border-pink-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_80px_rgba(0,0,0,0.8),0_0_40px_rgba(236,72,153,0.2)] transition-all duration-300">
        
        {/* Top Eyebrow Badge */}
        <div className="flex items-center justify-center mb-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-pink-500/15 border border-pink-400/30 text-pink-300 text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(236,72,153,0.25)]">
            <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin" />
            <span>MIND SPORT ARENA • تسجيل الدخول</span>
          </div>
        </div>

        {/* Header Branding */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 mx-auto mb-2.5 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 p-0.5 shadow-[0_0_25px_rgba(236,72,153,0.5)] flex items-center justify-center">
            <div className="w-full h-full bg-slate-950/80 rounded-[14px] flex items-center justify-center">
              {selectedRole === 'admin' ? (
                <ShieldCheck className="w-7 h-7 text-pink-400" />
              ) : (
                <Gamepad2 className="w-7 h-7 text-pink-400" />
              )}
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-fuchsia-300 to-purple-400 drop-shadow-[0_0_20px_rgba(236,72,153,0.4)]">
            SPEEDDIGITS
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            اختر نوع الدخول للوصول إلى اللعبة أو لوحة التحكم
          </p>
        </div>

        {/* Role Selector Tabs (Student vs Admin) */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/90 border border-white/10 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => {
              soundEngine.playTargetActivate();
              setSelectedRole('student');
              setUsername('');
              setPassword('');
              setErrorMessage('');
            }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              selectedRole === 'student'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>طالب / Student</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playTargetActivate();
              setSelectedRole('admin');
              setUsername('');
              setPassword('');
              setErrorMessage('');
            }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              selectedRole === 'admin'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>أدمن / Admin</span>
          </button>
        </div>

        {/* Error Alert Message */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="font-semibold leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-right">
          {/* User Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              {selectedRole === 'admin' ? 'اسم مستخدم الأدمن' : 'اسم المستخدم'} <span className="text-slate-500 font-mono font-normal">/ User Name</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-pink-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم / Username"
                autoComplete="username"
                className="w-full bg-slate-900/80 border border-white/15 focus:border-pink-400 rounded-2xl pr-10 pl-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition-all font-mono font-bold tracking-wider"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              كلمة المرور <span className="text-slate-500 font-mono font-normal">/ Password</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-pink-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-slate-900/80 border border-white/15 focus:border-pink-400 rounded-2xl pr-10 pl-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition-all font-mono font-bold tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role Description Note */}
          <div className="text-[11px] text-slate-400 bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-center">
            {selectedRole === 'admin' ? (
              <span className="text-pink-300">🛡️ الدخول كـ <strong>مسؤول</strong> يتيح ضبط السرعات، الأسئلة، ومتابعة الأداء.</span>
            ) : (
              <span className="text-cyan-300">🎓 الدخول كـ <strong>طالب</strong> يفتح ساحات اللعب الفردي، التحدي، وبطولة السرعة.</span>
            )}
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(236,72,153,0.4)] hover:shadow-[0_0_35px_rgba(236,72,153,0.7)] flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جاري التحقق...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {selectedRole === 'admin' ? (
                  <>
                    <Settings className="w-4 h-4 text-white" />
                    <span>دخول الأدمن / ADMIN LOGIN</span>
                  </>
                ) : (
                  <>
                    <Gamepad2 className="w-4 h-4 text-white" />
                    <span>دخول الطالب / START GAME</span>
                  </>
                )}
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </span>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-5 pt-3.5 border-t border-white/10 text-center">
          <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
            <Lock className="w-3.5 h-3.5 text-pink-400/80" />
            <span>نظام محمي • Mind Sport Interactive SpeedDigits</span>
          </div>
        </div>

      </div>
    </div>
  );
};

