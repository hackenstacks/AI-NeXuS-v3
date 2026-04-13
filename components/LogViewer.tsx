
import React, { useState, useEffect, useRef } from 'react';
import { logger, LogEntry, LogLevel } from '../services/loggingService.ts';
import { TrashIcon } from './icons/TrashIcon.tsx';

interface LogViewerProps {
  onClose: () => void;
}

export const LogViewer: React.FC<LogViewerProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = logger.subscribe(setLogs);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const formatDetails = (details: any): string => {
    if (!details) return '';
    if (details instanceof Error) return details.stack || details.message;
    if (typeof details === 'object') return JSON.stringify(details, null, 2);
    return String(details);
  }

  const getLogColor = (level: LogLevel) => {
      switch(level) {
          case 'INFO': return 'var(--text-primary)';
          case 'WARN': return '#ffcc00'; // Hardcoded legible yellow
          case 'ERROR': return 'var(--error-color)';
          case 'DEBUG': return 'var(--text-secondary)';
          default: return 'var(--text-primary)';
      }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{maxWidth: '900px', height: '80vh'}} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-xl font-bold">SYSTEM LOGS</h2>
          <div className="flex items-center space-x-4">
            <button onClick={logger.clearLogs} className="text-sm border border-text-secondary px-2 py-1 hover:bg-white/10 flex items-center gap-2">
              <TrashIcon /> CLEAR
            </button>
            <button onClick={onClose} className="text-xl font-bold hover:text-white">&times;</button>
          </div>
        </div>
        
        <div ref={logContainerRef} className="modal-content font-mono text-xs" style={{backgroundColor: '#000'}}>
          {logs.length === 0 && <div className="text-center text-dim mt-10">No logs recorded.</div>}
          {logs.map(log => (
            <div key={log.id} style={{borderBottom: '1px solid #333', padding: '4px 0'}}>
              <div className="flex items-start">
                <span className="text-dim mr-2 shrink-0" style={{minWidth: '70px'}}>
                    {log.timestamp.toLocaleTimeString('en-US', { hour12: false })}
                </span>
                <span className="font-bold mr-2 shrink-0" style={{minWidth: '50px', color: getLogColor(log.level)}}>
                    [{log.level}]
                </span>
                <span style={{color: 'var(--text-primary)', wordBreak: 'break-word'}}>
                    {log.message}
                </span>
              </div>
              {log.details && (
                <pre style={{
                    marginTop: '4px', 
                    marginLeft: '130px', 
                    padding: '8px', 
                    backgroundColor: '#111', 
                    color: 'var(--text-secondary)',
                    overflowX: 'auto'
                }}>
                  {formatDetails(log.details)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
