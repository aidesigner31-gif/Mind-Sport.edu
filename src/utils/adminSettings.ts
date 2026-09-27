import { AdminSettings } from '../types';

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
    multiplier: 0.7,
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
    multiplier: 1.5,
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

export function getStoredAdminSettings(): AdminSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADMIN_SETTINGS);
    if (!raw) return DEFAULT_ADMIN_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_ADMIN_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_ADMIN_SETTINGS;
  }
}

export function saveStoredAdminSettings(settings: AdminSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_ADMIN_SETTINGS, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

/**
 * Fetches the unified admin settings from the central server.
 * This guarantees all devices get the exact speed set by the admin.
 */
export async function fetchRemoteAdminSettings(): Promise<AdminSettings | null> {
  try {
    const res = await fetch('/api/game-settings', {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && data.settings) {
      const merged: AdminSettings = { ...DEFAULT_ADMIN_SETTINGS, ...data.settings };
      saveStoredAdminSettings(merged);
      return merged;
    }
  } catch (err) {
    console.warn('Could not fetch remote admin settings, using local cache:', err);
  }
  return null;
}

/**
 * Pushes updated settings from the Admin to the central server so that
 * all players and devices receive the new speed and settings immediately.
 */
export async function syncAdminSettingsToServer(settings: AdminSettings): Promise<boolean> {
  saveStoredAdminSettings(settings);
  try {
    const res = await fetch('/api/game-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error('Failed to sync settings to server:', err);
    return false;
  }
}

/**
 * Subscribes to real-time speed & settings updates from the server.
 * Uses Server-Sent Events (SSE) for instant cross-device updates,
 * along with window focus revalidation and periodic fallback polling.
 */
export function subscribeToRemoteAdminSettings(
  onUpdate: (settings: AdminSettings) => void
): () => void {
  let isCleanedUp = false;
  let eventSource: EventSource | null = null;
  let pollingInterval: NodeJS.Timeout | null = null;

  const handleIncomingSettings = (raw: any) => {
    if (!raw || typeof raw !== 'object') return;
    const updated: AdminSettings = {
      gameSpeedMultiplier: Number(raw.gameSpeedMultiplier) || 1.0,
      flashIntervalMs: Number(raw.flashIntervalMs) || 800,
      timeLimitSeconds: Number(raw.timeLimitSeconds) || 10,
      targetLevel: typeof raw.targetLevel === 'number' ? raw.targetLevel : 3,
      isComplexMode: Boolean(raw.isComplexMode),
      questionCount: Number(raw.questionCount) || 10,
      autoAdvanceDelayMs: Number(raw.autoAdvanceDelayMs) || 600,
    };
    saveStoredAdminSettings(updated);
    onUpdate(updated);
  };

  // 1. Initial fetch
  fetchRemoteAdminSettings().then((remote) => {
    if (remote && !isCleanedUp) {
      onUpdate(remote);
    }
  });

  // 2. Setup Server-Sent Events (SSE) for instantaneous multi-device broadcast
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
          // heartbeat or unparseable
        }
      };

      eventSource.onerror = () => {
        // SSE reconnects automatically
      };
    }
  } catch (e) {
    console.warn('SSE subscription failed, falling back to polling:', e);
  }

  // 3. Fallback short polling (every 5 seconds) to ensure all devices stay in sync
  pollingInterval = setInterval(async () => {
    if (isCleanedUp) return;
    const remote = await fetchRemoteAdminSettings();
    if (remote && !isCleanedUp) {
      onUpdate(remote);
    }
  }, 5000);

  // 4. Revalidate whenever device tab gains focus or user switches back to browser
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
  if (settings.flashIntervalMs >= 1100 || settings.gameSpeedMultiplier <= 0.75) {
    return 'slow';
  }
  if (settings.flashIntervalMs <= 450 || settings.gameSpeedMultiplier >= 1.4) {
    return 'fast';
  }
  if (
    settings.flashIntervalMs >= 650 &&
    settings.flashIntervalMs <= 950 &&
    settings.gameSpeedMultiplier >= 0.85 &&
    settings.gameSpeedMultiplier <= 1.2
  ) {
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

  // Custom fallback
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
