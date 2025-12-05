import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, StopCircle, X } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string, mode: 'text' | 'voice') => void;
  isLoading: boolean;
  onStop: () => void;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSend, 
  isLoading, 
  onStop,
  isSpeaking,
  onStopSpeaking
}) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  // Use ReturnType<typeof setTimeout> to handle both browser (number) and Node (object) environments without implicit NodeJS namespace
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  // Handle Send
  const handleSend = (mode: 'text' | 'voice' = 'text') => {
    if (!text.trim() || isLoading) return;
    onSend(text, mode);
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend('text');
    }
  };

  // Setup Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Keep listening until we manually stop or detect silence
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        if (isSpeaking) onStopSpeaking(); // Stop AI from talking if user starts
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech error", event.error);
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        // Clear existing silence timer on new input
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setText(prev => {
             const newVal = prev + (prev ? ' ' : '') + finalTranscript;
             return newVal;
          });
          
          // Auto-send after 2 seconds of silence if we have final results
          silenceTimerRef.current = setTimeout(() => {
             if (recognitionRef.current) recognitionRef.current.stop();
             // We need to wait a tick for the state to update, or use the value directly.
             // Since setText is async, we pass the known transcript if needed, but 
             // for simplicity, the user effect or manual trigger is safer. 
             // Here we rely on the user manually stopping or this timer stopping the mic.
             // The actual send happens in the separate useEffect below designed for auto-send logic
             // or we can just trigger it here if we refactor.
             
             // Let's just stop the mic here. The `toggleListening` logic handles the "stop" action.
          }, 2000);
        }
      };
      recognitionRef.current = recognition;
    }
    
    return () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [isSpeaking, onStopSpeaking]);

  // Separate effect to handle "Auto Send" when listening stops naturally and we have text
  // However, explicit user control is often better. Let's make the stop button send.

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      // User manually stopped. If there is text, send it as voice message.
      recognitionRef.current.stop();
      if (text.trim()) {
        // Small delay to ensure state is settled
        setTimeout(() => handleSend('voice'), 200);
      }
    } else {
      // Start listening
      setText(''); // Clear previous text for a fresh voice command
      recognitionRef.current.start();
    }
  };

  const cancelListening = () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      setText('');
      setIsListening(false);
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 relative">
      {/* Voice Mode Overlay */}
      {isListening && (
        <div className="absolute inset-x-4 bottom-4 top-4 bg-brand-500/95 backdrop-blur-sm rounded-xl z-20 flex items-center justify-between px-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-200">
           <div className="flex items-center gap-4 text-white">
              <div className="relative flex items-center justify-center w-10 h-10">
                  <span className="absolute w-full h-full bg-white rounded-full opacity-20 animate-ping"></span>
                  <Mic className="w-6 h-6 z-10" />
              </div>
              <div className="flex flex-col">
                  <span className="font-semibold">Listening...</span>
                  <span className="text-xs opacity-80 truncate max-w-[200px]">{text || "Speak now"}</span>
              </div>
           </div>
           
           <div className="flex items-center gap-2">
              <button 
                onClick={cancelListening}
                className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
              >
                  <X className="w-5 h-5" />
              </button>
              <button 
                onClick={toggleListening}
                className="p-2 bg-white text-brand-600 rounded-full hover:bg-gray-100 transition-colors font-medium text-sm px-4"
              >
                  Done
              </button>
           </div>
        </div>
      )}

      <div className="relative flex items-end w-full p-3 bg-white dark:bg-gray-700 rounded-xl shadow-lg border border-black/10 dark:border-gray-600 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
        
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Send a message..."
          rows={1}
          className="w-full max-h-[200px] py-2 px-2 bg-transparent border-0 focus:ring-0 resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 leading-6 outline-none"
          disabled={isLoading}
        />

        <div className="flex items-center gap-2 ml-2 pb-1">
            {isLoading ? (
                 <button
                 onClick={onStop}
                 className="p-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 transition-colors"
                 title="Stop generating"
               >
                 <StopCircle className="w-5 h-5 animate-pulse" />
               </button>
            ) : isSpeaking ? (
                <button
                 onClick={onStopSpeaking}
                 className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 animate-pulse"
                 title="Stop Speaking"
               >
                 <span className="flex gap-0.5 items-end h-4">
                    <span className="w-1 bg-current h-2 animate-[pulse_0.5s_ease-in-out_infinite]"></span>
                    <span className="w-1 bg-current h-4 animate-[pulse_0.5s_ease-in-out_0.2s_infinite]"></span>
                    <span className="w-1 bg-current h-3 animate-[pulse_0.5s_ease-in-out_0.4s_infinite]"></span>
                 </span>
               </button>
            ) : (
                <>
                    <button
                        onClick={toggleListening}
                        className={`p-2 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600`}
                        title="Voice Input"
                    >
                        <Mic className="w-5 h-5" />
                    </button>
                    
                    <button
                        onClick={() => handleSend('text')}
                        disabled={!text.trim()}
                        className={`p-2 rounded-lg transition-colors ${
                        text.trim() 
                            ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm' 
                            : 'bg-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        }`}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </>
            )}
        </div>
      </div>
      <div className="text-center mt-2 text-xs text-gray-400 dark:text-gray-500">
        A-Plex AI may display inaccurate info, including about people, so double-check its responses.
      </div>
    </div>
  );
};