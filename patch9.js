const fs = require('fs');
const file = 'src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const slugHelper = `  const generatePolymarketUrl = (score: any) => {
    if (score.league.toLowerCase().includes('wtt')) {
      // If WTT, we don't know the exact slug format without Gamma, maybe just search?
      return \`https://polymarket.us/markets?query=\${encodeURIComponent(score.p1)}\`;
    }
    const processName = (name: string) => {
      const parts = name.split(' ').map(p => p.trim()).filter(p => p.length > 0);
      if (parts.length >= 2) {
        const last = parts[0].toLowerCase().replace(/[^a-z]/g, '').substring(0, 3);
        const first = parts[1].toLowerCase().replace(/[^a-z]/g, '').substring(0, 3);
        return \`\${last}\${first}\`;
      }
      return name.toLowerCase().replace(/[^a-z]/g, '').substring(0, 6);
    };
    const p1code = processName(score.p1);
    const p2code = processName(score.p2);
    const d = new Date();
    const dateStr = \`\${d.getUTCFullYear()}-\${String(d.getUTCMonth() + 1).padStart(2, '0')}-\${String(d.getUTCDate()).padStart(2, '0')}\`;
    return \`https://polymarket.us/sports/setka-cup-ukraine-men/setkameua-\${p1code}-\${p2code}-\${dateStr}\`;
  };

  const handleMatchClick = (score: any) => {`;

content = content.replace('  const handleMatchClick = (score: any) => {', slugHelper);

// In Ticker onClick, remove setting the custom stream URL
content = content.replace(
\`              <div 
                key={score.id} 
                onClick={() => {
                  setCustomStreamUrl(\\\`\${score.p1} vs \${score.p2}\\\`);
                  handleMatchClick(score);
                }}\`,
\`              <div 
                key={score.id} 
                onClick={() => handleMatchClick(score)}\`
);

// In Watch Button onClick
content = content.replace(
\`                         if (score.league.toLowerCase().includes('wtt')) {
                           handleMatchClick(score);
                           window.scrollTo({ top: 0, behavior: 'smooth' });
                         } else {
                           window.open('https://polymarket.us', '_blank');
                         }\`,
\`                         if (score.league.toLowerCase().includes('wtt')) {
                           handleMatchClick(score);
                           window.scrollTo({ top: 0, behavior: 'smooth' });
                         } else {
                           window.open(generatePolymarketUrl(score), '_blank');
                         }\`
);

// Replace the Gamma API fetch with something that does nothing since we'll map liveScores
content = content.replace(
\`    // 2. Fetch Polymarket Table Tennis Markets
    axios.get('/api/polymarket')
      .then(res => {
        const events = res.data || [];
        setPolymarketEvents(events);
      })
      .catch(() => console.log("Polymarket Gamma API unavailable"));\`,
\`    // 2. Polymarket events are now derived directly from liveScores 
    // to bypass Gamma API unreliability.\`
);

// In Polymarket rendering section, map over liveScores instead
const oldPolyMap = \`            <div className="p-4">
              {polymarketEvents.length > 0 ? (
                <div className="space-y-3">
                  {polymarketEvents.filter(ev => {
                    if (globalFilter === "All") return true;
                    if (globalFilter === "WTT") return ev.title?.toLowerCase().includes("wtt") || ev.description?.toLowerCase().includes("wtt");
                    if (globalFilter === "Setka") return !ev.title?.toLowerCase().includes("wtt") && !ev.description?.toLowerCase().includes("wtt");
                    return true;
                  }).map((ev, i) => (
                    <div key={i} className="border border-slate-800 p-3 rounded-lg flex justify-between items-center bg-slate-950 hover:border-slate-700 transition-colors">
                      <div>
                        <h4 className="font-semibold text-sm text-slate-100">{ev.title}</h4>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">Volume: \${Number(ev.volume || 0).toLocaleString()}</p>
                      </div>
                      <a
                        href={\`https://polymarket.us/event/\${ev.slug}\`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center"
                      >
                        Trade <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (\`;

const newPolyMap = \`            <div className="p-4">
              {liveScores.length > 0 ? (
                <div className="space-y-3">
                  {liveScores.filter(score => {
                    if (globalFilter === "All") return true;
                    if (globalFilter === "WTT") return score.league.toLowerCase().includes("wtt");
                    if (globalFilter === "Setka") return !score.league.toLowerCase().includes("wtt");
                    return true;
                  }).map((score, i) => (
                    <div key={i} className="border border-slate-800 p-3 rounded-lg flex justify-between items-center bg-slate-950 hover:border-slate-700 transition-colors">
                      <div>
                        <h4 className="font-semibold text-sm text-slate-100">{score.p1} vs {score.p2}</h4>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">League: {score.league}</p>
                      </div>
                      <a
                        href={generatePolymarketUrl(score)}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center"
                      >
                        Trade <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (\`;

content = content.replace(oldPolyMap, newPolyMap);

// Remove the GAMMA API badge since we aren't using it anymore
content = content.replace(
\`              <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/80 px-2 py-0.5 rounded">
                GAMMA API
              </span>\`,
\`              <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/80 px-2 py-0.5 rounded">
                BETSAPI SYNC
              </span>\`
);

fs.writeFileSync(file, content);
