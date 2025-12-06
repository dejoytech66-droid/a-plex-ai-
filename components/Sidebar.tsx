
import React from 'react';
import { Plus, MessageSquare, Trash2, Moon, Sun, Download, LogOut, User, FolderKanban, Settings, Users, MessageCircle, Key } from 'lucide-react';
import { ChatSession, Theme } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onNewGroup: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  onClearAll: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  onDownloadChat: () => void;
  userEmail?: string | null;
  onSignOut: () => void;
  currentView: 'chat' | 'projects';
  onChangeView: (view: 'chat' | 'projects') => void;
  onOpenSettings: () => void;
  onOpenKeyModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onNewChat,
  onNewGroup,
  onSelectSession,
  onDeleteSession,
  onClearAll,
  theme,
  onToggleTheme,
  onDownloadChat,
  userEmail,
  onSignOut,
  currentView,
  onChangeView,
  onOpenSettings,
  onOpenKeyModal
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-[260px] bg-gray-900 text-gray-100 flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 border-r border-gray-800
      `}>
        
        {/* Navigation Tabs */}
        <div className="flex p-2 gap-2 border-b border-gray-800">
             <button
                onClick={() => { onChangeView('chat'); if(window.innerWidth < 768) onClose(); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'chat' 
                    ? 'bg-brand-600 text-white' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
             >
                <MessageSquare className="w-4 h-4" />
                Chats
             </button>
             <button
                onClick={() => { onChangeView('projects'); if(window.innerWidth < 768) onClose(); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'projects' 
                    ? 'bg-brand-600 text-white' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
             >
                <FolderKanban className="w-4 h-4" />
                Projects
             </button>
        </div>

        {currentView === 'chat' ? (
            <>
                {/* Header / New Chat */}
                <div className="p-3 flex-shrink-0 space-y-2">
                    <button
                        onClick={() => {
                            onNewChat();
                            if (window.innerWidth < 768) onClose();
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-md border border-white/20 hover:bg-white/10 transition-colors duration-200 text-sm text-white"
                    >
                        <Plus className="w-4 h-4" />
                        New chat
                    </button>
                    <button
                        onClick={() => {
                            onNewGroup();
                            if (window.innerWidth < 768) onClose();
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-md bg-purple-900/40 hover:bg-purple-900/60 border border-purple-500/30 transition-colors duration-200 text-sm text-purple-200"
                    >
                        <Users className="w-4 h-4" />
                        New Group
                    </button>
                </div>

                {/* Chat History List */}
                <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin scrollbar-thumb-gray-700">
                <div className="text-xs font-semibold text-gray-500 mb-3 px-2">History</div>
                <div className="flex flex-col gap-2">
                    {sessions.map((session) => (
                    <button
                        key={session.id}
                        onClick={() => {
                            onSelectSession(session.id);
                            if (window.innerWidth < 768) onClose();
                        }}
                        className={`group flex items-center gap-3 px-3 py-3 rounded-md text-sm transition-colors duration-200 relative overflow-hidden
                        ${currentSessionId === session.id ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5'}
                        `}
                    >
                        {session.type === 'group' ? <Users className="w-4 h-4 flex-shrink-0 text-purple-400" /> : <MessageSquare className="w-4 h-4 flex-shrink-0" />}
                        <span className="flex-1 text-left truncate relative z-10">
                            {session.title || (session.type === 'group' ? session.groupMetadata?.name : 'New Chat')}
                        </span>
                        
                        {(currentSessionId === session.id || true) && (
                        <div 
                            className="absolute right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 shadow-xl pl-2"
                            onClick={(e) => onDeleteSession(e, session.id)}
                        >
                            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                        </div>
                        )}
                    </button>
                    ))}
                    {sessions.length === 0 && (
                        <div className="text-center text-gray-500 text-xs py-10">
                            No chat history
                        </div>
                    )}
                </div>
                </div>
            </>
        ) : (
             <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-500 space-y-4">
                 <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                    <FolderKanban className="w-8 h-8 opacity-50" />
                 </div>
                 <p className="text-sm">Manage your projects in the main view.</p>
                 <button 
                   onClick={() => { if(window.innerWidth < 768) onClose(); }}
                   className="text-xs text-brand-400 hover:text-brand-300 underline"
                 >
                    Close Sidebar
                 </button>
             </div>
        )}

        {/* Footer / Settings */}
        <div className="p-3 border-t border-white/10 space-y-1">
          {userEmail && (
             <div className="px-3 py-2 flex items-center gap-3 text-xs text-gray-400 mb-1 truncate">
                <User className="w-3 h-3" />
                <span className="truncate">{userEmail}</span>
             </div>
          )}

          {currentView === 'chat' && (
            <>
                <button 
                    onClick={onDownloadChat}
                    className="flex items-center gap-3 w-full px-3 py-3 rounded-md hover:bg-white/10 text-sm text-gray-100 transition-colors text-left"
                >
                    <Download className="w-4 h-4" />
                    Download Chat
                </button>
                
                <button 
                    onClick={onClearAll}
                    className="flex items-center gap-3 w-full px-3 py-3 rounded-md hover:bg-white/10 text-sm text-gray-100 transition-colors text-left"
                >
                    <Trash2 className="w-4 h-4" />
                    Clear all chats
                </button>
            </>
          )}

          <button 
             onClick={onOpenSettings}
             className="flex items-center gap-3 w-full px-3 py-3 rounded-md hover:bg-white/10 text-sm text-gray-100 transition-colors text-left"
          >
            <Settings className="w-4 h-4" />
            Settings & Privacy
          </button>
          
          {onOpenKeyModal && (
            <button 
                onClick={onOpenKeyModal}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-md hover:bg-white/10 text-sm text-gray-100 transition-colors text-left"
            >
                <Key className="w-4 h-4" />
                Update API Key
            </button>
          )}

          <button 
             onClick={onToggleTheme}
             className="flex items-center gap-3 w-full px-3 py-3 rounded-md hover:bg-white/10 text-sm text-gray-100 transition-colors text-left"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>

          <button 
             onClick={onSignOut}
             className="flex items-center gap-3 w-full px-3 py-3 rounded-md hover:bg-red-900/50 text-sm text-red-300 transition-colors text-left mt-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
};
