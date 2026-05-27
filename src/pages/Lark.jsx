import React, { useState } from 'react';
import LarkNavbar from '@/components/lark/LarkNavbar';
import AudioCaptureCard from '@/components/lark/AudioCaptureCard';
import ParameterMatrixCard from '@/components/lark/ParameterMatrixCard';
import PlaybackEngineCard from '@/components/lark/PlaybackEngineCard';
import ProjectHistoryCard from '@/components/lark/ProjectHistoryCard';
import { useAudiotoolProjects } from '@/hooks/useAudiotoolProjects';

export default function Lark() {
  const { openProject } = useAudiotoolProjects();

  const [currentProject, setCurrentProject] = useState({
    title: 'Untitled Track',
    source_audio_url: null,
    target_instrument: null,
    selected_mood: null,
    atProjectName: null,   // Audiotool project resource name
    dawUrl: null,          // Active DAW URL for "Open in Studio" link
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

  // Called when ParameterMatrixCard opens/creates a project
  const handleProjectOpened = (atProject, larkMeta, doc, dawUrl) => {
    setCurrentProject(p => ({
      ...p,
      title: atProject.displayName || p.title,
      target_instrument: larkMeta?.instrument || p.target_instrument,
      selected_mood: larkMeta?.mood || p.selected_mood,
      source_audio_url: larkMeta?.sourceAudioUrl || p.source_audio_url,
      atProjectName: atProject.name,
      dawUrl,
    }));
    setRefreshHistory(n => n + 1);
  };

  // Called from ProjectHistoryCard when user clicks a project card
  const handleOpenFromHistory = async ({ atProject, larkMeta }) => {
    const result = await openProject(atProject.name);
    if (result) {
      handleProjectOpened(atProject, larkMeta, result.doc, result.dawUrl);
    }
  };

  const handleAutomate = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 2800));
    setOutputUrl(currentProject.source_audio_url || null);
    setIsProcessing(false);
    setRefreshHistory(n => n + 1);
  };

  return (
    <div className="min-h-screen font-grotesk" style={{ background: 'var(--lark-bg)', transition: 'background 0.3s ease' }}>
      <LarkNavbar />

      <main className="px-6 pb-8 pt-4 max-w-[1600px] mx-auto">
        {/* Top bento row */}
        <div className="grid grid-cols-12 gap-4 mb-4">
          <div className="col-span-4">
            <AudioCaptureCard onAudioReady={handleAudioReady} />
          </div>

          <div className="col-span-4">
            <ParameterMatrixCard
              instrument={currentProject.target_instrument}
              mood={currentProject.selected_mood}
              onInstrumentChange={handleInstrumentChange}
              onMoodChange={handleMoodChange}
              onAutomate={handleAutomate}
              onProjectOpened={handleProjectOpened}
              isProcessing={isProcessing}
              currentProject={currentProject}
              onSaved={() => setRefreshHistory(n => n + 1)}
            />
          </div>

          <div className="col-span-4">
            <PlaybackEngineCard outputUrl={outputUrl} isProcessing={isProcessing} />
          </div>
        </div>

        {/* Bottom bento row */}
        <div>
          <ProjectHistoryCard
            refreshKey={refreshHistory}
            onOpenProject={handleOpenFromHistory}
          />
        </div>
      </main>
    </div>
  );
}