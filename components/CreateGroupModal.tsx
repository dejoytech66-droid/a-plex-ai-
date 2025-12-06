
import React, { useState } from 'react';
import { Users, X, Check, Shield } from 'lucide-react';
import { GroupMetadata, Visibility } from '../types';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (groupData: GroupMetadata) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [membersInput, setMembersInput] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('Private');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Parse members (comma separated)
    const memberList = membersInput.split(',').map(m => m.trim()).filter(m => m.length > 0);

    const newGroup: GroupMetadata = {
        name,
        description,
        members: memberList,
        visibility: visibility as 'Private' | 'Public' | 'Friends',
        admins: ['You'] // Current user is admin
    };

    onCreate(newGroup);
    // Reset
    setName('');
    setDescription('');
    setMembersInput('');
    setVisibility('Private');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
             </div>
             <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Group Chat</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Name</label>
                <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Project Alpha Team"
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <input 
                    type="text" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this group about?"
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Add Members (comma separated)</label>
                <input 
                    type="text" 
                    value={membersInput}
                    onChange={(e) => setMembersInput(e.target.value)}
                    placeholder="alice@example.com, bob@example.com"
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visibility</label>
                <div className="flex gap-2">
                    {(['Private', 'Friends', 'Public'] as const).map((v) => (
                        <button
                            key={v}
                            type="button"
                            onClick={() => setVisibility(v)}
                            className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                                visibility === v 
                                ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300' 
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                            }`}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg flex gap-2 items-start">
                <Shield className="w-4 h-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                    Group chats are moderated by A-Plex AI. Unsafe content will be flagged.
                </p>
            </div>

            <div className="pt-2 flex justify-end">
                <button 
                    type="submit" 
                    className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium"
                >
                    <Check className="w-4 h-4" />
                    Create Group
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};
