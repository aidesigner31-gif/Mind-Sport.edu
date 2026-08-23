import React, { useState } from 'react';
import { GameMode, LEDTheme, SoundSettings, AdminSettings } from './types';
import { MainMenu } from './components/MainMenu';
import { SinglePlayerGame } from './components/SinglePlayerGame';
import { TwoPlayerGame } from './components/TwoPlayerGame';
import { CompetitionMode } from './components/CompetitionMode';
import { TeacherDashboard } from './components/TeacherDashboard';
import { DeviceShowcase } from './components/DeviceShowcase';
import { getStoredAdminSettings, saveStoredAdminSettings } from './utils/adminSettings';

export default function App() {
  const [currentMode, setCurrentMode] = useState<GameMode>('main-menu');
  const [selectedTheme, setSelectedTheme] = useState<LEDTheme>('cyber-neon');
  const [soundSettings, setSoundSettings] = useState<SoundSettings>({
    masterVolume: 0.8,
    sfxVolume: 0.9,
    musicVolume: 0.3,
    narrationEnabled: true,
  });

  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => getStoredAdminSettings());

  const handleUpdateAdminSettings = (newSettings: AdminSettings) => {
    setAdminSettings(newSettings);
    saveStoredAdminSettings(newSettings);
  };

  return (
    <div
      className="relative w-full min-h-screen bg-[#080312] text-slate-100 font-sans selection:bg-pink-500 selection:text-white overflow-x-hidden flex flex-col justify-between"
      style={{ background: 'radial-gradient(circle at center, #1c0b36 0%, #080312 100%)' }}
    >
      {/* Frosted Glass Background Ambient Glowing Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-pink-600/15 blur-[130px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-purple-600/15 blur-[130px] rounded-full pointer-events-none z-0" />

      {/* Decorative Arena Corner Accents */}
      <div className="fixed bottom-0 left-0 w-28 h-28 border-b-[20px] border-l-[20px] border-pink-500/10 pointer-events-none z-0 hidden sm:block" />
      <div className="fixed bottom-0 right-0 w-28 h-28 border-b-[20px] border-r-[20px] border-purple-500/10 pointer-events-none z-0 hidden sm:block" />

      {/* Side Hardware Labels */}
      <div className="hidden xl:flex fixed right-4 top-1/2 -translate-y-1/2 flex-col gap-32 pointer-events-none z-10 select-none">
        <div className="[writing-mode:vertical-rl] text-[10px] font-bold uppercase tracking-[0.5em] text-pink-400/30">
          SPEEDDIGITS MENTAL ARITHMETIC
        </div>
        <div className="[writing-mode:vertical-rl] text-[10px] font-bold uppercase tracking-[0.5em] text-purple-400/30">
          SYSTEM ACTIVE
        </div>
      </div>

      <div className="relative z-10 w-full flex-1 flex flex-col">
        {currentMode === 'main-menu' && (
          <MainMenu
            onSelectMode={(mode) => setCurrentMode(mode)}
            selectedTheme={selectedTheme}
            onChangeTheme={(t) => setSelectedTheme(t)}
            soundSettings={soundSettings}
            onUpdateSound={(s) => setSoundSettings(s)}
          />
        )}

        {currentMode === 'single-player' && (
          <SinglePlayerGame
            theme={selectedTheme}
            onBackToMenu={() => setCurrentMode('main-menu')}
            adminSettings={adminSettings}
          />
        )}

        {currentMode === 'two-player' && (
          <TwoPlayerGame
            theme={selectedTheme}
            onBackToMenu={() => setCurrentMode('main-menu')}
            adminSettings={adminSettings}
          />
        )}

        {currentMode === 'competition' && (
          <CompetitionMode
            onBackToMenu={() => setCurrentMode('main-menu')}
            adminSettings={adminSettings}
          />
        )}

        {currentMode === 'teacher-dashboard' && (
          <TeacherDashboard
            onBackToMenu={() => setCurrentMode('main-menu')}
            adminSettings={adminSettings}
            onUpdateAdminSettings={handleUpdateAdminSettings}
          />
        )}

        {currentMode === 'device-showcase' && (
          <DeviceShowcase
            theme={selectedTheme}
            onChangeTheme={(t) => setSelectedTheme(t)}
            onBackToMenu={() => setCurrentMode('main-menu')}
          />
        )}
      </div>
    </div>
  );
}

