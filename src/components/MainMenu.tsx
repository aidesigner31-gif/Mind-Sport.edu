import React, { useState } from 'react';
import { GameMode, LEDTheme, SoundSettings } from '../types';
import { soundEngine } from '../utils/audio';
import { Play, Users, Trophy, Volume2, ShieldCheck, Sparkles, Lock } from 'lucide-react';
import { AdminLoginModal } from './AdminLoginModal';

interface MainMenuProps {
  onSelectMode: (mode: GameMode) => void;
  selectedTheme: LEDTheme;
  onChangeTheme: (theme: LEDTheme) => void;
  soundSettings: SoundSettings;
  onUpdateSound: (settings: SoundSettings) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onSelectMode,
  soundSettings,
  onUpdateSound,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between p-4 md:p-6 select-none">
      {/* Top Header Bar / HUD with Admin ControlControl at top */}
      <header className="relative z-10 w-full max-w-7xl flex items-center justify-between pt-2 pb-4 border-b border-white/10">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.9)] rounded-sm" />
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-70 text-pink-400">
              System Online • Mind Sport Arena
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-fuchsia-400 to-purple-500 drop-shadow-[0_0_20px_rgba(236,72,153,0.5)]">
            MIND SPORT
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Top Admin Control Button */}
          <button
            onClick={() => {
              soundEngine.playTargetActivate();
              setShowAdminLogin(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-600/30 to-purple-600/30 hover:from-pink-600/50 hover:to-purple-600/50 backdrop-blur-md border border-pink-500/40 hover:border-pink-400 text-pink-200 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-pink-400" />
            <span>Admin Control</span>
            <Lock className="w-3.5 h-3.5 text-pink-400/70 ml-0.5" />
          </button>

          <button
            onClick={() => {
              soundEngine.playTargetActivate();
              setShowSettings(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-pink-950/40 hover:bg-pink-900/40 backdrop-blur-md border border-pink-500/30 hover:border-pink-400 transition-all text-slate-200 hover:text-white flex items-center gap-2 shadow-lg shadow-pink-500/10 cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-pink-400" />
            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Settings</span>
          </button>
        </div>
      </header>

      {/* Main Hero & Glass Navigation Grid */}
      <main className="relative z-10 my-auto text-center max-w-5xl w-full flex flex-col items-center py-4 sm:py-8">
        {/* Holographic Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-500/10 backdrop-blur-md border border-pink-400/30 text-pink-300 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] mb-3 sm:mb-4 shadow-[0_0_20px_rgba(236,72,153,0.25)]">
          <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin" />
          SPEEDDIGITS MENTAL ARITHMETIC SYSTEM
        </div>

        <h2 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-fuchsia-300 to-purple-400 mb-2 sm:mb-3 drop-shadow-[0_0_35px_rgba(236,72,153,0.4)]">
          SPEEDDIGITS
        </h2>
        <p className="text-slate-300 text-xs sm:text-sm md:text-base max-w-2xl font-normal leading-relaxed mb-6 sm:mb-8 opacity-85">
          Process mental arithmetic equations at high velocity and punch illuminated LED pads.
        </p>

        {/* Primary Menu Navigation Glass Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full">
          {/* Single Player Card */}
          <button
            onClick={() => {
              soundEngine.playTargetActivate();
              onSelectMode('single-player');
            }}
            className="group relative p-5 sm:p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-cyan-400/60 hover:bg-white/10 transition-all duration-300 text-left flex flex-col justify-between overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] hover:shadow-[0_0_35px_rgba(34,211,238,0.25)] hover:-translate-y-1 cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl group-hover:bg-cyan-400/20 transition-all" />
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-cyan-300" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.25em] mb-1 opacity-90">PRO TRAINING</div>
              <h3 className="text-xl sm:text-2xl font-black text-white mb-1.5">Single Player</h3>
              <p className="text-[11px] sm:text-xs text-slate-300/80 leading-relaxed">
                Practice, Career progression & Level 0–6 Easy & Complex training modes.
              </p>
            </div>
          </button>

          {/* Two Player Split Screen Card */}
          <button
            onClick={() => {
              soundEngine.playTargetActivate();
              onSelectMode('two-player');
            }}
            className="group relative p-5 sm:p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-purple-400/60 hover:bg-white/10 transition-all duration-300 text-left flex flex-col justify-between overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] hover:shadow-[0_0_35px_rgba(168,85,247,0.25)] hover:-translate-y-1 cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-purple-500/15 text-purple-300 border border-purple-400/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.25em] mb-1 opacity-90">DUAL MACHINE</div>
              <h3 className="text-xl sm:text-2xl font-black text-white mb-1.5">Two Players</h3>
              <p className="text-[11px] sm:text-xs text-slate-300/80 leading-relaxed">
                Synchronized flashcards, head-to-head reaction battle & live split comparison.
              </p>
            </div>
          </button>

          {/* Competition Mode Card */}
          <button
            onClick={() => {
              soundEngine.playTargetActivate();
              onSelectMode('competition');
            }}
            className="group relative p-5 sm:p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-amber-400/60 hover:bg-white/10 transition-all duration-300 text-left flex flex-col justify-between overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] hover:shadow-[0_0_35px_rgba(245,158,11,0.25)] hover:-translate-y-1 cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/15 text-amber-300 border border-amber-400/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-[0.25em] mb-1 opacity-90">CHAMPIONSHIP</div>
              <h3 className="text-xl sm:text-2xl font-black text-white mb-1.5">Competition</h3>
              <p className="text-[11px] sm:text-xs text-slate-300/80 leading-relaxed">
                Classroom eSports leaderboard tournament sorted by Score, Speed, and Accuracy.
              </p>
            </div>
          </button>
        </div>
      </main>

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
