import React, { useState } from 'react';
import { Mic, MicOff, Languages, AlertCircle } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  placeholder?: string;
  className?: string;
  autoAppend?: boolean;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  disabled = false,
  size = 'md',
  className = '',
  autoAppend = true,
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const {
    isListening,
    interimTranscript,
    error,
    isSupported,
    lang,
    setLang,
    toggleListening,
    stopListening,
  } = useSpeechRecognition({
    onTranscript: (spokenText, isFinal) => {
      if (isFinal && spokenText) {
        onTranscript(spokenText);
      }
    },
  });

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    }
    if (showLangMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLangMenu]);

  const sizeClasses = {
    sm: 'h-9 min-w-[36px] px-2.5 text-xs',
    md: 'h-10 min-w-[40px] px-3 text-xs',
    lg: 'h-11 min-w-[44px] px-3.5 text-sm',
  };

  const iconSizes = {
    sm: 15,
    md: 17,
    lg: 19,
  };

  return (
    <div ref={containerRef} className={`relative inline-flex items-center gap-1.5 ${className}`}>
      {/* Listening Wave / Pulse Badge */}
      {isListening && (
        <div className="absolute -top-10 right-0 flex items-center gap-2 bg-neutral-900 text-white text-xs px-3 py-1.5 rounded-full shadow-lg border border-neutral-700 animate-fadeIn z-30 whitespace-nowrap">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="font-medium text-[11px] text-neutral-200">
            {lang.startsWith('tr') ? 'Dinleniyor...' : 'Listening...'}
          </span>
          {interimTranscript && (
            <span className="max-w-[180px] truncate text-neutral-400 italic text-[11px]">
              "{interimTranscript}"
            </span>
          )}
          {/* Animated sound bars */}
          <div className="flex items-center gap-0.5 ml-1">
            <span className="w-0.5 h-2.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-0.5 h-3.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-0.5 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="w-0.5 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
          </div>
          <button
            type="button"
            onClick={stopListening}
            className="ml-1 text-[10px] uppercase font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 px-1.5 py-0.5 rounded cursor-pointer transition"
          >
            {lang.startsWith('tr') ? 'Bitti' : 'Done'}
          </button>
        </div>
      )}

      {/* Language Selector Dropdown Button */}
      <div className="relative">
        <button
          type="button"
          disabled={disabled || isListening}
          onClick={() => setShowLangMenu((prev) => !prev)}
          title={`Speech Recognition Language: ${lang}`}
          aria-label="Change voice input language"
          className="flex items-center gap-1 h-9 px-2 text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200/60 rounded-xl transition disabled:opacity-40 cursor-pointer"
        >
          <Languages size={13} />
          <span>{lang.startsWith('tr') ? 'TR' : 'EN'}</span>
        </button>

        {showLangMenu && (
          <div className="absolute bottom-full mb-1.5 left-0 bg-white border border-neutral-200 rounded-xl shadow-lg py-1 z-40 text-xs w-28 overflow-hidden">
            <button
              type="button"
              onClick={() => {
                setLang('tr-TR');
                setShowLangMenu(false);
              }}
              className={`w-full text-left px-3 py-1.5 hover:bg-neutral-50 flex items-center justify-between cursor-pointer ${
                lang.startsWith('tr') ? 'font-semibold text-io-blue' : 'text-neutral-700'
              }`}
            >
              <span>Türkçe</span>
              <span className="text-[10px] text-neutral-400">tr-TR</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLang('en-US');
                setShowLangMenu(false);
              }}
              className={`w-full text-left px-3 py-1.5 hover:bg-neutral-50 flex items-center justify-between cursor-pointer ${
                lang.startsWith('en') ? 'font-semibold text-io-blue' : 'text-neutral-700'
              }`}
            >
              <span>English</span>
              <span className="text-[10px] text-neutral-400">en-US</span>
            </button>
          </div>
        )}
      </div>

      {/* Microphone Toggle Button */}
      <button
        type="button"
        disabled={disabled || !isSupported}
        onClick={toggleListening}
        aria-label={isListening ? 'Stop recording voice' : 'Start voice input'}
        title={
          !isSupported
            ? 'Web Speech API is not supported in this browser. Please use Chrome or Edge.'
            : isListening
            ? 'Stop recording voice'
            : `Voice Input (${lang.startsWith('tr') ? 'Sesle Soru Sor' : 'Speak to AI'})`
        }
        className={`flex items-center justify-center rounded-xl font-medium transition cursor-pointer relative ${sizeClasses[size]} ${
          isListening
            ? 'bg-red-500 text-white shadow-md shadow-red-500/20 ring-2 ring-red-300 animate-pulse'
            : !isSupported
            ? 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-900 border border-neutral-200/80 active:scale-95'
        }`}
      >
        {isListening ? (
          <MicOff size={iconSizes[size]} />
        ) : (
          <Mic size={iconSizes[size]} />
        )}
      </button>

      {/* Error message tooltip */}
      {error && (
        <div className="absolute bottom-full mb-2 right-0 bg-red-600 text-white text-[11px] rounded-lg p-2.5 shadow-lg max-w-xs z-50 flex items-start gap-1.5 leading-snug">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
