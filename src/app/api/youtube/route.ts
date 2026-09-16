import { NextResponse } from 'next/server';
import axios from 'axios';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const WTT_CHANNEL_ID = 'UC9ckyA_A3MfXUa0ttxMoIZw'; // WTT Global Channel ID

export async function GET(request: Request) {
  if (!YOUTUBE_API_KEY) {
    return NextResponse.json({ error: 'YouTube API key is missing' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('eventType') || 'live'; // 'live' or 'upcoming' or 'completed'

    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        channelId: WTT_CHANNEL_ID,
        type: 'video',
        eventType: eventType,
        maxResults: 10,
        order: 'date',
        key: YOUTUBE_API_KEY,
      },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching YouTube videos:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to fetch YouTube videos' },
      { status: error.response?.status || 500 }
    );
  }
}
