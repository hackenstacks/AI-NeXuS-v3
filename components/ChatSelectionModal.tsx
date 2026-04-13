
import React, { useState, useMemo } from 'react';
import { Character, Lorebook } from '../types.ts';
import { UserIcon } from './icons/UserIcon.tsx';
import { BookOpenIcon } from './icons/BookOpenIcon.tsx';

interface ChatSelectionModalProps {
  characters: Character[];
  lorebooks: Lorebook[];
  onClose: () => void;
  onCreateChat: (name: string, characterIds: string[], lorebookIds: string[]) => void;
}

export const ChatSelectionModal: React.FC<ChatSelectionModalProps> = ({ characters, lorebooks, onClose, onCreateChat }) => {
  const [selectedCharIds, setSelectedCharIds] = useState<Set<string>>(new Set());
  const [selectedLorebookIds, setSelectedLorebookIds] = useState<Set<string>>(new Set());
  const [chatName, setChatName] = useState('');

  const handleToggleCharacter = (id: string) => {
    setSelectedCharIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleToggleLorebook = (id: string) => {
    setSelectedLorebookIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    });
  };

  useMemo(() => {
    const selectedChars = characters.filter(c => selectedCharIds.has(c.id));
    if (selectedChars.length === 1) {
      setChatName(`Chat with ${selectedChars[0].name}`);
    } else if (selectedChars.length > 1) {
      setChatName(selectedChars.map(c => c.name).join(', '));
    } else {
      setChatName('');
    }
  }, [selectedCharIds, characters]);

  const handleSubmit = () => {
    if (selectedCharIds.size === 0) {
      alert('Please select at least one character.');
      return;
    }
    if (!chatName.trim()) {
      alert('Please enter a name for the chat.');
      return;
    }
    onCreateChat(chatName.trim(), Array.from(selectedCharIds), Array.from(selectedLorebookIds));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-xl font-bold">Start a New Chat</h2>
          <button onClick={onClose} style={{background: 'transparent', border: 'none', fontSize: '1.5rem'}}>
            &times;
          </button>
        </div>
        
        <div className="modal-content flex flex-col gap-4">
            <div>
                <label htmlFor="chat-name" className="block text-sm font-medium mb-1">Chat Name</label>
                <input
                    id="chat-name"
                    type="text"
                    value={chatName}
                    onChange={(e) => setChatName(e.target.value)}
                    required
                    placeholder="Enter chat name..."
                />
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
                 <label className="block text-sm font-medium mb-1">Select Characters ({selectedCharIds.size})</label>
                 <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '5px' }}>
                    {characters.length === 0 ? (
                        <p className="text-dim text-center p-4">No characters found. Please create one first.</p>
                    ) : characters.map(character => (
                        <div 
                            key={character.id} 
                            onClick={() => handleToggleCharacter(character.id)} 
                            className="flex items-center p-2 rounded-sm cursor-pointer hover:bg-white/10"
                            style={{ backgroundColor: selectedCharIds.has(character.id) ? 'rgba(0, 255, 65, 0.1)' : 'transparent' }}
                        >
                            <input
                                type="checkbox"
                                checked={selectedCharIds.has(character.id)}
                                readOnly
                                style={{ marginRight: '10px' }}
                            />
                            <div className="w-6 h-6 rounded-full overflow-hidden border border-text-secondary mr-2 flex-shrink-0">
                                <img 
                                    src={character.avatarUrl || `https://picsum.photos/seed/${character.id}/40/40`} 
                                    alt={character.name} 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="font-bold">{character.name}</span>
                                {character.characterType === 'narrator' 
                                    ? <BookOpenIcon /> 
                                    : <UserIcon />}
                            </div>
                        </div>
                    ))}
                 </div>
            </div>

             <div className="flex-1 min-h-0 flex flex-col">
                 <label className="block text-sm font-medium mb-1">Attach Lorebooks ({selectedLorebookIds.size})</label>
                 <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '5px' }}>
                    {lorebooks.length === 0 ? (
                        <p className="text-dim text-center p-4">No lorebooks found.</p>
                    ) : lorebooks.map(lorebook => (
                        <div 
                            key={lorebook.id} 
                            onClick={() => handleToggleLorebook(lorebook.id)} 
                            className="flex items-center p-2 rounded-sm cursor-pointer hover:bg-white/10"
                            style={{ backgroundColor: selectedLorebookIds.has(lorebook.id) ? 'rgba(0, 255, 65, 0.1)' : 'transparent' }}
                        >
                            <input
                                type="checkbox"
                                checked={selectedLorebookIds.has(lorebook.id)}
                                readOnly
                                style={{ marginRight: '10px' }}
                            />
                            <span className="font-bold">{lorebook.name}</span>
                        </div>
                    ))}
                 </div>
            </div>
        </div>

        <div className="modal-footer">
            <button onClick={onClose}>
                Cancel
            </button>
            <button onClick={handleSubmit} style={{ borderColor: 'var(--accent-color)' }}>
                Create Chat
            </button>
        </div>
      </div>
    </div>
  );
};
