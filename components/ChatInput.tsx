
import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, StopCircle, X, Paperclip, Image as ImageIcon, FileText } from 'lucide-react';
import { Attachment } from '../types';

interface ChatInputProps {
  onSend: (text: string, mode: 'text' | 'voice', attachments?: Attachment[]) => void;
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
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  // Handle Send
  const handleSend = (mode: 'text' | 'voice' = 'text') => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    onSend(text, mode, attachments);
    setText('');
    setAttachments([]);
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
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        if (isSpeaking) onStopSpeaking();
      };

      recognition.onend = () => setIsListening(false);

      recognition.onerror = (event: any) => {
        console.error("Speech error", event.error);
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setText(prev => prev + (prev ? ' ' : '') + finalTranscript);
          silenceTimerRef.current = setTimeout(() => {
             if (recognitionRef.current) recognitionRef.current.stop();
          }, 2000);
        }
      };
      recognitionRef.current = recognition;
    }
    
    return () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [isSpeaking, onStopSpeaking]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      if (text.trim()) setTimeout(() => handleSend('voice'), 200);
    } else {
      setText('');
      recognitionRef.current.start();
    }
  };

  const cancelListening = () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      setText('');
      setIsListening(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          
          if (file.size > 2 * 1024 * 1024) {
             alert("File too large (Max 2MB)");
             return;
          }

          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) {
                  let type: 'image' | 'video' | 'pdf' | 'document' | 'audio' = 'document';
                  if (file.type.startsWith('image/')) type = 'image';
                  else if (file.type.startsWith('video/')) type = 'video';
                  else if (file.type === 'application/pdf') type = 'pdf';
                  else if (file.type.startsWith('audio/')) type = 'audio';

                  setAttachments(prev => [...prev, {
                      id: Date.now().toString(),
                      name: file.name,
                      type,
                      url: ev.target!.result as string,
                      size: (file.size / 1024).toFixed(1) + ' KB'
                  }]);
              }
          };
          reader.readAsDataURL(file);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
      setAttachments(prev => prev.filter(a => a.id !== id));
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
              <button onClick={cancelListening} className="p-2 rounded-full hover:bg-white/20 text-white transition-colors">
                  <X className="w-5 h-5" />
              </button>
              <button onClick={toggleListening} className="p-2 bg-white text-brand-600 rounded-full hover:bg-gray-100 transition-colors font-medium text-sm px-4">
                  Done
              </button>
           </div>
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
          <div className="flex gap-2 mb-2 overflow-x-auto pb-2 px-1">
              {attachments.map(att => (
                  <div key={att.id} className="relative group bg-gray-100 dark:bg-gray-800 rounded-lg p-2 flex items-center gap-2 min-w-[120px] max-w-[200px] border border-gray-200 dark:border-gray-700">
                      {att.type === 'image' ? (
                          <img src={att.url} alt="preview" className="w-8 h-8 rounded object-cover" />
                      ) : (
                          <FileText className="w-8 h-8 text-gray-400 p-1" />
                      )}
                      <span className="text-xs truncate flex-1 dark:text-gray-200">{att.name}</span>
                      <button 
                        onClick={() => removeAttachment(att.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                          <X className="w-3 h-3" />
                      </button>
                  </div>
              ))}
          </div>
      )}

      <div className="relative flex items-end w-full p-3 bg-white dark:bg-gray-700 rounded-xl shadow-lg border border-black/10 dark:border-gray-600 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
        
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileSelect}
        />
        
        <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 mr-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            title="Attach file"
        >
            <Paperclip className="w-5 h-5" />
        </button>

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
                 <button onClick={onStop} className="p-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 transition-colors">
                    <StopCircle className="w-5 h-5 animate-pulse" />
                 </button>
            ) : isSpeaking ? (
                <button onClick={onStopSpeaking} className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 animate-pulse">
                     <span className="flex gap-0.5 items-end h-4">
                        <span className="w-1 bg-current h-2 animate-[pulse_0.5s_ease-in-out_infinite]"></span>
                        <span className="w-1 bg-current h-4 animate-[pulse_0.5s_ease-in-out_0.2s_infinite]"></span>
                        <span className="w-1 bg-current h-3 animate-[pulse_0.5s_ease-in-out_0.4s_infinite]"></span>
                     </span>
               </button>
            ) : (
                <>
                    <button onClick={toggleListening} className="p-2 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">
                        <Mic className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => handleSend('text')}
                        disabled={!text.trim() && attachments.length === 0}
                        className={`p-2 rounded-lg transition-colors ${
                        text.trim() || attachments.length > 0
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
    </div>
  );
};
