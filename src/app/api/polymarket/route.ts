import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    const res = await axios.get('https://gamma-api.polymarket.com/events?closed=false&tag_slug=table-tennis');
    const now = new Date();
    // Filter out old/resolved markets (e.g. older than 2 weeks or strictly past endDate if applicable)
    const filtered = (res.data || []).filter((e: any) => {
      if (!e.active || e.closed) return false;
      const start = new Date(e.startDate || e.creationDate);
      const diffDays = (now.getTime() - start.getTime()) / (1000 * 3600 * 24);
      return diffDays < 14; // Only keep recent games (started less than 14 days ago)
    });
    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Polymarket fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch Polymarket data" }, { status: 500 });
  }
}
