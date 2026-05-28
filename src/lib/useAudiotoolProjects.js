import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudiotool } from '@/lib/AudiotoolContext';
import {
  formatDeleteProjectError,
  getProjectDeleteBlockReason,
  unwrapAudiotoolResult,
} from '@/lib/audiotool-api';
import {
  composeMoodLayers,
  fetchAudioBlob,
  getAudioDurationMs,
} from '@/lib/elevenlabs-api';
import { transcribeHumToNotes } from '@/lib/hum-basic-pitch';
import {
  audiotoolProjectToLark,
  encodeLarkMetadata,
  emptyLarkProject,
  normalizeProjectResourceName,
  studioUrlForProject,
} from '@/lib/lark-project-metadata';
import { applyNotesToInstrument } from '@/lib/nexus-rhythm-notes';

export function useAudiotoolProjects() {
  const { client, isAuthenticated, login, isLoading: authLoading, userName } = useAudiotool();
  const documentRef = useRef(null);
  const openProjectNameRef = useRef(null);

  const [larkProject, setLarkProject] = useState(emptyLarkProject);
  const [cloudProjects, setCloudProjects] = useState([]);
  const [isProjectBusy, setIsProjectBusy] = useState(false);
  const [projectError, setProjectError] = useState(null);
  const [projectSuccess, setProjectSuccess] = useState(null);
  const [transformStatus, setTransformStatus] = useState(null);
  const [moodLayers, setMoodLayers] = useState([]);
  const [isGeneratingMoodLayers, setIsGeneratingMoodLayers] = useState(false);

  const patchLarkProject = useCallback((patch) => {
    setLarkProject((prev) => ({ ...prev, ...patch }));
  }, []);

  const closeCurrentDocument = useCallback(async () => {
    const doc = documentRef.current;
    documentRef.current = null;
    openProjectNameRef.current = null;
    if (doc) {
      try {
        await doc.stop();
      } catch {
        // ignore stop errors during teardown
      }
    }
  }, []);

  const releaseProjectForDelete = useCallback(async (projectName) => {
    const normalized = normalizeProjectResourceName(projectName);
    const openName = openProjectNameRef.current
      ? normalizeProjectResourceName(openProjectNameRef.current)
      : null;

    if (documentRef.current && openName === normalized) {
      await closeCurrentDocument();
      // Let the server release the open session before DeleteProject
      await new Promise((r) => setTimeout(r, 400));
    }

    if (normalizeProjectResourceName(larkProject.audiotoolName) === normalized) {
      setLarkProject(emptyLarkProject());
    }
  }, [closeCurrentDocument, larkProject.audiotoolName]);

  useEffect(() => () => {
    closeCurrentDocument();
  }, [closeCurrentDocument]);

  useEffect(() => () => {
    for (const layer of moodLayers) {
      if (layer?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(layer.url);
      }
    }
  }, [moodLayers]);

  useEffect(() => {
    if (!authLoading) {
      setIsProjectBusy(false);
    }
  }, [authLoading]);

  const requireClient = useCallback(() => {
    if (!isAuthenticated || !client) {
      throw new Error('Sign in with Audiotool to manage projects.');
    }
    return client;
  }, [isAuthenticated, client]);

  const refreshProjectList = useCallback(async () => {
    const at = requireClient();
    setProjectError(null);
    const result = await at.projects.listProjects({
      pageSize: 50,
      orderBy: 'project.update_time desc',
    });
    const response = unwrapAudiotoolResult(result, 'List projects');
    setCloudProjects(response.projects ?? []);
    return response.projects ?? [];
  }, [requireClient]);

  const openProjectDocument = useCallback(async (projectName) => {
    const at = requireClient();
    await closeCurrentDocument();
    const resourceName = normalizeProjectResourceName(projectName);
    const doc = await at.open(studioUrlForProject(resourceName) || resourceName);
    await doc.start();
    documentRef.current = doc;
    openProjectNameRef.current = resourceName;
    return doc;
  }, [requireClient, closeCurrentDocument]);

  const createNewProject = useCallback(async (overrides = {}) => {
    if (!isAuthenticated) {
      login();
      return null;
    }

    const at = requireClient();
    setIsProjectBusy(true);
    setProjectError(null);

    try {
      const title = overrides.title ?? larkProject.title ?? 'Untitled Track';
      const instrument = overrides.target_instrument ?? larkProject.target_instrument;
      const mood = overrides.selected_mood ?? larkProject.selected_mood;
      const sourceUrl = overrides.source_audio_url ?? larkProject.source_audio_url;

      const createResult = await at.projects.createProject({
        project: {
          displayName: title,
          description: encodeLarkMetadata({
            source_audio_url: sourceUrl,
            target_instrument: instrument,
            selected_mood: mood,
            elevenlabs_output_url: overrides.elevenlabs_output_url ?? larkProject.elevenlabs_output_url,
          }),
        },
      });
      const created = unwrapAudiotoolResult(createResult, 'Create project');
      const project = created.project;
      if (!project?.name) {
        throw new Error('Create project did not return a project name.');
      }

      const doc = await openProjectDocument(project.name);
      const next = {
        ...audiotoolProjectToLark(project),
        dawUrl: doc.dawUrl,
      };
      setLarkProject(next);
      await refreshProjectList();
      return next;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setProjectError(message);
      throw err;
    } finally {
      setIsProjectBusy(false);
    }
  }, [
    isAuthenticated,
    login,
    requireClient,
    larkProject,
    openProjectDocument,
    refreshProjectList,
  ]);

  const openProject = useCallback(async (projectName) => {
    if (!isAuthenticated) {
      login();
      return null;
    }

    const at = requireClient();
    setIsProjectBusy(true);
    setProjectError(null);

    try {
      const getResult = await at.projects.getProject({ name: projectName });
      const got = unwrapAudiotoolResult(getResult, 'Get project');
      const project = got.project;
      if (!project?.name) {
        throw new Error('Project not found.');
      }

      const doc = await openProjectDocument(project.name);
      const next = {
        ...audiotoolProjectToLark(project),
        dawUrl: doc.dawUrl,
      };
      setLarkProject(next);
      return next;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setProjectError(message);
      throw err;
    } finally {
      setIsProjectBusy(false);
    }
  }, [isAuthenticated, login, requireClient, openProjectDocument]);

  const saveProject = useCallback(async (overrides = {}) => {
    if (!isAuthenticated) {
      login();
      return null;
    }

    const at = requireClient();
    const name = overrides.audiotoolName ?? larkProject.audiotoolName;

    setIsProjectBusy(true);
    setProjectError(null);

    try {
      const projectName = name;

      if (!projectName) {
        throw new Error('Choose an Audiotool project to use (Connected project).');
      }

      const title = overrides.title ?? larkProject.title ?? 'Untitled Track';
      const instrument = overrides.target_instrument ?? larkProject.target_instrument;
      const mood = overrides.selected_mood ?? larkProject.selected_mood;
      const sourceUrl = overrides.source_audio_url ?? larkProject.source_audio_url;
      const outputUrl = overrides.elevenlabs_output_url ?? larkProject.elevenlabs_output_url;

      const updateResult = await at.projects.updateProject({
        project: {
          name: projectName,
          displayName: title,
          description: encodeLarkMetadata({
            source_audio_url: sourceUrl,
            target_instrument: instrument,
            selected_mood: mood,
            elevenlabs_output_url: outputUrl,
          }),
        },
        updateMask: { paths: ['display_name', 'description'] },
      });
      const updated = unwrapAudiotoolResult(updateResult, 'Save project');
      const project = updated.project;
      const next = audiotoolProjectToLark(project);
      setLarkProject((prev) => ({
        ...prev,
        ...next,
        source_audio_url: sourceUrl,
        target_instrument: instrument,
        selected_mood: mood,
        elevenlabs_output_url: outputUrl,
      }));
      await refreshProjectList();
      return next;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setProjectError(message);
      throw err;
    } finally {
      setIsProjectBusy(false);
    }
  }, [
    isAuthenticated,
    login,
    requireClient,
    larkProject,
    createNewProject,
    refreshProjectList,
  ]);

  const resetLocalProject = useCallback(async () => {
    await closeCurrentDocument();
    setLarkProject(emptyLarkProject());
    setProjectError(null);
  }, [closeCurrentDocument]);

  const renameProject = useCallback(async (projectName, newTitle) => {
    const at = requireClient();
    const title = newTitle?.trim();
    if (!projectName || !title) return null;

    setIsProjectBusy(true);
    setProjectError(null);

    try {
      const updateResult = await at.projects.updateProject({
        project: { name: projectName, displayName: title },
        updateMask: { paths: ['display_name'] },
      });
      const updated = unwrapAudiotoolResult(updateResult, 'Rename project');
      const project = updated.project;
      const next = audiotoolProjectToLark(project);

      if (larkProject.audiotoolName === projectName) {
        setLarkProject((prev) => ({ ...prev, ...next, title }));
      }

      await refreshProjectList();
      return next;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setProjectError(message);
      throw err;
    } finally {
      setIsProjectBusy(false);
    }
  }, [requireClient, larkProject.audiotoolName, refreshProjectList]);

  const transformHummingToInstrument = useCallback(async ({
    sourceUrl: sourceUrlOverride,
    sourceBlob: sourceBlobOverride,
  } = {}) => {
    if (!isAuthenticated) {
      login();
      return null;
    }

    setIsProjectBusy(true);
    setProjectError(null);
    setProjectSuccess(null);

    try {
      const instrument = larkProject.target_instrument;
      const mood = larkProject.selected_mood;
      const sourceUrl = sourceUrlOverride ?? larkProject.source_audio_url;

      if (!sourceUrl) {
        throw new Error('Record or import humming first.');
      }
      if (!instrument) {
        throw new Error('Choose a target instrument first.');
      }
      if (!mood) {
        throw new Error('Choose a mood.');
      }
      if (!larkProject.audiotoolName) {
        throw new Error('Choose an Audiotool project to use (Connected project).');
      }

      let doc = documentRef.current;
      if (!doc) {
        await openProject(larkProject.audiotoolName);
        doc = documentRef.current;
      }
      if (!doc) {
        throw new Error('Could not open the Audiotool project. Select it again from the dropdown.');
      }

      const blob = await fetchAudioBlob(sourceUrl, sourceBlobOverride);

      const transcription = await transcribeHumToNotes(blob, {
        instrument,
        mood,
        onProgress: setTransformStatus,
      });

      const nexusResult = await applyNotesToInstrument(doc, {
        instrument,
        mood,
        notePlans: transcription.notePlans,
        regionDuration: transcription.regionDuration,
        bpm: transcription.bpm,
      });

      setLarkProject((prev) => ({
        ...prev,
        target_instrument: instrument,
        selected_mood: mood,
        dawUrl: doc.dawUrl ?? prev.dawUrl,
      }));

      const melodyLabel = transcription.source === 'basic-pitch'
        ? 'Melody from your hum (Basic Pitch).'
        : 'Rhythm only (Basic Pitch unavailable).';
      const successMsg = `${melodyLabel} Wrote ${nexusResult.noteCount} notes at ~${nexusResult.bpm} BPM. Press play in Studio from bar 1.`;
      setProjectSuccess(successMsg);
      setTransformStatus(null);

      return {
        outputUrl: sourceUrl,
        dawUrl: doc.dawUrl ?? larkProject.dawUrl,
        noteCount: nexusResult.noteCount,
        bpm: nexusResult.bpm,
        nexusCabled: nexusResult.cabled ?? false,
        hummingUsed: true,
        transcriptionSource: transcription.source,
        message: successMsg,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setProjectError(message);
      throw err;
    } finally {
      setTransformStatus(null);
      setIsProjectBusy(false);
    }
  }, [isAuthenticated, login, larkProject, openProject]);

  const generateMoodLayers = useCallback(async ({
    sourceUrl: sourceUrlOverride,
    sourceBlob: sourceBlobOverride,
    noteBpm,
  } = {}) => {
    if (!isAuthenticated) {
      login();
      return [];
    }

    const instrument = larkProject.target_instrument;
    const mood = larkProject.selected_mood;
    const sourceUrl = sourceUrlOverride ?? larkProject.source_audio_url;
    if (!sourceUrl) {
      throw new Error('Record or import humming first.');
    }
    if (!instrument || !mood) {
      throw new Error('Choose both instrument and mood before generating layers.');
    }

    setIsGeneratingMoodLayers(true);
    setProjectError(null);
    setProjectSuccess(null);
    try {
      const blob = await fetchAudioBlob(sourceUrl, sourceBlobOverride);
      const durationMs = await getAudioDurationMs(blob);
      const layers = await composeMoodLayers({
        instrument,
        mood,
        bpm: noteBpm,
        durationMs,
      });
      setMoodLayers((prev) => {
        for (const old of prev) {
          if (old?.url?.startsWith('blob:')) URL.revokeObjectURL(old.url);
        }
        return layers;
      });
      setProjectSuccess(`Generated ${layers.length} wow-pass assets with ElevenLabs.`);
      return layers;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setProjectError(message);
      throw err;
    } finally {
      setIsGeneratingMoodLayers(false);
    }
  }, [isAuthenticated, login, larkProject]);

  const deleteCloudProject = useCallback(async (projectName) => {
    const at = requireClient();
    const name = normalizeProjectResourceName(projectName);
    if (!name) {
      throw new Error('Invalid project name.');
    }

    const cloudProject = cloudProjects.find(
      (p) => normalizeProjectResourceName(p?.name) === name,
    );
    const blockReason = getProjectDeleteBlockReason(cloudProject, userName);
    if (blockReason) {
      setProjectError(blockReason);
      throw new Error(blockReason);
    }

    setIsProjectBusy(true);
    setProjectError(null);

    const hadOpenSession = Boolean(
      documentRef.current
      || (openProjectNameRef.current
        && normalizeProjectResourceName(openProjectNameRef.current) === name),
    );

    const attemptDelete = async () => {
      const result = await at.projects.deleteProject({ name });
      return unwrapAudiotoolResult(result, 'Delete project');
    };

    try {
      await releaseProjectForDelete(name);

      try {
        await attemptDelete();
      } catch {
        await releaseProjectForDelete(name);
        await attemptDelete();
      }

      await refreshProjectList();
    } catch (err) {
      const hint = formatDeleteProjectError(err, { blockReason, hadOpenSession });
      setProjectError(hint);
      throw err;
    } finally {
      setIsProjectBusy(false);
    }
  }, [
    requireClient,
    releaseProjectForDelete,
    refreshProjectList,
    cloudProjects,
    userName,
  ]);

  return {
    larkProject,
    setLarkProject,
    patchLarkProject,
    cloudProjects,
    isProjectBusy,
    projectError,
    setProjectError,
    projectSuccess,
    setProjectSuccess,
    transformStatus,
    moodLayers,
    isGeneratingMoodLayers,
    authLoading,
    isAuthenticated,
    login,
    refreshProjectList,
    createNewProject,
    openProject,
    saveProject,
    renameProject,
    resetLocalProject,
    deleteCloudProject,
    transformHummingToInstrument,
    generateMoodLayers,
    activeDocument: documentRef,
  };
}
