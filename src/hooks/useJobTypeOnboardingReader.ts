import { useCallback, useEffect, useRef, useState } from 'react';

const TICK_MS = 250;

interface UseJobTypeOnboardingReaderOptions {
  speechText: string;
  requiredMs: number;
  active: boolean;
}

export function useJobTypeOnboardingReader({
  speechText,
  requiredMs,
  active,
}: UseJobTypeOnboardingReaderOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const tickRef = useRef<number | null>(null);
  const lastTickAtRef = useRef<number | null>(null);

  const speechSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  const cancelSpeech = useCallback(() => {
    if (!speechSupported) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
  }, [speechSupported]);

  const reset = useCallback(() => {
    cancelSpeech();
    setIsPlaying(false);
    setIsPaused(false);
    setIsMuted(false);
    setElapsedMs(0);
    lastTickAtRef.current = null;
  }, [cancelSpeech]);

  const startSpeech = useCallback(() => {
    if (!speechSupported || !speechText.trim()) return;

    cancelSpeech();

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = isMuted ? 0 : 1;

    utterance.onend = () => {
      utteranceRef.current = null;
      if (!isPaused) {
        setIsPlaying(false);
      }
    };

    utterance.onerror = () => {
      utteranceRef.current = null;
      setIsPlaying(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [cancelSpeech, isMuted, isPaused, speechSupported, speechText]);

  const play = useCallback(() => {
    if (!active) return;

    if (speechSupported) {
      if (window.speechSynthesis.paused && utteranceRef.current) {
        utteranceRef.current.volume = isMuted ? 0 : 1;
        window.speechSynthesis.resume();
      } else if (!window.speechSynthesis.speaking) {
        startSpeech();
      }
    }

    setIsPaused(false);
    setIsPlaying(true);
    lastTickAtRef.current = performance.now();
  }, [active, isMuted, speechSupported, startSpeech]);

  const pause = useCallback(() => {
    if (speechSupported && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
    setIsPaused(true);
    setIsPlaying(false);
    lastTickAtRef.current = null;
  }, [speechSupported]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (utteranceRef.current) {
        utteranceRef.current.volume = next ? 0 : 1;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!active) {
      reset();
      return;
    }

    reset();
    const startId = window.setTimeout(() => {
      play();
    }, 350);

    return () => {
      window.clearTimeout(startId);
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset/play only when sheet opens
  }, [active, speechText, requiredMs]);

  useEffect(() => {
    if (!active || isPaused) {
      if (tickRef.current != null) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
      lastTickAtRef.current = null;
      return;
    }

    lastTickAtRef.current = performance.now();
    tickRef.current = window.setInterval(() => {
      const now = performance.now();
      const last = lastTickAtRef.current ?? now;
      const delta = now - last;
      lastTickAtRef.current = now;
      setElapsedMs((prev) => Math.min(requiredMs, prev + delta));
    }, TICK_MS);

    return () => {
      if (tickRef.current != null) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [active, isPaused, requiredMs]);

  const remainingMs = Math.max(0, requiredMs - elapsedMs);
  const readComplete = elapsedMs >= requiredMs;
  const progressPct = requiredMs <= 0 ? 100 : Math.min(100, Math.round((elapsedMs / requiredMs) * 100));

  return {
    speechSupported,
    isPlaying,
    isPaused,
    isMuted,
    elapsedMs,
    requiredMs,
    remainingMs,
    readComplete,
    progressPct,
    play,
    pause,
    toggleMute,
    reset,
  };
}
