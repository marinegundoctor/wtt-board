import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const p1 = searchParams.get('p1');
  const p2 = searchParams.get('p2');
  const date = searchParams.get('date');
  const league = (searchParams.get('league') || "").toLowerCase();

  if (!p1 || !p2 || !date) {
    return NextResponse.redirect('https://polymarket.us');
  }

  // Pre-compute the 4 known Setka slugs
  const ukraineMen = `https://polymarket.us/sports/setka-cup-ukraine-men/setkameua-${p1}-${p2}-${date}`;
  const ukraineWomen = `https://polymarket.us/sports/setka-cup-ukraine-women/setkawoua-${p1}-${p2}-${date}`;
  const czechiaMen = `https://polymarket.us/sports/setka-cup-czechia-men/setkamecz-${p1}-${p2}-${date}`;
  const moldovaMen = `https://polymarket.us/sports/setka-cup-moldova-men/setkamemd-${p1}-${p2}-${date}`;

  // Dynamically set the fallback and priority based on the league string
  let variations = [ukraineMen, czechiaMen, moldovaMen, ukraineWomen];
  let fallback = ukraineMen;

  if (league.includes('women')) {
    variations = [ukraineWomen, ukraineMen];
    fallback = ukraineWomen;
  } else if (league.includes('czech')) {
    variations = [czechiaMen, ukraineMen, moldovaMen];
    fallback = czechiaMen;
  } else if (league.includes('moldova')) {
    variations = [moldovaMen, ukraineMen, czechiaMen];
    fallback = moldovaMen;
  }

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

  // Fallback if none returned 200 (e.g. market doesn't exist, or name typo)
  // This guarantees the browser bar at least shows the most logical slug attempt
  return NextResponse.redirect(fallback);
}
