
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Character, ChatSession, AppData, Plugin, GeminiApiRequest, Message, CryptoKeys, RagSource, ConfirmationRequest, UISettings, Lorebook, UserProfile } from '../types.ts';
import { loadData, saveData } from '../services/secureStorage.ts';
import { CharacterList } from './CharacterList.tsx';
import { ChatList } from './ChatList.tsx';
import { CharacterForm } from './CharacterForm.tsx';
import { ChatInterface } from './ChatInterface.tsx';
import { PluginManager } from './PluginManager.tsx';
import { LogViewer } from './LogViewer.tsx';
import { HelpModal } from './HelpModal.tsx';
import { LorebookManager } from './LorebookManager.tsx';
import { DocumentLibrary } from './DocumentLibrary.tsx';
import { ChatSelectionModal } from './ChatSelectionModal.tsx';
import { ConfirmationModal } from './ConfirmationModal.tsx';
import { AppearanceModal } from './AppearanceModal.tsx';
import { UserProfileModal } from './UserProfileModal.tsx';
import { PluginSandbox } from '../services/pluginSandbox.ts';
import * as geminiService from '../services/geminiService.ts';
import * as compatibilityService from '../services/compatibilityService.ts';
import * as cryptoService from '../services/cryptoService.ts';
import { logger } from '../services/loggingService.ts';
// Icons now render Emojis
import { DownloadIcon } from './icons/DownloadIcon.tsx';
import { UploadIcon } from './icons/UploadIcon.tsx';
import { CodeIcon } from './icons/CodeIcon.tsx';
import { TerminalIcon } from './icons/TerminalIcon.tsx';
import { HelpIcon } from './icons/HelpIcon.tsx';
import { PlusIcon } from './icons/PlusIcon.tsx';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon.tsx';
import { UsersIcon } from './icons/UsersIcon.tsx';
import { PaletteIcon } from './icons/PaletteIcon.tsx';
import { GlobeIcon } from './icons/GlobeIcon.tsx';
import { FolderIcon } from './icons/FolderIcon.tsx';
import { UserIcon } from './icons/UserIcon.tsx';
import { CogIcon } from './icons/CogIcon.tsx';
import { XMarkIcon } from './icons/XMarkIcon.tsx';

// Default Plugins (Updated default to AI Horde)
const defaultImagePlugin: Plugin = {
    id: 'default-image-generator',
    name: 'Image Gen',
    description: 'CLI Image Generator Hook',
    enabled: true,
    code: `
nexus.hooks.register('generateImage', async (payload) => {
  try {
    let prompt = payload.type === 'summary' ? 
      await nexus.gemini.generateContent('Describe this scene for an image generator: ' + payload.value) : 
      payload.value;
    const settings = payload.settings || {};
    const imageUrl = await nexus.gemini.generateImage(prompt, settings);
    return { url: imageUrl };
  } catch (error) { return { error: String(error) }; }
});`,
    settings: { 
        service: 'aihorde', 
        model: 'stable_diffusion',
        apiKey: '0000000000'
    }
};

const defaultTtsPlugin: Plugin = {
    id: 'default-tts-narrator',
    name: 'TTS Engine',
    description: 'Core TTS System',
    enabled: true,
    code: `nexus.log('TTS System Active');`,
    settings: {}
};

type ActivePanel = 'chats' | 'characters' | 'lorebooks' | 'library' | 'none';
type ActiveView = 'chat' | 'character-form' | 'plugins' | 'lorebooks' | 'library';

