
import React, { useState, useMemo, useEffect } from 'react';
import { UISettings, ChatSession, Character } from '../types';
import { generateContent } from '../services/geminiService';
import { logger } from '../services/loggingService';
import { SpinnerIcon } from './icons/SpinnerIcon.tsx';
import { UploadIcon } from './icons/UploadIcon.tsx';
import { SparklesIcon } from './icons/SparklesIcon.tsx';
import { TrashIcon } from './icons/TrashIcon.tsx';
import * as themeService from '../services/themeService.ts';

interface AppearanceModalProps {
  settings: UISettings;
  currentChat: ChatSession | undefined;
  allCharacters: Character[];
  onUpdate: (settings: UISettings) => void;
  onGenerateImage: (prompt: string) => Promise<string | null>;
  onClose: () => void;
}

const ImageControl: React.FC<{
  label: string;
  imageUrl?: string;
  onUpload: (file: File) => void;
  onGenerate: (type: 'prompt' | 'auto' | 'character') => void;
  onClear: () => void;
  isGenerating: boolean;
  canAutoGenerate: boolean;
  canCharacterGenerate: boolean;
}> = ({ label, imageUrl, onUpload, onGenerate, onClear, isGenerating, canAutoGenerate, canCharacterGenerate }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { // 4MB limit
      alert("File is too large. Please select an image under 4MB.");
      return;
    }
    onUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-text-primary">{label}</h3>
      <div className="h-40 w-full rounded-md border-2 border-dashed border-border-strong flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl || ''})`, backgroundColor: imageUrl ? '' : 'rgba(0,0,0,0.1)' }}>
        {!imageUrl && <span className="text-text-secondary">No Image Set</span>}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp, image/gif" className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-center rounded-md bg-background-tertiary hover:bg-opacity-80 transition-colors">
            <UploadIcon className="w-4 h-4" /> <span>Upload</span>
        </button>
        <button onClick={() => onGenerate('prompt')} disabled={isGenerating} className="flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-center rounded-md bg-background-tertiary hover:bg-opacity-80 transition-colors disabled:opacity-50">
            {isGenerating ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : <SparklesIcon className="w-4 h-4" />} <span>From Prompt</span>
        </button>
        <button onClick={() => onGenerate('auto')} disabled={isGenerating || !canAutoGenerate} className="flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-center rounded-md bg-background-tertiary hover:bg-opacity-80 transition-colors disabled:opacity-50" title={!canAutoGenerate ? "Not enough chat history available" : "Generate from chat context"}>
            {isGenerating ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : <SparklesIcon className="w-4 h-4" />} <span>From Chat</span>
        </button>
        <button onClick={() => onGenerate('character')} disabled={isGenerating || !canCharacterGenerate} className="flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-center rounded-md bg-background-tertiary hover:bg-opacity-80 transition-colors disabled:opacity-50" title={!canCharacterGenerate ? "No characters in this chat" : "Generate from character details"}>
            {isGenerating ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : <SparklesIcon className="w-4 h-4" />} <span>From Character</span>
        </button>
        <button onClick={onClear} className="col-span-2 md:col-span-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-center rounded-md bg-accent-red/20 text-accent-red hover:bg-accent-red/30 transition-colors">
            <TrashIcon className="w-4 h-4" /> <span>Clear</span>
        </button>
      </div>
    </div>
  );
};

