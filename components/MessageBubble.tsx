import React from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot, AlertCircle, Volume2, StopCircle } from 'lucide-react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
  onStopSpeak?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onSpeak, isSpeaking, onStopSpeak }) => {
  const isUser = message.role === 'user';
  const isError = message.isError;
  
  // We don't have a unique ID for current speaking message in global state for simplicity,
  // but usually users play one at a time. We can just check global isSpeaking.
  // Ideally, we match message ID, but for this feature set, a global toggle is acceptable UX.

  const handlePlayClick = () => {
    if (isSpeaking && onStopSpeak) {
        onStopSpeak();
    } else if (onSpeak) {
        onSpeak(message.text);
    }
  };

  return (
    <div className={`group w-full text-gray-800 dark:text-gray-100 border-b border-black/10 dark:border-gray-900/50 ${isUser ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}`}>
      <div className="max-w-3xl mx-auto p-4 md:p-6 flex gap-4 md:gap-6">
        
        {/* Avatar */}
        <div className="flex-shrink-0 flex flex-col relative items-end">
          <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${isUser ? 'bg-transparent' : 'bg-green-500'}`}>
            {isUser ? (
               <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-sm flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500 dark:text-gray-300" />
               </div>
            ) : isError ? (
                <div className="w-8 h-8 bg-red-500 rounded-sm flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
            ) : (
                <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-sm flex items-center justify-center shadow-md">
                   <Bot className="w-5 h-5 text-white" />
                </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="relative flex-1 overflow-hidden">
            <div className={`font-semibold text-sm mb-1 opacity-90 flex items-center justify-between ${isUser ? 'text-gray-600 dark:text-gray-300' : 'text-blue-600 dark:text-blue-400'}`}>
                <span>{isUser ? 'You' : 'A-Plex AI'}</span>
                
                {/* TTS Control for AI messages */}
                {!isUser && !isError && onSpeak && (
                    <button 
                        onClick={handlePlayClick}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        title="Read aloud"
                    >
                        {isSpeaking ? (
                            <StopCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        ) : (
                            <Volume2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        )}
                    </button>
                )}
            </div>
            
            <div className="prose dark:prose-invert max-w-none leading-relaxed markdown-body text-[15px] md:text-base break-words">
                {isError ? (
                    <p className="text-red-500">{message.text}</p>
                ) : (
                    <ReactMarkdown
                        components={{
                            code({node, className, children, ...props}) {
                                return (
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                )
                            }
                        }}
                    >
                        {message.text}
                    </ReactMarkdown>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};