export const MainLayout: React.FC = () => {
    const [appData, setAppData] = useState<AppData>({ characters: [], chatSessions: [], plugins: [], lorebooks: [], knowledgeBase: [] });
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
    const [activeView, setActiveView] = useState<ActiveView>('chat');
    const [activePanel, setActivePanel] = useState<ActivePanel>('chats'); // Default open panel? Or none?
    const [isLogViewerVisible, setIsLogViewerVisible] = useState(false);
    const [isHelpVisible, setIsHelpVisible] = useState(false);
    const [isChatModalVisible, setIsChatModalVisible] = useState(false);
    const [isAppearanceModalVisible, setIsAppearanceModalVisible] = useState(false);
    const [isUserProfileVisible, setIsUserProfileVisible] = useState(false);
    const [confirmationRequest, setConfirmationRequest] = useState<ConfirmationRequest | null>(null);
    const [showArchivedChats, setShowArchivedChats] = useState(false);
    const [showArchivedCharacters, setShowArchivedCharacters] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const sandboxes = useRef(new Map<string, PluginSandbox>()).current;

    const persistData = useCallback(async (data: AppData) => { await saveData(data); }, []);

    const handlePanelToggle = (panel: ActivePanel) => {
        setActivePanel(prev => (prev === panel ? 'none' : panel));
    };

    // Plugin API Handler
    const handlePluginApiRequest = useCallback(async (request: GeminiApiRequest) => {
        switch (request.type) {
            case 'generateContent': return await geminiService.generateContent(request.prompt);
            case 'generateImage': 
                const imagePlugin = appData.plugins?.find(p => p.id === 'default-image-generator');
                return await geminiService.generateImageFromPrompt(request.prompt, { ...imagePlugin?.settings, ...request.settings });
            default: throw new Error('Unknown API request type');
        }
    }, [appData.plugins]);

    // Data Loading & Init
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const data = await loadData();
                let dataNeedsSave = false;
                if (!data.userKeys) {
                    const keyPair = await cryptoService.generateSigningKeyPair();
                    data.userKeys = {
                        publicKey: await cryptoService.exportKey(keyPair.publicKey),
                        privateKey: await cryptoService.exportKey(keyPair.privateKey),
                    };
                    dataNeedsSave = true;
                }
                // Ensure arrays exist
                if (!data.characters) data.characters = [];
                if (!data.chatSessions) data.chatSessions = [];
                if (!data.knowledgeBase) data.knowledgeBase = [];
                if (!data.lorebooks) data.lorebooks = [];
                if (!data.userProfile) data.userProfile = { name: 'Commander' };
                
                // Plugin Init
                if (!data.plugins) data.plugins = [];
                [defaultImagePlugin, defaultTtsPlugin].forEach(dp => {
                    if (!data.plugins!.some(p => p.id === dp.id)) {
                        data.plugins!.push(dp);
                        dataNeedsSave = true;
                    }
                });

                if (dataNeedsSave) await persistData(data);
                setAppData(data);
                if (data.chatSessions.length > 0) {
                    setSelectedChatId(data.chatSessions.find(cs => !cs.isArchived)?.id || data.chatSessions[0].id);
                } else if (data.characters.length > 0) {
                    setActivePanel('characters');
                }
            } catch (error) {
                console.error(error);
                alert("Critical System Failure: Data corruption detected.");
            }
        };
        loadInitialData();
        return () => { sandboxes.forEach(s => s.terminate()); sandboxes.clear(); };
    }, [persistData]);

    // Sandbox Management
    useEffect(() => {
        appData.plugins?.forEach(async (plugin) => {
            if (plugin.enabled && !sandboxes.get(plugin.id)) {
                const sandbox = new PluginSandbox(handlePluginApiRequest);
                if(plugin.code) await sandbox.loadCode(plugin.code);
                sandboxes.set(plugin.id, sandbox);
            } else if (!plugin.enabled && sandboxes.get(plugin.id)) {
                sandboxes.get(plugin.id)?.terminate();
                sandboxes.delete(plugin.id);
            }
        });
    }, [appData.plugins, sandboxes, handlePluginApiRequest]);

    // ... [Handlers] ...
    
    const handleSaveCharacter = async (character: Character) => {
        const isNew = !appData.characters.some(c => c.id === character.id);
        let updated = { ...character };
        if (isNew || !updated.keys) {
            const kp = await cryptoService.generateSigningKeyPair();
            updated.keys = { publicKey: await cryptoService.exportKey(kp.publicKey), privateKey: await cryptoService.exportKey(kp.privateKey) };
        }
        if (appData.userKeys) {
            const pk = await cryptoService.importKey(appData.userKeys.privateKey, 'sign');
            const toSign: Partial<Character> = { ...updated };
            delete toSign.signature;
            updated.signature = await cryptoService.sign(cryptoService.createCanonicalString(toSign), pk);
            updated.userPublicKeyJwk = appData.userKeys.publicKey;
        }
        const newList = isNew ? [...appData.characters, updated] : appData.characters.map(c => c.id === updated.id ? updated : c);
        const newData = { ...appData, characters: newList };
        setAppData(newData);
        await persistData(newData);
        setActiveView('chat');
    };

    const handleCharacterUpdate = useCallback((c: Character) => {
        setAppData(prev => {
            const n = { ...prev, characters: prev.characters.map(ch => ch.id === c.id ? c : ch) };
            persistData(n);
            return n;
        });
    }, [persistData]);

    const handleCreateChat = (name: string, characterIds: string[], lorebookIds: string[]) => {
        const newSession: ChatSession = {
            id: crypto.randomUUID(), name, characterIds, messages: [], 
            uiSettings: { avatarSize: 3 }, // Default to small avatar (scale 1-10, where 3 is quite small)
            lorebookIds
        };
        const newData = { ...appData, chatSessions: [...appData.chatSessions, newSession] };
        setAppData(newData);
        persistData(newData);
        setSelectedChatId(newSession.id);
        setActiveView('chat');
        setIsChatModalVisible(false);
        setActivePanel('none');
    };

    const handleSessionUpdate = useCallback((s: ChatSession) => {
        setAppData(prev => {
            const exists = prev.chatSessions.some(sess => sess.id === s.id);
            const list = exists ? prev.chatSessions.map(sess => sess.id === s.id ? s : sess) : [...prev.chatSessions, s];
            const n = { ...prev, chatSessions: list };
            persistData(n);
            return n;
        });
    }, [persistData]);

    const triggerPluginHook = useCallback(async <T, R>(hook: string, data: T): Promise<R> => {
        let processed: any = data;
        const enabled = appData.plugins?.filter(p => p.enabled) || [];
        if (hook === 'generateImage') {
            const ip = appData.plugins?.find(p => p.id === 'default-image-generator');
            processed = { ...processed, settings: ip?.settings || {} };
        }
        for (const p of enabled) {
            const sb = sandboxes.get(p.id);
            if (sb) try { processed = await sb.executeHook(hook, processed); } catch(e) { console.error(e); }
        }
        return processed as R;
    }, [appData.plugins, sandboxes]);

    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        // Do NOT clear value here. Clearing it immediately can cause the browser to garbage collect the File object reference.
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                let text = (e.target?.result as string) || '';
                // 1. Sanitize BOM
                if (text.charCodeAt(0) === 0xFEFF) {
                    text = text.slice(1);
                }
                // 2. Trim whitespace
                text = text.trim();
                
                let data;
                try {
                    data = JSON.parse(text);
                } catch (parseError) {
                    console.error("JSON Parse Error:", parseError);
                    alert("Import failed: Invalid JSON format. The file might be corrupted or encoded incorrectly.");
                    return;
                }

                // 3. Check for Full Backup
                if (data.spec === 'ai_nexus_backup') {
                    if (confirm("Restore full system backup? This will overwrite your current data.")) {
                        await persistData(data.data);
                        window.location.reload();
                    }
                    return;
                }

                // 4. Check for Lorebook (SillyTavern format)
                const lorebookImport = compatibilityService.sillyTavernWorldInfoToNexus(data, file.name);
                if (lorebookImport) {
                     setAppData(prev => {
                        const newLorebook = { ...lorebookImport, id: crypto.randomUUID() };
                        const newLorebooks = [...(prev.lorebooks || []), newLorebook];
                        const newData = { ...prev, lorebooks: newLorebooks };
                        persistData(newData);
                        return newData;
                    });
                    alert(`Imported Lorebook: ${lorebookImport.name}`);
                    return;
                }

                // 5. Check for Character
                const importResult = compatibilityService.v2ToNexus(data);
                if (importResult) {
                    const { character, lorebook } = importResult;
                    setAppData(prev => {
                        const exists = prev.characters.find(c => c.id === character.id);
                        const chars = exists ? prev.characters.map(c => c.id === character.id ? {...character, keys: c.keys} : c) : [...prev.characters, character];
                        
                        let newLorebooks = prev.lorebooks || [];
                        if (lorebook) {
                             newLorebooks = [...newLorebooks, lorebook];
                        }

                        const newData = { ...prev, characters: chars, lorebooks: newLorebooks };
                        persistData(newData);
                        return newData;
                    });
                    alert(`Imported Character: ${character.name}`);
                    return;
                }

                alert('Unknown format. Please ensure you are importing a valid backup, character card, or lorebook JSON.');
            } catch(e) { 
                console.error(e); 
                alert(`Import failed: ${e instanceof Error ? e.message : String(e)}. Please check the file content.`); 
            } finally {
                // Clear the input value AFTER processing is complete to allow re-importing same file if needed.
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        
        // Handle read errors
        reader.onerror = () => {
            alert("Error reading file");
            if (fileInputRef.current) fileInputRef.current.value = '';
        };

        reader.readAsText(file);
    }

    // UI Renders
    const selectedChat = appData.chatSessions.find(s => s.id === selectedChatId);

    const renderMainContent = () => {
        switch (activeView) {
            case 'character-form': return <div className="h-full overflow-hidden"><CharacterForm character={editingCharacter} onSave={handleSaveCharacter} onCancel={() => setActiveView('chat')} onGenerateImage={(p) => geminiService.generateImageFromPrompt(p)} availableDocuments={appData.knowledgeBase || []} /></div>;
            case 'plugins': return <div className="fixed inset-0 z-50 overflow-hidden bg-bg-color"><PluginManager plugins={appData.plugins || []} onPluginsUpdate={(p) => { setAppData({...appData, plugins: p}); persistData({...appData, plugins: p}); }} onSetConfirmation={setConfirmationRequest} /></div>; // Full screen for plugins
            case 'library': return <div className="fixed inset-0 z-50 overflow-hidden bg-bg-color"><DocumentLibrary documents={appData.knowledgeBase || []} onUpdateDocuments={(d) => { setAppData({...appData, knowledgeBase: d}); persistData({...appData, knowledgeBase: d}); }} onSetConfirmation={setConfirmationRequest} /></div>;
            case 'chat': default:
                return selectedChat ? <ChatInterface 
                    key={selectedChat.id} session={selectedChat} allCharacters={appData.characters} allChatSessions={appData.chatSessions} allLorebooks={appData.lorebooks || []}
                    userKeys={appData.userKeys} userProfile={appData.userProfile} onSessionUpdate={handleSessionUpdate} onCharacterUpdate={handleCharacterUpdate}
                    onTriggerHook={triggerPluginHook} onMemoryImport={() => {}} onSaveBackup={() => {}} handlePluginApiRequest={handlePluginApiRequest}
                    onOpenUserProfile={() => setIsUserProfileVisible(true)}
                /> : <div className="p-4 text-center text-dim pt-20"><h3>System Ready. Select a Chat from the Dock.</h3></div>;
        }
    };

    return (
        <div className="app-container">
            {isLogViewerVisible && <LogViewer onClose={() => setIsLogViewerVisible(false)} />}
            {isHelpVisible && <HelpModal onClose={() => setIsHelpVisible(false)} />}
            {isChatModalVisible && <ChatSelectionModal characters={appData.characters.filter(c => !c.isArchived)} lorebooks={appData.lorebooks || []} onClose={() => setIsChatModalVisible(false)} onCreateChat={handleCreateChat}/>}
            {isAppearanceModalVisible && <AppearanceModal settings={selectedChat?.uiSettings || {}} currentChat={selectedChat} allCharacters={appData.characters} onUpdate={(s) => handleSessionUpdate({...selectedChat!, uiSettings: s})} onGenerateImage={(p) => geminiService.generateImageFromPrompt(p)} onClose={() => setIsAppearanceModalVisible(false)} />}
            {isUserProfileVisible && <UserProfileModal profile={appData.userProfile} onSave={(p) => { setAppData({...appData, userProfile: p}); persistData({...appData, userProfile: p}); }} onClose={() => setIsUserProfileVisible(false)} onGenerateImage={(p) => geminiService.generateImageFromPrompt(p)} />}
            {confirmationRequest && <ConfirmationModal message={confirmationRequest.message} onConfirm={confirmationRequest.onConfirm} onCancel={confirmationRequest.onCancel} />}

            <main className="main-content">
                {selectedChat?.uiSettings?.bannerImage && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '150px', 
                        backgroundImage: `url(${selectedChat.uiSettings.bannerImage})`, 
                        backgroundSize: 'cover', opacity: 0.5, zIndex: 0 
                    }}></div>
                )}
                {/* Ensure content is above banner */}
                <div style={{position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column'}}>
                    {renderMainContent()}
                </div>
            </main>

            {/* Side Panels (Now act as windows/drawers controlled by dock) */}
            {activePanel === 'chats' && (
                <div className="side-panel">
                    <div className="flex justify-between items-center p-2 border-b border-border-color">
                        <span className="font-bold uppercase">Chats</span>
                        <button onClick={() => setActivePanel('none')} className="text-text-primary hover:text-text-secondary" title="Close Panel"><XMarkIcon/></button>
                    </div>
                    <ChatList 
                        chatSessions={appData.chatSessions.filter(c => !!c.isArchived === showArchivedChats)} 
                        characters={appData.characters} 
                        selectedChatId={selectedChatId} 
                        onSelectChat={(id) => { setSelectedChatId(id); setActiveView('chat'); setActivePanel('none'); }} 
                        onDeleteChat={() => {}} 
                        onExportChat={() => {}} 
                        onAddNew={() => setIsChatModalVisible(true)}
                        showArchived={showArchivedChats} 
                        onToggleArchiveView={() => setShowArchivedChats(!showArchivedChats)} 
                        onRestoreChat={() => {}} 
                        onPermanentlyDeleteChat={() => {}} 
                    />
                </div>
            )}
            
            {activePanel === 'characters' && (
                <div className="side-panel">
                    <div className="flex justify-between items-center p-2 border-b border-border-color">
                        <span className="font-bold uppercase">Personnel</span>
                        <button onClick={() => setActivePanel('none')} className="text-text-primary hover:text-text-secondary" title="Close Panel"><XMarkIcon/></button>
                    </div>
                    <CharacterList characters={appData.characters.filter(c => !!c.isArchived === showArchivedCharacters)} onDeleteCharacter={() => {}} onEditCharacter={(c) => {setEditingCharacter(c); setActiveView('character-form'); setActivePanel('none');}} onAddNew={() => {setEditingCharacter(null); setActiveView('character-form'); setActivePanel('none');}} onExportCharacter={() => {}} showArchived={showArchivedCharacters} onToggleArchiveView={() => setShowArchivedCharacters(!showArchivedCharacters)} onRestoreCharacter={() => {}} onPermanentlyDeleteCharacter={() => {}} />
                </div>
            )}

            {activePanel === 'lorebooks' && (
                <div className="side-panel">
                    <div className="flex justify-between items-center p-2 border-b border-border-color">
                        <span className="font-bold uppercase">Intel</span>
                        <button onClick={() => setActivePanel('none')} className="text-text-primary hover:text-text-secondary" title="Close Panel"><XMarkIcon/></button>
                    </div>
                    <LorebookManager lorebooks={appData.lorebooks || []} onLorebooksUpdate={(l) => { setAppData({...appData, lorebooks: l}); persistData({...appData, lorebooks: l}); }} onSetConfirmation={setConfirmationRequest} />
                </div>
            )}

            {/* Bottom Dock */}
            <div className="dock-trigger"></div>
            <div className={`dock-container ${activePanel !== 'none' ? 'active' : ''}`}>
                <button className={`dock-icon-btn ${activePanel === 'chats' ? 'active' : ''}`} onClick={() => handlePanelToggle('chats')}>
                    <ChatBubbleIcon />
                    <span className="dock-label">Chats</span>
                </button>
                <button className={`dock-icon-btn ${activePanel === 'characters' ? 'active' : ''}`} onClick={() => handlePanelToggle('characters')}>
                    <UsersIcon />
                    <span className="dock-label">People</span>
                </button>
                <button className={`dock-icon-btn ${activePanel === 'lorebooks' ? 'active' : ''}`} onClick={() => handlePanelToggle('lorebooks')}>
                    <GlobeIcon />
                    <span className="dock-label">Intel</span>
                </button>
                <div className="dock-separator"></div>
                <button className="dock-icon-btn" onClick={() => { setActiveView('library'); setActivePanel('none'); }}>
                    <FolderIcon />
                    <span className="dock-label">Files</span>
                </button>
                <button className="dock-icon-btn" onClick={() => { setActiveView('plugins'); setActivePanel('none'); }}>
                    <CodeIcon />
                    <span className="dock-label">Mods</span>
                </button>
                <div className="dock-separator"></div>
                
                {/* Import/Export */}
                <input type="file" ref={fileInputRef} onChange={handleImportData} accept=".json" className="hidden" />
                <button className="dock-icon-btn" onClick={() => fileInputRef.current?.click()}>
                    <UploadIcon />
                    <span className="dock-label">Import</span>
                </button>
                <button className="dock-icon-btn" onClick={() => {
                     const data = { spec: 'ai_nexus_backup', version: '1.0', data: appData };
                     // Pretty print JSON to avoid single-line errors and improve robustness
                     const jsonString = JSON.stringify(data, null, 2); 
                     const blob = new Blob([jsonString], {type: 'application/json'});
                     const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'backup.json'; a.click();
                }}>
                    <DownloadIcon />
                    <span className="dock-label">Export</span>
                </button>

                <div className="dock-separator"></div>
                <button className="dock-icon-btn" onClick={() => setIsAppearanceModalVisible(true)}>
                    <PaletteIcon />
                    <span className="dock-label">Style</span>
                </button>
                <button className="dock-icon-btn" onClick={() => setIsLogViewerVisible(true)}>
                    <TerminalIcon />
                    <span className="dock-label">Log</span>
                </button>
                <button className="dock-icon-btn" onClick={() => setIsHelpVisible(true)}>
                    <HelpIcon />
                    <span className="dock-label">Help</span>
                </button>
            </div>
        </div>
    );
};
