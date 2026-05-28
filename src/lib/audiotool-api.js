/** Where users delete projects when the Nexus API returns permission_denied. */
export const AUDIOTOOL_PROJECTS_URL = 'https://www.audiotool.com/projects';

export const AUDIOTOOL_DELETE_ON_WEB_CONFIRM =
  `Lark cannot delete this project via OAuth (insufficient rights).\n\n`
  + `Open ${AUDIOTOOL_PROJECTS_URL} to delete it there?`;

export function isAudiotoolPermissionDenied(err) {
  const text = err instanceof Error ? formatAudiotoolErrorMessage(err) : String(err);
  return /permission_denied|insufficient rights|insufficient_permissions|grpc code 7/i.test(text);
}

/** Client-side checks before calling DeleteProject. */
export function getProjectDeleteBlockReason(project, userName) {
  if (!project) return null;

  const trackName = project.trackName ?? project.track_name;
  if (trackName) {
    return (
      'This project is published as a track. Remove the track on Audiotool first, '
      + `then delete the project at ${AUDIOTOOL_PROJECTS_URL}.`
    );
  }

  const creator = project.creatorName ?? project.creator_name;
  if (userName && creator && creator !== userName) {
    return `Only the project owner (@${creator}) can delete this project.`;
  }

  return null;
}

export function formatDeleteProjectError(err, { blockReason, hadOpenSession } = {}) {
  if (blockReason) return blockReason;

  const message = err instanceof Error ? formatAudiotoolErrorMessage(err) : String(err);

  if (isAudiotoolPermissionDenied(message)) {
    return (
      'Lark cannot delete this project via OAuth (insufficient rights). '
      + `Delete it at ${AUDIOTOOL_PROJECTS_URL}.`
    );
  }

  if (hadOpenSession) {
    return `${message} Close the project in Lark (or refresh), then try again.`;
  }

  return `${message} Delete it at ${AUDIOTOOL_PROJECTS_URL}.`;
}

/** Unwrap RetryingClient results (returns value or Error, never throws). */
export function unwrapAudiotoolResult(result, action) {
  if (result instanceof Error) {
    throw new Error(`${action}: ${formatAudiotoolErrorMessage(result)}`, { cause: result });
  }
  return result;
}

export function formatAudiotoolErrorMessage(err) {
  const parts = [];
  const seen = new Set();
  let current = err;

  while (current && !seen.has(current)) {
    seen.add(current);
    if (current.message && !parts.includes(current.message)) {
      parts.push(current.message);
    }
    if (current.rawMessage && !parts.includes(current.rawMessage)) {
      parts.push(current.rawMessage);
    }
    if (current.code != null) {
      const codeLabel = `gRPC code ${current.code}`;
      if (!parts.some((p) => p.includes('gRPC'))) parts.push(codeLabel);
    }
    current = current.cause;
  }

  const text = parts.join(' — ');
  if (/threw error/i.test(text) && parts.length > 1) {
    return parts.filter((p) => !/threw error$/i.test(p)).join(' — ') || text;
  }
  return text || 'Unknown error';
}
