import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    const res = await axios.get('https://gamma-api.polymarket.com/events?closed=false&tag_slug=table-tennis');
    return NextResponse.json(res.data);
  } catch (error) {
    console.error("Polymarket fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch Polymarket data" }, { status: 500 });
  }
}
