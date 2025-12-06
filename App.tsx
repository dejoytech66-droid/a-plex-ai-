import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Menu, Loader2, Users } from 'lucide-react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';

import { Sidebar } from './components/Sidebar';
import { ChatInput } from './components/ChatInput';
import { MessageBubble } from './components/MessageBubble';
import { AuthPage } from './components/AuthPage';
import { ProjectDashboard } from './components/ProjectDashboard';
import { PrivacySettingsModal } from './components/PrivacySettingsModal';
import { CreateGroupModal } from './components/CreateGroupModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ChatSession, Message, Theme, Project, UserSettings, Attachment, GroupMetadata } from './types';
import { streamGeminiResponse, generateChatTitle, generateImage, getStoredKey } from './services/geminiService';
import { auth } from './services/firebase';

const App: React.FC = () => {
  // --- Auth State ---
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // --- App State ---
  const [currentView, setCurrentView] = useState<'chat' | 'projects'>('chat');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  
  // API Key State
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // Check for key on mount
  useEffect(() => {
    // If no env key is likely present (checked via simple heuristic) and no stored key
    // We can proactively show the modal, or wait for an error. 
    // Let's check stored key.
    const hasStored = !!getStoredKey();
    const hasEnv = process.env.API_KEY && process.env.API_KEY !== 'YOUR_API_KEY_HERE';
    if (!hasStored && !hasEnv) {
        // We delay slightly to not jar the user immediately
        const timer = setTimeout(() => setIsKeyModalOpen(true), 2000);
        return () => clearTimeout(timer);
    }
  }, []);
  
  // Default Settings
  const [userSettings, setUserSettings] = useState<UserSettings>({
      privacy: {
          defaultPostVisibility: 'Friends',
          defaultProjectVisibility: 'Private',
          defaultFileVisibility: 'Private',
          profileVisibility: 'Public',
          allowTagging: true,
          showActivityStatus: true
      }
  });

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // --- Initialize Speech Synthesis ---
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        speechSynthesisRef.current = window.speechSynthesis;
    }
  }, []);

  // --- Auth Effect ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Strictly enforce email verification
      if (currentUser && currentUser.emailVerified) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Derived State ---
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  // --- Effects ---

  // Load Data for specific user
  useEffect(() => {
    if (user) {
        // Sessions
        const savedSessionKey = `aplex_sessions_${user.uid}`;
        const savedSessions = localStorage.getItem(savedSessionKey);
        if (savedSessions) {
            const loadedSessions = JSON.parse(savedSessions);
            setSessions(loadedSessions);
            if (loadedSessions.length > 0) {
                setCurrentSessionId(loadedSessions[0].id);
            }
        } else {
            setSessions([]);
            setCurrentSessionId(null);
        }

        // Projects
        const savedProjectsKey = `aplex_projects_${user.uid}`;
        const savedProjects = localStorage.getItem(savedProjectsKey);
        if (savedProjects) {
            setProjects(JSON.parse(savedProjects));
        } else {
            setProjects([]);
        }

        // Settings
        const savedSettingsKey = `aplex_settings_${user.uid}`;
        const savedSettings = localStorage.getItem(savedSettingsKey);
        if (savedSettings) {
            setUserSettings(JSON.parse(savedSettings));
        }

    } else {
        setSessions([]);
        setProjects([]);
        setCurrentSessionId(null);
    }
  }, [user]);

  // Persist Sessions
  useEffect(() => {
    if (user) {
        const savedKey = `aplex_sessions_${user.uid}`;
        localStorage.setItem(savedKey, JSON.stringify(sessions));
    }
  }, [sessions, user]);

  // Persist Projects
  useEffect(() => {
    if (user) {
        const savedKey = `aplex_projects_${user.uid}`;
        localStorage.setItem(savedKey, JSON.stringify(projects));
    }
  }, [projects, user]);

  // Persist Settings
  useEffect(() => {
    if (user) {
        const savedKey = `aplex_settings_${user.uid}`;
        localStorage.setItem(savedKey, JSON.stringify(userSettings));
    }
  }, [userSettings, user]);

  // Initialize new chat if needed
  useEffect(() => {
      if (!authLoading && user && sessions.length === 0 && !currentSessionId) {
          createNewSession();
      }
  }, [user, authLoading, sessions.length, currentSessionId]);

  // Theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, currentView]);


  // --- Voice / TTS Functions ---

  const stopSpeaking = () => {
    if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
        setIsSpeaking(false);
    }
  };

  const speakText = (text: string) => {
    if (!speechSynthesisRef.current) return;
    stopSpeaking();
    const cleanText = text.replace(/[*#`]/g, ''); 
    const utterance = new SpeechSynthesisUtterance(cleanText);
    currentUtteranceRef.current = utterance;
    const voices = speechSynthesisRef.current.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('en-US')) 
                        || voices.find(v => v.lang.includes('en-US'));
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechSynthesisRef.current.speak(utterance);
  };


  // --- Handlers ---

  const handleSignOut = async () => {
    stopSpeaking();
    try {
        await signOut(auth);
        setSessions([]);
        setProjects([]);
        setCurrentSessionId(null);
    } catch (error) {
        console.error("Error signing out", error);
    }
  };

  const createNewSession = () => {
    stopSpeaking();
    const newSession: ChatSession = {
      id: uuidv4(),
      type: 'direct',
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      lastModified: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setCurrentView('chat'); 
  };

  const handleCreateGroup = (metadata: GroupMetadata) => {
      const newGroupSession: ChatSession = {
          id: uuidv4(),
          type: 'group',
          title: metadata.name, // Group title
          groupMetadata: metadata,
          messages: [],
          createdAt: Date.now(),
          lastModified: Date.now()
      };
      setSessions(prev => [newGroupSession, ...prev]);
      setCurrentSessionId(newGroupSession.id);
      setIsCreateGroupOpen(false);
      setCurrentView('chat');
  };

  const updateSession = (id: string, updates: Partial<ChatSession>) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const addMessageToSession = (sessionId: string, message: Message) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          messages: [...s.messages, message],
          lastModified: Date.now()
        };
      }
      return s;
    }));
  };

  const updateLastMessage = (sessionId: string, text: string) => {
      setSessions(prev => prev.map(s => {
          if (s.id === sessionId) {
              const msgs = [...s.messages];
              if (msgs.length > 0) {
                  msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], text };
              }
              return { ...s, messages: msgs };
          }
          return s;
      }));
  }

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    stopSpeaking();
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (currentSessionId === id) {
        setCurrentSessionId(newSessions.length > 0 ? newSessions[0].id : null);
        if (newSessions.length === 0) createNewSession();
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete all chats?')) {
        stopSpeaking();
        setSessions([]);
        createNewSession();
    }
  };

  const handleDownloadChat = () => {
      if (!currentSession) return;
      const text = currentSession.messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n\n');
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentSession.title.replace(/\s+/g, '_')}_chat.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleSendMessage = async (text: string, mode: 'text' | 'voice' = 'text', attachments: Attachment[] = []) => {
    if (!currentSessionId) return;
    
    stopSpeaking();

    // 1. Add User Message
    const userMsg: Message = {
      id: uuidv4(),
      role: 'user',
      text,
      timestamp: Date.now(),
      attachments: attachments
    };
    addMessageToSession(currentSessionId, userMsg);
    setIsLoading(true);

    // 2. Check for Image Generation Command
    const lowerText = text.toLowerCase();
    const isImageRequest = 
        lowerText.includes("generate image") || 
        lowerText.includes("create image") || 
        lowerText.includes("draw") || 
        lowerText.includes("ছবি") || 
        lowerText.includes("আঁকো") || 
        lowerText.includes("banao");

    if (isImageRequest) {
        try {
            const base64Image = await generateImage(text);
            const aiMsg: Message = {
                id: uuidv4(),
                role: 'model',
                text: "Here is the image you requested:",
                imageUrl: `data:image/jpeg;base64,${base64Image}`,
                timestamp: Date.now()
            };
            addMessageToSession(currentSessionId, aiMsg);
        } catch (error: any) {
            const errorMsg: Message = {
                id: uuidv4(),
                role: 'model',
                text: `I couldn't generate the image. ${error.message}`,
                isError: true,
                timestamp: Date.now()
            };
            addMessageToSession(currentSessionId, errorMsg);
            if (error.message.includes("API Key is missing")) {
                setIsKeyModalOpen(true);
            }
        } finally {
            setIsLoading(false);
        }
        return;
    }

    // 3. Normal Text Chat
    
    // Generate Title if needed
    const session = sessions.find(s => s.id === currentSessionId);
    if (session && session.messages.length === 0 && session.type === 'direct') {
        generateChatTitle(text).then(title => {
            updateSession(currentSessionId, { title });
        });
    }

    // Prepare AI Message Placeholder
    const aiMsgId = uuidv4();
    const aiMsg: Message = {
      id: aiMsgId,
      role: 'model',
      text: '', 
      timestamp: Date.now()
    };
    addMessageToSession(currentSessionId, aiMsg);

    // Stream Response
    let fullResponse = '';
    try {
        const history = sessions.find(s => s.id === currentSessionId)?.messages || [];
        
        // Construct Group Context string if applicable
        let groupContext = '';
        if (session?.type === 'group' && session.groupMetadata) {
            groupContext = `Group Name: ${session.groupMetadata.name}\nMembers: ${session.groupMetadata.members.join(', ')}\nDescription: ${session.groupMetadata.description || 'None'}`;
        }

        const stream = streamGeminiResponse(history, text, groupContext);

        for await (const chunk of stream) {
            if (chunk === 'API_KEY_MISSING') {
                setIsKeyModalOpen(true);
                throw new Error("API Key Missing");
            }
            fullResponse += chunk;
            updateLastMessage(currentSessionId, fullResponse);
        }

        if (mode === 'voice' && fullResponse) {
             speakText(fullResponse);
        }

    } catch (error: any) {
        if (error.message !== "API Key Missing") {
            updateLastMessage(currentSessionId, "Error: " + error.message);
        } else {
             updateLastMessage(currentSessionId, "Please enter your API Key to continue.");
        }
        
        setSessions(prev => prev.map(s => {
             if (s.id === currentSessionId) {
                 const msgs = [...s.messages];
                 if (msgs.length > 0) {
                     msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], isError: true };
                 }
                 return { ...s, messages: msgs };
             }
             return s;
        }));
    } finally {
        setIsLoading(false);
    }
  };

  const handleStop = () => {
      setIsLoading(false);
      stopSpeaking();
  };

  const handlePinMessage = (msgId: string) => {
      if (!currentSessionId) return;
      setSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
              return {
                  ...s,
                  messages: s.messages.map(m => m.id === msgId ? { ...m, pinned: !m.pinned } : m)
              };
          }
          return s;
      }));
  };

  // --- Project Handlers ---
  const handleAddProject = (newProject: Project) => {
      setProjects(prev => [newProject, ...prev]);
  };

  const handleUpdateProject = (id: string, updates: Partial<Project>) => {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleDeleteProject = (id: string) => {
      if (confirm('Are you sure you want to delete this project?')) {
        setProjects(prev => prev.filter(p => p.id !== id));
      }
  };


  // --- Render ---

  if (authLoading) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-gray-900">
              <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
          </div>
      );
  }

  if (!user) {
      return <AuthPage />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-gray-800">
      
      {/* Modals */}
      <PrivacySettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={userSettings}
        onUpdateSettings={setUserSettings}
      />
      
      <CreateGroupModal 
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreate={handleCreateGroup}
      />

      <ApiKeyModal 
        isOpen={isKeyModalOpen} 
        onClose={() => setIsKeyModalOpen(false)}
        onSuccess={() => {
            // Re-render or just let the user try again
            alert("API Key saved! Please try your request again.");
        }}
      />

      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={createNewSession}
        onNewGroup={() => setIsCreateGroupOpen(true)}
        onSelectSession={(id) => { stopSpeaking(); setCurrentSessionId(id); setCurrentView('chat'); }}
        onDeleteSession={handleDeleteSession}
        onClearAll={handleClearAll}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
        onDownloadChat={handleDownloadChat}
        userEmail={user.email}
        onSignOut={handleSignOut}
        currentView={currentView}
        onChangeView={setCurrentView}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center p-3 border-b dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-200"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-2 font-medium text-gray-700 dark:text-gray-200 truncate flex items-center gap-2">
             {currentView === 'chat' && currentSession?.type === 'group' && <Users className="w-4 h-4 text-purple-500" />}
             {currentView === 'chat' ? (currentSession?.title || 'A-Plex AI') : 'Projects'}
          </span>
        </div>

        {/* View Switcher */}
        {currentView === 'chat' ? (
            <>
                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 bg-white dark:bg-gray-800">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-80">
                        <div className="bg-white dark:bg-gray-700 p-4 rounded-full shadow-lg mb-6">
                            {currentSession?.type === 'group' ? (
                                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                    <Users className="w-8 h-8 text-purple-600" />
                                </div>
                            ) : (
                                <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <h1 className="text-4xl font-bold mb-2 text-gray-800 dark:text-white">
                            {currentSession?.type === 'group' ? currentSession.title : 'A-Plex AI'}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md">
                            {currentSession?.type === 'group' 
                                ? `Group Members: ${currentSession.groupMetadata?.members.length} participants` 
                                : 'Your intelligent companion. Ask me anything, generate ideas, or translate languages.'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col pb-32 pt-4">
                    {messages.map((msg) => (
                        <MessageBubble 
                            key={msg.id} 
                            message={msg} 
                            onSpeak={speakText} 
                            isSpeaking={isSpeaking}
                            onStopSpeak={stopSpeaking}
                            onPin={handlePinMessage}
                        />
                    ))}
                    <div ref={messagesEndRef} />
                    </div>
                )}
                </div>

                {/* Input Area */}
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-transparent dark:from-gray-800 dark:via-gray-800 pt-10 pb-2 px-2">
                <ChatInput 
                    onSend={handleSendMessage} 
                    isLoading={isLoading}
                    onStop={handleStop}
                    isSpeaking={isSpeaking}
                    onStopSpeaking={stopSpeaking}
                />
                </div>
            </>
        ) : (
            <ProjectDashboard 
                projects={projects}
                onAddProject={handleAddProject}
                onUpdateProject={handleUpdateProject}
                onDeleteProject={handleDeleteProject}
                defaultVisibility={userSettings.privacy.defaultProjectVisibility}
            />
        )}

      </div>
    </div>
  );
};

export default App;