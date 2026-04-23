import fs from 'fs';
import path from 'path';

type HeaderCarrier = {
  headers: {
    set: (name: string, value: string) => void;
  };
};

export type ShareDiagnosticHeaders = {
  branch?: string | null;
  reason?: string | null;
  missingConfig?: string[] | null;
};

let cachedBuildId: string | null | undefined;

function readBuildId() {
  if (cachedBuildId !== undefined) return cachedBuildId;
  try {
    const buildIdPath = path.join(process.cwd(), '.next', 'BUILD_ID');
    cachedBuildId = fs.readFileSync(buildIdPath, 'utf8').trim() || null;
  } catch {
    cachedBuildId = null;
  }
  return cachedBuildId;
}

export function getRuntimeInfo() {
  return {
    pid: process.pid,
    buildId: readBuildId(),
    envSource: fs.existsSync(path.join(process.cwd(), '.env.local')) ? '.env.local' : 'process-env-only',
    nodeEnv: process.env.NODE_ENV || 'development',
  };
}

export function attachRuntimeHeaders(response: HeaderCarrier, diagnostics: ShareDiagnosticHeaders = {}) {
  const runtime = getRuntimeInfo();
  response.headers.set('x-offroady-runtime-pid', String(runtime.pid));
  response.headers.set('x-offroady-runtime-build', runtime.buildId ?? 'unknown');
  response.headers.set('x-offroady-runtime-env', runtime.envSource);
  response.headers.set('x-offroady-runtime-node-env', runtime.nodeEnv);
  if (diagnostics.branch) response.headers.set('x-offroady-share-branch', diagnostics.branch);
  if (diagnostics.reason) response.headers.set('x-offroady-share-reason', diagnostics.reason);
  if (diagnostics.missingConfig?.length) response.headers.set('x-offroady-share-missing-config', diagnostics.missingConfig.join(','));
}
