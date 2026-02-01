const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const app = express();

app.use(cors());

const ytDlpPath = path.join(__dirname, 'bin', 'yt-dlp.exe');

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
    const ytDlp = spawn(ytDlpPath, ['-J', videoURL]);

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
    const { url, itag } = req.query; // itag here is actually format_id
    if (!url || !itag) {
        return res.status(400).send('Missing url or quality');
    }

    console.log(`Starting download via yt-dlp: ${url} (format: ${itag})`);

    // First fetch info quickly to get filename (optional, but good for UX)
    // Or just stream efficiently. We need to set headers.
    // To be fast, we can just use a generic filename or try to get it from a separate quick call.
    // Let's use a generic name first to ensure speed, or use the one from frontend if passed?
    // User didn't pass title. Let's assume generic.

    res.header('Content-Disposition', `attachment; filename="video_${itag}.mp4"`);

    const ytDlp = spawn(ytDlpPath, ['-f', itag, '-o', '-', url]);

    ytDlp.stdout.pipe(res);

    ytDlp.stderr.on('data', (data) => {
        console.error('yt-dlp stderr:', data.toString());
    });

    ytDlp.on('close', (code) => {
        console.log('yt-dlp process exited with code', code);
    });
});

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
