import { AdminSettings } from '../types';
import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export type SpeedPresetKey = 'slow' | 'normal' | 'fast';

export interface SpeedPreset {
  id: SpeedPresetKey;
  nameAr: string;
  nameEn: string;
  taglineAr: string;
  taglineEn: string;
  icon: string; // Emoji
  multiplier: number;
  flashIntervalMs: number;
  timeLimitSeconds: number;
  badgeColor: string;
  borderColor: string;
  bgGradient: string;
}

export const THREE_SPEED_PRESETS: Record<SpeedPresetKey, SpeedPreset> = {
  slow: {
    id: 'slow',
    nameAr: 'بطيء (للمبتدئين)',
    nameEn: 'Slow / Starter',
    taglineAr: 'وميض هادئ ومريح للتدريب وبناء التركيز',
    taglineEn: '1.2s per flash • 15s per question',
    icon: '🐢',
    multiplier: 1.0,
    flashIntervalMs: 1200,
    timeLimitSeconds: 15,
    badgeColor: 'text-emerald-300 bg-emerald-950/80 border-emerald-500/40',
    borderColor: 'border-emerald-500/50',
    bgGradient: 'from-emerald-950/40 via-slate-900/80 to-slate-950',
  },
  normal: {
    id: 'normal',
    nameAr: 'عادي (قياسي)',
    nameEn: 'Normal / Standard',
    taglineAr: 'السرعة المتوازنة المعتمدة للمباريات',
    taglineEn: '0.8s per flash • 10s per question',
    icon: '⚡',
    multiplier: 1.0,
    flashIntervalMs: 800,
    timeLimitSeconds: 10,
    badgeColor: 'text-cyan-300 bg-cyan-950/80 border-cyan-500/40',
    borderColor: 'border-cyan-500/50',
    bgGradient: 'from-cyan-950/40 via-slate-900/80 to-slate-950',
  },
  fast: {
    id: 'fast',
    nameAr: 'سريع (للمحترفين)',
    nameEn: 'Fast / Advanced',
    taglineAr: 'وميض خاطف وتحدي رد فعل فائق للأبطال',
    taglineEn: '0.4s per flash • 6s per question',
    icon: '🚀',
    multiplier: 1.0,
    flashIntervalMs: 400,
    timeLimitSeconds: 6,
    badgeColor: 'text-pink-300 bg-pink-950/80 border-pink-500/40',
    borderColor: 'border-pink-500/50',
    bgGradient: 'from-pink-950/40 via-slate-900/80 to-slate-950',
  },
};

const STORAGE_KEY_ADMIN_SETTINGS = 'mindsport_admin_settings';

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  gameSpeedMultiplier: 1.0,
  flashIntervalMs: 800,
  timeLimitSeconds: 10,
  targetLevel: 3,
  isComplexMode: true,
  questionCount: 10,
  autoAdvanceDelayMs: 600,
};

export function getSettingsFromURL(): Partial<AdminSettings> | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const speedParam = params.get('speed')?.toLowerCase();
    const flashParam = params.get('flash');
    const timeParam = params.get('time');

    if (speedParam && (speedParam === 'slow' || speedParam === 'normal' || speedParam === 'fast')) {
      const preset = THREE_SPEED_PRESETS[speedParam as SpeedPresetKey];
      return {
        gameSpeedMultiplier: preset.multiplier,
        flashIntervalMs: preset.flashIntervalMs,
        timeLimitSeconds: preset.timeLimitSeconds,
      };
    }

    if (flashParam || timeParam) {
      const res: Partial<AdminSettings> = {};
      if (flashParam) {
        const f = Number(flashParam);
        if (!isNaN(f)) res.flashIntervalMs = Math.max(50, Math.min(5000, f));
      }
      if (timeParam) {
        const t = Number(timeParam);
        if (!isNaN(t)) res.timeLimitSeconds = Math.max(2, Math.min(120, t));
      }
      return Object.keys(res).length > 0 ? res : null;
    }
  } catch {
    // ignore
  }
  return null;
}

