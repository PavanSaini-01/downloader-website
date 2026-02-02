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



// Setup Cookies from Environment Variable
// Setup Cookies from Environment Variable
const cookiesEnv = process.env.YOUTUBE_COOKIES_BASE64 || process.env['YOUTUBE COOKIES BASE64'];
if (cookiesEnv) {
    try {
        const cookiesPath = path.join(__dirname, 'youtube_cookies.txt');
        const decoded = Buffer.from(cookiesEnv, 'base64').toString('utf-8');
        fs.writeFileSync(cookiesPath, decoded);
        console.log('Successfully created youtube_cookies.txt from environment variable.');
    } catch (err) {
        console.error('Error creating cookies file from env var:', err);
    }
} else {
    console.log('YOUTUBE_COOKIES_BASE64 not found in environment.');
}

const STRATEGIES = [
    { name: 'android_ios', args: ['--extractor-args', 'youtube:player_client=android,ios'] },
    { name: 'web', args: ['--extractor-args', 'youtube:player_client=web'] },
    { name: 'tv', args: ['--extractor-args', 'youtube:player_client=tv'] },
    { name: 'clean', args: ['--extractor-args', 'youtube:player_client=android,ios'], noCookies: true }, // Try without cookies
    { name: 'default', args: [] }
];

function getVideoInfo(ytDlpPath, url, strategyIndex = 0) {
    return new Promise((resolve, reject) => {
        if (strategyIndex >= STRATEGIES.length) {
            return reject(new Error('All strategies failed to fetch video info.'));
        }

        const strategy = STRATEGIES[strategyIndex];
        console.log(`[Attempt ${strategyIndex + 1}/${STRATEGIES.length}] Using strategy: ${strategy.name}`);

        const args = [
            '-J',
            '--no-playlist',
            ...strategy.args,
            url
        ];

        const cookiesPath = path.join(__dirname, 'youtube_cookies.txt');
        if (fs.existsSync(cookiesPath) && !strategy.noCookies) {
            // Insert cookies arg after -J
            args.splice(1, 0, '--cookies', cookiesPath);
        }

        const child = spawn(ytDlpPath, args);
        let dataBuffer = '';
        let errorBuffer = '';

        child.stdout.on('data', d => dataBuffer += d.toString());
        child.stderr.on('data', d => errorBuffer += d.toString());

        child.on('close', (code) => {
            if (code !== 0) {
                console.warn(`Strategy ${strategy.name} failed. Stderr: ${errorBuffer.slice(0, 200)}...`);
                // Recursive retry
                resolve(getVideoInfo(ytDlpPath, url, strategyIndex + 1));
            } else {
                try {
                    const json = JSON.parse(dataBuffer);
                    resolve({ info: json, strategy: strategy.name });
                } catch (e) {
                    console.warn(`Strategy ${strategy.name} produced invalid JSON.`);
                    resolve(getVideoInfo(ytDlpPath, url, strategyIndex + 1));
                }
            }
        });
    });
}

// Get video info
app.get('/api/info', async (req, res) => {
    const videoURL = req.query.url;
    if (!videoURL) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    try {
        const result = await getVideoInfo(ytDlpPath, videoURL);
        const info = result.info;

        // Process formats as before
        const rawFormats = info.formats || [];
        const relevantFormats = rawFormats
            .filter(f => f.vcodec !== 'none')
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
                    itag: f.format_id,
                    qualityLabel: `${heightStr}${note}`,
                    container: f.ext,
                    mimeType: `video/${f.ext}`,
                    hasAudio: f.acodec !== 'none',
                    hasVideo: f.vcodec !== 'none',
                    size: f.filesize || f.filesize_approx || 0,
                    url: f.url
                };
            }),
            audioFormats: audioFormats.map(f => ({
                itag: f.format_id,
                container: f.ext,
                audioBitrate: Math.round(f.abr || 0),
                mimeType: `audio/${f.ext}`,
                hasAudio: true,
                hasVideo: false,
                size: f.filesize || f.filesize_approx || 0,
                url: f.url
            }))
        };

        res.json(videoInfo);

    } catch (error) {
        console.error('Final error fetching video info:', error);
        res.status(500).json({ error: 'Failed to fetch video info after multiple attempts.' });
    }
});

app.get('/api/debug', (req, res) => {
    // 1. Check yt-dlp version
    execFile(ytDlpPath, ['--version'], (err, stdout, stderr) => {
        const version = err ? 'Error getting version' : stdout.trim();

        // 2. Check cookies
        const cookiesPath = path.join(__dirname, 'youtube_cookies.txt');
        const hasCookies = fs.existsSync(cookiesPath);
        const cookiesSize = hasCookies ? fs.statSync(cookiesPath).size : 0;

        // 3. Env Var check
        const cookiesEnv = process.env.YOUTUBE_COOKIES_BASE64 || process.env['YOUTUBE COOKIES BASE64'];
        const hasEnvVar = !!cookiesEnv;
        const envVarLen = hasEnvVar ? cookiesEnv.length : 0;

        // 3. Test a known video (optional, can be triggered via query)
        const testUrl = req.query.url;
        let testResult = 'Not requested';

        if (testUrl) {
            const child = spawn(ytDlpPath, ['-J', '--no-playlist', testUrl]);
            let buf = '';
            let errBuf = '';
            child.stdout.on('data', d => buf += d.toString());
            child.stderr.on('data', d => errBuf += d.toString());
            child.on('close', (code) => {
                res.json({
                    version,
                    cwd: __dirname,
                    dir_files: fs.readdirSync(__dirname),
                    env: {
                        has_cookie_var: hasEnvVar,
                        var_length: envVarLen
                    },
                    cookies: { exists: hasCookies, size: cookiesSize },
                    test: {
                        url: testUrl,
                        code,
                        stdout_preview: buf.substring(0, 200),
                        stderr: errBuf
                    }
                });
            });
            res.json({
                version,
                cwd: __dirname,
                dir_files: fs.readdirSync(__dirname),
                env: {
                    has_cookie_var: hasEnvVar,
                    var_length: envVarLen
                },
                cookies: { exists: hasCookies, size: cookiesSize },
                message: 'Pass ?url=YOUTUBE_URL to test download'
            });
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
        '--extractor-args', 'youtube:player_client=android,ios',
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