export const AppearanceModal: React.FC<AppearanceModalProps> = ({ settings, currentChat, allCharacters, onUpdate, onGenerateImage, onClose }) => {
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false);
  const [activeTheme, setActiveTheme] = useState(themeService.getTheme());

  useEffect(() => {
    const unsubscribe = themeService.subscribe(() => {
      setActiveTheme(themeService.getTheme());
    });
    return unsubscribe;
  }, []);

  const participants = useMemo(() => {
    if (!currentChat) return [];
    return allCharacters.filter(c => currentChat.characterIds.includes(c.id));
  }, [allCharacters, currentChat]);
  
  const canAutoGenerate = !!currentChat && currentChat.messages.length >= 2;
  const canCharacterGenerate = participants.length > 0;

  const handleFileUpload = (file: File, type: 'background' | 'banner') => {
    const reader = new FileReader();
    reader.onload = () => {
      const newSettings = { ...settings };
      if (type === 'background') newSettings.backgroundImage = reader.result as string;
      if (type === 'banner') newSettings.bannerImage = reader.result as string;
      onUpdate(newSettings);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async (type: 'background' | 'banner', mode: 'prompt' | 'auto' | 'character') => {
    const setIsGenerating = type === 'background' ? setIsGeneratingBg : setIsGeneratingBanner;
    
    let promptText: string | null = null;
    setIsGenerating(true);

    try {
        if (mode === 'prompt') {
            promptText = window.prompt(`Enter a prompt for the ${type} image:`);
        } else if (mode === 'auto') {
            if (!canAutoGenerate) throw new Error("Not enough chat history to auto-generate an image.");
            const context = currentChat.messages.slice(-5).map(m => m.content).join('\n');
            const summaryPrompt = `Based on the following conversation, create a short, visually descriptive prompt for an atmospheric ${type} image. The prompt should capture the essence of the scene. Be creative and concise. Conversation:\n\n${context}`;
            promptText = await generateContent(summaryPrompt);
            logger.log(`Auto-generated image prompt from chat:`, promptText);
        } else if (mode === 'character') {
            if (!canCharacterGenerate) throw new Error("No characters in this chat to generate an image from.");
            const characterDetails = participants.map(p => {
                let details = `Name: ${p.name}\nDescription: ${p.description}\nPhysical Appearance: ${p.physicalAppearance}\nPersonality: ${p.personalityTraits}`;
                if (p.memory && p.memory !== 'No memories yet.') {
                    details += `\nRecent Memory: ${p.memory}`;
                }
                return details;
            }).join('\n\n---\n\n');

            const summaryPrompt = `Based on the following character details, create a short, visually descriptive prompt for an atmospheric ${type} image that represents them or their environment. Be creative and concise. Character Details:\n\n${characterDetails}`;
            promptText = await generateContent(summaryPrompt);
            logger.log(`Auto-generated image prompt from character details:`, promptText);
        }

        if (!promptText) {
          setIsGenerating(false);
          return;
        }

        const imageUrl = await onGenerateImage(promptText);
        if (imageUrl) {
          const newSettings = { ...settings };
          if (type === 'background') newSettings.backgroundImage = imageUrl;
          if (type === 'banner') newSettings.bannerImage = imageUrl;
          onUpdate(newSettings);
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        logger.error("Failed to generate image prompt or image", err);
        alert(`Could not generate image: ${message}`);
    } finally {
        setIsGenerating(false);
    }
  };
  
  const handleClear = (type: 'background' | 'banner') => {
    const newSettings = { ...settings };
    if (type === 'background') newSettings.backgroundImage = undefined;
    if (type === 'banner') newSettings.bannerImage = undefined;
    onUpdate(newSettings);
  };

  const handleAvatarSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...settings, avatarSize: parseInt(e.target.value, 10) });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-xl font-bold text-text-primary">Appearance Settings</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors text-2xl font-bold leading-none p-1">&times;</button>
        </div>
        
        <div className="modal-content space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-text-primary">Theme</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {themeService.themes.map(theme => (
                <div key={theme.id} onClick={() => themeService.setTheme(theme.id)} className="cursor-pointer">
                  <div className={`h-16 w-full rounded-md border-2 flex items-end p-2 theme-preview theme-${theme.id} ${activeTheme === theme.id ? 'border-primary-500' : 'border-border-neutral'}`}>
                    <div className="w-4 h-4 rounded-full bg-primary-500"></div>
                  </div>
                  <p className={`text-center mt-2 text-sm ${activeTheme === theme.id ? 'text-primary-500 font-bold' : 'text-text-primary'}`}>{theme.name}</p>
                </div>
              ))}
            </div>
          </div>

          <ImageControl 
            label="Background Image"
            imageUrl={settings.backgroundImage}
            onUpload={(file) => handleFileUpload(file, 'background')}
            onGenerate={(mode) => handleGenerate('background', mode)}
            onClear={() => handleClear('background')}
            isGenerating={isGeneratingBg}
            canAutoGenerate={canAutoGenerate}
            canCharacterGenerate={canCharacterGenerate}
          />
          <ImageControl 
            label="Banner Image"
            imageUrl={settings.bannerImage}
            onUpload={(file) => handleFileUpload(file, 'banner')}
            onGenerate={(mode) => handleGenerate('banner', mode)}
            onClear={() => handleClear('banner')}
            isGenerating={isGeneratingBanner}
            canAutoGenerate={canAutoGenerate}
            canCharacterGenerate={canCharacterGenerate}
          />

          <div className="space-y-3 pt-6 border-t border-border-neutral">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium text-text-primary">Avatar Size</h3>
                    <p className="text-sm text-text-secondary">Controls the size of character avatars in the chat (1-10).</p>
                </div>
                <span className="text-primary-600 font-bold text-lg">{settings.avatarSize || 5}</span>
            </div>
            <input 
                type="range" 
                min="1" 
                max="10" 
                value={settings.avatarSize || 5} 
                onChange={handleAvatarSizeChange}
                className="w-full h-2 bg-background-tertiary rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex justify-between text-xs text-text-secondary">
                <span>Tiny</span>
                <span>Medium</span>
                <span>Massive</span>
            </div>
          </div>

        </div>

        <div className="modal-footer">
            <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