export function updateURLWithSpeed(settings: AdminSettings): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    const presetKey = getCurrentSpeedPresetKey(settings);
    if (presetKey !== 'custom') {
      url.searchParams.set('speed', presetKey);
      url.searchParams.delete('flash');
      url.searchParams.delete('time');
    } else {
      url.searchParams.delete('speed');
      url.searchParams.set('flash', String(settings.flashIntervalMs));
      url.searchParams.set('time', String(settings.timeLimitSeconds));
    }
    window.history.replaceState({}, '', url.toString());
  } catch {
    // ignore
  }
}

export function generateShareableSpeedLink(settings: AdminSettings): string {
  if (typeof window === 'undefined') return '';
  try {
    const url = new URL(window.location.href);
    const presetKey = getCurrentSpeedPresetKey(settings);
    if (presetKey !== 'custom') {
      url.searchParams.set('speed', presetKey);
      url.searchParams.delete('flash');
      url.searchParams.delete('time');
    } else {
      url.searchParams.delete('speed');
      url.searchParams.set('flash', String(settings.flashIntervalMs));
      url.searchParams.set('time', String(settings.timeLimitSeconds));
    }
    return url.toString();
  } catch {
    return window.location.href;
  }
}

export function getWhatsAppShareURL(settings: AdminSettings): string {
  const link = generateShareableSpeedLink(settings);
  const info = getActiveSpeedInfo(settings);
  const text = `🎮 *رابط لعبة Mind Sport - مسابقة الحساب الذهني*\n⏱ *السرعة الموحدة المعتمدة:* ${info.displayNameAr} (${(info.effectiveFlashMs / 1000).toFixed(2)} ثانية وميض / ${info.timeLimitSec} ثوانٍ إجابة)\n🔗 افتح الرابط وابدأ اللعب فوراً بنفس السرعة على هاتفك أو شاشتك الذكية:\n${link}`;
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}

export function getStoredAdminSettings(): AdminSettings {
  const urlSettings = getSettingsFromURL();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADMIN_SETTINGS);
    const parsed = raw ? JSON.parse(raw) : {};
    const merged: AdminSettings = {
      ...DEFAULT_ADMIN_SETTINGS,
      ...parsed,
      ...(urlSettings || {}),
    };
    if (urlSettings) {
      saveStoredAdminSettings(merged);
    }
    return merged;
  } catch {
    return { ...DEFAULT_ADMIN_SETTINGS, ...(urlSettings || {}) };
  }
}

