import React, { useState } from 'react';
import LarkNavbar from '@/components/lark/LarkNavbar';
import AudioCaptureCard from '@/components/lark/AudioCaptureCard';
import ParameterMatrixCard from '@/components/lark/ParameterMatrixCard';
import PlaybackEngineCard from '@/components/lark/PlaybackEngineCard';
import ProjectHistoryCard from '@/components/lark/ProjectHistoryCard';

export default function Lark() {
  const [currentProject, setCurrentProject] = useState({
    title: 'Untitled Track',
    source_audio_url: null,
    target_instrument: null,
    selected_mood: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState(null);
  const [refreshHistory, setRefreshHistory] = useState(0);

  const handleAudioReady = (url) => {
    setCurrentProject(p => ({ ...p, source_audio_url: url }));
  };

  const handleInstrumentChange = (instrument) => {
    setCurrentProject(p => ({ ...p, target_instrument: instrument }));
  };

  const handleMoodChange = (mood) => {
    setCurrentProject(p => ({ ...p, selected_mood: mood }));
  };

  const handleAutomate = async () => {
    setIsProcessing(true);
    // Simulate processing delay
    await new Promise(r => setTimeout(r, 2800));
    setOutputUrl(currentProject.source_audio_url || null);
    setIsProcessing(false);
    setRefreshHistory(n => n + 1);
  };

  return (
    <div
      className="min-h-screen font-grotesk"
      style={{ background: 'var(--lark-bg)' }}
    >
      <LarkNavbar />

      <main className="px-6 pb-8 pt-4 max-w-[1600px] mx-auto">
        {/* Top bento row */}
        <div className="grid grid-cols-12 gap-4 mb-4">
          {/* Audio Capture — 4 cols */}
          <div className="col-span-4">
            <AudioCaptureCard onAudioReady={handleAudioReady} />
          </div>

          {/* Parameter Matrix — 4 cols */}
          <div className="col-span-4">
            <ParameterMatrixCard
              instrument={currentProject.target_instrument}
              mood={currentProject.selected_mood}
              onInstrumentChange={handleInstrumentChange}
              onMoodChange={handleMoodChange}
              onAutomate={handleAutomate}
              isProcessing={isProcessing}
              hasAudio={!!currentProject.source_audio_url}
              currentProject={currentProject}
              onSaved={() => setRefreshHistory(n => n + 1)}
            />
          </div>

          {/* Playback Engine — 4 cols */}
          <div className="col-span-4">
            <PlaybackEngineCard
              outputUrl={outputUrl}
              isProcessing={isProcessing}
            />
          </div>
        </div>

        {/* Bottom bento row — full width */}
        <div>
          <ProjectHistoryCard refreshKey={refreshHistory} />
        </div>
      </main>
    </div>
  );
}