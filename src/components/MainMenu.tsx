import React, { useState } from 'react';
import { GameMode, LEDTheme, SoundSettings, AdminSettings } from '../types';
import { soundEngine } from '../utils/audio';
import { Play, Users, Trophy, Volume2, ShieldCheck, Sparkles, Lock, LogOut, GraduationCap, Shield, Zap, RefreshCw, Check } from 'lucide-react';
import { AdminLoginModal } from './AdminLoginModal';
import { UserRole } from '../utils/appAuth';
import { getActiveSpeedInfo, fetchRemoteAdminSettings } from '../utils/adminSettings';

interface MainMenuProps {
  userRole?: UserRole;
  adminSettings?: AdminSettings;
  onSelectMode: (mode: GameMode) => void;
  selectedTheme: LEDTheme;
  onChangeTheme: (theme: LEDTheme) => void;
  soundSettings: SoundSettings;
  onUpdateSound: (settings: SoundSettings) => void;
  onLogout?: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  userRole = 'student',
  adminSettings,
  onSelectMode,
  selectedTheme,
  onChangeTheme,
  soundSettings,
  onUpdateSound,
  onLogout,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isRefreshingSpeed, setIsRefreshingSpeed] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  const speedInfo = adminSettings ? getActiveSpeedInfo(adminSettings) : null;

  const handleRefreshSpeed = async () => {
    soundEngine.playTargetActivate();
    setIsRefreshingSpeed(true);
    setRefreshSuccess(false);
    try {
      const res = await fetchRemoteAdminSettings();
      if (res) {
        soundEngine.playCorrectSound();
        setRefreshSuccess(true);
        setTimeout(() => setRefreshSuccess(false), 2500);
      }
    } finally {
      setIsRefreshingSpeed(false);
    }
  };


  const handleAdminClick = () => {
    soundEngine.playTargetActivate();
    if (userRole === 'admin') {
      onSelectMode('teacher-dashboard');
    } else {
      setShowAdminLogin(true);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between p-4 md:p-6 select-none">
      {/* Top Header Bar / HUD with Admin Control and Logout at top */}
      <header className="relative z-10 w-full max-w-7xl flex items-center justify-between pt-2 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.9)] rounded-sm" />
          <span className="text-base sm:text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-fuchsia-400 to-purple-400">
            Mind Sport
          </span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* User Role Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold">
            {userRole === 'admin' ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-pink-400" />
                <span className="text-pink-300">Admin</span>
              </>
            ) : (
              <>
                <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-cyan-300">Student</span>
              </>
            )}
          </div>

          {/* Top Admin Control Button */}
          <button
            onClick={handleAdminClick}
            className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-pink-600/30 to-purple-600/30 hover:from-pink-600/50 hover:to-purple-600/50 backdrop-blur-md border border-pink-500/40 hover:border-pink-400 text-pink-200 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-pink-400" />
            <span>Admin Control</span>
            {userRole !== 'admin' && <Lock className="w-3.5 h-3.5 text-pink-400/70 ml-0.5" />}
          </button>

          <button
            onClick={() => {
              soundEngine.playTargetActivate();
              setShowSettings(true);
            }}
            className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-pink-950/40 hover:bg-pink-900/40 backdrop-blur-md border border-pink-500/30 hover:border-pink-400 transition-all text-slate-200 hover:text-white flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-pink-500/10 cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-pink-400" />
            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Settings</span>
          </button>

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={() => {
                soundEngine.playTargetActivate();
                onLogout();
              }}
              title="Logout"
              className="px-3 py-2 sm:py-2.5 rounded-2xl bg-white/5 hover:bg-rose-500/20 backdrop-blur-md border border-white/10 hover:border-rose-400/50 transition-all text-slate-400 hover:text-rose-300 flex items-center gap-1.5 cursor-pointer shadow"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-bold hidden md:inline">Logout</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Hero & Navigation Grid */}
      <main className="relative z-10 my-auto text-center max-w-5xl w-full flex flex-col items-center py-6 sm:py-10">
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-fuchsia-300 to-purple-400 mb-8 sm:mb-12 drop-shadow-[0_0_35px_rgba(236,72,153,0.4)]">
          Mind Sport
        </h1>

        {/* Primary Menu Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 w-full">
          {/* Single Player Card */}
          <button
            onClick={() => {
              soundEngine.playTargetActivate();
              onSelectMode('single-player');
            }}
            className="group relative p-8 sm:p-10 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-cyan-400/60 hover:bg-white/10 transition-all duration-300 flex flex-col items-center justify-center text-center overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] hover:shadow-[0_0_35px_rgba(34,211,238,0.25)] hover:-translate-y-1 cursor-pointer min-h-[200px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl group-hover:bg-cyan-400/20 transition-all" />
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-cyan-300" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white">Single Player</h3>
          </button>

          {/* Two Players Card */}
          <button
            onClick={() => {
              soundEngine.playTargetActivate();
              onSelectMode('two-player');
            }}
            className="group relative p-8 sm:p-10 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-purple-400/60 hover:bg-white/10 transition-all duration-300 flex flex-col items-center justify-center text-center overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] hover:shadow-[0_0_35px_rgba(168,85,247,0.25)] hover:-translate-y-1 cursor-pointer min-h-[200px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-purple-500/15 text-purple-300 border border-purple-400/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <Users className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white">Two Players</h3>
          </button>

          {/* Competition Card */}
          <button
            onClick={() => {
              soundEngine.playTargetActivate();
              onSelectMode('competition');
            }}
            className="group relative p-8 sm:p-10 rounded-3xl bg-white/5 backdrop-blur-xl border border-amber-400/40 hover:border-amber-400 hover:bg-white/10 transition-all duration-300 flex flex-col items-center justify-center text-center overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] hover:shadow-[0_0_35px_rgba(245,158,11,0.35)] hover:-translate-y-1 cursor-pointer min-h-[200px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl group-hover:bg-amber-500/25 transition-all" />
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <Trophy className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white">Competition</h3>
          </button>
        </div>
      </main>

      {/* Footer with Copyright */}
      <footer className="relative z-10 w-full max-w-7xl mt-8 pt-4 pb-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2 text-center sm:text-right">
          <span>Copyright © 2026 <strong>شركة رياضة العقل</strong>. All rights reserved.</span>
          <span className="hidden sm:inline opacity-40">•</span>
          <span className="hidden sm:inline text-slate-400/80">صُممت وبرمجت لصالح شركة رياضة العقل</span>
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          Mind Sport Platform v2.5
        </div>
      </footer>

      {/* Admin Login Gate Modal */}
      <AdminLoginModal
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onSuccess={() => {
          setShowAdminLogin(false);
          onSelectMode('teacher-dashboard');
        }}
      />

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0a0f1d]/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 shadow-[0_0_60px_rgba(0,0,0,0.8)] text-left">
            <h3 className="text-xl font-black text-white mb-6 flex items-center justify-between border-b border-white/10 pb-4">
              <span className="flex items-center gap-2 text-cyan-400">
                <Volume2 className="w-5 h-5" /> AUDIO & HARDWARE SFX
              </span>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-white text-lg font-bold w-8 h-8 rounded-full bg-white/5 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </h3>

            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  Master Volume ({Math.round(soundSettings.masterVolume * 100)}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={soundSettings.masterVolume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    const updated = { ...soundSettings, masterVolume: v };
                    onUpdateSound(updated);
                    soundEngine.setVolumes(v, updated.sfxVolume, updated.musicVolume);
                  }}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  Silicone Punch SFX ({Math.round(soundSettings.sfxVolume * 100)}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={soundSettings.sfxVolume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    const updated = { ...soundSettings, sfxVolume: v };
                    onUpdateSound(updated);
                    soundEngine.setVolumes(updated.masterVolume, v, updated.musicVolume);
                    soundEngine.playPunchImpact();
                  }}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  Arena Sports Music ({Math.round(soundSettings.musicVolume * 100)}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={soundSettings.musicVolume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    const updated = { ...soundSettings, musicVolume: v };
                    onUpdateSound(updated);
                    soundEngine.setVolumes(updated.masterVolume, updated.sfxVolume, v);
                  }}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="mt-8 w-full py-3 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black uppercase text-xs tracking-wider transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)] cursor-pointer"
            >
              SAVE SETTINGS
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
