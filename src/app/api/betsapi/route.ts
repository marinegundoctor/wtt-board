import { NextResponse } from 'next/server';
import axios from 'axios';

const BETSAPI_TOKEN = process.env.BETSAPI_TOKEN || '';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    const response = await axios.get('https://api.b365api.com/v2/events/inplay', {
      params: {
        sport_id: 92,
        token: BETSAPI_TOKEN
      }
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching BetsAPI data:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to fetch BetsAPI data' },
      { status: error.response?.status || 500 }
    );
  }
}
