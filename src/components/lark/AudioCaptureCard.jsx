import React, { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Upload, FileAudio, CheckCircle, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const WaveformBars = () => (
  <div className="flex items-center justify-center gap-0.5 h-8">
    {[0.3, 0.6, 1, 0.8, 0.5, 0.9, 0.4, 0.7, 1, 0.6, 0.3, 0.8].map((h, i) => (
      <div
        key={i}
        className="w-0.5 rounded-full wave-bar"
        style={{
          height: `${h * 100}%`,
          background: 'linear-gradient(to top, #7C3AED, #A78BFA)',
          '--dur': `${0.5 + i * 0.07}s`,
          animationDelay: `${i * 0.05}s`,
          transformOrigin: 'bottom',
        }}
      />
    ))}
  </div>
);

export default function AudioCaptureCard({ onAudioReady }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunksRef.current = [];
    const mr = new MediaRecorder(stream);
    mr.ondataavailable = e => chunksRef.current.push(e.data);
    mr.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
      setIsUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setIsUploading(false);
      setUploadedFile({ name: 'Voice Recording', url: file_url });
      onAudioReady(file_url);
      stream.getTracks().forEach(t => t.stop());
    };
    mr.start();
    mediaRecorderRef.current = mr;
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleFile = useCallback(async (file) => {
    if (!file.type.startsWith('audio/')) return;
    setIsUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setIsUploading(false);
    setUploadedFile({ name: file.name, url: file_url });
    onAudioReady(file_url);
  }, [onAudioReady]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const clearFile = () => {
    setUploadedFile(null);
    onAudioReady(null);
  };

  return (
    <div
      className="lark-card-glass rounded-2xl p-5 h-full flex flex-col"
      style={{ minHeight: '340px' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div
          className="w-1.5 h-5 rounded-full"
          style={{ background: 'linear-gradient(to bottom, #8B5CF6, #4C1D95)' }}
        />
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--lark-text-muted)' }}>
          Audio Capture
        </span>
      </div>

      {/* Mic Button */}
      <div className="flex flex-col items-center justify-center flex-1 gap-4">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isUploading}
          className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${isRecording ? 'recording-pulse' : 'hover:scale-105'}`}
          style={{
            background: isRecording
              ? 'radial-gradient(circle, rgba(239,68,68,0.3), rgba(220,38,38,0.1))'
              : 'radial-gradient(circle, rgba(139,92,246,0.25), rgba(76,29,149,0.1))',
            border: isRecording
              ? '2px solid rgba(239,68,68,0.6)'
              : '2px solid rgba(139,92,246,0.4)',
            boxShadow: isRecording
              ? '0 0 30px rgba(239,68,68,0.2)'
              : '0 0 20px rgba(139,92,246,0.15)',
          }}
        >
          {isRecording ? (
            <MicOff size={32} style={{ color: '#F87171' }} />
          ) : (
            <Mic size={32} style={{ color: 'var(--lark-violet-bright)' }} />
          )}
        </button>

        {isRecording && (
          <div className="flex flex-col items-center gap-2">
            <WaveformBars />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-mono font-medium" style={{ color: '#F87171' }}>
                {formatTime(recordingTime)}
              </span>
            </div>
          </div>
        )}

        {!isRecording && (
          <div className="text-center">
            <p className="text-sm font-medium" style={{ color: 'var(--lark-text)' }}>
              {isUploading ? 'Processing...' : 'Record Voice Input'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--lark-text-muted)' }}>
              Click to start recording
            </p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px" style={{ background: 'var(--lark-border)' }} />
        <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--lark-text-subtle)' }}>or</span>
        <div className="flex-1 h-px" style={{ background: 'var(--lark-border)' }} />
      </div>

      {/* Drop Zone */}
      {uploadedFile ? (
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{
            background: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.25)',
          }}
        >
          <CheckCircle size={16} style={{ color: '#A78BFA' }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: 'var(--lark-text)' }}>{uploadedFile.name}</p>
            <p className="text-[10px]" style={{ color: 'var(--lark-text-muted)' }}>Ready for processing</p>
          </div>
          <button onClick={clearFile}>
            <X size={14} style={{ color: 'var(--lark-text-muted)' }} />
          </button>
        </div>
      ) : (
        <div
          className="relative rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer transition-all duration-200"
          style={{
            border: `1.5px dashed ${isDragging ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.1)'}`,
            background: isDragging ? 'rgba(139,92,246,0.06)' : 'transparent',
          }}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.wav,.mp3,.webm,.ogg"
            className="hidden"
            onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
          />
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <FileAudio size={20} style={{ color: isDragging ? 'var(--lark-violet-bright)' : 'var(--lark-text-muted)' }} />
          )}
          <p className="text-xs text-center" style={{ color: 'var(--lark-text-muted)' }}>
            {isUploading ? 'Uploading...' : 'Drop .wav or .mp3 file here'}
          </p>
        </div>
      )}
    </div>
  );
}