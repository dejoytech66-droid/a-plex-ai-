
import React from 'react';
import { Shield, Lock, Globe, Users, X, Eye, EyeOff } from 'lucide-react';
import { UserSettings, Visibility } from '../types';

interface PrivacySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
}

export const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}) => {
  if (!isOpen) return null;

  const updatePrivacy = (key: keyof UserSettings['privacy'], value: any) => {
    onUpdateSettings({
      ...settings,
      privacy: {
        ...settings.privacy,
        [key]: value
      }
    });
  };

  const visibilityOptions: Visibility[] = ['Public', 'Friends', 'Private', 'Team'];

  const getIcon = (v: Visibility) => {
    switch (v) {
      case 'Public': return <Globe className="w-4 h-4" />;
      case 'Private': return <Lock className="w-4 h-4" />;
      case 'Friends': return <Users className="w-4 h-4" />;
      case 'Team': return <Users className="w-4 h-4 text-blue-500" />;
      default: return <Lock className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
                <Shield className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Privacy Settings</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Manage your data visibility & security</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8">
          
          {/* Default Visibility Section */}
          <section>
             <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wider mb-4">Default Visibility</h3>
             <div className="space-y-4">
                
                {/* Projects */}
                <div className="flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Projects</span>
                      <span className="text-xs text-gray-500">Default setting for new projects</span>
                   </div>
                   <div className="relative">
                      <select 
                         value={settings.privacy.defaultProjectVisibility}
                         onChange={(e) => updatePrivacy('defaultProjectVisibility', e.target.value)}
                         className="appearance-none bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg py-2 pl-3 pr-8 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                      >
                         {visibilityOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                         ))}
                      </select>
                      <div className="absolute right-2 top-2.5 pointer-events-none text-gray-500">
                          {getIcon(settings.privacy.defaultProjectVisibility)}
                      </div>
                   </div>
                </div>

                {/* Posts */}
                <div className="flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Posts</span>
                      <span className="text-xs text-gray-500">Who can see your future posts</span>
                   </div>
                   <div className="relative">
                      <select 
                         value={settings.privacy.defaultPostVisibility}
                         onChange={(e) => updatePrivacy('defaultPostVisibility', e.target.value)}
                         className="appearance-none bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg py-2 pl-3 pr-8 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                      >
                         {visibilityOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                         ))}
                      </select>
                      <div className="absolute right-2 top-2.5 pointer-events-none text-gray-500">
                          {getIcon(settings.privacy.defaultPostVisibility)}
                      </div>
                   </div>
                </div>

                {/* Profile */}
                <div className="flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Profile Info</span>
                      <span className="text-xs text-gray-500">Who can see your bio & details</span>
                   </div>
                   <div className="relative">
                      <select 
                         value={settings.privacy.profileVisibility}
                         onChange={(e) => updatePrivacy('profileVisibility', e.target.value)}
                         className="appearance-none bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg py-2 pl-3 pr-8 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                      >
                         {visibilityOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                         ))}
                      </select>
                      <div className="absolute right-2 top-2.5 pointer-events-none text-gray-500">
                          {getIcon(settings.privacy.profileVisibility)}
                      </div>
                   </div>
                </div>

             </div>
          </section>

          {/* Interaction Section */}
          <section>
             <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wider mb-4">Interactions</h3>
             <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                   <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${settings.privacy.showActivityStatus ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                         {settings.privacy.showActivityStatus ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Active Status</span>
                        <span className="text-xs text-gray-500">Show when you are online</span>
                      </div>
                   </div>
                   <button 
                      onClick={() => updatePrivacy('showActivityStatus', !settings.privacy.showActivityStatus)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.privacy.showActivityStatus ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                   >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.privacy.showActivityStatus ? 'translate-x-6' : 'translate-x-1'}`} />
                   </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                         <Users className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Allow Tagging</span>
                        <span className="text-xs text-gray-500">Let others tag you in posts/projects</span>
                      </div>
                   </div>
                   <button 
                      onClick={() => updatePrivacy('allowTagging', !settings.privacy.allowTagging)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.privacy.allowTagging ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                   >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.privacy.allowTagging ? 'translate-x-6' : 'translate-x-1'}`} />
                   </button>
                </div>
             </div>
          </section>

          {/* Security Tip */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex gap-3">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                  <h4 className="text-sm font-bold text-blue-700 dark:text-blue-300">Security Tip</h4>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Always enable 2-Factor Authentication (2FA) and use a strong password to keep your A-Plex account safe. Never share your password with anyone.
                  </p>
              </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl flex justify-end">
            <button
                onClick={onClose}
                className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors"
            >
                Done
            </button>
        </div>
      </div>
    </div>
  );
};
