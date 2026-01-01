
import React, { useState, useEffect, useRef } from 'react';
import { Character, GeminiApiRequest } from '../types.ts';
import { PluginSandbox } from '../services/pluginSandbox.ts';
import { TerminalIcon } from './icons/TerminalIcon.tsx';

interface TerminalModalProps {
  character: Character;
  onClose: () => void;
  handlePluginApiRequest: (request: GeminiApiRequest) => Promise<any>;
}

interface TerminalLog {
    type: 'input' | 'output' | 'error' | 'system';
    content: string;
}

export const TerminalModal: React.FC<TerminalModalProps> = ({ character, onClose, handlePluginApiRequest }) => {
  const [logs, setLogs] = useState<TerminalLog[]>([{ type: 'system', content: `Connected to ${character.name}@nexus-terminal v1.0` }]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sandboxRef = useRef<PluginSandbox | null>(null);

  // Initialize sandbox
  useEffect(() => {
      const initSandbox = async () => {
          try {
              sandboxRef.current = new PluginSandbox(handlePluginApiRequest);
              if (character.pluginCode) {
                  setLogs(prev => [...prev, { type: 'system', content: 'Loading character plugin code...' }]);
                  await sandboxRef.current.loadCode(character.pluginCode);
                  setLogs(prev => [...prev, { type: 'system', content: 'Environment ready.' }]);
              } else {
                  setLogs(prev => [...prev, { type: 'system', content: 'No plugin code found. Standard shell ready.' }]);
              }
          } catch (e) {
              setLogs(prev => [...prev, { type: 'error', content: `Init failed: ${e instanceof Error ? e.message : String(e)}` }]);
          }
      };
      initSandbox();

      return () => {
          sandboxRef.current?.terminate();
      };
  }, [character, handlePluginApiRequest]);

  useEffect(() => {
      if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
  }, [logs]);

  // Focus input on click anywhere
  const handleContainerClick = () => {
      inputRef.current?.focus();
  };

  const executeCommand = async (cmd: string) => {
      if (!cmd.trim()) return;
      
      setLogs(prev => [...prev, { type: 'input', content: `> ${cmd}` }]);
      setHistory(prev => [...prev, cmd]);
      setHistoryIndex(-1);
      setInput('');

      if (!sandboxRef.current) {
          setLogs(prev => [...prev, { type: 'error', content: 'Sandbox not initialized.' }]);
          return;
      }

      try {
          // Detect simple commands or treat as JS
          if (cmd === 'clear') {
              setLogs([]);
              return;
          }
          if (cmd === 'help') {
              setLogs(prev => [...prev, { type: 'system', content: 'Available commands: clear, help. All other input is evaluated as JavaScript.' }]);
              return;
          }

          const result = await sandboxRef.current.evalCode(cmd);
          const output = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
          setLogs(prev => [...prev, { type: 'output', content: output }]);
      } catch (e) {
          setLogs(prev => [...prev, { type: 'error', content: String(e) }]);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          executeCommand(input);
      } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (history.length > 0) {
              const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
              setHistoryIndex(newIndex);
              setInput(history[newIndex]);
          }
      } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (historyIndex !== -1) {
              const newIndex = Math.min(history.length - 1, historyIndex + 1);
              setHistoryIndex(newIndex);
              setInput(history[newIndex]);
              if (historyIndex === history.length - 1) {
                  setHistoryIndex(-1);
                  setInput('');
              }
          }
      }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-black border-2 border-gray-700 rounded-lg shadow-2xl w-full max-w-3xl h-[600px] flex flex-col font-mono text-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gray-800 p-2 flex justify-between items-center border-b border-gray-700 select-none">
            <div className="flex items-center space-x-2 text-gray-300">
                <TerminalIcon className="w-4 h-4" />
                <span className="font-bold">{character.name} @ shell</span>
            </div>
            <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500 cursor-pointer" title="Minimize" onClick={onClose}></div>
                <div className="w-3 h-3 rounded-full bg-green-500 cursor-pointer" title="Maximize"></div>
                <div className="w-3 h-3 rounded-full bg-red-500 cursor-pointer" title="Close" onClick={onClose}></div>
            </div>
        </div>

        {/* Terminal Body */}
        <div 
            className="flex-1 bg-black p-4 overflow-y-auto cursor-text text-green-400" 
            onClick={handleContainerClick}
            ref={scrollRef}
        >
            {logs.map((log, i) => (
                <div key={i} className={`mb-1 whitespace-pre-wrap break-all ${
                    log.type === 'input' ? 'text-white' : 
                    log.type === 'error' ? 'text-red-400' : 
                    log.type === 'system' ? 'text-blue-400' : 
                    'text-green-400'
                }`}>
                    {log.content}
                </div>
            ))}
            <div className="flex items-center">
                <span className="text-white mr-2">{'>'}</span>
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent border-none outline-none text-white font-mono p-0"
                    autoComplete="off"
                    autoFocus
                />
            </div>
        </div>
      </div>
    </div>
  );
};
