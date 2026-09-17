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

  // Format A: [P1Last3][P1First3]-[P2Last3][P2First3] (Legacy format)
  const getFormatA = (name1: string, name2: string) => {
    const parse = (name: string) => {
      const parts = name.split(' ').map(p => p.trim()).filter(p => p.length > 0);
      if (parts.length >= 2) {
        const last = parts[parts.length - 1].toLowerCase().replace(/[^a-z]/g, '').substring(0, 3);
        const first = parts[0].toLowerCase().replace(/[^a-z]/g, '').substring(0, 3);
        return `${last}${first}`;
      }
      return name.toLowerCase().replace(/[^a-z]/g, '').substring(0, 6);
    }
    return `${parse(name1)}-${parse(name2)}`;
  };

  // Format B: [P1Last4][P2Last4]-[P1First4][P2First4] (Modern format)
  const getFormatB = (name1: string, name2: string) => {
    const parseParts = (name: string) => {
      const parts = name.split(' ').map(p => p.trim()).filter(p => p.length > 0);
      if (parts.length >= 2) {
        const last = parts[parts.length - 1].toLowerCase().replace(/[^a-z]/g, '').substring(0, 4);
        const first = parts[0].toLowerCase().replace(/[^a-z]/g, '').substring(0, 4);
        return { first, last };
      }
      const safe = name.toLowerCase().replace(/[^a-z]/g, '');
      return { first: safe.substring(0, 4), last: safe.substring(0, 4) };
    }
    const p1Parts = parseParts(name1);
    const p2Parts = parseParts(name2);
    return `${p1Parts.last}${p1Parts.first}-${p2Parts.last}${p2Parts.first}`;
  };

  const slugA = getFormatA(p1, p2);
  const slugB = getFormatB(p1, p2);

  const getUrls = (slug: string) => [
    `https://polymarket.us/sports/setka-cup-ukraine-men/setkameua-${slug}-${date}`,
    `https://polymarket.us/sports/setka-cup-ukraine-women/setkawoua-${slug}-${date}`,
    `https://polymarket.us/sports/setka-cup-czechia-men/setkamecz-${slug}-${date}`,
    `https://polymarket.us/sports/setka-cup-moldova-men/setkamemd-${slug}-${date}`,
  ];

  let variations = [...getUrls(slugB), ...getUrls(slugA)]; // Try modern format first
  let fallback = variations[0];

  if (league.includes('women')) {
    variations = [variations[1], variations[5], variations[0], variations[4]]; // B-women, A-women, B-men, A-men
    fallback = variations[0];
  } else if (league.includes('czech')) {
    variations = [variations[2], variations[6], variations[0], variations[4], variations[3], variations[7]]; // B-czech, A-czech, ...
    fallback = variations[0];
  } else if (league.includes('moldova')) {
    variations = [variations[3], variations[7], variations[0], variations[4], variations[2], variations[6]];
    fallback = variations[0];
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

  // Fallback
  return NextResponse.redirect(fallback);
}
