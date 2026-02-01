import React, { useState } from 'react';
import { FaSearch, FaPaste, FaDownload, FaLink } from 'react-icons/fa';

const SearchBar = ({ onSearch, isLoading }) => {
    const [url, setUrl] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (url.trim()) onSearch(url);
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setUrl(text);
        } catch (err) {
            console.log('Clipboard access error', err);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto mb-16 fade-in relative z-10" style={{ animationDelay: '0.1s' }}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                {/* Input Area */}
                <div className="relative group w-full">
                    <div className="absolute inset-0 bg-accent-gradient opacity-10 blur-xl rounded-2xl group-hover:opacity-15 transition-opacity duration-500"></div>
                    <div className="glass-panel p-1 flex items-center relative rounded-2xl border-white/10 hover:border-white/20 transition-all bg-black/40">
                        <div className="pl-6 pr-4 text-white/40">
                            <FaLink size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Paste YouTube link here..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full bg-transparent border-none text-white placeholder-white/30 text-lg py-5 focus:outline-none font-normal tracking-wide"
                            disabled={isLoading}
                        />
                        {url === '' && (
                            <button
                                type="button"
                                onClick={handlePaste}
                                className="mr-3 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all text-sm font-medium flex items-center gap-2"
                                title="Paste"
                            >
                                <FaPaste />
                                Paste
                            </button>
                        )}
                    </div>
                </div>

                {/* Action Button */}
                <button
                    type="submit"
                    className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 hover:shadow-accent-color/20
                ${!url.trim() ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-accent-gradient text-white shadow-accent-color/20'}
            `}
                    disabled={isLoading || !url.trim()}
                >
                    {isLoading ? (
                        <>
                            <span className="spinner w-5 h-5 border-2 border-white/50 border-t-white"></span>
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <span>Download Video</span>
                            <FaDownload size={16} />
                        </>
                    )}
                </button>

            </form>
        </div>
    );
};

export default SearchBar;
