
import React, { useState, useRef } from 'react';
import { UserProfile } from '../types.ts';
import { UploadIcon } from './icons/UploadIcon.tsx';
import { UserIcon } from './icons/UserIcon.tsx';

interface UserProfileModalProps {
  profile: UserProfile | undefined;
  onSave: (profile: UserProfile) => void;
  onClose: () => void;
  onGenerateImage: (prompt: string) => Promise<string | null>;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ profile, onSave, onClose }) => {
  const [name, setName] = useState(profile?.name || 'Commander');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => setAvatarUrl(reader.result as string);
        reader.readAsDataURL(file);
    }
  };

  const setEmojiAvatar = () => {
      const emoji = prompt("Enter an emoji to use as avatar:", "👨‍✈️");
      if (emoji) setAvatarUrl(emoji);
  };

  return (
    <div className="modal-overlay fixed inset-0 flex items-center justify-center z-50">
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>/// USER_PROFILE</h2>
          <button onClick={onClose} style={{background: 'none', border: 'none', color: 'black', fontSize: '1.5rem'}}>X</button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); onSave({ name, avatarUrl }); onClose(); }} className="modal-content space-y-4">
            <div className="flex flex-col items-center gap-4">
                <div className="message-avatar" style={{width: '100px', height: '100px', fontSize: '3em'}}>
                    {avatarUrl.startsWith('data:') ? <img src={avatarUrl} /> : avatarUrl || <UserIcon />}
                </div>
                <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="btn"><UploadIcon /> UPLOAD IMG</button>
                    <button type="button" onClick={setEmojiAvatar} className="btn">😊 USE EMOJI</button>
                </div>
            </div>

            <div>
                <label>CODENAME</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="flex justify-end pt-4">
                <button type="submit">SAVE RECORD</button>
            </div>
        </form>
      </div>
    </div>
  );
};
