const http = require('http');
const fs = require('fs');

const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
// fetching info first to get an itag
const infoUrl = `http://localhost:4000/api/info?url=${encodeURIComponent(videoUrl)}`;

http.get(infoUrl, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (res.statusCode !== 200) {
            console.error('Failed to get info:', data);
            return;
        }
        const info = JSON.parse(data);
        const itag = info.formats[0].itag;
        console.log(`Trying to download itag: ${itag}`);

        const downloadUrl = `http://localhost:4000/api/download?url=${encodeURIComponent(videoUrl)}&itag=${itag}`;
        http.get(downloadUrl, (dlRes) => {
            console.log('Download Status:', dlRes.statusCode);
            console.log('Headers:', dlRes.headers);

            if (dlRes.statusCode === 200) {
                const file = fs.createWriteStream("test_video.mp4");
                dlRes.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log('Download completed successfully.');
                });
            } else {
                dlRes.resume(); // consume response to free memory
            }
        });
    });
}).on('error', err => console.error('Error:', err));
