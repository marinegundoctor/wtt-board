import { NextResponse } from 'next/server';
import axios from 'axios';
import { format } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // WTT Feeder Bangkok 2026 is Sept 14 - 18
    // If no date provided, default to current date (or a specific tournament date)
    const dateParam = searchParams.get('date');
    const date = dateParam || format(new Date(), 'yyyy-MM-dd');

    // Sofascore API endpoint for table tennis scheduled events on a given date
    const response = await axios.get(`https://api.sofascore.com/api/v1/sport/table-tennis/scheduled-events/${date}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WTTDashboard/1.0)',
        'Origin': 'https://www.sofascore.com',
        'Referer': 'https://www.sofascore.com/',
      },
    });

    // Filter events for WTT Feeder Bangkok 2026 if necessary
    // Example: tournament name usually contains "Feeder Bangkok"
    const allEvents = response.data.events || [];
    const bangkokEvents = allEvents.filter((event: any) => 
      event.tournament?.name?.toLowerCase().includes('bangkok') ||
      event.tournament?.category?.name?.toLowerCase().includes('wtt')
    );

    return NextResponse.json({
      date,
      totalEvents: bangkokEvents.length,
      events: bangkokEvents,
    });
  } catch (error: any) {
    console.error('Error fetching Sofascore data:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to fetch match data' },
      { status: error.response?.status || 500 }
    );
  }
}
