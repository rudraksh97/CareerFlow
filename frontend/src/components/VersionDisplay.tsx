import React, { useState, useEffect } from 'react';
import { Info, Code, GitBranch } from 'lucide-react';
import { fetchVersionInfo, formatVersion, getFrontendVersion, VersionInfo } from '../utils/version';

interface VersionDisplayProps {
  className?: string;
  showDetails?: boolean;
}

const VersionDisplay: React.FC<VersionDisplayProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadVersionInfo = async () => {
      try {
        const info = await fetchVersionInfo();
        setVersionInfo(info);
      } catch (error) {
        console.error('Failed to load version info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVersionInfo();
  }, []);

  if (isLoading) {
    return (
      <div className={`text-xs text-neutral-500 ${className}`}>
        <div className="inline-flex items-center gap-2">
          <div className="loading" />
          Loading version info...
        </div>
      </div>
    );
  }

  const frontendVersion = getFrontendVersion();
  const backendVersion = versionInfo?.version || frontendVersion;

  if (showDetails && versionInfo) {
    return (
      <div className={`bg-neutral-50 border border-neutral-200 rounded-xl p-6 ${className}`}>
        <h3 className="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-100 border border-blue-200">
            <Info className="w-4 h-4 text-blue-600" />
          </div>
          Version Information
        </h3>
        <div className="space-y-3 text-xs">
          <div className="flex justify-between items-center py-3 px-4 rounded-lg bg-white border border-neutral-200">
            <span className="text-neutral-600 font-medium">Application:</span>
            <span className="font-mono text-neutral-900 bg-neutral-100 px-2 py-1 rounded border">
              {formatVersion(backendVersion)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 px-4 rounded-lg bg-white border border-neutral-200">
            <span className="text-neutral-600 font-medium">Frontend:</span>
            <span className="font-mono text-neutral-900 bg-neutral-100 px-2 py-1 rounded border">
              {formatVersion(frontendVersion)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 px-4 rounded-lg bg-white border border-neutral-200">
            <span className="text-neutral-600 font-medium">API:</span>
            <span className="font-mono text-neutral-900 bg-neutral-100 px-2 py-1 rounded border">
              {versionInfo.api_version}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 px-4 rounded-lg bg-white border border-neutral-200">
            <span className="text-neutral-600 font-medium">Environment:</span>
            <span className="font-mono text-neutral-900 bg-neutral-100 px-2 py-1 rounded border capitalize">
              {versionInfo.environment}
            </span>
          </div>
          {versionInfo.build_info.commit_hash !== 'unknown' && (
            <div className="flex justify-between items-center py-3 px-4 rounded-lg bg-white border border-neutral-200">
              <span className="text-neutral-600 font-medium">Build:</span>
              <span className="font-mono text-neutral-900 bg-neutral-100 px-2 py-1 rounded border text-[10px]">
                {versionInfo.build_info.commit_hash}
              </span>
            </div>
          )}
          {versionInfo.release_date && (
            <div className="flex justify-between items-center py-3 px-4 rounded-lg bg-white border border-neutral-200">
              <span className="text-neutral-600 font-medium">Released:</span>
              <span className="font-mono text-neutral-900 bg-neutral-100 px-2 py-1 rounded border">
                {versionInfo.release_date}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-200 cursor-pointer group focus-ring"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="p-1 rounded bg-neutral-100 group-hover:bg-blue-100 transition-all duration-200">
          <Code className="w-3 h-3 text-neutral-600 group-hover:text-blue-600" />
        </div>
        <span className="font-mono">
          v{formatVersion(backendVersion)}
        </span>
      </button>
      
      {showTooltip && versionInfo && (
        <div className="absolute bottom-full left-0 mb-3 p-4 bg-white border border-neutral-200 shadow-xl text-xs rounded-xl whitespace-nowrap z-50">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-6">
              <span className="text-neutral-600 font-medium">Frontend:</span>
              <span className="font-mono text-neutral-900">{formatVersion(frontendVersion)}</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-neutral-600 font-medium">Backend:</span>
              <span className="font-mono text-neutral-900">{formatVersion(backendVersion)}</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-neutral-600 font-medium">API:</span>
              <span className="font-mono text-neutral-900">{versionInfo.api_version}</span>
            </div>
            {versionInfo.build_info.commit_hash !== 'unknown' && (
              <>
                <div className="h-px bg-neutral-200 my-2" />
                <div className="flex items-center justify-between gap-6">
                  <span className="text-neutral-600 font-medium flex items-center gap-1">
                    <GitBranch className="w-3 h-3" />
                    Build:
                  </span>
                  <span className="font-mono text-neutral-700 text-[10px]">
                    {versionInfo.build_info.commit_hash}
                  </span>
                </div>
              </>
            )}
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-200" />
        </div>
      )}
    </div>
  );
};

export default VersionDisplay; 