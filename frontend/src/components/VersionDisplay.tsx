import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
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
      <div className={`text-xs text-gray-400 ${className}`}>
        Loading...
      </div>
    );
  }

  const frontendVersion = getFrontendVersion();
  const backendVersion = versionInfo?.version || frontendVersion;

  if (showDetails && versionInfo) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <Info className="w-4 h-4 mr-2" />
          Version Information
        </h3>
        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Application:</span>
            <span className="font-mono">{formatVersion(backendVersion)}</span>
          </div>
          <div className="flex justify-between">
            <span>Frontend:</span>
            <span className="font-mono">{formatVersion(frontendVersion)}</span>
          </div>
          <div className="flex justify-between">
            <span>API:</span>
            <span className="font-mono">{versionInfo.api_version}</span>
          </div>
          <div className="flex justify-between">
            <span>Environment:</span>
            <span className="font-mono capitalize">{versionInfo.environment}</span>
          </div>
          {versionInfo.build_info.commit_hash !== 'unknown' && (
            <div className="flex justify-between">
              <span>Build:</span>
              <span className="font-mono">{versionInfo.build_info.commit_hash}</span>
            </div>
          )}
          {versionInfo.release_date && (
            <div className="flex justify-between">
              <span>Released:</span>
              <span className="font-mono">{versionInfo.release_date}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {formatVersion(backendVersion)}
      </button>
      
      {showTooltip && versionInfo && (
        <div className="absolute bottom-full left-0 mb-2 p-2 bg-black text-white text-xs rounded shadow-lg whitespace-nowrap z-50">
          <div>Frontend: {formatVersion(frontendVersion)}</div>
          <div>Backend: {formatVersion(backendVersion)}</div>
          <div>API: {versionInfo.api_version}</div>
          {versionInfo.build_info.commit_hash !== 'unknown' && (
            <div>Build: {versionInfo.build_info.commit_hash}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default VersionDisplay; 