
import React from 'react';
import { Character } from '../types.ts';
import { PlusIcon } from './icons/PlusIcon.tsx';
import { TrashIcon } from './icons/TrashIcon.tsx';
import { EditIcon } from './icons/EditIcon.tsx';
import { DownloadIcon } from './icons/DownloadIcon.tsx';
import { ArchiveBoxIcon } from './icons/ArchiveBoxIcon.tsx';
import { RestoreIcon } from './icons/RestoreIcon.tsx';
import { UserIcon } from './icons/UserIcon.tsx';
import { BookOpenIcon } from './icons/BookOpenIcon.tsx';

interface CharacterListProps {
  characters: Character[];
  onDeleteCharacter: (id: string) => void;
  onEditCharacter: (character: Character) => void;
  onAddNew: () => void;
  onExportCharacter: (id: string) => void;
  showArchived: boolean;
  onToggleArchiveView: () => void;
  onRestoreCharacter: (id: string) => void;
  onPermanentlyDeleteCharacter: (id: string) => void;
}

export const CharacterList: React.FC<CharacterListProps> = ({
  characters,
  onDeleteCharacter,
  onEditCharacter,
  onAddNew,
  onExportCharacter,
  showArchived,
  onToggleArchiveView,
  onRestoreCharacter,
  onPermanentlyDeleteCharacter
}) => {
  return (
    <div className="flex-1 flex flex-col min-h-0">
       <div className="flex justify-between items-center mb-2 border-t border-border-color pt-2 px-2">
        <h2 className="text-sm font-semibold text-text-primary uppercase">{showArchived ? 'Archived' : 'Characters'}</h2>
        <button
          onClick={onAddNew}
          className="p-1 rounded-md text-text-secondary hover:bg-white hover:text-black transition-colors"
          title="Add New Character"
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

      <div className="space-y-1 overflow-y-auto px-2">
        {characters.length === 0 ? (
           <p className="text-text-secondary text-xs text-center py-4">
            {showArchived ? 'No archived characters.' : "No characters yet. Click '+' to create one."}
           </p>
        ) : (
          characters.map((char) => (
            <div
              key={char.id}
              className="group flex items-center p-2 rounded-sm bg-transparent hover:bg-white/5 border border-transparent hover:border-text-secondary"
            >
              <div className="flex-1 flex items-center min-w-0">
                <img
                  src={char.avatarUrl || `https://picsum.photos/seed/${char.id}/40/40`}
                  alt={char.name}
                  className="w-6 h-6 rounded-full mr-2 flex-shrink-0 object-cover border border-text-secondary"
                />
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="font-semibold truncate text-xs text-text-primary">{char.name}</p>
                    {char.characterType === 'narrator' 
                        ? <BookOpenIcon className="w-3 h-3 text-text-secondary flex-shrink-0" title="Narrator/Scenario"/> 
                        : <UserIcon className="w-3 h-3 text-text-secondary flex-shrink-0" title="Persona"/>}
                  </div>
                </div>
              </div>
              <div className="ml-1 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {showArchived ? (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); onRestoreCharacter(char.id); }}
                      className="p-1 hover:text-white"
                      title="Restore"
                    >
                      <RestoreIcon className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onPermanentlyDeleteCharacter(char.id); }}
                      className="p-1 hover:text-red-500"
                      title="Delete Permanently"
                    >
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); onExportCharacter(char.id); }}
                      className="p-1 hover:text-white"
                      title="Export"
                    >
                      <DownloadIcon className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditCharacter(char); }}
                      className="p-1 hover:text-white"
                      title="Edit"
                    >
                      <EditIcon className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteCharacter(char.id); }}
                      className="p-1 hover:text-red-500"
                      title="Archive"
                    >
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
