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

  const handleSearch = async (url) => {
    setLoading(true);
    setError('');
    setVideoInfo(null);
    setCurrentUrl(url);
    try {
      // Assuming backend runs on port 4000
      const response = await axios.get(`http://localhost:4000/api/info?url=${encodeURIComponent(url)}`);
      setVideoInfo(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to fetch video info. Please check the URL.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (itag) => {
    if (!currentUrl) return;

    // Use hidden iframe or window location to trigger download w/o replacing page content if possible, 
    // but attachment header usually handles it fine in same window.
    window.location.href = `http://localhost:4000/api/download?url=${encodeURIComponent(currentUrl)}&itag=${itag}`;
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
