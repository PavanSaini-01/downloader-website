# YouTube Cookies Setup (Optional but Recommended)

YouTube's bot detection is very aggressive on data center IPs (like Render). Using authenticated cookies significantly improves success rates.

## Why Cookies Help
- Bypasses "Sign in to confirm you're not a bot" errors
- Allows access to age-restricted and region-locked videos
- More reliable on cloud hosting platforms

## How to Extract YouTube Cookies

### Option 1: Using Browser Extension (Easiest)

1. **Install Extension:**
   - Chrome/Edge: [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
   - Firefox: [cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)

2. **Export Cookies:**
   - Go to [YouTube.com](https://youtube.com) and **sign in**
   - Click the extension icon
   - Click "Export" or "Download"
   - Save as `youtube_cookies.txt`

### Option 2: Using yt-dlp (Command Line)

```bash
# This creates a cookies file from your browser
yt-dlp --cookies-from-browser chrome --cookies youtube_cookies.txt "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

Replace `chrome` with your browser: `firefox`, `edge`, `safari`, `brave`, etc.

## Deploying Cookies to Render

### Method 1: Environment Variable (Recommended for Production)

1. **Encode your cookies file to base64:**
   ```bash
   # Windows PowerShell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("youtube_cookies.txt")) | Set-Clipboard
   
   # Linux/Mac
   base64 youtube_cookies.txt | pbcopy
   ```

2. **Add to Render:**
   - Go to your Render service → Environment
   - Add environment variable: `YOUTUBE_COOKIES_BASE64`
   - Paste the base64 string as the value
   - Save changes

3. **Update Dockerfile** to decode on startup (see below)

### Method 2: Commit to Private Repo (Quick but Less Secure)

1. Place `youtube_cookies.txt` in the `server/` directory
2. **Important:** Make sure your repo is **PRIVATE** (cookies contain auth tokens!)
3. Add to `.gitignore` if repo is public:
   ```
   server/youtube_cookies.txt
   ```

## Updating the Dockerfile (for Method 1)

Add this to your `Dockerfile` before the `CMD` line:

```dockerfile
# Decode cookies from environment variable if present
RUN echo '#!/bin/sh\n\
if [ -n "$YOUTUBE_COOKIES_BASE64" ]; then\n\
  echo "$YOUTUBE_COOKIES_BASE64" | base64 -d > /usr/src/app/youtube_cookies.txt\n\
  echo "YouTube cookies loaded from environment"\n\
fi\n\
exec npm start' > /usr/src/app/start.sh && chmod +x /usr/src/app/start.sh

CMD ["/usr/src/app/start.sh"]
```

## Security Notes

⚠️ **Important:**
- Cookies contain authentication tokens - treat them like passwords
- Never commit cookies to a public repository
- Cookies expire after ~1 year - you'll need to refresh them
- Use environment variables for production deployments

## Testing Locally

1. Place `youtube_cookies.txt` in the `server/` folder
2. Restart your server
3. You should see: `Using cookies file for authentication` in the logs
4. Test with a video URL

## Troubleshooting

**"Still getting bot detection errors"**
- Make sure you're signed into YouTube when exporting cookies
- Try exporting fresh cookies (they may have expired)
- Verify the cookies file is in Netscape format (should start with `# Netscape HTTP Cookie File`)

**"Cookies not being used"**
- Check server logs for "Using cookies file for authentication"
- Verify file path: should be `server/youtube_cookies.txt`
- Check file permissions (should be readable)
