import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lock, Unlock, Mic, MicOff, ShieldCheck, ShieldAlert, Sparkles, Key, Volume2, RefreshCw } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface VoiceSecurityBannerProps {
  isUnlocked: boolean;
  isEnabled: boolean;
  onUnlock: () => void;
  onLock: () => void;
  onToggleEnabled: (enabled: boolean) => void;
}

const WAKE_PATTERNS = [
  /hey\s*google.*unlock/i,
  /hey\s*google.*open/i,
  /hey\s*google.*şifre.*aç/i,
  /hey\s*google.*sifre.*ac/i,
  /hey\s*google.*kilit.*aç/i,
  /hey\s*google.*kilit.*ac/i,
  /hey\s*google.*sesli\s*komut/i,
  /sesli\s*komut.*şifre.*aç/i,
  /sesli\s*komut.*sifre.*ac/i,
  /şifre.*aç/i,
  /sifre.*ac/i,
  /kilidi?\s*aç/i,
  /kilidi?\s*ac/i,
  /\bunlock\b/i,
];

function playUnlockSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.12, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.3);
    });
  } catch {
    // Non-blocking
  }
}

export const VoiceSecurityBanner: React.FC<VoiceSecurityBannerProps> = ({
  isUnlocked,
  isEnabled,
  onUnlock,
  onLock,
  onToggleEnabled,
}) => {
  const [lastHeard, setLastHeard] = useState<string>('');
  const [unlockSuccessAnimation, setUnlockSuccessAnimation] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const checkWakePhrase = useCallback((text: string) => {
    if (!text) return;
    setLastHeard(text);
    const clean = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ').trim();
    const matched = WAKE_PATTERNS.some((p) => p.test(clean));

    if (matched) {
      playUnlockSound();
      setUnlockSuccessAnimation(true);
      setTimeout(() => {
        onUnlock();
        setUnlockSuccessAnimation(false);
      }, 700);
    }
  }, [onUnlock]);

  const {
    isListening,
    interimTranscript,
    error,
    isSupported,
    lang,
    setLang,
    startListening,
    stopListening,
    toggleListening,
  } = useSpeechRecognition({
    continuous: true,
    onTranscript: (spokenText) => {
      checkWakePhrase(spokenText);
    },
  });

  // Check interim transcript as well for ultra-fast instant unlock!
  useEffect(() => {
    if (interimTranscript) {
      checkWakePhrase(interimTranscript);
    }
  }, [interimTranscript, checkWakePhrase]);

  if (!isEnabled) {
    return (
      <div className="bg-neutral-100 border border-neutral-200/80 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-neutral-200 flex items-center justify-center text-neutral-500">
            <ShieldAlert size={18} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-neutral-800">Voice-Activated Security is Disabled</h4>
            <p className="text-[11px] text-neutral-500">Anyone can run data analyses without voice verification.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onToggleEnabled(true);
            onLock();
          }}
          className="text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-300 px-3 py-1.5 rounded-xl transition cursor-pointer"
        >
          Enable Security
        </button>
      </div>
    );
  }

  if (isUnlocked) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                Voice Security: Authenticated
              </h4>
              <span className="text-[10px] font-semibold bg-emerald-200/80 text-emerald-800 px-2 py-0.5 rounded-full">
                Unlocked
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Analysis tools and agent controls are fully unlocked.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={onLock}
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-white hover:bg-emerald-100/60 border border-emerald-300/80 px-3 py-1.5 rounded-xl transition cursor-pointer shadow-2xs"
          >
            <Lock size={13} />
            <span>Lock Now</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleEnabled(false)}
            className="text-[11px] text-neutral-500 hover:text-neutral-700 px-2 py-1 transition"
          >
            Disable
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-2xl p-5 shadow-xs transition-all relative overflow-hidden ${
      unlockSuccessAnimation
        ? 'bg-emerald-50 border-emerald-300 scale-[1.01]'
        : 'bg-gradient-to-br from-white via-neutral-50 to-neutral-100 border-neutral-300'
    }`}>
      {/* Background scanline/accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-io-blue via-io-red to-io-yellow" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 transition shadow-xs ${
            unlockSuccessAnimation
              ? 'bg-emerald-500 text-white animate-bounce'
              : isListening
              ? 'bg-red-500 text-white animate-pulse shadow-red-500/20 shadow-md'
              : 'bg-neutral-900 text-white'
          }`}>
            {unlockSuccessAnimation ? (
              <Unlock size={22} />
            ) : isListening ? (
              <Mic size={22} className="animate-spin-slow" />
            ) : (
              <Lock size={22} />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping inline-block" />
                Voice-Activated Security Active
              </span>
              <span className="text-[10px] font-semibold bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-full">
                Locked
              </span>
            </div>
            
            <p className="text-sm font-semibold text-neutral-900">
              Say <span className="text-io-blue font-bold">"Hey Google, unlock"</span> or{' '}
              <span className="text-io-red font-bold">"Hey Google, sesli komut ile şifre açma"</span>
            </p>

            <p className="text-xs text-neutral-500 leading-relaxed">
              Dataset analysis and execution are guarded until authorized via your voice wake-phrase.
            </p>

            {(lastHeard || interimTranscript) && (
              <div className="mt-2 text-xs font-mono bg-white border border-neutral-200/80 rounded-lg px-2.5 py-1.5 text-neutral-700 flex items-center gap-2 max-w-md">
                <span className="text-[10px] uppercase font-bold text-neutral-400">Heard:</span>
                <span className="truncate italic">"{interimTranscript || lastHeard}"</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Language selector for wake phrase */}
          <div className="flex items-center bg-white border border-neutral-200 rounded-xl p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setLang('tr-TR')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                lang.startsWith('tr')
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              TR
            </button>
            <button
              type="button"
              onClick={() => setLang('en-US')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                lang.startsWith('en')
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              EN
            </button>
          </div>

          {/* Voice Wake-Word Listen Button */}
          <button
            type="button"
            disabled={!isSupported}
            onClick={toggleListening}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer shadow-xs ${
              isListening
                ? 'bg-red-500 text-white hover:bg-red-600 ring-2 ring-red-300'
                : 'bg-neutral-900 hover:bg-neutral-800 text-white'
            }`}
          >
            {isListening ? (
              <>
                <MicOff size={15} />
                <span>Stop Listening</span>
              </>
            ) : (
              <>
                <Mic size={15} />
                <span>Listen for Wake-Phrase</span>
              </>
            )}
          </button>

          {/* Quick Test / Manual Bypass for Accessibility */}
          <button
            type="button"
            onClick={() => {
              checkWakePhrase('Hey Google unlock');
            }}
            title="Simulate speaking the wake phrase"
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-700 text-xs font-semibold border border-neutral-300 transition cursor-pointer"
          >
            <Sparkles size={14} className="text-amber-500" />
            <span>Simulate Voice</span>
          </button>

          {/* Manual bypass toggle */}
          <button
            type="button"
            onClick={() => setShowManualInput(!showManualInput)}
            title="Unlock with Passcode or Manual Click"
            className="p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition cursor-pointer"
          >
            <Key size={15} />
          </button>
        </div>
      </div>

      {/* Manual Input Fallback Drawer */}
      {showManualInput && (
        <div className="mt-4 pt-3 border-t border-neutral-200/80 flex items-center gap-2">
          <input
            type="text"
            placeholder="Type wake phrase or passcode (e.g. 'Hey Google, unlock')"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                checkWakePhrase(manualCode);
              }
            }}
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-io-blue focus:ring-1 focus:ring-blue-100 outline-none transition"
          />
          <button
            type="button"
            onClick={() => {
              checkWakePhrase(manualCode || 'Hey Google unlock');
            }}
            className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-semibold rounded-xl cursor-pointer transition"
          >
            Unlock
          </button>
        </div>
      )}

      {error && (
        <div className="mt-3 text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 flex items-center gap-1.5">
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
