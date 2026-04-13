
import React from 'react';
import { ChatSession, Character } from '../types.ts';
import { TrashIcon } from './icons/TrashIcon.tsx';
import { UsersIcon } from './icons/UsersIcon.tsx';
import { DownloadIcon } from './icons/DownloadIcon.tsx';
import { ArchiveBoxIcon } from './icons/ArchiveBoxIcon.tsx';
import { RestoreIcon } from './icons/RestoreIcon.tsx';
import { PlusIcon } from './icons/PlusIcon.tsx';

interface ChatListProps {
  chatSessions: ChatSession[];
  characters: Character[];
  selectedChatId?: string | null;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onExportChat: (id: string) => void;
  onAddNew: () => void;
  showArchived: boolean;
  onToggleArchiveView: () => void;
  onRestoreChat: (id: string) => void;
  onPermanentlyDeleteChat: (id: string) => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  chatSessions,
  characters,
  selectedChatId,
  onSelectChat,
  onDeleteChat,
  onExportChat,
  onAddNew,
  showArchived,
  onToggleArchiveView,
  onRestoreChat,
  onPermanentlyDeleteChat
}) => {
  const getCharacter = (id: string) => characters.find(c => c.id === id);

  return (
    <div className="flex-1 flex flex-col min-h-0">
       <div className="flex justify-between items-center mb-2 border-t border-border-color pt-2 px-2">
        <h2 className="text-sm font-semibold text-text-primary uppercase">{showArchived ? 'Archived Chats' : 'Active Chats'}</h2>
        <button
          onClick={onAddNew}
          className="p-1 rounded-md text-text-secondary hover:bg-white hover:text-black transition-colors"
          title="New Chat"
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>

       <button 
        onClick={onToggleArchiveView}
        className="mx-2 mb-2 flex items-center justify-center space-x-2 text-xs py-1 px-2 rounded-md text-text-primary border border-border-color hover:bg-white/10 transition-colors"
      >
        <ArchiveBoxIcon className="w-4 h-4" />
        <span>{showArchived ? 'View Active' : 'View Archive'}</span>
      </button>

      <div className="overflow-y-auto px-2 space-y-1">
        {chatSessions.length === 0 ? (
          <p className="text-text-secondary text-xs text-center py-4">
            {showArchived ? 'No archived chats.' : "No chats yet. Click '+' to start."}
          </p>
        ) : (
          chatSessions.map((session) => {
            const participants = (session.characterIds || []).map(getCharacter).filter(Boolean) as Character[];
            
            return (
              <div
                key={session.id}
                onClick={() => onSelectChat(session.id)}
                className={`group flex items-center p-2 rounded-sm cursor-pointer transition-colors border border-transparent ${
                  selectedChatId === session.id
                    ? 'border-text-primary bg-white/10'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="flex-shrink-0 mr-2">
                  {participants.length === 1 ? (
                    <img
                      src={participants[0].avatarUrl || `https://picsum.photos/seed/${participants[0].id}/40/40`}
                      alt={participants[0].name}
                      className="w-6 h-6 rounded-full object-cover border border-text-secondary"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-black border border-text-secondary flex items-center justify-center">
                        <UsersIcon className="w-3 h-3 text-text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate text-xs ${selectedChatId === session.id ? 'text-white' : 'text-text-primary'}`}>{session.name}</p>
                  <p className="text-xs truncate text-text-secondary">
                    {participants.length > 0 ? participants.map(p => p.name).join(', ') : 'Empty'}
                  </p>
                </div>
                 <div className="ml-1 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {showArchived ? (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); onRestoreChat(session.id); }}
                                className="p-1 hover:text-white"
                                title="Restore"
                            >
                                <RestoreIcon className="w-3 h-3" />
                            </button>
                             <button
                                onClick={(e) => { e.stopPropagation(); onPermanentlyDeleteChat(session.id); }}
                                className="p-1 hover:text-red-500"
                                title="Delete"
                            >
                                <TrashIcon className="w-3 h-3" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); onExportChat(session.id); }}
                                className="p-1 hover:text-white"
                                title="Export"
                            >
                                <DownloadIcon className="w-3 h-3" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDeleteChat(session.id); }}
                                className="p-1 hover:text-red-500"
                                title="Archive"
                            >
                                <TrashIcon className="w-3 h-3" />
                            </button>
                        </>
                    )}
                 </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
