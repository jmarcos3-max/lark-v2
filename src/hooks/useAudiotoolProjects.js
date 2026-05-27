import { useState, useCallback } from 'react';
import { useAudiotool } from '@/lib/AudiotoolContext';
import { encodeLarkMeta, decodeLarkMeta } from '@/lib/larkMeta';

/**
 * Hook for Audiotool cloud project CRUD.
 * All methods require authenticated status.
 */
export function useAudiotoolProjects() {
  const { atClient, status } = useAudiotool();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isReady = status === 'authenticated' && atClient;

  /** List all projects for the authenticated user. Returns array of {atProject, larkMeta}. */
  const listProjects = useCallback(async () => {
    if (!isReady) return [];
    setLoading(true);
    setError(null);
    try {
      const res = await atClient.projects.listProjects({});
      return (res.projects || []).map(p => {
        const { meta } = decodeLarkMeta(p.description);
        return { atProject: p, larkMeta: meta };
      });
    } catch (err) {
      setError(err?.message ?? String(err));
      return [];
    } finally {
      setLoading(false);
    }
  }, [isReady, atClient]);

  /** Create a new Audiotool project with optional Lark metadata. */
  const createProject = useCallback(async ({ title = 'Untitled Track', larkMeta = {} } = {}) => {
    if (!isReady) return null;
    setLoading(true);
    setError(null);
    try {
      const res = await atClient.projects.createProject({
        project: {
          displayName: title,
          description: encodeLarkMeta(larkMeta),
        },
      });
      return res.project ?? null;
    } catch (err) {
      setError(err?.message ?? String(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, [isReady, atClient]);

  /** Save (update) an existing project with latest Lark fields. */
  const saveProject = useCallback(async (projectName, { title, larkMeta = {} } = {}) => {
    if (!isReady || !projectName) return null;
    setLoading(true);
    setError(null);
    try {
      const res = await atClient.projects.updateProject({
        project: {
          name: projectName,
          displayName: title,
          description: encodeLarkMeta(larkMeta),
        },
        updateMask: { paths: ['display_name', 'description'] },
      });
      return res.project ?? null;
    } catch (err) {
      setError(err?.message ?? String(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, [isReady, atClient]);

  /** Open a project in the DAW (returns the nexus doc + dawUrl). */
  const openProject = useCallback(async (projectOrUrl) => {
    if (!isReady) return null;
    setLoading(true);
    setError(null);
    try {
      // Accept a project object (with .name), a DAW URL string, or a plain project name
      let dawUrl;
      if (typeof projectOrUrl === 'string') {
        // Could be a full DAW URL or a project name like "users/xxx/projects/yyy"
        dawUrl = projectOrUrl.startsWith('http')
          ? projectOrUrl
          : `https://beta.audiotool.com/studio?project=${encodeURIComponent(projectOrUrl)}`;
      } else {
        dawUrl = `https://beta.audiotool.com/studio?project=${encodeURIComponent(projectOrUrl.name)}`;
      }
      const doc = await atClient.open(dawUrl);
      await doc.start();
      return { doc, dawUrl };
    } catch (err) {
      setError(err?.message ?? String(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, [isReady, atClient]);

  /** Delete an Audiotool project by its resource name. */
  const deleteProject = useCallback(async (projectName) => {
    if (!isReady || !projectName) return false;
    setLoading(true);
    setError(null);
    try {
      await atClient.projects.deleteProject({ name: projectName });
      return true;
    } catch (err) {
      setError(err?.message ?? String(err));
      return false;
    } finally {
      setLoading(false);
    }
  }, [isReady, atClient]);

  return { loading, error, listProjects, createProject, saveProject, openProject, deleteProject };
}