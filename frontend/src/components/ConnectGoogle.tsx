import React, { useState } from 'react';

const ConnectGoogle: React.FC<{ message?: string }> = ({ message }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/google/connect');
      if (!res.ok) throw new Error('Failed to get Google connect URL');
      const data = await res.json();
      if (data.auth_url) {
        window.location.href = data.auth_url;
      } else {
        setError('No auth URL returned from server.');
      }
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', margin: '2rem 0' }}>
      {message && <div style={{ marginBottom: 16, color: '#374151' }}>{message}</div>}
      <div style={{ marginBottom: 16, fontSize: 14, color: '#6B7280' }}>
        🔒 One-time consent for both Gmail and Calendar access
      </div>
      <button
        onClick={handleConnect}
        disabled={loading}
        style={{
          background: '#4285F4',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          padding: '12px 32px',
          fontSize: 16,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          fontWeight: 500,
        }}
      >
        {loading ? 'Connecting...' : '🔗 Connect Gmail & Calendar'}
      </button>
      <div style={{ marginTop: 12, fontSize: 12, color: '#9CA3AF' }}>
        This will enable email and calendar synchronization in one step
      </div>
      {error && <div style={{ color: 'red', marginTop: 12, fontSize: 14 }}>{error}</div>}
    </div>
  );
};

export default ConnectGoogle; 