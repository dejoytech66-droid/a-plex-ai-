import React, { useState } from 'react';
import { Key, Save, ExternalLink, Shield } from 'lucide-react';
import { setStoredKey } from '../services/geminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [inputKey, setInputKey] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!inputKey.trim() || !inputKey.startsWith('AIza')) {
        alert('Please enter a valid Google Gemini API Key (starts with AIza...)');
        return;
    }
    setStoredKey(inputKey.trim());
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
        
        <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-xl">
                <Key className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Enter API Key</h2>
                <p className="text-sm text-gray-500">Authentication Required</p>
            </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            A-Plex AI requires a Google Gemini API Key to function. This key is stored locally in your browser and is never sent to our servers.
        </p>

        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Your Gemini API Key
                </label>
                <input 
                    type="password" 
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none dark:text-white font-mono text-sm"
                />
            </div>

            <div className="flex gap-2 text-xs text-gray-500">
                <Shield className="w-3 h-3 mt-0.5" />
                <span>Only use keys from Google AI Studio.</span>
            </div>

            <div className="flex flex-col gap-3 pt-2">
                <button 
                    onClick={handleSave}
                    className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                    <Save className="w-4 h-4" />
                    Save & Continue
                </button>
                
                <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm"
                >
                    <ExternalLink className="w-4 h-4" />
                    Get a Free API Key
                </a>
            </div>
        </div>
      </div>
    </div>
  );
};