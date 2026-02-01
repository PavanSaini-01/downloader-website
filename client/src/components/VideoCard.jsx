import React from 'react';
import { FaEye, FaUser } from 'react-icons/fa';

const VideoCard = ({ video }) => {
    if (!video) return null;
    const { title, thumbnail, lengthSeconds, channel, viewCount } = video;

    const formatTime = (seconds) => {
        if (!seconds) return '0:00';
        const hrs = Math.floor(seconds / 3600);
        const min = Math.floor((seconds % 3600) / 60);
        const sec = seconds % 60;

        if (hrs > 0) {
            return `${hrs}:${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
        }
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const formatViews = (count) => {
        if (!count) return '0 views';
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M views`;
        }
        if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K views`;
        }
        return `${count} views`;
    };

    return (
        <div className="glass-panel w-full max-w-2xl mx-auto flex flex-col sm:flex-row gap-6 items-start fade-in mb-8 hover:border-white/20 transition-all">
            <div className="relative w-full sm:w-2/5 aspect-video rounded-lg overflow-hidden shadow-lg group">
                <img src={thumbnail} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md text-white/90 text-xs font-bold px-2 py-1 rounded-md">
                    {formatTime(lengthSeconds)}
                </div>
            </div>

            <div className="flex-1 min-w-0 py-1">
                <h2 className="text-xl font-semibold mb-3 text-white leading-snug tracking-tight line-clamp-2">
                    {title}
                </h2>

                {/* Channel and Stats */}
                <div className="flex flex-col gap-2 mb-4">
                    {channel && (
                        <div className="flex items-center gap-2 text-white/60">
                            <FaUser className="text-accent-color" size={12} />
                            <span className="text-sm font-medium">{channel}</span>
                        </div>
                    )}
                    {viewCount > 0 && (
                        <div className="flex items-center gap-2 text-white/60">
                            <FaEye className="text-accent-color" size={12} />
                            <span className="text-sm font-medium">{formatViews(viewCount)}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <span className="inline-block w-8 h-1 bg-accent-gradient rounded-full"></span>
                    <span className="text-xs text-white/40 uppercase tracking-widest font-semibold">YouTube Video</span>
                </div>
            </div>
        </div>
    );
};

export default VideoCard;
