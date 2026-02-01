import React from 'react';
import { FaVideo, FaMusic, FaDownload, FaCheckCircle } from 'react-icons/fa';

const QualitySelector = ({ formats, audioFormats, onDownload }) => {
    return (
        <div className="w-full max-w-2xl mx-auto fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="bg-black/20 rounded-3xl p-8 border border-white/5 backdrop-blur-2xl">

                {/* Video Section */}
                <h3 className="text-xl font-bold mb-8 flex items-center gap-3 text-white">
                    <span className="bg-accent-color/20 text-accent-color p-2 rounded-lg">
                        <FaVideo size={20} />
                    </span>
                    Select Video Quality
                </h3>

                <div className="flex flex-col gap-4 mb-12">
                    {formats.map((format, idx) => (
                        <button
                            key={`${format.itag}-${idx}`}
                            onClick={() => onDownload(format.itag)}
                            className="group relative flex items-center justify-between p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-accent-color/50 hover:shadow-[0_0_30px_-5px_var(--accent-color)] hover:shadow-accent-color/10 transition-all duration-300"
                        >
                            <div className="flex items-center gap-4">
                                <div className="text-2xl font-bold text-white group-hover:text-accent-color transition-colors">
                                    {format.qualityLabel || 'Standard'}
                                </div>
                                <span className="text-xs font-mono uppercase tracking-widest text-white/40 bg-black/20 px-2 py-1 rounded">
                                    {format.container}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 text-sm font-semibold text-white/60 group-hover:text-white transition-colors">
                                <span>Download</span>
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-accent-color group-hover:text-white transition-all">
                                    <FaDownload size={12} />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Audio Section */}
                {audioFormats && audioFormats.length > 0 && (
                    <>
                        <h3 className="text-xl font-bold mb-8 flex items-center gap-3 text-white pt-8 border-t border-white/10">
                            <span className="bg-purple-500/20 text-purple-400 p-2 rounded-lg">
                                <FaMusic size={20} />
                            </span>
                            Audio Only
                        </h3>
                        <div className="flex flex-col gap-4">
                            {audioFormats.map((format, idx) => (
                                <button
                                    key={`${format.itag}-${idx}-audio`}
                                    onClick={() => onDownload(format.itag)}
                                    className="group relative flex items-center justify-between p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-500/50 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)] transition-all duration-300"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                                            Audio Track
                                        </div>
                                        <span className="text-xs font-mono text-white/40 bg-black/20 px-2 py-1 rounded">
                                            {format.audioBitrate}kbps • {format.container}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 text-sm font-semibold text-white/60 group-hover:text-white transition-colors">
                                        <span>Download</span>
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all">
                                            <FaDownload size={12} />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default QualitySelector;
