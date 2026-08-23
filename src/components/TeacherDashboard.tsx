import React, { useState, useEffect } from 'react';
import { StudentRecord, AdminSettings } from '../types';
import { soundEngine } from '../utils/audio';
import { ArrowLeft, GraduationCap, Users, Plus, Download, Sparkles, ShieldCheck, FileText, Gauge, Zap, Play, Settings, CheckCircle2, RotateCcw, KeyRound, LogOut, Lock, Sliders, ChevronDown, ChevronUp, Check, Save, Home } from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';
import { getAdminUsername } from '../utils/adminAuth';
import { THREE_SPEED_PRESETS, SpeedPresetKey, getCurrentSpeedPresetKey, saveStoredAdminSettings } from '../utils/adminSettings';

interface TeacherDashboardProps {
  onBackToMenu: () => void;
  adminSettings: AdminSettings;
  onUpdateAdminSettings: (settings: AdminSettings) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onBackToMenu,
  adminSettings,
  onUpdateAdminSettings,
}) => {
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
  const [showAdvancedSliders, setShowAdvancedSliders] = useState<boolean>(false);
  const [stagedSettings, setStagedSettings] = useState<AdminSettings>(adminSettings);
  const [showAppliedToast, setShowAppliedToast] = useState<boolean>(false);

  const currentAdminUser = getAdminUsername();
  const currentSpeedKey = getCurrentSpeedPresetKey(stagedSettings);
  const activeSpeedKey = getCurrentSpeedPresetKey(adminSettings);
  const activeCalculatedFlashDuration = Math.max(80, Math.round(adminSettings.flashIntervalMs / adminSettings.gameSpeedMultiplier));
  const stagedCalculatedFlashDuration = Math.max(80, Math.round(stagedSettings.flashIntervalMs / stagedSettings.gameSpeedMultiplier));

  // Sync stagedSettings if parent adminSettings updates externally
  useEffect(() => {
    setStagedSettings(adminSettings);
  }, [adminSettings]);

  // Roster state
  const [students, setStudents] = useState<StudentRecord[]>([
    {
      id: 'st_1',
      name: 'Ahmed Youssef',
      grade: 'Grade 5A',
      totalGames: 12,
      highestScore: 1450,
      avgAccuracyPercent: 94,
      avgResponseMs: 1280,
      currentLevel: 3,
      isComplex: true,
      logs: [],
    },
    {
      id: 'st_2',
      name: 'Sara Mansour',
      grade: 'Grade 5A',
      totalGames: 18,
      highestScore: 1620,
      avgAccuracyPercent: 98,
      avgResponseMs: 1120,
      currentLevel: 4,
      isComplex: true,
      logs: [],
    },
    {
      id: 'st_3',
      name: 'Khaled Hassan',
      grade: 'Grade 5B',
      totalGames: 8,
      highestScore: 920,
      avgAccuracyPercent: 82,
      avgResponseMs: 1850,
      currentLevel: 2,
      isComplex: false,
      logs: [],
    },
  ]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>('st_1');
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [newStudentGrade, setNewStudentGrade] = useState<string>('Grade 5A');

  // AI Diagnostic Report
  const [aiReport, setAiReport] = useState<any | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);

  // Speed Simulation Testing State
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simActiveDigit, setSimActiveDigit] = useState<number | null>(null);

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const newSt: StudentRecord = {
      id: `st_${Date.now()}`,
      name: newStudentName.trim(),
      grade: newStudentGrade,
      totalGames: 0,
      highestScore: 0,
      avgAccuracyPercent: 100,
      avgResponseMs: 1500,
      currentLevel: adminSettings.targetLevel,
      isComplex: adminSettings.isComplexMode,
      logs: [],
    };

    setStudents([...students, newSt]);
    setSelectedStudentId(newSt.id);
    setNewStudentName('');
    soundEngine.playCorrectSound();
  };

  // Run Live Speed Test Simulation
  const runSpeedSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimActiveDigit(null);

    const testDigits = [7, 3, 9, 2, 5];
    let idx = 0;
    const intervalMs = Math.max(80, Math.round(stagedSettings.flashIntervalMs / stagedSettings.gameSpeedMultiplier));

    const simInterval = setInterval(() => {
      if (idx < testDigits.length) {
        setSimActiveDigit(testDigits[idx]);
        soundEngine.playTargetActivate();
        idx++;
      } else {
        setSimActiveDigit(null);
        setIsSimulating(false);
        clearInterval(simInterval);
        soundEngine.playCorrectSound();
      }
    }, intervalMs);
  };

  const applySpeedPreset = (key: SpeedPresetKey) => {
    soundEngine.playTargetActivate();
    const preset = THREE_SPEED_PRESETS[key];
    setStagedSettings({
      ...stagedSettings,
      gameSpeedMultiplier: preset.multiplier,
      flashIntervalMs: preset.flashIntervalMs,
      timeLimitSeconds: preset.timeLimitSeconds,
    });
  };

  const handleAcceptAndApplySpeed = () => {
    soundEngine.playVictorySound();
    onUpdateAdminSettings(stagedSettings);
    saveStoredAdminSettings(stagedSettings);
    setShowAppliedToast(true);
    setTimeout(() => {
      setShowAppliedToast(false);
    }, 4500);
  };

  const generateAIReport = async () => {
    if (!selectedStudent) return;
    setIsGeneratingReport(true);
    setAiReport(null);

    try {
      const res = await fetch('/api/ai-student-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: selectedStudent.name,
          logs: [
            { question: '7 + 8', answer: '15', correct: true, timeMs: 1200 },
            { question: '14 - 6', answer: '8', correct: true, timeMs: 1350 },
            { question: '9 x 6', answer: '54', correct: false, timeMs: 2100 },
          ],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiReport(data.report);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const exportCSV = () => {
    const csvHeader = 'ID,Name,Grade,Total Games,Highest Score,Avg Accuracy %,Avg Response (ms)\n';
    const csvRows = students
      .map(
        (s) => `${s.id},"${s.name}","${s.grade}",${s.totalGames},${s.highestScore},${s.avgAccuracyPercent},${s.avgResponseMs}`
      )
      .join('\n');

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MindSport_Class_Report_${Date.now()}.csv`;
    a.click();
  };

  const calculatedFlashDuration = Math.round(
    adminSettings.flashIntervalMs / adminSettings.gameSpeedMultiplier
  );

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between p-4 md:p-6 select-none">
      {/* Header HUD */}
      <header className="relative z-10 w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between pb-4 border-b border-white/10 gap-3">
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-start">
          {/* Home / Return to Main Page Icon Button */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playTargetActivate();
              onBackToMenu();
            }}
            title="الرجوع للصفحة الرئيسية"
            className="px-4 py-2 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 backdrop-blur-md border border-cyan-400/50 hover:border-cyan-300 text-cyan-200 hover:text-white flex items-center gap-2 text-xs font-black uppercase transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] cursor-pointer active:scale-95"
          >
            <Home className="w-4 h-4 text-cyan-400" />
            <span>الرئيسية / Home</span>
          </button>

          <button
            onClick={onBackToMenu}
            className="px-3 py-2 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/15 hover:border-pink-400/50 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-bold uppercase transition-all shadow-lg cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">خروج / Logout</span>
          </button>

          <div className="px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-slate-400">User:</span>
            <span className="text-white font-mono">{currentAdminUser}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur-md border border-pink-400/40 text-pink-300 font-black text-xs uppercase flex items-center gap-2 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
            <Gauge className="w-5 h-5 text-pink-400 animate-pulse" />
            ADMIN CONTROL DASHBOARD / لوحة تحكم الأدمن
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={() => {
              soundEngine.playTargetActivate();
              setShowChangePasswordModal(true);
            }}
            className="px-3.5 py-2 rounded-2xl bg-purple-500/15 hover:bg-purple-500/25 backdrop-blur-md border border-purple-400/40 text-purple-200 hover:text-white flex items-center gap-1.5 text-xs font-bold uppercase transition-all shadow-lg hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-purple-300" />
            <span>تغيير كلمة المرور / Password</span>
          </button>

          <button
            onClick={exportCSV}
            className="px-3.5 py-2 rounded-2xl bg-emerald-400/15 backdrop-blur-md border border-emerald-400/30 hover:bg-emerald-400 hover:text-slate-950 text-emerald-300 flex items-center gap-1.5 text-xs font-bold uppercase transition-all shadow-lg cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="relative z-10 w-full max-w-7xl mx-auto my-3 sm:my-5 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 flex-1">
        
        {/* Left Column: Admin Speed Master Controls & Difficulty Settings */}
        <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
          
          {/* ⚡ ADMIN SPEED MASTER CONTROLLER ⚡ */}
          <div className="bg-white/5 backdrop-blur-xl border border-pink-500/30 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(236,72,153,0.15)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header & Active Speed Readout */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-white/10 pb-4">
              <div>
                <div className="text-[10px] font-bold text-pink-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
                  ADMIN EXCLUSIVE SPEED CONTROL / تحكم المشرف الحصري في سرعة اللعبة
                </div>
                <h3 className="text-xl font-black text-white mt-0.5">
                  حدد السرعة واضغط Accept لتطبيقها على اللعبة كاملة
                </h3>
              </div>

              {/* Active Speed Readout Badge */}
              <div className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border border-emerald-400/50 text-emerald-200 font-black text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.35)]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>السرعة المعتمدة للعبة حالياً:</span>
                <span className="text-white text-sm font-black">
                  {activeSpeedKey === 'slow' ? '🐢 بطيء (1.2s)' : activeSpeedKey === 'fast' ? '🚀 سريع (0.4s)' : activeSpeedKey === 'normal' ? '⚡ عادي (0.8s)' : `${activeCalculatedFlashDuration}ms`}
                </span>
              </div>
            </div>

            {/* Success Toast Notification after pressing Accept */}
            {showAppliedToast && (
              <div className="mb-5 p-4 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-200 flex items-center gap-3 animate-bounce shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                <div className="p-2 rounded-xl bg-emerald-500 text-slate-950 font-black">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
                <div className="text-right flex-1">
                  <div className="text-sm font-black text-white">
                    ✅ تم اعتماد وتطبيق السرعة بنجاح على اللعبة كاملة!
                  </div>
                  <div className="text-xs text-emerald-300">
                    جميع اللاعبين في جميع الأنماط سيلعبون بسرعة: <span className="font-black text-white underline">{THREE_SPEED_PRESETS[currentSpeedKey as SpeedPresetKey]?.nameAr || 'المخصصة'} ({stagedCalculatedFlashDuration}ms)</span> ولا يمكنهم تغييرها.
                  </div>
                </div>
              </div>
            )}

            {/* The 3 Speeds Cards Section */}
            <div className="mb-5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-3 flex items-center justify-between">
                <span>اختر السرعة المطلوبة (3 سرعات) / SELECT GAME SPEED:</span>
                <span className="text-[10px] text-pink-400 font-normal">التحكم حصري للأدمن فقط</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {(['slow', 'normal', 'fast'] as SpeedPresetKey[]).map((key) => {
                  const preset = THREE_SPEED_PRESETS[key];
                  const isSelected = currentSpeedKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => applySpeedPreset(key)}
                      className={`relative p-4 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer group ${
                        isSelected
                          ? `bg-gradient-to-b ${preset.bgGradient} ${preset.borderColor} border-2 shadow-[0_0_25px_rgba(236,72,153,0.3)] scale-[1.02]`
                          : 'bg-white/5 border-white/10 hover:border-white/25 hover:bg-white/[0.08]'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-400 text-pink-300 text-[10px] font-black flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-pink-400" />
                          <span>محددة</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2.5 mb-2">
                        <span className="text-2xl">{preset.icon}</span>
                        <div>
                          <div className="text-sm font-black text-white group-hover:text-pink-300 transition-colors">
                            {preset.nameAr}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase">
                            {preset.nameEn}
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
                        {preset.taglineAr}
                      </p>

                      <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-cyan-300 font-bold">
                          وميض: {preset.flashIntervalMs}ms
                        </span>
                        <span className="text-purple-300 font-bold">
                          وقت: {preset.timeLimitSeconds}s
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Collapsible Advanced Fine-Tuning Sliders */}
            <div className="mb-5">
              <button
                type="button"
                onClick={() => setShowAdvancedSliders(!showAdvancedSliders)}
                className="w-full py-2 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-xs font-bold text-slate-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-pink-400" />
                  <span>تعديل يدوي دقيق للسرعات (متقدم) / Advanced Custom Fine-Tuning</span>
                </div>
                {showAdvancedSliders ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showAdvancedSliders && (
                <div className="mt-3 p-4 rounded-2xl bg-black/40 border border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Speed Multiplier Slider */}
                  <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-slate-300 uppercase">معامل السرعة</span>
                      <span className="text-xs font-black text-pink-400">{stagedSettings.gameSpeedMultiplier}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.3"
                      max="3.0"
                      step="0.1"
                      value={stagedSettings.gameSpeedMultiplier}
                      onChange={(e) =>
                        setStagedSettings({
                          ...stagedSettings,
                          gameSpeedMultiplier: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-pink-500 cursor-pointer"
                    />
                    <div className="text-[9px] text-slate-400 mt-1">التحكم في إيقاع اللعبة العام</div>
                  </div>

                  {/* Flash Duration Slider */}
                  <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-slate-300 uppercase">سرعة وميض الرقم</span>
                      <span className="text-xs font-black text-cyan-400">{stagedSettings.flashIntervalMs}ms</span>
                    </div>
                    <input
                      type="range"
                      min="150"
                      max="2000"
                      step="50"
                      value={stagedSettings.flashIntervalMs}
                      onChange={(e) =>
                        setStagedSettings({
                          ...stagedSettings,
                          flashIntervalMs: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <div className="text-[9px] text-slate-400 mt-1">
                      الوميض الفعلي: <span className="text-cyan-300 font-bold">{stagedCalculatedFlashDuration}ms</span>
                    </div>
                  </div>

                  {/* Question Countdown Timer Slider */}
                  <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-slate-300 uppercase">عداد وقت الإجابة</span>
                      <span className="text-xs font-black text-purple-400">{stagedSettings.timeLimitSeconds}s</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="30"
                      step="1"
                      value={stagedSettings.timeLimitSeconds}
                      onChange={(e) =>
                        setStagedSettings({
                          ...stagedSettings,
                          timeLimitSeconds: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full accent-purple-400 cursor-pointer"
                    />
                    <div className="text-[9px] text-slate-400 mt-1">الحد الأقصى للثواني لكل مسألة</div>
                  </div>
                </div>
              )}
            </div>

            {/* ⭐ THE PROMINENT ACCEPT & APPLY BUTTON ⭐ */}
            <div className="mb-5">
              <button
                type="button"
                onClick={handleAcceptAndApplySpeed}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-3 shadow-[0_0_35px_rgba(16,185,129,0.5)] transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-slate-950 text-emerald-400 flex items-center justify-center font-black">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <span>
                  ACCEPT & APPLY TO ENTIRE GAME / اعتماد وتطبيق السرعة على اللعبة كاملة (Accept)
                </span>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-950/40 text-emerald-200 font-mono">
                  {THREE_SPEED_PRESETS[currentSpeedKey as SpeedPresetKey]?.nameAr || `${stagedCalculatedFlashDuration}ms`}
                </span>
              </button>
            </div>

            {/* Real-time Interactive Speed Tester & Live Preview */}
            <div className="bg-slate-950/80 border border-white/15 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={runSpeedSimulation}
                  disabled={isSimulating}
                  className="px-5 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-400 disabled:opacity-50 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(236,72,153,0.5)] cursor-pointer"
                >
                  <Play className={`w-4 h-4 fill-slate-950 ${isSimulating ? 'animate-spin' : ''}`} />
                  {isSimulating ? 'جاري اختبار الوميض...' : 'تجربة السرعة المحددة الآن / TEST SPEED'}
                </button>
                <div className="text-right sm:text-left hidden sm:block">
                  <div className="text-xs font-bold text-white">معاينة وميض السرعة الحالية</div>
                  <div className="text-[10px] text-slate-400 font-mono">اختبار 5 أرقام بفاصل {stagedCalculatedFlashDuration}ms لكل رقم</div>
                </div>
              </div>

              {/* Mini Target Pad Flasher */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => (
                  <div
                    key={d}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center font-black text-xs transition-all ${
                      simActiveDigit === d
                        ? 'bg-pink-500 border-white text-white scale-125 shadow-[0_0_20px_#ec4899]'
                        : 'bg-white/5 border-white/10 text-slate-500'
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Machine Level & Class Configuration Box */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              DRILL DIFFICULTY & QUESTION CONFIGURATION
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">TARGET LEVEL</label>
                <select
                  value={adminSettings.targetLevel}
                  onChange={(e) =>
                    onUpdateAdminSettings({
                      ...adminSettings,
                      targetLevel: Number(e.target.value),
                    })
                  }
                  className="w-full bg-[#0a0f1d] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-cyan-300 focus:outline-none"
                >
                  {[0, 1, 2, 3, 4, 5, 6].map((l) => (
                    <option key={l} value={l}>
                      Level {l} {l === 0 ? '(Starter)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">COMPLEXITY</label>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateAdminSettings({
                      ...adminSettings,
                      isComplexMode: !adminSettings.isComplexMode,
                    })
                  }
                  className={`w-full py-2 rounded-xl text-xs font-bold border transition-all backdrop-blur-md ${
                    adminSettings.isComplexMode
                      ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  {adminSettings.isComplexMode ? 'COMPLEX MODE (متقدم)' : 'EASY MODE (سهل)'}
                </button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">QUESTIONS PER ROUND</label>
                <select
                  value={adminSettings.questionCount}
                  onChange={(e) =>
                    onUpdateAdminSettings({
                      ...adminSettings,
                      questionCount: Number(e.target.value),
                    })
                  }
                  className="w-full bg-[#0a0f1d] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
                >
                  {[5, 10, 15, 20].map((c) => (
                    <option key={c} value={c}>
                      {c} Questions
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Roster & AI Diagnostic */}
        <div className="space-y-6 flex flex-col justify-between">
          
          {/* Class Student Roster Box */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                STUDENT ROSTER / سجل الطلاب
              </h3>

              {/* Roster List */}
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {students.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      setSelectedStudentId(st.id);
                      setAiReport(null);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between backdrop-blur-md ${
                      selectedStudentId === st.id
                        ? 'bg-cyan-400/20 border-cyan-400/80 text-white shadow-[0_0_20px_rgba(34,211,238,0.25)]'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold">{st.name}</div>
                      <div className="text-[10px] text-cyan-400 font-semibold">{st.grade}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-cyan-300">{st.highestScore} PTS</div>
                      <div className="text-[10px] text-slate-400">{st.avgAccuracyPercent}% ACC</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Add Student Form */}
            <form onSubmit={handleAddStudent} className="mt-5 pt-4 border-t border-white/10">
              <div className="text-xs font-bold text-slate-400 uppercase mb-2.5 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-cyan-400" /> Add New Student
              </div>

              <div className="space-y-2.5">
                <input
                  type="text"
                  placeholder="Student Name"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50"
                />
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                >
                  ADD TO ROSTER
                </button>
              </div>
            </form>
          </div>

          {/* AI Student Educational Diagnostic Report */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                AI DIAGNOSTIC ANALYTICS
              </h3>

              <button
                type="button"
                onClick={generateAIReport}
                disabled={isGeneratingReport}
                className="px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)]"
              >
                {isGeneratingReport ? (
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                {isGeneratingReport ? 'ANALYZING...' : 'ANALYZE'}
              </button>
            </div>

            {aiReport ? (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 space-y-3 text-left">
                <div className="text-xs font-bold text-cyan-300 border-b border-white/10 pb-1.5">
                  Report for {aiReport.studentName}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{aiReport.summary}</p>
                <div className="text-[11px] text-slate-300 italic bg-amber-400/10 border border-amber-400/30 p-2 rounded-xl">
                  "{aiReport.personalizedTip}"
                </div>
              </div>
            ) : (
              <div className="my-auto text-center p-6 border border-dashed border-white/10 rounded-2xl">
                <ShieldCheck className="w-8 h-8 mx-auto text-slate-600 mb-1.5" />
                <div className="text-xs font-bold text-slate-400 uppercase">Select student and run AI Diagnostic</div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </div>
  );
};