export function saveStoredAdminSettings(settings: AdminSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_ADMIN_SETTINGS, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

// Inter-tab / local device broadcast channel for instantaneous zero-latency sync
const localBroadcast = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('mindsport_admin_speed_sync')
  : null;

// Registry of local active listeners
const localListeners = new Set<(settings: AdminSettings) => void>();

function notifyLocalListeners(settings: AdminSettings) {
  for (const listener of localListeners) {
    try {
      listener(settings);
    } catch (e) {
      console.error('Error notifying speed listener:', e);
    }
  }
}

// Listen to local inter-tab broadcasts
if (localBroadcast) {
  localBroadcast.onmessage = (event) => {
    if (event.data && event.data.settings) {
      saveStoredAdminSettings(event.data.settings);
      notifyLocalListeners(event.data.settings);
    }
  };
}

/**
 * Fetches the unified admin settings from Cloud Firestore database first,
 * guaranteeing instantaneous sync across all devices worldwide without needing a custom server or link copying.
 */
export async function fetchRemoteAdminSettings(): Promise<AdminSettings | null> {
  // 1. Try Cloud Firestore (works seamlessly on GitHub Pages, mobile, and smart boards)
  try {
    const settingsDocRef = doc(db, 'game_settings', 'global');
    const snap = await getDoc(settingsDocRef);
    if (snap.exists()) {
      const data = snap.data();
      const urlSettings = getSettingsFromURL();
      const merged: AdminSettings = {
        ...DEFAULT_ADMIN_SETTINGS,
        gameSpeedMultiplier: Number(data.gameSpeedMultiplier) || 1.0,
        flashIntervalMs: Number(data.flashIntervalMs) || 800,
        timeLimitSeconds: Number(data.timeLimitSeconds) || 10,
        targetLevel: typeof data.targetLevel === 'number' ? data.targetLevel : 3,
        isComplexMode: data.isComplexMode !== undefined ? Boolean(data.isComplexMode) : true,
        questionCount: Number(data.questionCount) || 10,
        autoAdvanceDelayMs: Number(data.autoAdvanceDelayMs) || 600,
        ...(urlSettings || {}),
      };
      saveStoredAdminSettings(merged);
      notifyLocalListeners(merged);
      return merged;
    }
  } catch (err) {
    console.warn('Firestore fetch failed, checking local server fallback:', err);
  }

  // 2. Fallback to Express backend if hosted with server.ts
  try {
    const res = await fetch(`/api/game-settings?t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success && data.settings) {
          const urlSettings = getSettingsFromURL();
          const merged: AdminSettings = {
            ...DEFAULT_ADMIN_SETTINGS,
            ...data.settings,
            ...(urlSettings || {}),
          };
          saveStoredAdminSettings(merged);
          notifyLocalListeners(merged);
          return merged;
        }
      }
    }
  } catch {
    // Ignore server error on static hosting
  }

  return null;
}

/**
 * Pushes updated settings from the Admin to Cloud Firestore so that
 * all players and devices receive the new speed automatically upon opening.
 */
export async function syncAdminSettingsToServer(settings: AdminSettings): Promise<boolean> {
  saveStoredAdminSettings(settings);
  notifyLocalListeners(settings);

  // Broadcast to other open tabs on the same device immediately
  if (localBroadcast) {
    try {
      localBroadcast.postMessage({ type: 'SPEED_UPDATED', settings });
    } catch {
      // ignore
    }
  }

  let firestoreSuccess = false;

  // 1. Push to Cloud Firestore (Global real-time database)
  try {
    const cleanPayload = {
      flashIntervalMs: Math.max(50, Math.min(5000, Number(settings.flashIntervalMs) || 800)),
      timeLimitSeconds: Math.max(2, Math.min(120, Number(settings.timeLimitSeconds) || 10)),
      gameSpeedMultiplier: Number(settings.gameSpeedMultiplier) || 1.0,
      targetLevel: typeof settings.targetLevel === 'number' ? settings.targetLevel : 3,
      isComplexMode: Boolean(settings.isComplexMode),
      questionCount: Math.max(1, Math.min(100, Number(settings.questionCount) || 10)),
      autoAdvanceDelayMs: Math.max(100, Math.min(5000, Number(settings.autoAdvanceDelayMs) || 600)),
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin',
    };

    const settingsDocRef = doc(db, 'game_settings', 'global');
    await setDoc(settingsDocRef, cleanPayload);
    firestoreSuccess = true;
  } catch (err) {
    console.error('Failed to update Firestore settings:', err);
  }

  // 2. Also push to /api/game-settings if local Express server is running
  try {
    await fetch('/api/game-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ settings }),
    });
  } catch {
    // Static hosting will ignore this
  }

  return firestoreSuccess;
}

/**
 * Subscribes to real-time speed & settings updates.
 * Directly listens to Cloud Firestore onSnapshot for instantaneous cross-device sync on GitHub hosting,
 * along with window focus revalidation.
 */
export function subscribeToRemoteAdminSettings(
  onUpdate: (settings: AdminSettings) => void
): () => void {
  let isCleanedUp = false;
  let unsubscribeFirestore: (() => void) | null = null;
  let eventSource: EventSource | null = null;
  let pollingInterval: NodeJS.Timeout | null = null;

  localListeners.add(onUpdate);

  const handleIncomingSettings = (raw: any) => {
    if (!raw || typeof raw !== 'object') return;
    const urlSettings = getSettingsFromURL();
    const updated: AdminSettings = {
      gameSpeedMultiplier: Number(raw.gameSpeedMultiplier) || 1.0,
      flashIntervalMs: Number(raw.flashIntervalMs) || 800,
      timeLimitSeconds: Number(raw.timeLimitSeconds) || 10,
      targetLevel: typeof raw.targetLevel === 'number' ? raw.targetLevel : 3,
      isComplexMode: raw.isComplexMode !== undefined ? Boolean(raw.isComplexMode) : true,
      questionCount: Number(raw.questionCount) || 10,
      autoAdvanceDelayMs: Number(raw.autoAdvanceDelayMs) || 600,
      ...(urlSettings || {}),
    };
    saveStoredAdminSettings(updated);
    onUpdate(updated);
  };

  // 1. Cloud Firestore Real-time Listener (Active on all devices worldwide)
  try {
    const settingsDocRef = doc(db, 'game_settings', 'global');
    unsubscribeFirestore = onSnapshot(
      settingsDocRef,
      (docSnap) => {
        if (isCleanedUp) return;
        if (docSnap.exists()) {
          handleIncomingSettings(docSnap.data());
        }
      },
      (err) => {
        console.warn('Firestore snapshot error, falling back to polling:', err);
      }
    );
  } catch (e) {
    console.warn('Could not register Firestore listener:', e);
  }

  // 2. Initial fetch to ensure instant display upon opening
  fetchRemoteAdminSettings().then((remote) => {
    if (remote && !isCleanedUp) {
      onUpdate(remote);
    }
  });

  // 3. Fallback SSE (if connected to dev server)
  try {
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      eventSource = new EventSource('/api/game-settings/events');
      eventSource.onmessage = (event) => {
        if (isCleanedUp) return;
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.settings) {
            handleIncomingSettings(parsed.settings);
          }
        } catch {
          // ignore
        }
      };
      eventSource.onerror = () => {
        // SSE reconnects automatically
      };
    }
  } catch {
    // ignore
  }

  // 4. Revalidate whenever device tab gains focus or screen turns on
  const handleFocus = async () => {
    if (isCleanedUp) return;
    const remote = await fetchRemoteAdminSettings();
    if (remote && !isCleanedUp) {
      onUpdate(remote);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleFocus();
      }
    });
  }

  return () => {
    isCleanedUp = true;
    localListeners.delete(onUpdate);
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
      unsubscribeFirestore = null;
    }
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', handleFocus);
    }
  };
}

export function getCurrentSpeedPresetKey(settings: AdminSettings): SpeedPresetKey | 'custom' {
  const effective = Math.max(80, Math.round(settings.flashIntervalMs / (settings.gameSpeedMultiplier || 1.0)));
  if (effective >= 1100) {
    return 'slow';
  }
  if (effective <= 500) {
    return 'fast';
  }
  if (effective >= 650 && effective <= 950) {
    return 'normal';
  }
  return 'custom';
}

export function getActiveSpeedInfo(settings: AdminSettings): {
  presetKey: SpeedPresetKey | 'custom';
  preset: SpeedPreset;
  displayNameAr: string;
  displayNameEn: string;
  effectiveFlashMs: number;
  timeLimitSec: number;
  speedMultiplier: number;
  icon: string;
} {
  const presetKey = getCurrentSpeedPresetKey(settings);
  const effectiveFlashMs = Math.max(80, Math.round(settings.flashIntervalMs / (settings.gameSpeedMultiplier || 1.0)));
  const timeLimitSec = settings.timeLimitSeconds || 10;
  
  if (presetKey !== 'custom') {
    const preset = THREE_SPEED_PRESETS[presetKey];
    return {
      presetKey,
      preset,
      displayNameAr: preset.nameAr,
      displayNameEn: preset.nameEn,
      effectiveFlashMs,
      timeLimitSec,
      speedMultiplier: settings.gameSpeedMultiplier,
      icon: preset.icon,
    };
  }

  return {
    presetKey: 'custom',
    preset: THREE_SPEED_PRESETS.normal,
    displayNameAr: `مخصص (${effectiveFlashMs}ms)`,
    displayNameEn: `Custom (${effectiveFlashMs}ms)`,
    effectiveFlashMs,
    timeLimitSec,
    speedMultiplier: settings.gameSpeedMultiplier,
    icon: '⚙️',
  };
}
