
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Character, ChatSession, Message, CryptoKeys, GeminiApiRequest, Lorebook, UserProfile } from '../types.ts';
import { streamChatResponse } from '../services/geminiService.ts';
import * as lorebookService from '../services/lorebookService.ts';
import { parseMarkdown } from '../services/markdownService.ts';
import { PaperClipIcon } from './icons/PaperClipIcon.tsx';
import { TerminalIcon } from './icons/TerminalIcon.tsx';
import { BrainIcon } from './icons/BrainIcon.tsx';
import { UserIcon } from './icons/UserIcon.tsx';
import { ImageIcon } from './icons/ImageIcon.tsx';
import { ManageParticipantsModal } from './ManageParticipantsModal.tsx';
import { TerminalModal } from './TerminalModal.tsx';
import { ImageGenerationWindow } from './ImageGenerationWindow.tsx';
import * as geminiService from '../services/geminiService.ts';

interface ChatInterfaceProps {
  session: ChatSession;
  allCharacters: Character[];
  allChatSessions: ChatSession[];
  allLorebooks: Lorebook[];
  userKeys?: CryptoKeys;
  userProfile?: UserProfile;
  onSessionUpdate: (session: ChatSession) => void;
  onCharacterUpdate: (character: Character) => void;
  onTriggerHook: <T, R>(hookName: string, data: T) => Promise<R>;
  onMemoryImport: (fromSessionId: string, toSessionId: string) => void;
  onSaveBackup: () => void;
  handlePluginApiRequest: (request: GeminiApiRequest) => Promise<any>;
  onOpenUserProfile: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
    session, allCharacters, allLorebooks, userProfile,
    onSessionUpdate, handlePluginApiRequest, onOpenUserProfile
}) => {
  const [currentSession, setCurrentSession] = useState<ChatSession>(session);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isManageParticipantsVisible, setIsManageParticipantsVisible] = useState(false);
  const [isTerminalVisible, setIsTerminalVisible] = useState(false);
  const [isImageWindowVisible, setIsImageWindowVisible] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const participants = useMemo(() => allCharacters.filter(c => (currentSession.characterIds || []).includes(c.id)), [allCharacters, currentSession.characterIds]);
  const attachedLorebooks = useMemo(() => (currentSession.lorebookIds || []).map(id => allLorebooks.find(lb => lb.id === id)).filter(Boolean) as Lorebook[], [allLorebooks, currentSession.lorebookIds]);

  // Sync prop changes to local state, but ONLY if IDs match to avoid overwriting streaming state with stale parent data
  useEffect(() => { 
      if (session.id === currentSession.id && !isStreaming) {
          setCurrentSession(session); 
      } else if (session.id !== currentSession.id) {
          setCurrentSession(session);
      }
  }, [session, isStreaming, currentSession.id]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [currentSession.messages, isStreaming]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { role: 'user', content: input, timestamp: new Date().toISOString() };
    
    // 1. Commit user message to history immediately
    const historyWithUser = [...(currentSession.messages || []), userMessage];
    const sessionWithUser = { ...currentSession, messages: historyWithUser };
    setCurrentSession(sessionWithUser);
    onSessionUpdate(sessionWithUser); // Persist user message
    
    setInput('');
    setIsStreaming(true);

    if (participants.length > 0) {
        const respondent = participants[0];
        let override = '';
        const lore = lorebookService.findRelevantLore(historyWithUser, attachedLorebooks);
        if (lore) override += `[INTEL]: ${lore}\n`;

        let accumulatedContent = "";

        await streamChatResponse(respondent, participants, historyWithUser, (chunk) => {
             accumulatedContent += chunk;
             
             // Construct temporary model message
             const modelMessage: Message = { 
                 role: 'model', 
                 content: accumulatedContent, 
                 timestamp: new Date().toISOString(), 
                 characterId: respondent.id 
             };
             
             // Update UI only
             setCurrentSession(prev => ({
                 ...prev,
                 messages: [...historyWithUser, modelMessage]
             }));
        }, override);
        
        // 2. Commit final model message to history
        const finalModelMessage: Message = { 
             role: 'model', 
             content: accumulatedContent, 
             timestamp: new Date().toISOString(), 
             characterId: respondent.id 
        };
        const finalSession = { ...currentSession, messages: [...historyWithUser, finalModelMessage] };
        
        setCurrentSession(finalSession);
        onSessionUpdate(finalSession); // Persist final state
    }
    setIsStreaming(false);
  };

  const userAvatar = userProfile?.avatarUrl || '👤';

  return (
    <div className="flex flex-col h-full">
      {isImageWindowVisible && <ImageGenerationWindow onGenerate={(p) => geminiService.generateImageFromPrompt(p)} onClose={() => setIsImageWindowVisible(false)} />}
      {isManageParticipantsVisible && <ManageParticipantsModal allCharacters={allCharacters} currentParticipantIds={currentSession.characterIds || []} onSave={(ids) => onSessionUpdate({...currentSession, characterIds: ids})} onClose={() => setIsManageParticipantsVisible(false)} />}
      {isTerminalVisible && participants.length > 0 && <TerminalModal character={participants[0]} onClose={() => setIsTerminalVisible(false)} handlePluginApiRequest={handlePluginApiRequest} />}

      <header className="flex justify-between items-center p-2 border-b border-border-color bg-panel-bg">
        <div className="flex items-center truncate">
            <h2 className="text-lg font-bold text-text-primary mr-2 truncate">{session.name}</h2>
            <span className="text-text-secondary text-xs truncate"> // {participants.map(p => p.name).join(', ') || 'No connection'}</span>
        </div>
        <div className="flex gap-2 shrink-0">
            <button onClick={() => setIsImageWindowVisible(true)} title="Generate Image" className="hover:text-white text-text-primary"><ImageIcon /></button>
            <button onClick={() => setIsTerminalVisible(true)} title="Terminal" className="hover:text-white text-text-primary"><TerminalIcon /></button>
            <button onClick={() => setIsManageParticipantsVisible(true)} title="Netconfig" className="hover:text-white text-text-primary"><BrainIcon /></button>
        </div>
      </header>

      <div className="chat-stream">
        {(currentSession.messages || []).map((msg, index) => {
            const isUser = msg.role === 'user';
            const char = msg.characterId ? participants.find(p => p.id === msg.characterId) : null;
            const avatar = isUser ? (userAvatar) : (char?.avatarUrl || '🤖');
            
            return (
              <div key={index} className={`message ${msg.role}`}>
                <div className="message-avatar">
                    {avatar.startsWith('data:') || avatar.startsWith('http') ? <img src={avatar} /> : avatar}
                </div>
                <div className="message-bubble">
                    <h4 className="text-xs text-dim mb-1" style={{border: 'none', margin: '0', padding: '0'}}>{isUser ? userProfile?.name || 'Commander' : char?.name || 'System'}</h4>
                    <div className="markdown-body" dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} />
                </div>
              </div>
            );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        {/* User Profile Access Button */}
        <button onClick={onOpenUserProfile} title="My Profile" className="p-1 border border-text-primary rounded hover:bg-white/10">
             <div className="w-6 h-6 flex items-center justify-center overflow-hidden">
                {userAvatar.startsWith('data:') || userAvatar.startsWith('http') ? <img src={userAvatar} className="w-full h-full object-cover" /> : userAvatar}
             </div>
        </button>

        <button onClick={() => fileInputRef.current?.click()} className="text-text-primary hover:text-white"><PaperClipIcon /></button>
        <input type="file" ref={fileInputRef} className="hidden" />
        <textarea 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
            placeholder="Enter command..."
            disabled={isStreaming}
        />
        <button onClick={handleSendMessage} disabled={!input.trim() || isStreaming}>SEND</button>
      </div>
    </div>
  );
};
