
import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FolderKanban, Plus, CheckSquare, Trash2, Calendar, BookOpen, Briefcase, Users, User, Youtube, MoreHorizontal, Layout, FileText, Image as ImageIcon, Link as LinkIcon, Video, Paperclip, UploadCloud, X, Globe, Lock } from 'lucide-react';
import { Project, Task, ProjectCategory, ProjectFile, FileType, Visibility } from '../types';

interface ProjectDashboardProps {
  projects: Project[];
  onAddProject: (project: Project) => void;
  onUpdateProject: (projectId: string, updates: Partial<Project>) => void;
  onDeleteProject: (projectId: string) => void;
  defaultVisibility?: Visibility;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  projects,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  defaultVisibility = 'Private'
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // New Project Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ProjectCategory>('Personal');
  const [newDesc, setNewDesc] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newVisibility, setNewVisibility] = useState<Visibility>(defaultVisibility);

  // Link Input State
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine current selected project
  const selectedProject = projects.find(p => p.id === selectedProjectId) || (projects.length > 0 ? projects[0] : null);

  // Fix for deletion sync: If selected project is deleted, reset selection
  useEffect(() => {
    if (selectedProjectId && !projects.find(p => p.id === selectedProjectId)) {
        if (projects.length > 0) {
            setSelectedProjectId(projects[0].id);
        } else {
            setSelectedProjectId(null);
        }
    }
  }, [projects, selectedProjectId]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newProject: Project = {
        id: uuidv4(),
        title: newTitle,
        category: newCategory,
        description: newDesc,
        deadline: newDeadline,
        tasks: [],
        files: [],
        createdAt: Date.now(),
        visibility: newVisibility
    };

    onAddProject(newProject);
    setSelectedProjectId(newProject.id);
    setIsCreating(false);
    // Reset form
    setNewTitle('');
    setNewDesc('');
    setNewDeadline('');
    setNewVisibility(defaultVisibility);
  };

  // --- Task Logic ---
  const handleAddTask = (text: string) => {
      if (!selectedProject || !text.trim()) return;
      const newTask: Task = {
          id: uuidv4(),
          text,
          completed: false
      };
      onUpdateProject(selectedProject.id, {
          tasks: [...selectedProject.tasks, newTask]
      });
  };

  const toggleTask = (taskId: string) => {
      if (!selectedProject) return;
      const updatedTasks = selectedProject.tasks.map(t => 
          t.id === taskId ? { ...t, completed: !t.completed } : t
      );
      onUpdateProject(selectedProject.id, { tasks: updatedTasks });
  };

  const deleteTask = (taskId: string) => {
      if (!selectedProject) return;
      const updatedTasks = selectedProject.tasks.filter(t => t.id !== taskId);
      onUpdateProject(selectedProject.id, { tasks: updatedTasks });
  };

  // --- File Logic ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProject || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    
    // Safety & Size Check (Limit to ~2MB for localStorage safety)
    if (file.size > 2 * 1024 * 1024) {
        alert("File is too large for this demo (Max 2MB). Please upload a smaller file.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        if (event.target?.result) {
            let fileType: FileType = 'document';
            if (file.type.startsWith('image/')) fileType = 'image';
            else if (file.type.startsWith('video/')) fileType = 'video';
            else if (file.type === 'application/pdf') fileType = 'pdf';

            const newFile: ProjectFile = {
                id: uuidv4(),
                name: file.name,
                type: fileType,
                url: event.target.result as string,
                size: (file.size / 1024).toFixed(1) + ' KB',
                createdAt: Date.now(),
                visibility: selectedProject.visibility // Inherit visibility
            };

            onUpdateProject(selectedProject.id, {
                files: [...(selectedProject.files || []), newFile]
            });
        }
    };
    reader.readAsDataURL(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddLink = () => {
      if (!selectedProject || !linkUrl.trim()) return;
      
      const newFile: ProjectFile = {
          id: uuidv4(),
          name: linkName.trim() || linkUrl,
          type: 'link',
          url: linkUrl,
          createdAt: Date.now(),
          visibility: selectedProject.visibility
      };

      onUpdateProject(selectedProject.id, {
          files: [...(selectedProject.files || []), newFile]
      });
      setIsAddingLink(false);
      setLinkUrl('');
      setLinkName('');
  };

  const deleteFile = (fileId: string) => {
      if (!selectedProject) return;
      const updatedFiles = (selectedProject.files || []).filter(f => f.id !== fileId);
      onUpdateProject(selectedProject.id, { files: updatedFiles });
  };

  // --- Helpers ---
  const getCategoryIcon = (cat: ProjectCategory) => {
      switch(cat) {
          case 'Study': return <BookOpen className="w-4 h-4" />;
          case 'Business': return <Briefcase className="w-4 h-4" />;
          case 'Teamwork': return <Users className="w-4 h-4" />;
          case 'Personal': return <User className="w-4 h-4" />;
          case 'Content Creation': return <Youtube className="w-4 h-4" />;
          default: return <Layout className="w-4 h-4" />;
      }
  };

  const getCategoryColor = (cat: ProjectCategory) => {
    switch(cat) {
        case 'Study': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
        case 'Business': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
        case 'Teamwork': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
        case 'Personal': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
        case 'Content Creation': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
        default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getFileIcon = (type: FileType) => {
      switch(type) {
          case 'image': return <ImageIcon className="w-5 h-5 text-purple-500" />;
          case 'video': return <Video className="w-5 h-5 text-red-500" />;
          case 'pdf': return <FileText className="w-5 h-5 text-orange-500" />;
          case 'link': return <LinkIcon className="w-5 h-5 text-blue-500" />;
          default: return <Paperclip className="w-5 h-5 text-gray-500" />;
      }
  };

  const getVisibilityIcon = (v?: Visibility) => {
     switch(v) {
         case 'Public': return <Globe className="w-3.5 h-3.5" />;
         case 'Private': return <Lock className="w-3.5 h-3.5" />;
         case 'Team': return <Users className="w-3.5 h-3.5" />;
         case 'Friends': return <Users className="w-3.5 h-3.5" />;
         default: return <Lock className="w-3.5 h-3.5" />;
     }
  };

  // --- Render ---

  if (projects.length === 0 && !isCreating) {
      return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in duration-300">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                  <FolderKanban className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">No Projects Yet</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
                  Organize your goals, tasks, files, and ideas. Start your first project today!
              </p>
              <button 
                onClick={() => setIsCreating(true)}
                className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                  <Plus className="w-5 h-5" />
                  Create New Project
              </button>
          </div>
      );
  }

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
        
        {/* Left Sidebar - Project List */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 flex flex-col hidden md:flex">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h2 className="font-bold text-lg text-gray-800 dark:text-white">My Projects</h2>
                <button 
                  onClick={() => setIsCreating(true)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-brand-600 dark:text-brand-400 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {projects.map(p => (
                    <div 
                        key={p.id}
                        onClick={() => { setSelectedProjectId(p.id); setIsCreating(false); }}
                        className={`p-3 rounded-lg cursor-pointer transition-all border ${
                            selectedProject?.id === p.id 
                            ? 'bg-brand-50 border-brand-200 dark:bg-brand-900/10 dark:border-brand-800' 
                            : 'bg-white border-transparent hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700'
                        }`}
                    >
                        <div className="flex items-start justify-between mb-1">
                            <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{p.title}</span>
                            {selectedProject?.id === p.id && (
                                <button onClick={(e) => { e.stopPropagation(); onDeleteProject(p.id); }} className="text-gray-400 hover:text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${getCategoryColor(p.category)}`}>
                                {getCategoryIcon(p.category)}
                                {p.category}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 flex items-center gap-1">
                                {getVisibilityIcon(p.visibility)}
                                {p.visibility || 'Private'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {isCreating ? (
                <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Create New Project</h2>
                    <form onSubmit={handleCreate} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Project Name</label>
                            <input 
                                type="text" 
                                required
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all dark:text-white"
                                placeholder="e.g. Final Year Thesis"
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                                <div className="relative">
                                    <select 
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value as ProjectCategory)}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none appearance-none dark:text-white"
                                    >
                                        <option value="Study">Study</option>
                                        <option value="Business">Business</option>
                                        <option value="Teamwork">Teamwork</option>
                                        <option value="Personal">Personal</option>
                                        <option value="Content Creation">Content Creation</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    <div className="absolute right-3 top-3.5 pointer-events-none text-gray-500">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Visibility</label>
                                <div className="relative">
                                    <select 
                                        value={newVisibility}
                                        onChange={(e) => setNewVisibility(e.target.value as Visibility)}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none appearance-none dark:text-white"
                                    >
                                        <option value="Private">Private (Only me)</option>
                                        <option value="Team">Team</option>
                                        <option value="Friends">Friends</option>
                                        <option value="Public">Public</option>
                                    </select>
                                    <div className="absolute right-3 top-3.5 pointer-events-none text-gray-500">
                                        {getVisibilityIcon(newVisibility)}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Deadline (Optional)</label>
                                <input 
                                    type="date" 
                                    value={newDeadline}
                                    onChange={(e) => setNewDeadline(e.target.value)}
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                            <textarea 
                                value={newDesc}
                                onChange={(e) => setNewDesc(e.target.value)}
                                rows={4}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none resize-none dark:text-white"
                                placeholder="What is this project about?"
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button 
                                type="button" 
                                onClick={() => setIsCreating(false)}
                                className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium shadow-md transition-all"
                            >
                                Create Project
                            </button>
                        </div>
                    </form>
                </div>
            ) : selectedProject ? (
                <div className="max-w-6xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                    {/* Mobile Project Select (visible only on small screens) */}
                    <div className="md:hidden mb-4">
                        <select 
                            value={selectedProject.id}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                        <button 
                            onClick={() => setIsCreating(true)}
                            className="w-full mt-2 p-2 bg-brand-100 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-lg text-sm font-medium"
                        >
                            + New Project
                        </button>
                    </div>

                    {/* Header */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-4">
                             <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{selectedProject.title}</h1>
                                <div className="flex flex-wrap gap-3">
                                    <span className={`text-xs px-3 py-1 rounded-full flex items-center gap-1.5 font-medium ${getCategoryColor(selectedProject.category)}`}>
                                        {getCategoryIcon(selectedProject.category)}
                                        {selectedProject.category}
                                    </span>
                                    <span className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center gap-1.5 font-medium">
                                        {getVisibilityIcon(selectedProject.visibility)}
                                        {selectedProject.visibility || 'Private'}
                                    </span>
                                    {selectedProject.deadline && (
                                        <span className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 flex items-center gap-1.5 font-medium">
                                            <Calendar className="w-3.5 h-3.5" />
                                            Due: {selectedProject.deadline}
                                        </span>
                                    )}
                                </div>
                             </div>
                             <div className="flex gap-2">
                                <button 
                                    onClick={() => onDeleteProject(selectedProject.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Delete Project"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                             </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            {selectedProject.description || "No description provided."}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Tasks Section */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <CheckSquare className="w-5 h-5 text-brand-500" />
                                Tasks & Goals
                            </h3>
                            
                            {/* Add Task */}
                            <div className="mb-6">
                                <input 
                                    type="text" 
                                    placeholder="Add a new task..."
                                    onKeyDown={(e) => {
                                        if(e.key === 'Enter') {
                                            handleAddTask(e.currentTarget.value);
                                            e.currentTarget.value = '';
                                        }
                                    }}
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none dark:text-white transition-all"
                                />
                            </div>

                            {/* Task List */}
                            <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px]">
                                {selectedProject.tasks.length === 0 ? (
                                    <p className="text-center text-gray-400 py-4 italic">No tasks yet.</p>
                                ) : (
                                    selectedProject.tasks.map(task => (
                                        <div 
                                            key={task.id} 
                                            className="group flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                                        >
                                            <button 
                                                onClick={() => toggleTask(task.id)}
                                                className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                                    task.completed 
                                                    ? 'bg-brand-500 border-brand-500 text-white' 
                                                    : 'border-gray-300 dark:border-gray-600 text-transparent hover:border-brand-500'
                                                }`}
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            </button>
                                            <span className={`flex-1 text-gray-800 dark:text-gray-200 transition-all ${task.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
                                                {task.text}
                                            </span>
                                            <button 
                                                onClick={() => deleteTask(task.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 rounded transition-all"
                                            >
                                                <XIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Files & Assets Section */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full">
                             <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <FolderKanban className="w-5 h-5 text-orange-500" />
                                Files & Assets
                            </h3>

                            {/* Actions */}
                            <div className="flex gap-2 mb-6">
                                <input 
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*,video/*,application/pdf,.doc,.docx,.txt"
                                    onChange={handleFileUpload}
                                />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <UploadCloud className="w-4 h-4" />
                                    <span className="text-sm">Upload File</span>
                                </button>
                                <button 
                                    onClick={() => setIsAddingLink(true)}
                                    className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <LinkIcon className="w-4 h-4" />
                                    <span className="text-sm">Add Link</span>
                                </button>
                            </div>

                            {/* Link Form */}
                            {isAddingLink && (
                                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg animate-in fade-in zoom-in-95 duration-200">
                                    <input 
                                        type="text" 
                                        placeholder="Paste URL here..." 
                                        value={linkUrl}
                                        onChange={(e) => setLinkUrl(e.target.value)}
                                        className="w-full p-2 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-sm outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Link Name (optional)" 
                                        value={linkName}
                                        onChange={(e) => setLinkName(e.target.value)}
                                        className="w-full p-2 mb-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-sm outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <button 
                                            onClick={() => setIsAddingLink(false)}
                                            className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleAddLink}
                                            className="px-3 py-1.5 text-xs bg-brand-600 text-white rounded hover:bg-brand-700"
                                        >
                                            Add Link
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* File List */}
                            <div className="space-y-2 flex-1 overflow-y-auto max-h-[400px]">
                                {(!selectedProject.files || selectedProject.files.length === 0) ? (
                                    <p className="text-center text-gray-400 py-8 text-sm italic">
                                        No files yet. Upload images, docs, or add links.
                                    </p>
                                ) : (
                                    selectedProject.files.map(file => (
                                        <div 
                                            key={file.id}
                                            className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all group"
                                        >
                                            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                                                {getFileIcon(file.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <a 
                                                    href={file.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="font-medium text-sm text-gray-700 dark:text-gray-200 truncate block hover:text-brand-600 dark:hover:text-brand-400"
                                                >
                                                    {file.name}
                                                </a>
                                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                                    <span className="capitalize">{file.type}</span>
                                                    {file.size && <span>• {file.size}</span>}
                                                    {file.visibility && <span className="flex items-center gap-0.5">• {getVisibilityIcon(file.visibility)}</span>}
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => deleteFile(file.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    </div>
  );
};

const XIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);
