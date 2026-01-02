
import React, { useState, useRef } from 'react';
import { UserProfile } from '../types.ts';
import { UploadIcon } from './icons/UploadIcon.tsx';
import { SparklesIcon } from './icons/SparklesIcon.tsx';
import { SpinnerIcon } from './icons/SpinnerIcon.tsx';
import { UserIcon } from './icons/UserIcon.tsx';

interface UserProfileModalProps {
  profile: UserProfile | undefined;
  onSave: (profile: UserProfile) => void;
  onClose: () => void;
  onGenerateImage: (prompt: string) => Promise<string | null>;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ profile, onSave, onClose, onGenerateImage }) => {
  const [name, setName] = useState(profile?.name || 'User');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '');
  const [appearance, setAppearance] = useState(profile?.appearance || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File is too large. Please select an image under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!appearance.trim()) {
        const input = prompt("Describe your avatar appearance:");
        if(!input) return;
        setAppearance(input);
    }
    
    setIsGenerating(true);
    try {
        const promptText = `A high quality profile avatar of ${appearance || 'a mysterious user'}`;
        const url = await onGenerateImage(promptText);
        if (url) setAvatarUrl(url);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, avatarUrl, appearance });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-background-secondary rounded-xl shadow-2xl w-full max-w-md flex flex-col border border-border-strong" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-border-neutral flex justify-between items-center">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <UserIcon className="w-6 h-6"/> User Profile
          </h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors text-2xl font-bold leading-none">&times;</button>
        </header>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            <div className="flex flex-col items-center space-y-4">
                <div className="relative w-32 h-32 rounded-full border-4 border-background-tertiary overflow-hidden group">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-background-tertiary flex items-center justify-center text-text-secondary">
                            <UserIcon className="w-16 h-16 opacity-50" />
                        </div>
                    )}
                    {isGenerating && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <SpinnerIcon className="w-8 h-8 text-white animate-spin" />
                        </div>
                    )}
                </div>
                
                <div className="flex space-x-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-2 px-3 py-2 bg-background-tertiary hover:bg-opacity-80 rounded-md text-sm text-text-primary transition-colors">
                        <UploadIcon className="w-4 h-4" /> <span>Upload</span>
                    </button>
                    <button type="button" onClick={handleGenerate} disabled={isGenerating} className="flex items-center space-x-2 px-3 py-2 bg-background-tertiary hover:bg-opacity-80 rounded-md text-sm text-text-primary transition-colors disabled:opacity-50">
                        <SparklesIcon className="w-4 h-4" /> <span>Generate</span>
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Your Name</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="w-full bg-background-primary border border-border-strong rounded-md py-2 px-3 text-text-primary focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder="Enter your name"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Physical Description (for Generation)</label>
                <textarea 
                    value={appearance} 
                    onChange={(e) => setAppearance(e.target.value)} 
                    rows={3}
                    className="w-full bg-background-primary border border-border-strong rounded-md py-2 px-3 text-text-primary focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                    placeholder="E.g., A cyberpunk hacker with neon green hair and visors..."
                />
            </div>

            <div className="flex justify-end pt-4">
                <button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-md font-medium transition-colors shadow-sm">
                    Save Profile
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};
