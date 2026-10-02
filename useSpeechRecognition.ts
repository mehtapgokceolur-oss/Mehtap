import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionOptions {
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  lang?: string;
  continuous?: boolean;
}

export interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  lang: string;
  setLang: (lang: string) => void;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechRecognition(options?: SpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Default to Turkish or user browser language if Turkish/English
  const defaultLang = typeof navigator !== 'undefined'
    ? (navigator.language.toLowerCase().startsWith('tr') ? 'tr-TR' : 'en-US')
    : 'tr-TR';
  const [lang, setLang] = useState<string>(options?.lang || defaultLang);

  const recognitionRef = useRef<any>(null);
  const isSupported = typeof window !== 'undefined' && Boolean(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );

  const onTranscriptRef = useRef(options?.onTranscript);
  useEffect(() => {
    onTranscriptRef.current = options?.onTranscript;
  }, [options?.onTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore errors on stopping an already stopped instance
      }
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  const startListening = useCallback(() => {
    setError(null);
    if (!isSupported) {
      setError('Web Speech API is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    // Stop any existing instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore
      }
    }

    try {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();
      recognitionRef.current = recognition;

      recognition.continuous = options?.continuous ?? true;
      recognition.interimResults = true;
      recognition.lang = lang;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            currentFinal += item[0].transcript;
          } else {
            currentInterim += item[0].transcript;
          }
        }

        if (currentFinal) {
          setTranscript((prev) => {
            const next = prev ? `${prev} ${currentFinal.trim()}` : currentFinal.trim();
            if (onTranscriptRef.current) {
              onTranscriptRef.current(next, true);
            }
            return next;
          });
          setInterimTranscript('');
        } else if (currentInterim) {
          setInterimTranscript(currentInterim);
          if (onTranscriptRef.current) {
            onTranscriptRef.current(currentInterim, false);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[useSpeechRecognition] Error:', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone permission was denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'no-speech') {
          // No speech detected, keep waiting or stop gracefully
        } else if (event.error === 'audio-capture') {
          setError('No microphone was found or microphone is busy.');
        } else if (event.error === 'network') {
          setError('Network error occurred during speech recognition.');
        } else {
          setError(`Speech error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.start();
    } catch (err: any) {
      console.error('[useSpeechRecognition] Failed to start:', err);
      setError(err?.message || 'Failed to initialize speech recognition.');
      setIsListening(false);
    }
  }, [isSupported, lang, options?.continuous]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Cleanup
        }
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    lang,
    setLang,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
}
