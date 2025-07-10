// Frontend version utilities
export interface VersionInfo {
  version: string;
  name: string;
  description: string;
  api_version: string;
  release_date: string;
  build_info: {
    commit_hash: string;
    branch: string;
    build_date: string;
  };
  environment: string;
}

// Frontend version (should match the version in version.json)
export const FRONTEND_VERSION = '1.0.0';

// API base URL for version endpoint
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Fetch version information from the backend API
 */
export async function fetchVersionInfo(): Promise<VersionInfo> {
  try {
    const response = await fetch(`${API_BASE_URL}/version`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch version info:', error);
    // Return fallback version info
    return {
      version: FRONTEND_VERSION,
      name: 'Personal Application Tracking System (PATS)',
      description: 'A comprehensive system to track job applications and manage contacts',
      api_version: 'v1',
      release_date: '',
      build_info: {
        commit_hash: 'unknown',
        branch: 'unknown',
        build_date: new Date().toISOString(),
      },
      environment: 'development',
    };
  }
}

/**
 * Get the current frontend version
 */
export function getFrontendVersion(): string {
  return FRONTEND_VERSION;
}

/**
 * Format version for display
 */
export function formatVersion(version: string): string {
  return `v${version}`;
}

/**
 * Check if this is a development build
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV;
}

/**
 * Get build environment
 */
export function getBuildEnvironment(): string {
  return import.meta.env.MODE || 'development';
}
