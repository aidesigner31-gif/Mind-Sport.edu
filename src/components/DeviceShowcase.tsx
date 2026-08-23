import React, { useState } from 'react';
import { ThreeBoxingMachine } from './ThreeBoxingMachine';
import { LEDTheme } from '../types';
import { soundEngine } from '../utils/audio';
import { ArrowLeft, Box, Sparkles, Sliders, Volume2 } from 'lucide-react';

interface DeviceShowcaseProps {
  theme: LEDTheme;
  onChangeTheme: (theme: LEDTheme) => void;
  onBackToMenu: () => void;
}

export const DeviceShowcase: React.FC<DeviceShowcaseProps> = ({ theme, onChangeTheme, onBackToMenu }) => {
  const [cameraAngle, setCameraAngle] = useState<'broadcast' | 'frontal' | 'close-up'>('frontal');
  const [lastPunchedPad, setLastPunchedPad] = useState<number | null>(null);

  const themes: { id: LEDTheme; name: string; desc: string }[] = [
    { id: 'cyber-neon', name: 'Cyber Neon', desc: 'Electric cyan and deep violet laser rings' },
    { id: 'olympic-gold', name: 'Olympic Gold', desc: 'Prestige golden glow for championship events' },
    { id: 'laser-purple', name: 'Laser Purple', desc: 'Futuristic ultraviolet sports lighting' },
    { id: 'emerald-boost', name: 'Emerald Boost', desc: 'High contrast emerald green energy pulse' },
    { id: 'fire-red', name: 'Fire Red', desc: 'High intensity red sports training lighting' },
  ];

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between p-4 md:p-6 select-none">
      {/* Top Bar / HUD Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto flex items-center justify-between pb-4 border-b border-white/10">
        <button
          onClick={onBackToMenu}
          className="px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/15 hover:border-cyan-400/50 text-slate-200 hover:text-white flex items-center gap-2 text-xs font-bold uppercase transition-all shadow-lg"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          Menu
        </button>

        <div className="flex items-center gap-3">
          <div className="px-4 py-1.5 rounded-xl bg-purple-500/15 backdrop-blur-md border border-purple-400/30 text-purple-300 font-black text-xs uppercase flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Box className="w-5 h-5 text-purple-400" />
            3D HARDWARE DEVICE SHOWCASE
          </div>
        </div>
      </header>

      {/* Main Showcase Layout */}
      <div className="relative z-10 w-full max-w-7xl mx-auto my-3 sm:my-5 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 flex-1 items-stretch">
        {/* 3D Machine Viewer (2 cols) */}
        <div className="lg:col-span-2 flex flex-col justify-between h-full min-h-[320px]">
          <div className="flex items-center justify-between bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl mb-2 sm:mb-3">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">CAMERA ANGLE MODE</span>
            <div className="flex items-center gap-2">
              {(['frontal', 'broadcast', 'close-up'] as const).map((angle) => (
                <button
                  key={angle}
                  onClick={() => {
                    soundEngine.playTargetActivate();
                    setCameraAngle(angle);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold uppercase transition-all backdrop-blur-md ${
                    cameraAngle === angle
                      ? 'bg-purple-500 text-slate-950 font-black shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {angle}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 h-[460px] sm:h-[520px] md:h-[580px] max-h-[72vh]">
            <ThreeBoxingMachine
              theme={theme}
              cameraAngle={cameraAngle}
              onPunchDigit={(d) => setLastPunchedPad(d)}
              labelTitle="PHYSICAL MACHINE PRODUCT VISUALIZER"
              interactive={true}
            />
          </div>
        </div>

        {/* Device Customizer & Specification Glass Panel (1 col) */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-400" />
              HARDWARE THEMES & SPECS
            </h3>

            {/* LED Theme Selection List */}
            <div className="space-y-3 mb-6">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                SELECT RGB LED THEME
              </label>
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    soundEngine.playTargetActivate();
                    onChangeTheme(t.id);
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all backdrop-blur-md ${
                    theme === t.id
                      ? 'bg-purple-500/20 border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>{t.name}</span>
                    {theme === t.id && <Sparkles className="w-4 h-4 text-purple-400" />}
                  </div>
                  <div className="text-[10px] text-slate-300/80 mt-1">{t.desc}</div>
                </button>
              ))}
            </div>

            {/* Silicone Pad Test Bench Feedback */}
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-left">
              <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1">
                PAD TEST BENCH FEEDBACK
              </div>
              <div className="text-xs text-slate-300">
                {lastPunchedPad !== null ? (
                  <span>
                    Punched Pad <strong className="text-cyan-300">#{lastPunchedPad}</strong> — Sub bass impact & 3D
                    reactive light compression triggered.
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Click or punch any pad on the 3D machine to test!</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 text-[10px] text-slate-400 leading-relaxed uppercase tracking-wider">
            PRODUCT SPEC: Wall mounted 10-pad silicone matrix, RGB active lighting rings, central high-contrast display,
            dual Bluetooth 5.2 speakers, high velocity mental math reaction suite.
          </div>
        </div>
      </div>
    </div>
  );
};
