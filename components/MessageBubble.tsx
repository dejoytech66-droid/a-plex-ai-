import React from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot, AlertCircle, Volume2, StopCircle, Pin, Heart, ThumbsUp, FileText, Download } from 'lucide-react';
import { Message, Reaction } from '../types';

interface MessageBubbleProps {
  message: Message;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
  onStopSpeak?: () => void;
  onPin?: (id: string) => void;
  onReact?: (id: string, emoji: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
    message, onSpeak, isSpeaking, onStopSpeak, onPin, onReact 
}) => {
  const isUser = message.role === 'user';
  const isError = message.isError;
  
  const handlePlayClick = () => {
    if (isSpeaking && onStopSpeak) {
        onStopSpeak();
    } else if (onSpeak) {
        onSpeak(message.text);
    }
  };

  return (
    <div className={`group w-full text-gray-800 dark:text-gray-100 border-b border-black/10 dark:border-gray-900/50 ${
        isUser ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'
    } ${message.pinned ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}`}>
      
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
                <div className="flex items-center gap-2">
                    <span>{isUser ? 'You' : 'A-Plex AI'}</span>
                    {message.pinned && <Pin className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isUser && !isError && onSpeak && (
                        <button 
                            onClick={handlePlayClick}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                            title="Read aloud"
                        >
                            {isSpeaking ? <StopCircle className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                    )}
                    {onPin && (
                        <button onClick={() => onPin(message.id)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" title="Pin">
                            <Pin className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>
            
            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {message.attachments.map(att => (
                        <a key={att.id} href={att.url} download={att.name} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors no-underline">
                             {att.type === 'image' ? (
                                <img src={att.url} alt={att.name} className="w-10 h-10 object-cover rounded" />
                             ) : (
                                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-gray-500" />
                                </div>
                             )}
                             <div className="flex flex-col max-w-[150px]">
                                <span className="text-xs font-medium truncate dark:text-gray-200">{att.name}</span>
                                <span className="text-[10px] text-gray-500">{att.size}</span>
                             </div>
                             <Download className="w-4 h-4 text-gray-400" />
                        </a>
                    ))}
                </div>
            )}

            {/* Image (Generated) */}
            {message.imageUrl && (
                <div className="mb-3">
                    <img src={message.imageUrl} alt="Generated" className="rounded-lg max-w-full md:max-w-sm border border-gray-200 dark:border-gray-700 shadow-sm" />
                </div>
            )}

            {/* Text */}
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

            {/* Reactions */}
            {message.reactions && Object.keys(message.reactions).length > 0 && (
                <div className="flex gap-1 mt-2">
                    {Object.entries(message.reactions).map(([emoji, reaction]) => (
                        <span key={emoji} className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">
                            {emoji} {(reaction as Reaction).count}
                        </span>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};