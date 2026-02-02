const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoint to get video info (Mocked for Cobalt)
app.get('/api/info', async (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        console.log('Fetching info (mock) for:', videoUrl);

        // Cobalt handles quality selection automatically or via simple flags.
        // We will provide a standard list of options to the frontend.
        // The frontend expects: { videoFormats: [], audioFormats: [], ... }

        // We can't easily get the REAL title/thumbnail without calling Cobalt or oEmbed.
        // Let's try oEmbed for title/thumbnail mainly.
        let title = 'YouTube Video';
        let thumbnail = '';

        try {
            // Quick fetch to oEmbed to get title
            const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
            const oembedRes = await fetch(oembedUrl);
            if (oembedRes.ok) {
                const data = await oembedRes.json();
                title = data.title;
                thumbnail = data.thumbnail_url;
            }
        } catch (e) {
            console.log('oEmbed failed, using defaults');
        }

        const formats = [
            {
                itag: 'max', // Cobalt 'max'
                qualityLabel: 'Best Quality (Max)',
                container: 'mp4',
                hasAudio: true,
                hasVideo: true,
                size: 0 // Unknown
            },
            {
                itag: '1080',
                qualityLabel: '1080p',
                container: 'mp4',
                hasAudio: true,
                hasVideo: true,
                size: 0
            },
            {
                itag: '720',
                qualityLabel: '720p',
                container: 'mp4',
                hasAudio: true,
                hasVideo: true,
                size: 0
            },
            {
                itag: '480',
                qualityLabel: '480p',
                container: 'mp4',
                hasAudio: true,
                hasVideo: true,
                size: 0
            }
        ];

        const audioFormats = [
            {
                itag: 'audio',
                qualityLabel: 'Audio MP3',
                container: 'mp3',
                hasAudio: true,
                hasVideo: false,
                size: 0,
                audioBitrate: 128
            }
        ];

        res.json({
            title,
            thumbnail,
            lengthSeconds: 0, // Unknown
            videoFormats: formats,
            audioFormats: audioFormats
        });

    } catch (error) {
        console.error('Error in /api/info:', error);
        res.status(500).json({ error: 'Failed to fetch video info.' });
    }
});

// API Endpoint to download video
app.get('/api/download', async (req, res) => {
    const { url, itag } = req.query;

    if (!url || !itag) {
        return res.status(400).send('URL and Quality (itag) are required');
    }

    console.log(`Processing download for ${url} with quality ${itag}`);

    try {
        // Map 'itag' to Cobalt parameters
        // Cobalt API Docs: https://github.com/imputnet/cobalt/blob/current/docs/api.md
        // POST https://api.cobalt.tools/api/json

        let requestBody = {
            url: url,
            videoQuality: 'max',
            downloadMode: 'auto', // audio for audio
        };

        if (itag === 'audio') {
            requestBody.downloadMode = 'audio';
        } else if (itag === 'max') {
            requestBody.videoQuality = 'max';
        } else {
            // 1080, 720, etc.
            requestBody.videoQuality = itag;
        }

        // Call Cobalt API
        const cobaltResponse = await fetch('https://api.cobalt.tools/api/json', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const cobaltData = await cobaltResponse.json();

        if (!cobaltData.url) {
            console.error('Cobalt Error:', cobaltData);
            // If picker is returned, just pick the first one?
            if (cobaltData.picker && cobaltData.picker.length > 0) {
                res.redirect(cobaltData.picker[0].url);
                return;
            }
            return res.status(500).send('Download failed (Provider Error)');
        }

        // Redirect the client to the direct download link
        // This is efficient and saves server bandwidth (we just act as a control plane)
        res.redirect(cobaltData.url);

    } catch (error) {
        console.error('Download Logic Error:', error);
        res.status(500).send('Internal Server Error during download request');
    }
});

// Debug endpoint (Simple version)
app.get('/api/debug', (req, res) => {
    res.json({
        status: 'Cobalt Backend Active',
        node_version: process.version,
        time: new Date().toISOString()
    });
});

// Serve React App for any other route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
