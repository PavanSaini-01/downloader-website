import React from 'react';

const VideoCard = ({ video }) => {
    if (!video) return null;
    const { title, thumbnail, lengthSeconds } = video;

    const formatTime = (seconds) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    return (
        <div className="glass-panel w-full max-w-2xl mx-auto flex flex-col sm:flex-row gap-6 items-start fade-in mb-8 hover:border-white/20 transition-all">
            <div className="relative w-full sm:w-2/5 aspect-video rounded-lg overflow-hidden shadow-lg group">
                <img src={thumbnail} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white/90 text-xs font-medium px-2 py-1 rounded-md">
                    {formatTime(lengthSeconds)}
                </div>
            </div>

            <div className="flex-1 min-w-0 py-1">
                <h2 className="text-xl font-semibold mb-3 text-white leading-snug tracking-tight line-clamp-2">
                    {title}
                </h2>
                <div className="flex items-center gap-2 mb-4">
                    <span className="inline-block w-8 h-1 bg-accent-gradient rounded-full"></span>
                    <span className="text-xs text-white/40 uppercase tracking-widest font-semibold">YouTube Video</span>
                </div>
            </div>
        </div>
    );
};

export default VideoCard;
