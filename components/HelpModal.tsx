
import React from 'react';

interface HelpModalProps {
  onClose: () => void;
}

const HelpSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-2xl font-bold text-primary-500 border-b-2 border-border-neutral pb-2 mb-4 flex items-center">
        {title}
    </h2>
    <div className="space-y-3 text-text-primary text-sm leading-relaxed">{children}</div>
  </section>
);

const HelpSubSection: React.FC<{ title: string; icon?: string; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="mt-4 pl-4 border-l-4 border-primary-500/30 bg-background-tertiary/10 p-2 rounded-r-lg">
        <h3 className="text-lg font-bold text-text-primary mb-2 flex items-center">
            {icon && <span className="mr-2 text-xl">{icon}</span>}
            {title}
        </h3>
        <div className="space-y-2 text-text-secondary">{children}</div>
    </div>
);


export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-background-secondary rounded-xl shadow-2xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col border border-border-strong" onClick={e => e.stopPropagation()}>
        <header className="p-5 border-b border-border-neutral flex justify-between items-center bg-background-tertiary/30 rounded-t-xl">
          <div className="flex items-center space-x-3">
             <span className="text-4xl">📘</span>
             <div>
                <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">AI Nexus Manual</h2>
                <p className="text-sm text-text-secondary">The Ultimate Guide to Your Personal AI World</p>
             </div>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-accent-red transition-colors text-3xl font-bold leading-none p-2 rounded-full hover:bg-background-tertiary">&times;</button>
        </header>
        <div className="flex-1 p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-primary-500 scrollbar-track-transparent">
            
            <HelpSection title="🚀 1. Getting Started">
                <p>Welcome, Commander! 🫡 You have just entered <strong>AI Nexus</strong>, a military-grade, offline-first AI station. Everything you create here stays here.</p>
                <HelpSubSection title="The Golden Key 🔑" icon="🔐">
                    <p>When you first arrived, you created a <strong>Master Password</strong>. This is not just a login; it is an encryption key! 🛡️</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>It encrypts <strong>EVERYTHING</strong>: Characters, Chats, Lore, Plugins.</li>
                        <li><strong>WARNING:</strong> We cannot recover this password. If you lose it, your data is locked forever in the digital void. 🕳️</li>
                    </ul>
                </HelpSubSection>
            </HelpSection>

            <HelpSection title="👥 2. Characters & Creation">
                 <p>Create digital souls! From helpful assistants to zombie apocalypse narrators.</p>
                 <HelpSubSection title="The Character Card 📇" icon="📝">
                    <ul className="list-disc list-inside space-y-2 ml-2">
                        <li><strong>Name & Avatar:</strong> Who are they? Upload a face or generate one with AI! 🎨</li>
                        <li><strong>Role Instruction:</strong> This is the brain! 🧠 Describe their personality, quirks, and secrets here.</li>
                        <li><strong>Voice 🗣️:</strong> Pick a high-quality AI voice (like Puck or Fenrir) for them to speak with.</li>
                        <li><strong>Lore 📜:</strong> Sticky notes for the AI. Key facts they should never forget.</li>
                    </ul>
                 </HelpSubSection>
                 <HelpSubSection title="Advanced Brains 🧠" icon="⚡">
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong>Google Search 🔍:</strong> Toggle this to let them browse the real web for facts!</li>
                        <li><strong>Thinking Mode 💡:</strong> Enables "Deep Thinking" (Gemini 3.0 Pro) for complex logic and coding.</li>
                        <li><strong>RAG (Knowledge) 📚:</strong> Connect them to your uploaded documents so they can read your PDFs and notes!</li>
                    </ul>
                 </HelpSubSection>
            </HelpSection>

            <HelpSection title="💬 3. The Chat Experience">
                 <p>This is where the magic happens. Talk, roleplay, and command.</p>
                 <HelpSubSection title="Cool Features" icon="✨">
                    <ul className="list-disc list-inside space-y-2 ml-2">
                        <li><strong>Multi-User Chat 🗣️🗣️:</strong> Add multiple characters to one room! They will talk to you AND each other.</li>
                        <li><strong>Auto-Conversation 🤖💬🤖:</strong> Type <code>/converse</code> and watch two AIs talk endlessly while you eat popcorn. 🍿</li>
                        <li><strong>Narrator Mode 📖:</strong> Click the Book icon. The AI becomes a storyteller describing the scene.</li>
                        <li><strong>Image Generation 🖼️:</strong> Click the Picture icon. The AI reads the chat and paints a picture of the current moment!</li>
                    </ul>
                 </HelpSubSection>
                 <HelpSubSection title="Slash Commands ⌨️" icon="⚡">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm font-mono bg-black/20 p-3 rounded-lg">
                        <div>/image [prompt]</div><div className="text-text-secondary">- Force generate an image</div>
                        <div>/narrate [text]</div><div className="text-text-secondary">- Force a narration event</div>
                        <div>/snapshot</div><div className="text-text-secondary">- Save chat into Long-Term Memory</div>
                        <div>/shell [code]</div><div className="text-text-secondary">- Execute JS code (See Section 5)</div>
                        <div>/sys [text]</div><div className="text-text-secondary">- Inject system instructions secretly</div>
                        <div>/converse</div><div className="text-text-secondary">- Make AIs talk to each other</div>
                    </div>
                 </HelpSubSection>
            </HelpSection>
            
            <HelpSection title="💻 4. The Terminal (NEW!)">
                <p>For the hackers and power users! 🕵️‍♂️ Access the raw brain of your character.</p>
                <HelpSubSection title="How to Access" icon="🖥️">
                    <p>Click the <strong>Terminal Icon (>_)</strong> in the top-right of the chat window. A retro console will slide down.</p>
                </HelpSubSection>
                <HelpSubSection title="What can I do?" icon="🛠️">
                    <p>This is a JavaScript Sandbox. You have access to a special object called <code>nexus</code>.</p>
                    <ul className="list-disc list-inside space-y-2 ml-2 mt-2">
                        <li><strong>Log Data:</strong> <code>nexus.log('Hello World')</code></li>
                        <li><strong>Generate AI Text:</strong> <code>await nexus.gemini.generateContent('Say hi')</code></li>
                        <li><strong>Generate Images:</strong> <code>await nexus.gemini.generateImage('A cat')</code></li>
                        <li><strong>Change UI Dynamically:</strong> <code>nexus.ui.setAvatarSize(8)</code> (Resizes avatars to level 8!) 📏</li>
                    </ul>
                    <p className="mt-2 text-accent-green font-mono">Tip: Type <code>/shell nexus.ui.setAvatarSize(10)</code> in the main chat to make avatars HUGE instantly!</p>
                </HelpSubSection>
            </HelpSection>

            <HelpSection title="🧩 5. Plugins & Logic">
                <p>Teach your AI new tricks with JavaScript code. 🪄</p>
                <HelpSubSection title="Character Logic" icon="🧠">
                    <p>In the Character Editor, turn on "Enable Character Logic". You can write code that runs <em>before</em> the AI replies.</p>
                    <p className="italic text-text-secondary">Example: Make the AI roll a D20 dice before every attack!</p>
                </HelpSubSection>
                <HelpSubSection title="Global Plugins" icon="🌐">
                    <p>Go to the <strong>Plugins</strong> panel (Code Icon). You can write scripts that affect the whole app, like intercepting messages or changing image generators.</p>
                </HelpSubSection>
            </HelpSection>

             <HelpSection title="🌍 6. Lorebooks & Library">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-background-primary p-4 rounded-lg border border-border-neutral">
                        <h4 className="font-bold text-accent-yellow mb-2">📚 Lorebooks (World Info)</h4>
                        <p>Create a dictionary for your world. If you add an entry for "Excalibur", the AI will automatically know what it is whenever you mention it in chat! No need to explain twice.</p>
                    </div>
                    <div className="bg-background-primary p-4 rounded-lg border border-border-neutral">
                        <h4 className="font-bold text-accent-blue mb-2">📂 Document Library (RAG)</h4>
                        <p>Upload PDFs, TXT files, or Markdown. Enable "RAG" on a character, and they can read these files to answer your questions accurately!</p>
                    </div>
                </div>
            </HelpSection>

            <HelpSection title="⚙️ 7. Settings & Customization">
                 <HelpSubSection title="Appearance" icon="🎨">
                    <p>Click the Palette icon. You can:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Change background & banner images.</li>
                        <li><strong>Avatar Size Slider:</strong> Slide from 1 (Tiny) to 10 (Massive)! 🤏🐘</li>
                    </ul>
                 </HelpSubSection>
                 <HelpSubSection title="Import / Export" icon="floppy-disk">
                    <p>We support <strong>Character Cards (V2)</strong> and <strong>SillyTavern Lorebooks</strong>. You can move your data in and out freely.</p>
                 </HelpSubSection>
            </HelpSection>

        </div>
      </div>
    </div>
  );
};
