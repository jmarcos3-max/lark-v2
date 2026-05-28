import React, { useCallback, useEffect, useRef, useState } from 'react';
import LarkNavbar from '@/components/lark/LarkNavbar';
import AudioCaptureCard from '@/components/lark/AudioCaptureCard';
import ParameterMatrixCard from '@/components/lark/ParameterMatrixCard';
import PlaybackEngineCard from '@/components/lark/PlaybackEngineCard';
import StudioHealthCard from '@/components/lark/StudioHealthCard';
import ProjectLibraryPanel from '@/components/lark/ProjectLibraryPanel';
import { addRawAudioEntry, getRawAudioBlob } from '@/lib/raw-audio-library';
import { useAudiotoolProjects } from '@/lib/useAudiotoolProjects';

export default function Lark() {
  const {
    larkProject,
    patchLarkProject,
    cloudProjects,
    isProjectBusy,
    projectError,
    isAuthenticated,
    login,
    refreshProjectList,
    createNewProject,
    openProject,
    saveProject,
    deleteCloudProject,
    renameProject,
    transformHummingToInstrument,
    generateMoodLayers,
    setProjectError,
    projectSuccess,
    transformStatus,
    moodLayers,
    isGeneratingMoodLayers,
  } = useAudiotoolProjects();

  const [isProcessing, setIsProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState(null);
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [importedAudio, setImportedAudio] = useState(null);
  const [activeRawAudioId, setActiveRawAudioId] = useState(null);
  const [lastTransformBpm, setLastTransformBpm] = useState(null);
  const [studioHealthReport, setStudioHealthReport] = useState(null);
  const importBlobUrlRef = useRef(null);
  /** Session humming — survives project switches (cloud metadata may not store blob URLs). */
  const activeHumRef = useRef({ url: null, blob: null });

  const getActiveHumSource = useCallback(() => {
    const url =
      larkProject.source_audio_url
      || importedAudio?.url
      || activeHumRef.current?.url
      || null;
    const blob = activeHumRef.current?.blob ?? null;
    return { url, blob };
  }, [larkProject.source_audio_url, importedAudio?.url]);

  const revokeImportBlobUrl = useCallback(() => {
    if (importBlobUrlRef.current?.startsWith('blob:')) {
      URL.revokeObjectURL(importBlobUrlRef.current);
    }
    importBlobUrlRef.current = null;
  }, []);

  useEffect(() => () => revokeImportBlobUrl(), [revokeImportBlobUrl]);

  const handleAudioReady = useCallback(async (url, meta = {}) => {
    if (!url) {
      revokeImportBlobUrl();
      setImportedAudio(null);
      setActiveRawAudioId(null);
      activeHumRef.current = { url: null, blob: null };
      patchLarkProject({ source_audio_url: null });
      return;
    }
    revokeImportBlobUrl();
    setImportedAudio(null);
    setActiveRawAudioId(null);
    const blob = meta.blob instanceof Blob ? meta.blob : null;
    activeHumRef.current = { url, blob };
    patchLarkProject({ source_audio_url: url });
    if (meta.saveToLibrary && meta.blob) {
      try {
        await addRawAudioEntry({
          blob: meta.blob,
          remoteUrl: url.startsWith('blob:') ? null : url,
          name: meta.name || 'Voice Recording',
          projectTitle: larkProject.title !== 'Untitled Track' ? larkProject.title : null,
        });
        setRefreshHistory((n) => n + 1);
      } catch {
        // IndexedDB unavailable — playback still works for current session via blob URL
      }
    }
  }, [patchLarkProject, larkProject.title, revokeImportBlobUrl]);

  const handleImportFromRawAudio = useCallback(async (entry) => {
    if (!entry?.id) return;
    setProjectError(null);
    const blob = await getRawAudioBlob(entry);
    if (!blob?.size) {
      setProjectError('Could not load that recording. Try re-recording or upload again.');
      return;
    }
    revokeImportBlobUrl();
    const url = URL.createObjectURL(blob);
    importBlobUrlRef.current = url;
    activeHumRef.current = { url, blob };
    setImportedAudio({ url, name: entry.name || 'Imported recording' });
    setActiveRawAudioId(entry.id);
    patchLarkProject({ source_audio_url: url });
    setOutputUrl(url);
  }, [patchLarkProject, revokeImportBlobUrl, setProjectError]);

  const handleInstrumentChange = (instrument) => {
    patchLarkProject({ target_instrument: instrument });
  };

  const handleMoodChange = (mood) => {
    patchLarkProject({ selected_mood: mood });
  };

  const handleNewProject = async (title) => {
    setOutputUrl(null);
    const name = title?.trim();
    if (!name) return;
    try {
      await createNewProject({
        title: name,
        target_instrument: null,
        selected_mood: null,
        source_audio_url: null,
        elevenlabs_output_url: null,
      });
      setRefreshHistory((n) => n + 1);
    } catch {
      // error surfaced via projectError
    }
  };

  const handleOpenProject = async (projectName) => {
    setOutputUrl(null);
    const sessionHum = activeHumRef.current?.url
      ? { ...activeHumRef.current }
      : null;
    try {
      const opened = await openProject(projectName);
      if (sessionHum?.url) {
        patchLarkProject({ source_audio_url: sessionHum.url });
        setProjectError(null);
      }
      if (opened?.elevenlabs_output_url) {
        setOutputUrl(opened.elevenlabs_output_url);
      } else if (sessionHum?.url) {
        setOutputUrl(sessionHum.url);
      } else if (opened?.source_audio_url) {
        setOutputUrl(opened.source_audio_url);
      }
      setRefreshHistory((n) => n + 1);
    } catch {
      // error surfaced via projectError
    }
  };

  const handleSave = async () => {
    try {
      await saveProject({
        title: larkProject.title,
        target_instrument: larkProject.target_instrument,
        selected_mood: larkProject.selected_mood,
        source_audio_url: larkProject.source_audio_url,
        elevenlabs_output_url: outputUrl ?? larkProject.elevenlabs_output_url,
      });
      setRefreshHistory((n) => n + 1);
      return true;
    } catch {
      return false;
    }
  };

  const handleAutomate = async () => {
    const { url: sourceUrl, blob: sourceBlob } = getActiveHumSource();
    if (!sourceUrl) {
      setProjectError('Record or import humming first.');
      return;
    }

    setIsProcessing(true);
    setProjectError(null);
    try {
      const result = await transformHummingToInstrument({
        sourceUrl,
        sourceBlob,
      });
      if (Number.isFinite(result?.bpm)) {
        setLastTransformBpm(result.bpm);
      }
      if (result) {
        setStudioHealthReport({
          noteCount: result.noteCount ?? 0,
          bpm: result.bpm ?? null,
          nexusCabled: Boolean(result.nexusCabled),
          instrument: larkProject.target_instrument,
          mood: larkProject.selected_mood,
          dawUrl: result.dawUrl ?? larkProject.dawUrl ?? null,
        });
      }
      if (result?.outputUrl) {
        setOutputUrl(result.outputUrl);
      } else if (larkProject.source_audio_url) {
        setOutputUrl(larkProject.source_audio_url);
      }
      setRefreshHistory((n) => n + 1);
    } catch {
      // error in projectError
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateMoodLayers = async () => {
    const { url: sourceUrl, blob: sourceBlob } = getActiveHumSource();
    if (!sourceUrl) {
      setProjectError('Record or import humming first.');
      return;
    }
    try {
      await generateMoodLayers({
        sourceUrl,
        sourceBlob,
        noteBpm: lastTransformBpm,
      });
      setRefreshHistory((n) => n + 1);
    } catch {
      // error in projectError
    }
  };

  const handleUseMoodLayer = (layer) => {
    if (!layer?.url) return;
    setOutputUrl(layer.url);
  };

  return (
    <div
      className="min-h-screen font-grotesk"
      style={{ background: 'var(--lark-bg)', transition: 'background 0.3s ease' }}
    >
      <LarkNavbar />

      <main className="px-6 pb-8 pt-4 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-12 gap-4 mb-4">
          <div className="col-span-4">
            <AudioCaptureCard
              onAudioReady={handleAudioReady}
              importedAudio={importedAudio}
            />
          </div>

          <div className="col-span-4">
            <ParameterMatrixCard
              instrument={larkProject.target_instrument}
              mood={larkProject.selected_mood}
              onInstrumentChange={handleInstrumentChange}
              onMoodChange={handleMoodChange}
              onAutomate={handleAutomate}
              onGenerateMoodLayers={handleGenerateMoodLayers}
              onNewProject={handleNewProject}
              onConnectProject={handleOpenProject}
              onSave={handleSave}
              isProcessing={isProcessing}
              isProjectBusy={isProjectBusy}
              projectError={projectError}
              projectSuccess={projectSuccess}
              transformStatus={transformStatus}
              isGeneratingMoodLayers={isGeneratingMoodLayers}
              isAuthenticated={isAuthenticated}
              onLogin={login}
              cloudProjects={cloudProjects}
              onRefreshProjects={refreshProjectList}
              hasAudio={Boolean(getActiveHumSource().url)}
              onTransformHint={setProjectError}
              hasInstrument={!!larkProject.target_instrument}
              hasMood={!!larkProject.selected_mood}
              currentProject={larkProject}
              activeProjectName={larkProject.audiotoolName}
            />
          </div>

          <div className="col-span-4">
            <div className="h-full flex flex-col gap-4">
              <StudioHealthCard
                currentProject={larkProject}
                report={studioHealthReport}
                projectError={projectError}
              />
              <PlaybackEngineCard
                outputUrl={outputUrl}
                isProcessing={isProcessing}
                dawUrl={larkProject.dawUrl}
              />
            </div>
          </div>
        </div>

        <div>
          <ProjectLibraryPanel
            refreshKey={refreshHistory}
            cloudProjects={cloudProjects}
            isAuthenticated={isAuthenticated}
            onLogin={login}
            onOpenProject={handleOpenProject}
            onRefreshProjects={refreshProjectList}
            onDeleteProject={deleteCloudProject}
            onRenameProject={renameProject}
            activeProjectName={larkProject.audiotoolName}
            onUseRawAudio={handleImportFromRawAudio}
            activeRawAudioId={activeRawAudioId}
            moodLayers={moodLayers}
            isGeneratingMoodLayers={isGeneratingMoodLayers}
            onGenerateMoodLayers={handleGenerateMoodLayers}
            onUseMoodLayer={handleUseMoodLayer}
          />
        </div>
      </main>
    </div>
  );
}
