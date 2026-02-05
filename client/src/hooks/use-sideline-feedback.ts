import { useCallback, useRef, useEffect } from "react";

type FeedbackType = "stat" | "undo" | "success" | "error" | "points";

interface HapticPattern {
  duration: number;
  intensity?: "light" | "medium" | "heavy";
}

const HAPTIC_PATTERNS: Record<FeedbackType, HapticPattern> = {
  stat: { duration: 50, intensity: "medium" },
  undo: { duration: 100, intensity: "light" },
  success: { duration: 200, intensity: "heavy" },
  error: { duration: 300, intensity: "heavy" },
  points: { duration: 75, intensity: "heavy" },
};

const AUDIO_FREQUENCIES: Record<FeedbackType, { freq: number; duration: number }> = {
  stat: { freq: 800, duration: 50 },
  undo: { freq: 400, duration: 100 },
  success: { freq: 1000, duration: 150 },
  error: { freq: 200, duration: 200 },
  points: { freq: 1200, duration: 100 },
};

export function useSidelineFeedback() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundEnabledRef = useRef(true);

  useEffect(() => {
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const triggerHaptic = useCallback((type: FeedbackType) => {
    const pattern = HAPTIC_PATTERNS[type];
    
    if ("vibrate" in navigator) {
      try {
        navigator.vibrate(pattern.duration);
      } catch (e) {
        // Haptic not available on this device
      }
    }
  }, []);

  const playAudioCue = useCallback((type: FeedbackType) => {
    if (!soundEnabledRef.current) return;

    try {
      const ctx = getAudioContext();
      const config = AUDIO_FREQUENCIES[type];
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = config.freq;
      oscillator.type = "sine";
      
      // Quick fade in/out for a softer sound
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + config.duration / 1000);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + config.duration / 1000);
    } catch (e) {
      // Audio not available
    }
  }, [getAudioContext]);

  const triggerFeedback = useCallback((type: FeedbackType) => {
    triggerHaptic(type);
    playAudioCue(type);
  }, [triggerHaptic, playAudioCue]);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    soundEnabledRef.current = enabled;
  }, []);

  return {
    triggerFeedback,
    triggerHaptic,
    playAudioCue,
    setSoundEnabled,
  };
}

// Offline storage for live game events
const OFFLINE_STORAGE_KEY = "caliber_live_game_offline_events";

interface OfflineEvent {
  id: string;
  playerId: number;
  eventType: string;
  timestamp: number;
  synced: boolean;
}

export function useOfflineGameStorage() {
  const getStoredEvents = useCallback((): OfflineEvent[] => {
    try {
      const stored = localStorage.getItem(OFFLINE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const storeEvent = useCallback((event: Omit<OfflineEvent, "id" | "timestamp" | "synced">) => {
    const events = getStoredEvents();
    const newEvent: OfflineEvent = {
      ...event,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      synced: false,
    };
    events.push(newEvent);
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(events));
    return newEvent;
  }, [getStoredEvents]);

  const markEventSynced = useCallback((eventId: string) => {
    const events = getStoredEvents();
    const updated = events.map(e => 
      e.id === eventId ? { ...e, synced: true } : e
    );
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(updated));
  }, [getStoredEvents]);

  const getUnsyncedEvents = useCallback(() => {
    return getStoredEvents().filter(e => !e.synced);
  }, [getStoredEvents]);

  const clearSyncedEvents = useCallback(() => {
    const events = getStoredEvents().filter(e => !e.synced);
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(events));
  }, [getStoredEvents]);

  const clearAllEvents = useCallback(() => {
    localStorage.removeItem(OFFLINE_STORAGE_KEY);
  }, []);

  return {
    storeEvent,
    markEventSynced,
    getUnsyncedEvents,
    clearSyncedEvents,
    clearAllEvents,
    getStoredEvents,
  };
}
