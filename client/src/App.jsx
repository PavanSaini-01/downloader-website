import React, { useState } from 'react';
import axios from 'axios';
import { FaYoutube } from 'react-icons/fa';
import SearchBar from './components/SearchBar';
import VideoCard from './components/VideoCard';
import QualitySelector from './components/QualitySelectorV3';

function App() {
  const [videoInfo, setVideoInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');

  const parseErrorMessage = (errorMsg) => {
    if (!errorMsg) return 'Failed to fetch video info. Please check the URL.';

    const msg = errorMsg.toLowerCase();

    if (msg.includes('sign in') || msg.includes('not a bot')) {
      return '🤖 YouTube bot detection triggered. Please add authentication cookies (see documentation) or try again later.';
    }
    if (msg.includes('private')) {
      return '🔒 This video is private and cannot be downloaded.';
    }
    if (msg.includes('age') || msg.includes('restricted')) {
      return '🔞 This video is age-restricted. Authentication required.';
    }
    if (msg.includes('unavailable') || msg.includes('not available')) {
      return '❌ This video is unavailable or has been removed.';
    }
    if (msg.includes('copyright') || msg.includes('blocked')) {
      return '⚠️ This video is blocked due to copyright restrictions.';
    }
    if (msg.includes('live')) {
      return '📡 Live streams are not supported.';
    }
    if (msg.includes('premium') || msg.includes('members')) {
      return '💎 This is members-only content and cannot be downloaded.';
    }

    return errorMsg;
  };

  const handleSearch = async (url) => {
    setLoading(true);
    setError('');
    setVideoInfo(null);
    setCurrentUrl(url);
    try {
      const getApiUrl = () => {
        if (import.meta.env.VITE_API_URL !== undefined) {
          return import.meta.env.VITE_API_URL;
        }
        return 'http://localhost:4000';
      };
      const apiUrl = getApiUrl();
      const response = await axios.get(`${apiUrl}/api/info?url=${encodeURIComponent(url)}`);
      setVideoInfo(response.data);
    } catch (err) {
      console.error(err);
      const rawError = err.response?.data?.error || 'Failed to fetch video info. Please check the URL.';
      setError(parseErrorMessage(rawError));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (itag, container) => {
    if (!currentUrl) return;

    // Use hidden iframe or window location to trigger download w/o replacing page content if possible, 
    // but attachment header usually handles it fine in same window.
    const getApiUrl = () => {
      if (import.meta.env.VITE_API_URL !== undefined) {
        return import.meta.env.VITE_API_URL;
      }
      return 'http://localhost:4000';
    };
    const apiUrl = getApiUrl();
    window.location.href = `${apiUrl}/api/download?url=${encodeURIComponent(currentUrl)}&itag=${itag}&title=${encodeURIComponent(videoInfo?.title || '')}&container=${container || 'mp4'}`;
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-2xl flex flex-col items-center">
      {/* Header */}
      <div className="text-center mb-10 fade-in w-full">
        <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-white/5 mb-6 shadow-xl border border-white/10 backdrop-blur-md">
          <FaYoutube className="text-6xl text-red-500 drop-shadow-md" />
        </div>
        <h1 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 mb-4 tracking-tight">
          Frost<span className="text-accent-color">Loader</span>
        </h1>
        <p className="text-lg md:text-xl text-white/60 font-medium">Premium YouTube Video Downloader</p>
      </div>

      <SearchBar onSearch={handleSearch} isLoading={loading} />

      {error && (
        <div className="max-w-2xl mx-auto glass-panel border-red-500/50 bg-red-500/10 text-red-200 text-center mb-8 fade-in px-6 py-4 flex items-center justify-center gap-2">
          <span className="text-xl">⚠️</span> {error}
        </div>
      )}

      {videoInfo && (
        <div className="fade-in space-y-8">
          <VideoCard video={videoInfo} />
          <QualitySelector
            formats={videoInfo.formats}
            audioFormats={videoInfo.audioFormats}
            onDownload={handleDownload}
          />
        </div>
      )}

      <div className="text-center mt-20 text-white/20 text-sm font-light">
        <p>© 2026 FrostLoader. Built with React & Node.</p>
      </div>
    </div>
  );
}

export default App;
