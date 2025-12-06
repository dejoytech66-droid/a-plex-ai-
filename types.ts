
export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'pdf' | 'document' | 'audio';
  url: string;
  name: string;
  size?: string;
}

export interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isError?: boolean;
  imageUrl?: string;
  attachments?: Attachment[];
  pinned?: boolean;
  reactions?: Record<string, Reaction>; // key is emoji
}

export type ChatType = 'direct' | 'group';

export interface GroupMetadata {
  name: string;
  description?: string;
  members: string[]; // List of member names/emails
  avatarUrl?: string;
  visibility: 'Public' | 'Friends' | 'Private';
  admins: string[];
}

export interface ChatSession {
  id: string;
  type: ChatType;
  title: string;
  groupMetadata?: GroupMetadata;
  messages: Message[];
  createdAt: number;
  lastModified: number;
  pinnedMessageId?: string;
}

export type Theme = 'light' | 'dark';

export type ProjectCategory = 'Study' | 'Business' | 'Teamwork' | 'Personal' | 'Content Creation' | 'Other';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export type FileType = 'image' | 'video' | 'pdf' | 'document' | 'link';

export type Visibility = 'Public' | 'Friends' | 'Team' | 'Private' | 'Custom';

export interface ProjectFile {
  id: string;
  name: string;
  type: FileType;
  url: string; // Base64 for files, URL for links
  size?: string;
  createdAt: number;
  visibility?: Visibility;
}

export interface Project {
  id: string;
  title: string;
  category: ProjectCategory;
  description: string;
  tasks: Task[];
  files: ProjectFile[];
  deadline?: string;
  createdAt: number;
  visibility: Visibility;
}

export interface PrivacySettings {
  defaultPostVisibility: Visibility;
  defaultProjectVisibility: Visibility;
  defaultFileVisibility: Visibility;
  profileVisibility: Visibility;
  allowTagging: boolean;
  showActivityStatus: boolean;
}

export interface UserSettings {
  privacy: PrivacySettings;
}

// Extend Window for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
