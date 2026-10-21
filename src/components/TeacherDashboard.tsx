import React, { useState, useEffect } from 'react';
import { StudentRecord, AdminSettings } from '../types';
import { soundEngine } from '../utils/audio';
import { ArrowLeft, GraduationCap, Users, Plus, Download, Sparkles, ShieldCheck, FileText, Gauge, Zap, Play, Settings, CheckCircle2, RotateCcw, KeyRound, LogOut, Lock, Sliders, ChevronDown, ChevronUp, Check, Save, Home, Table, Eye, BookOpen, Shield } from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';
import { LicenseModal } from './LicenseModal';
import { getAdminUsername } from '../utils/adminAuth';
import {
  THREE_SPEED_PRESETS,
  SpeedPresetKey,
  getCurrentSpeedPresetKey,
  saveStoredAdminSettings,
  syncAdminSettingsToServer,
  fetchRemoteAdminSettings,
} from '../utils/adminSettings';
import { TALMAS_LEVEL_0_BANK } from '../utils/questionsBank';

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
  const [showLicenseModal, setShowLicenseModal] = useState<boolean>(false);
  const [showAdvancedSliders, setShowAdvancedSliders] = useState<boolean>(false);
  const [stagedSettings, setStagedSettings] = useState<AdminSettings>(adminSettings);
  const [showAppliedToast, setShowAppliedToast] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const currentAdminUser = getAdminUsername();
  const currentSpeedKey = getCurrentSpeedPresetKey(stagedSettings);
  const activeSpeedKey = getCurrentSpeedPresetKey(adminSettings);
  const activeCalculatedFlashDuration = Math.max(80, Math.round(adminSettings.flashIntervalMs / adminSettings.gameSpeedMultiplier));
  const stagedCalculatedFlashDuration = Math.max(80, Math.round(stagedSettings.flashIntervalMs / stagedSettings.gameSpeedMultiplier));

  // When opening TeacherDashboard, immediately fetch authoritative speed from the central server
  useEffect(() => {
    fetchRemoteAdminSettings().then((remote) => {
      if (remote) {
        setStagedSettings(remote);
        onUpdateAdminSettings(remote);
      }
    });
  }, []);

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

  const [selectedTableTab, setSelectedTableTab] = useState<'all' | 'table1' | 'table2'>('all');
  const [previewingDrillIdx, setPreviewingDrillIdx] = useState<number | null>(null);

  const previewLevel0Drill = (drillIdx: number, promptSeq: { type: string; value: string }[]) => {
    if (isSimulating) return;
    setIsSimulating(true);
    setPreviewingDrillIdx(drillIdx);
    setSimActiveDigit(null);

    let idx = 0;
    const intervalMs = Math.max(80, Math.round(stagedSettings.flashIntervalMs / stagedSettings.gameSpeedMultiplier));

    const simInterval = setInterval(() => {
      if (idx < promptSeq.length) {
        const val = promptSeq[idx].value.replace('-', '');
        const num = parseInt(val, 10);
        setSimActiveDigit(!isNaN(num) ? num : 0);
        soundEngine.playTargetActivate();
        idx++;
      } else {
        setSimActiveDigit(null);
        setIsSimulating(false);
        setPreviewingDrillIdx(null);
        clearInterval(simInterval);
        soundEngine.playCorrectSound();
      }
    }, intervalMs);
  };

  // Instantly broadcast and unify speed across all devices
  const syncAndApplySettings = async (newSettings: AdminSettings, isVictory = false) => {
    if (isVictory) {
      soundEngine.playVictorySound();
    } else {
      soundEngine.playTargetActivate();
    }
    setStagedSettings(newSettings);
    onUpdateAdminSettings(newSettings);
    saveStoredAdminSettings(newSettings);
    setIsSyncing(true);
    await syncAdminSettingsToServer(newSettings);
    setIsSyncing(false);
    setShowAppliedToast(true);
    setTimeout(() => {
      setShowAppliedToast(false);
    }, 4500);
  };

  const applySpeedPreset = (key: SpeedPresetKey) => {
    const preset = THREE_SPEED_PRESETS[key];
    const updated: AdminSettings = {
      ...stagedSettings,
      gameSpeedMultiplier: preset.multiplier,
      flashIntervalMs: preset.flashIntervalMs,
      timeLimitSeconds: preset.timeLimitSeconds,
    };
    syncAndApplySettings(updated, true);
  };

  const handleAcceptAndApplySpeed = async () => {
    await syncAndApplySettings(stagedSettings, true);
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

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
          <button
            onClick={() => {
              soundEngine.playTargetActivate();
              setShowLicenseModal(true);
            }}
            className="px-3.5 py-2 rounded-2xl bg-pink-500/15 hover:bg-pink-500/25 backdrop-blur-md border border-pink-400/40 text-pink-200 hover:text-white flex items-center gap-1.5 text-xs font-bold uppercase transition-all shadow-lg hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-pink-400" />
            <span>ملف الترخيص والملكية (License)</span>
          </button>

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
                  ADMIN EXCLUSIVE SPEED CONTROL / توحيد السرعة المركزية لجميع الأجهزة
                </div>
                <h3 className="text-xl font-black text-white mt-0.5">
                  التحكم بالسرعة وتوحيدها آلياً على كافة الشاشات والأجهزة
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  عند تغيير أي إعداد أو فتح لوحة التحكم، يتم مزامنة وتوحيد السرعة فورياً عبر السيرفر المركزي لتعمل كافة الأجهزة بنفس التوقيت.
                </p>
              </div>

              {/* Active Speed Readout Badge */}
              <div className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-950/90 to-teal-950/90 border border-emerald-400/50 text-emerald-200 font-black text-xs flex items-center gap-2.5 shadow-[0_0_20px_rgba(16,185,129,0.35)]">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-emerald-400 font-bold">السرعة الموحدة الحالية على جميع الأجهزة:</span>
                  <span className="text-white text-sm font-black font-mono">
                    {(adminSettings.flashIntervalMs / 1000).toFixed(2)}s ({adminSettings.flashIntervalMs}ms) • {adminSettings.timeLimitSeconds}s إجابة
                  </span>
                </div>
              </div>
            </div>

            {/* Success Toast Notification after pressing Accept or changing speed */}
            {showAppliedToast && (
              <div className="mb-5 p-4 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-200 flex items-center gap-3 animate-bounce shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                <div className="p-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
                <div className="text-right flex-1">
                  <div className="text-sm font-black text-white flex items-center gap-2">
                    <span>✅ تم توحيد السرعة وتطبيقها على جميع الأجهزة بنجاح!</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold">
                      مزامنة فورية حية
                    </span>
                  </div>
                  <div className="text-xs text-emerald-300 mt-0.5 leading-relaxed">
                    تم حفظ السرعة في السيرفر المركزي وبثها فوراً لكافة المتصفحات والأجهزة المتصلة: <span className="font-black text-white font-mono underline">{(stagedSettings.flashIntervalMs / 1000).toFixed(2)} ثانية ({stagedSettings.flashIntervalMs}ms)</span> ووقت إجابة: <span className="font-black text-white font-mono underline">{stagedSettings.timeLimitSeconds} ثانية</span>.
                  </div>
                </div>
              </div>
            )}

            {/* ⭐ 3 UNIFIED SPEED PRESET CARDS (بطيء / عادي / سريع) ⭐ */}
            <div className="mb-5">
              <div className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  اختر السرعة المطلوبة ثم اضغط زر "تطبيق وتوحيد السرعة" بالأسفل:
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">مزامنة سحابية تلقائية لكافة الأجهزة</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['slow', 'normal', 'fast'] as SpeedPresetKey[]).map((key) => {
                  const p = THREE_SPEED_PRESETS[key];
                  const isSelected =
                    stagedSettings.flashIntervalMs === p.flashIntervalMs &&
                    stagedSettings.timeLimitSeconds === p.timeLimitSeconds;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        soundEngine.playTargetActivate();
                        setStagedSettings({
                          ...stagedSettings,
                          gameSpeedMultiplier: p.multiplier,
                          flashIntervalMs: p.flashIntervalMs,
                          timeLimitSeconds: p.timeLimitSeconds,
                        });
                      }}
                      className={`relative p-4 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer group active:scale-95 ${
                        isSelected
                          ? `bg-slate-900/90 border-2 ${p.borderColor} shadow-[0_0_30px_rgba(236,72,153,0.35)] scale-[1.02]`
                          : 'bg-slate-950/70 border-white/10 hover:border-white/30 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-3xl drop-shadow-md">{p.icon}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.badgeColor}`}>
                          {isSelected ? '✓ المختار حالياً' : p.nameEn}
                        </span>
                      </div>
                      <div>
                        <div className="text-base font-black text-white group-hover:text-cyan-200 transition-colors">
                          {p.nameAr}
                        </div>
                        <div className="text-xs text-cyan-300 font-mono mt-1 font-bold">
                          وميض: {(p.flashIntervalMs / 1000).toFixed(1)}s ({p.flashIntervalMs}ms)
                        </div>
                        <div className="text-[11px] text-purple-300 font-mono mt-0.5">
                          وقت إجابة: {p.timeLimitSeconds} ثوانٍ
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                          {p.taglineAr}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ⭐ زر تطبيق وتوحيد السرعة على جميع الأجهزة ⭐ */}
            <div className="mb-6">
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleAcceptAndApplySpeed}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-70 text-slate-950 font-black text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-3 shadow-[0_0_35px_rgba(16,185,129,0.5)] transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-slate-950 text-emerald-400 flex items-center justify-center font-black shrink-0">
                  {isSyncing ? (
                    <RotateCcw className="w-4 h-4 animate-spin text-emerald-400" />
                  ) : (
                    <Check className="w-5 h-5 stroke-[3]" />
                  )}
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <span className="font-black">
                    {isSyncing
                      ? 'جاري التوحيد والمزامنة السحابية...'
                      : 'تطبيق وتوحيد السرعة على جميع الأجهزة (APPLY & UNIFY)'}
                  </span>
                  <span className="text-xs px-3 py-1 rounded-xl bg-slate-950/80 text-emerald-300 font-mono font-bold border border-emerald-400/40">
                    وميض: {(stagedSettings.flashIntervalMs / 1000).toFixed(2)}s • إجابة: {stagedSettings.timeLimitSeconds}s
                  </span>
                </div>
              </button>
            </div>

            {/* ⏱️ SPEED & DURATION COUNTER CONTROLLERS ⏱️ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              
              {/* 1. Flash Duration Counter (عداد مدة وميض الرقم) */}
              <div className="bg-slate-950/80 border-2 border-cyan-500/40 hover:border-cyan-400/70 transition-all rounded-2xl p-4 sm:p-5 shadow-[0_0_25px_rgba(6,182,212,0.15)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                      عداد سرعة وميض الرقم (Flash Duration)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
                      {stagedSettings.flashIntervalMs < 500 ? '⚡ فائق السرعة' : stagedSettings.flashIntervalMs <= 900 ? '🎯 متوازن قياسي' : '🐢 هادئ للمبتدئين'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-4">
                    المدة الزمنية لظهور كل رقم في المسألة على الشاشة قبل الانتقال للرقم التالي
                  </p>

                  {/* Main Digital Counter Stepper Display */}
                  <div className="flex items-center justify-between gap-3 bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-3 mb-4 shadow-inner">
                    {/* Decrement Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...stagedSettings,
                            flashIntervalMs: Math.max(100, stagedSettings.flashIntervalMs - 100),
                          };
                          syncAndApplySettings(updated);
                        }}
                        className="w-10 h-10 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-white border border-cyan-500/40 flex items-center justify-center font-black text-lg transition-all active:scale-95 cursor-pointer"
                        title="إنقاص 0.1 ثانية (-100ms)"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...stagedSettings,
                            flashIntervalMs: Math.max(100, stagedSettings.flashIntervalMs - 50),
                          };
                          syncAndApplySettings(updated);
                        }}
                        className="px-2 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-cyan-200 border border-white/10 flex items-center justify-center font-bold text-[10px] transition-all active:scale-95 cursor-pointer font-mono"
                        title="إنقاص 0.05 ثانية (-50ms)"
                      >
                        -50ms
                      </button>
                    </div>

                    {/* Central Digital Readout */}
                    <div className="text-center flex-1">
                      <div className="text-3xl sm:text-4xl font-black font-mono text-cyan-300 tracking-tight drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]">
                        {(stagedSettings.flashIntervalMs / 1000).toFixed(2)}
                        <span className="text-xs sm:text-sm font-bold text-cyan-400/80 mr-1">ثانية</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 font-bold">
                        {stagedSettings.flashIntervalMs} مللي ثانية (ms)
                      </div>
                    </div>

                    {/* Increment Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...stagedSettings,
                            flashIntervalMs: Math.min(3000, stagedSettings.flashIntervalMs + 50),
                          };
                          syncAndApplySettings(updated);
                        }}
                        className="px-2 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-cyan-200 border border-white/10 flex items-center justify-center font-bold text-[10px] transition-all active:scale-95 cursor-pointer font-mono"
                        title="زيادة 0.05 ثانية (+50ms)"
                      >
                        +50ms
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...stagedSettings,
                            flashIntervalMs: Math.min(3000, stagedSettings.flashIntervalMs + 100),
                          };
                          syncAndApplySettings(updated);
                        }}
                        className="w-10 h-10 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-white border border-cyan-500/40 flex items-center justify-center font-black text-lg transition-all active:scale-95 cursor-pointer"
                        title="زيادة 0.1 ثانية (+100ms)"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Range Slider for Fast Dragging */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>0.10s (خاطف)</span>
                      <span>1.50s (متوسط)</span>
                      <span>3.00s (هادئ)</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="3000"
                      step="50"
                      value={stagedSettings.flashIntervalMs}
                      onChange={(e) =>
                        setStagedSettings({
                          ...stagedSettings,
                          flashIntervalMs: parseInt(e.target.value, 10),
                        })
                      }
                      onPointerUp={() => syncAndApplySettings(stagedSettings)}
                      className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                    />
                  </div>
                </div>

                {/* Quick Selection Presets Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-3 border-t border-white/10">
                  <span className="text-[10px] font-bold text-slate-400 mr-1">خيارات سريعة:</span>
                  {[
                    { label: '0.3s (300ms)', val: 300 },
                    { label: '0.5s (500ms)', val: 500 },
                    { label: '0.8s (800ms)', val: 800 },
                    { label: '1.0s (1000ms)', val: 1000 },
                    { label: '1.2s (1200ms)', val: 1200 },
                    { label: '1.5s (1500ms)', val: 1500 },
                    { label: '2.0s (2000ms)', val: 2000 },
                  ].map((chip) => (
                    <button
                      key={chip.val}
                      type="button"
                      onClick={() => {
                        const updated = {
                          ...stagedSettings,
                          flashIntervalMs: chip.val,
                        };
                        syncAndApplySettings(updated);
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all border ${
                        stagedSettings.flashIntervalMs === chip.val
                          ? 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.5)] scale-105'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Answer Time Limit Counter (عداد وقت إجابة المسألة) */}
              <div className="bg-slate-950/80 border-2 border-purple-500/40 hover:border-purple-400/70 transition-all rounded-2xl p-4 sm:p-5 shadow-[0_0_25px_rgba(168,85,247,0.15)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-purple-400" />
                      عداد وقت إجابة المسألة (Answer Time Limit)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 font-bold">
                      {stagedSettings.timeLimitSeconds <= 6 ? '⏱️ وقت ضيق' : stagedSettings.timeLimitSeconds <= 15 ? '🎯 وقت قياسي' : '⏳ وقت مريح'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-4">
                    الحد الأقصى المتاح للاعب لإدخال النتيجة وحساب العملية بعد انتهاء وميض الأرقام
                  </p>

                  {/* Main Digital Counter Stepper Display */}
                  <div className="flex items-center justify-between gap-3 bg-slate-900/90 border border-purple-500/30 rounded-2xl p-3 mb-4 shadow-inner">
                    {/* Decrement Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...stagedSettings,
                            timeLimitSeconds: Math.max(3, stagedSettings.timeLimitSeconds - 5),
                          };
                          syncAndApplySettings(updated);
                        }}
                        className="px-2 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-purple-200 border border-white/10 flex items-center justify-center font-bold text-[10px] transition-all active:scale-95 cursor-pointer font-mono"
                        title="إنقاص 5 ثوانٍ"
                      >
                        -5s
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...stagedSettings,
                            timeLimitSeconds: Math.max(2, stagedSettings.timeLimitSeconds - 1),
                          };
                          syncAndApplySettings(updated);
                        }}
                        className="w-10 h-10 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-white border border-purple-500/40 flex items-center justify-center font-black text-lg transition-all active:scale-95 cursor-pointer"
                        title="إنقاص ثانية واحدة (-1s)"
                      >
                        -
                      </button>
                    </div>

                    {/* Central Digital Readout */}
                    <div className="text-center flex-1">
                      <div className="text-3xl sm:text-4xl font-black font-mono text-purple-300 tracking-tight drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]">
                        {stagedSettings.timeLimitSeconds}
                        <span className="text-xs sm:text-sm font-bold text-purple-400/80 mr-1">ثوانٍ</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 font-bold">
                        {stagedSettings.timeLimitSeconds} Seconds
                      </div>
                    </div>

                    {/* Increment Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...stagedSettings,
                            timeLimitSeconds: Math.min(60, stagedSettings.timeLimitSeconds + 1),
                          };
                          syncAndApplySettings(updated);
                        }}
                        className="w-10 h-10 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-white border border-purple-500/40 flex items-center justify-center font-black text-lg transition-all active:scale-95 cursor-pointer"
                        title="زيادة ثانية واحدة (+1s)"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...stagedSettings,
                            timeLimitSeconds: Math.min(60, stagedSettings.timeLimitSeconds + 5),
                          };
                          syncAndApplySettings(updated);
                        }}
                        className="px-2 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-purple-200 border border-white/10 flex items-center justify-center font-bold text-[10px] transition-all active:scale-95 cursor-pointer font-mono"
                        title="زيادة 5 ثوانٍ"
                      >
                        +5s
                      </button>
                    </div>
                  </div>

                  {/* Range Slider for Fast Dragging */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>3s (سريع)</span>
                      <span>15s (قياسي)</span>
                      <span>45s (ممتد)</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="45"
                      step="1"
                      value={stagedSettings.timeLimitSeconds}
                      onChange={(e) =>
                        setStagedSettings({
                          ...stagedSettings,
                          timeLimitSeconds: parseInt(e.target.value, 10),
                        })
                      }
                      onPointerUp={() => syncAndApplySettings(stagedSettings)}
                      className="w-full accent-purple-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                    />
                  </div>
                </div>

                {/* Quick Selection Presets Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-3 border-t border-white/10">
                  <span className="text-[10px] font-bold text-slate-400 mr-1">خيارات سريعة:</span>
                  {[
                    { label: '5s', val: 5 },
                    { label: '8s', val: 8 },
                    { label: '10s', val: 10 },
                    { label: '12s', val: 12 },
                    { label: '15s', val: 15 },
                    { label: '20s', val: 20 },
                    { label: '30s', val: 30 },
                  ].map((chip) => (
                    <button
                      key={chip.val}
                      type="button"
                      onClick={() => {
                        const updated = {
                          ...stagedSettings,
                          timeLimitSeconds: chip.val,
                        };
                        syncAndApplySettings(updated);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all border ${
                        stagedSettings.timeLimitSeconds === chip.val
                          ? 'bg-purple-400 text-slate-950 border-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.5)] scale-105'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ⭐ THE PROMINENT ACCEPT & APPLY BUTTON ⭐ */}
            <div className="mb-5">
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleAcceptAndApplySpeed}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-70 text-slate-950 font-black text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-3 shadow-[0_0_35px_rgba(16,185,129,0.5)] transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-slate-950 text-emerald-400 flex items-center justify-center font-black">
                  {isSyncing ? (
                    <RotateCcw className="w-4 h-4 animate-spin text-emerald-400" />
                  ) : (
                    <Check className="w-4 h-4 stroke-[3]" />
                  )}
                </div>
                <span>
                  {isSyncing
                    ? 'جاري التوحيد والمزامنة مع كافة الأجهزة...'
                    : 'اعتماد وتوحيد السرعة فورياً على جميع الأجهزة / ACCEPT & UNIFY'}
                </span>
                <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-950/70 text-emerald-300 font-mono font-bold border border-emerald-400/40">
                  وميض: {(stagedSettings.flashIntervalMs / 1000).toFixed(2)}s • إجابة: {stagedSettings.timeLimitSeconds}s
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

          {/* Level 0 Excel Question Bank Card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                  <Table className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    بنك أسئلة المستوى 0 (جدول الإكسيل)
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      20 مسألة معتمدة
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    مبني طبقاً لطريقة الفيديو: كل صف يمثل مسألة تومض أرقامها (B إلى F)، والعمود G هو الناتج الصحيح.
                  </p>
                </div>
              </div>

              {/* Table Switcher Tabs */}
              <div className="flex items-center bg-[#0a0f1d] border border-white/10 rounded-xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedTableTab('all')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    selectedTableTab === 'all'
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  الكل (20)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTableTab('table1')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    selectedTableTab === 'table1'
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  جدول 1 (1-10)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTableTab('table2')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    selectedTableTab === 'table2'
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  جدول 2 (11-20)
                </button>
              </div>
            </div>

            {/* Scrollable Excel Table View */}
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#070b14]/90 max-h-80 overflow-y-auto">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-[10px] font-mono text-slate-400 uppercase tracking-wider sticky top-0 backdrop-blur-md">
                    <th className="py-2.5 px-3 text-right">المسألة / الصف</th>
                    <th className="py-2.5 px-2 text-cyan-400">عمود B</th>
                    <th className="py-2.5 px-2 text-cyan-400">عمود C</th>
                    <th className="py-2.5 px-2 text-cyan-400">عمود D</th>
                    <th className="py-2.5 px-2 text-cyan-400">عمود E</th>
                    <th className="py-2.5 px-2 text-cyan-400">عمود F</th>
                    <th className="py-2.5 px-3 text-amber-400 font-bold bg-amber-500/10">الناتج (عمود G)</th>
                    <th className="py-2.5 px-3 text-slate-300">معاينة الوميض</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs font-mono">
                  {TALMAS_LEVEL_0_BANK.filter((_, idx) => {
                    if (selectedTableTab === 'table1') return idx < 10;
                    if (selectedTableTab === 'table2') return idx >= 10;
                    return true;
                  }).map((drill, filteredIdx) => {
                    const actualIdx = selectedTableTab === 'table2' ? filteredIdx + 10 : filteredIdx;
                    const tokens = drill.promptSeq || [];
                    const isPreviewingThis = previewingDrillIdx === actualIdx;

                    return (
                      <tr
                        key={actualIdx}
                        className={`hover:bg-white/5 transition-colors ${
                          isPreviewingThis ? 'bg-emerald-500/15' : ''
                        }`}
                      >
                        <td className="py-2 px-3 text-right font-bold text-slate-300 whitespace-nowrap">
                          <span className="text-[10px] text-slate-500 ml-1">#{String(actualIdx + 1).padStart(2, '0')}</span>
                          <span>تدريب {actualIdx + 1}</span>
                        </td>
                        {tokens.map((tok, tIdx) => {
                          const isNeg = tok.value.startsWith('-');
                          return (
                            <td
                              key={tIdx}
                              className={`py-2 px-2 font-bold ${
                                isNeg ? 'text-rose-400' : 'text-slate-200'
                              }`}
                            >
                              {tok.value}
                            </td>
                          );
                        })}
                        <td className="py-2 px-3 font-black text-amber-300 bg-amber-500/5 text-sm">
                          {drill.answer}
                        </td>
                        <td className="py-2 px-3">
                          <button
                            type="button"
                            onClick={() => previewLevel0Drill(actualIdx, tokens)}
                            disabled={isSimulating}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 mx-auto transition-all ${
                              isPreviewingThis
                                ? 'bg-emerald-400 text-slate-950 font-black scale-105 shadow-[0_0_12px_rgba(52,211,153,0.5)] animate-pulse'
                                : 'bg-white/5 hover:bg-white/10 text-cyan-300 border border-white/10'
                            }`}
                            title="تشغيل تجربة الوميض على لوحة الأرقام أعلاه"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            {isPreviewingThis ? 'يومض الآن...' : 'تجربة'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                المستوى 0 مفعّل ومربوط ببنك الأسئلة في الفردي والثنائي والبطولة
              </span>
              <span className="text-slate-500 text-[10px]">
                سرعة الوميض الحالية: {stagedCalculatedFlashDuration}ms لكل رقم
              </span>
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

          {/* Intellectual Property & License Card (Admin Exclusive) */}
          <div className="bg-gradient-to-br from-pink-950/30 via-slate-900/60 to-purple-950/30 backdrop-blur-xl border border-pink-500/30 rounded-3xl p-5 shadow-[0_0_40px_rgba(236,72,153,0.15)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-300">
                  <Shield className="w-4 h-4 text-pink-400" />
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-black text-white">
                    ملف الترخيص والملكية الفكرية
                  </h3>
                  <p className="text-[10px] text-pink-300/80 font-mono">
                    Mind Sport Commercial License
                  </p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                ✓ مرخّص ومعتمد
              </span>
            </div>

            <div className="text-xs text-slate-300 space-y-1.5 mb-4 text-right">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">الجهة المالكة:</span>
                <span className="font-bold text-white">شركة رياضة العقل (Mind Sport LLC)</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">نوع الترخيص:</span>
                <span className="font-bold text-pink-300">Commercial Proprietary License</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">صلاحية العرض:</span>
                <span className="font-bold text-amber-300">لوحة تحكم الأدمن فقط</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playTargetActivate();
                setShowLicenseModal(true);
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-600/30 to-purple-600/30 hover:from-pink-600/50 hover:to-purple-600/50 border border-pink-500/40 text-pink-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer active:scale-95"
            >
              <FileText className="w-3.5 h-3.5 text-pink-400" />
              <span>عرض نص الترخيص الرسمي كاملاً / View License</span>
            </button>
          </div>

        </div>

      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />

      {/* License Modal - Admin Exclusive */}
      <LicenseModal
        isOpen={showLicenseModal}
        onClose={() => setShowLicenseModal(false)}
      />
    </div>
  );
};

