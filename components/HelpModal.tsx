
import React from 'react';

export const HelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="modal-overlay fixed inset-0 flex items-center justify-center z-50" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>/// MANUAL_OVERRIDE</h2>
          <button onClick={onClose} style={{background: 'none', border: 'none', color: 'black'}}>X</button>
        </div>
        <div className="modal-content">
            <h3>1. STEALTH MODE (OFFLINE)</h3>
            <p>This unit operates in a strict offline environment. All CSS/Assets are local. No CDNs are contacted unless you specifically configure an API endpoint that requires it.</p>
            
            <h3>2. SECURITY</h3>
            <p>Master Password encryption (AES-GCM) secures all local data. Losing your password means total data loss. There is no recovery mechanism.</p>

            <h3>3. INTERFACE</h3>
            <p>The UI is designed for high-efficiency CLI operations.</p>
            <ul>
                <li><strong>>_ Terminal:</strong> Access direct Javascript sandbox for plugins.</li>
                <li><strong>Network:</strong> Manage character connections (multi-chat).</li>
                <li><strong>Intel:</strong> Lorebooks provide context injection for LLMs.</li>
            </ul>

            <h3>4. AVATARS</h3>
            <p>You can use standard image files or <strong>Emojis</strong> as avatars. To use an Emoji, simply paste it into the "Avatar URL" field in the character editor, or use the Profile settings.</p>
        </div>
      </div>
    </div>
  );
};
