# WTT & Setka Terminal (Table Tennis Board)
**Version 1.0.0**

A real-time dashboard for live table tennis tracking, trading, and streaming. Built with Next.js and Tailwind CSS.

## Features
- **YouTube Live Auto-Match**: Automatically syncs BetsAPI WTT live matches with the active WTT YouTube stream. Clicking the "WATCH" button scans the YouTube live stream title for the players and jumps the player to the live edge.
- **BetsAPI Ticker**: Fetches real-time point-by-point table tennis scoring data, including historical set scores and live point tracking.
- **Polymarket Integration**: Generates predictive market URLs (Setka Cup) using player names and dynamically filters out inactive or non-Setka events.
- **Custom URL Streamer**: Allows dropping in a custom YouTube or M3U8 link for immediate playback.
- **Match filtering**: Filter the dashboard by WTT, Setka, or All.

## Environment Variables
Create a \`.env.local\` file in the root directory:
\`\`\`env
BETSAPI_TOKEN=your_token_here
\`\`\`

## Getting Started
\`\`\`bash
npm run dev
\`\`\`
Open [http://localhost:3000](http://localhost:3000) with your browser.

## Architecture
- \`/api/betsapi\`: Proxies BetsAPI in-play requests.
- \`/api/youtube\`: Proxies YouTube Data API searches for the active WTT live stream.
