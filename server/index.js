const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const app = express();

app.use(cors());

// Determine yt-dlp path. In Docker/Production we expect 'yt-dlp' to be in PATH.
// Locally on Windows we might use the included binary.
const fs = require('fs');
const localBinaryPath = path.join(__dirname, 'bin', 'yt-dlp.exe');
const ytDlpPath = (process.platform === 'win32' && fs.existsSync(localBinaryPath)) ? localBinaryPath : 'yt-dlp';

// Check yt-dlp version on startup
const { execFile } = require('child_process');
execFile(ytDlpPath, ['--version'], (error, stdout, stderr) => {
    if (error) {
        console.error('Error checking yt-dlp version:', error);
        console.error('Make sure yt-dlp is installed and in PATH (or in bin/ for Windows).');
    } else {
        console.log(`Using yt-dlp version: ${stdout.trim()}`);
    }
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Get video info
app.get('/api/info', (req, res) => {
    const videoURL = req.query.url;
    if (!videoURL) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Spawn yt-dlp process to get JSON info
    // Using multiple strategies to bypass bot detection
    const args = [
        '-J',
        '--no-playlist',
        // Try multiple clients as fallback: ios,web,mweb
        '--extractor-args', 'youtube:player_client=ios,web',
        // Skip unavailable fragments (helps with some restricted videos)
        '--extractor-args', 'youtube:skip=hls,dash',
        videoURL
    ];

    // Check if cookies file exists (optional, for authenticated access)
    const cookiesPath = path.join(__dirname, 'youtube_cookies.txt');
    if (fs.existsSync(cookiesPath)) {
        args.splice(1, 0, '--cookies', cookiesPath);
        console.log('Using cookies file for authentication');
    }
    const ytDlp = spawn(ytDlpPath, args);

    let dataBuffer = '';
    let errorBuffer = '';

    ytDlp.stdout.on('data', (data) => {
        dataBuffer += data.toString();
    });

    ytDlp.stderr.on('data', (data) => {
        errorBuffer += data.toString();
    });

    ytDlp.on('close', (code) => {
        if (code !== 0) {
            console.error('yt-dlp error:', errorBuffer);
            return res.status(500).json({ error: 'Failed to fetch info. ' + errorBuffer });
        }

        try {
            const info = JSON.parse(dataBuffer);

            // Map yt-dlp formats to our UI expectations
            // yt-dlp: format_id, ext, resolution, vcodec, acodec

            const rawFormats = info.formats || [];

            const relevantFormats = rawFormats
                .filter(f => f.vcodec !== 'none') // Include all video formats, even if no audio
                .sort((a, b) => (b.height || 0) - (a.height || 0));



            const audioFormats = rawFormats
                .filter(f => f.vcodec === 'none' && f.acodec !== 'none');

            const videoInfo = {
                title: info.title,
                thumbnail: info.thumbnail,
                lengthSeconds: info.duration,
                channel: info.channel || info.uploader || 'Unknown',
                uploader: info.uploader,
                viewCount: info.view_count || 0,
                uploadDate: info.upload_date,
                formats: relevantFormats.map(f => {
                    const heightStr = `${f.height}p`;
                    const note = f.format_note && f.format_note !== heightStr ? ` ${f.format_note}` : '';
                    return {
                        itag: f.format_id, // Mapping format_id to itag for frontend compat
                        qualityLabel: `${heightStr}${note}`,
                        container: f.ext,
                        mimeType: `video/${f.ext}`,
                        hasAudio: f.acodec !== 'none',
                        hasVideo: f.vcodec !== 'none',
                        size: f.filesize || f.filesize_approx || 0
                    };
                }),
                audioFormats: audioFormats.map(f => ({
                    itag: f.format_id,
                    container: f.ext,
                    audioBitrate: Math.round(f.abr || 0),
                    mimeType: `audio/${f.ext}`,
                    hasAudio: true,
                    hasVideo: false,
                    size: f.filesize || f.filesize_approx || 0
                }))
            };

            res.json(videoInfo);
        } catch (e) {
            console.error('JSON parse error:', e);
            res.status(500).json({ error: 'Failed to parse video info' });
        }
    });
});

// Download video
app.get('/api/download', (req, res) => {
    const { url, itag, title, container } = req.query; // itag here is actually format_id
    if (!url || !itag) {
        return res.status(400).send('Missing url or quality');
    }

    console.log(`Starting download via yt-dlp: ${url} (format: ${itag})`);

    const ext = container || 'mp4';
    let filename = `video_${itag}.${ext}`;
    if (title) {
        // Sanitize title: remove non-alphanumeric chars (keep spaces/dashes), replace spaces with underscores, limit length
        const sanitized = title.replace(/[^a-zA-Z0-9 \-_]/g, '').replace(/\s+/g, '_').substring(0, 50);
        if (sanitized) {
            filename = `${sanitized}_${itag}.${ext}`;
        }
    }

    res.header('Content-Disposition', `attachment; filename="${filename}"`);

    const args = [
        '-f', itag,
        '-o', '-',
        '--extractor-args', 'youtube:player_client=ios,web',
        '--extractor-args', 'youtube:skip=hls,dash',
        url
    ];

    // Use cookies if available
    const cookiesPath = path.join(__dirname, 'youtube_cookies.txt');
    if (fs.existsSync(cookiesPath)) {
        args.splice(1, 0, '--cookies', cookiesPath);
    }
    const ytDlp = spawn(ytDlpPath, args);

    ytDlp.stdout.pipe(res);

    ytDlp.stderr.on('data', (data) => {
        console.error('yt-dlp stderr:', data.toString());
    });

    ytDlp.on('close', (code) => {
        console.log('yt-dlp process exited with code', code);
    });
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all handler for any request that doesn't match an API route
// Catch-all handler for any request that doesn't match an API route
// Using regex /.*/ to avoid Express 5 path-to-regexp strict parameter matching issue with '*'
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
