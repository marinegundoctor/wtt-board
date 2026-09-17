import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const p1 = searchParams.get('p1');
  const p2 = searchParams.get('p2');
  const date = searchParams.get('date');

  if (!p1 || !p2 || !date) {
    return NextResponse.redirect('https://polymarket.us');
  }

  const variations = [
    `https://polymarket.us/sports/setka-cup-ukraine-men/setkameua-${p1}-${p2}-${date}`,
    `https://polymarket.us/sports/setka-cup-ukraine-women/setkawoua-${p1}-${p2}-${date}`,
    `https://polymarket.us/sports/setka-cup-czechia-men/setkamecz-${p1}-${p2}-${date}`,
    `https://polymarket.us/sports/setka-cup-moldova-men/setkamemd-${p1}-${p2}-${date}`,
  ];

  for (const url of variations) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) {
        return NextResponse.redirect(url);
      }
    } catch (e) {
      console.error('Poly redirect check error:', e);
    }
  }

  // Fallback if none returned 200
  return NextResponse.redirect(variations[0]);
}
