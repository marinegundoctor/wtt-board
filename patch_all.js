const fs = require('fs');
const file = 'src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Ticker Sticky
content = content.replace('      <div className="bg-slate-900/90 border-b border-slate-800">', '      <div className="bg-slate-900/90 border-b border-slate-800 sticky top-14 z-40">');

// 2. BetsAPI sets mapping
content = content.replace(
\`              s1: setScores[0] || '0',
              s2: setScores[1] || '0',
              current: lastSet ? \`Pts: \${lastSet.home ?? 0}-\${lastSet.away ?? 0}\` : (ev.league?.name || ''),\`,
\`              s1: setScores[0] || '0',
              s2: setScores[1] || '0',
              sets: scoresObj,
              current: lastSet ? \`Pts: \${lastSet.home ?? 0}-\${lastSet.away ?? 0}\` : (ev.league?.name || ''),\`
);

// 3. Ticker UI sets display
const oldBlock = \`                <div className="flex items-center space-x-3">
                  <div className="flex flex-col max-w-[130px]">
                    <span className="font-semibold text-white truncate">{score.p1}</span>
                    <span className="text-slate-400 truncate">{score.p2}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center font-mono font-bold text-sm px-2 text-emerald-400">
                    <span>{score.s1}</span>
                    <span>{score.s2}</span>
                  </div>
                  <div className="flex flex-col font-mono text-[11px] text-slate-400 min-w-[70px]">
                    <span className={score.status === "Live" ? "text-emerald-400 font-bold" : "text-slate-500"}>
                      {score.status}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {score.current?.includes('-') ? score.current : ''}
                    </span>
                  </div>
                </div>\`;

const newBlock = \`                <div className="flex items-center space-x-3 mt-1">
                  <div className="flex flex-col max-w-[130px]">
                    <span className="font-semibold text-white truncate">{score.p1}</span>
                    <span className="text-slate-400 truncate">{score.p2}</span>
                  </div>
                  
                  {/* Scores Area */}
                  <div className="flex items-center space-x-2 font-mono">
                    {/* Previous Sets */}
                    {score.sets.slice(0, score.status === 'Live' ? -1 : undefined).map((s: any, idx: number) => {
                      const h = parseInt(s.home||'0'), a = parseInt(s.away||'0');
                      return (
                        <div key={idx} className="flex flex-col items-center text-slate-300 text-[11px]">
                          <span className={h > a ? 'font-bold' : ''}>{h}</span>
                          <span className={a > h ? 'font-bold' : ''}>{a}</span>
                        </div>
                      )
                    })}
                    
                    {/* Current Set / Live Score */}
                    {score.status === 'Live' && score.sets.length > 0 && (() => {
                      const last = score.sets[score.sets.length - 1];
                      const h = parseInt(last.home||'0'), a = parseInt(last.away||'0');
                      return (
                        <div className="flex flex-col items-center text-sm ml-1">
                          <span className={\`font-bold \${h > a ? 'text-emerald-400' : h < a ? 'text-red-400' : 'text-emerald-400'}\`}>{h}</span>
                          <span className={\`font-bold \${a > h ? 'text-emerald-400' : a < h ? 'text-red-400' : 'text-emerald-400'}\`}>{a}</span>
                        </div>
                      )
                    })()}
                  </div>

                  <div className="flex flex-col items-end min-w-[50px]">
                    <span className={\`text-[10px] uppercase font-bold \${score.status === "Live" ? "text-emerald-400" : "text-slate-500"}\`}>
                      {score.status === "Live" ? "LIVE" : (score.status === "Finished" ? "FINISHED" : "PENDING")}
                    </span>
                    <button 
                      onClick={(e) => {
                         e.stopPropagation();
                         if (score.league.toLowerCase().includes('wtt')) {
                           handleMatchClick(score);
                           window.scrollTo({ top: 0, behavior: 'smooth' });
                         } else {
                           window.open('https://polymarket.us', '_blank');
                         }
                      }}
                      className="mt-1 bg-slate-700/80 hover:bg-slate-600 px-2 py-0.5 rounded text-[8px] font-bold text-white flex items-center transition-colors"
                    >
                       {score.league.toLowerCase().includes('wtt') ? 'WATCH' : 'WATCH ON POLY'}
                    </button>
                  </div>
                </div>\`;

content = content.replace(oldBlock, newBlock);

// 4. Mock Schedule
const oldSchedule = \`  const [matchSchedule, setMatchSchedule] = useState<any[]>([
    { time: "10:00", table: "Table 1", players: "S. Yingsha vs M. Ito", category: "WS - R16" },
    { time: "10:45", table: "Table 2", players: "M. Long vs L. Yun-Ju", category: "MS - R16" },
    { time: "11:30", table: "Table 1", players: "Chen/Wang vs Shin/Jeon", category: "WD - QF" },
  ]);\`;

const newSchedule = \`  const [matchSchedule, setMatchSchedule] = useState<any[]>([
    { time: "10:00", table: "Table 1", players: "S. Yingsha vs M. Ito", category: "WS - R16", league: "WTT" },
    { time: "10:45", table: "Table 2", players: "M. Long vs L. Yun-Ju", category: "MS - R16", league: "WTT" },
    { time: "11:00", table: "Setka", players: "O. Melashenko vs H. Kulishov", category: "Men Singles", league: "Setka" },
    { time: "11:30", table: "Table 1", players: "Chen/Wang vs Shin/Jeon", category: "WD - QF", league: "WTT" },
    { time: "12:00", table: "Setka", players: "I. Szymanski vs P. Kurek", category: "Men Singles", league: "Setka" },
  ]);\`;

content = content.replace(oldSchedule, newSchedule);

// 5. Polymarket US
content = content.replace(/https:\/\/polymarket\.com/g, 'https://polymarket.us');

// 6. Upcoming Matches Filter
const oldUpcomingMap = \`                  {matchSchedule.map((match, idx) => (\`;
const newUpcomingMap = \`                  {matchSchedule.filter(m => {
                    if (globalFilter === "All") return true;
                    if (globalFilter === "WTT") return m.league === "WTT";
                    if (globalFilter === "Setka") return m.league === "Setka";
                    return true;
                  }).map((match, idx) => (\`;
content = content.replace(oldUpcomingMap, newUpcomingMap);

// 7. Move Stream Input URL to Sidebar (but keep Resync Live)
const streamControlsOld = \`              {/* Custom stream URL input */}
              <form onSubmit={handleCustomStream} className="flex gap-2">
                <input
                  type="text"
                  value={customStreamUrl}
                  onChange={(e) => setCustomStreamUrl(e.target.value)}
                  placeholder="Load a custom game stream URL (YouTube ID / M3U8)..."
                  className="text-xs px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg w-full text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-2 rounded-lg shrink-0 border border-slate-700 transition-colors"
                >
                  Load URL
                </button>
                <button
                  type="button"
                  onClick={handleSyncLive}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-2 rounded-lg shrink-0 border border-slate-700 transition-colors flex items-center"
                >
                  <Activity className="h-3 w-3 mr-1" /> Resync Live
                </button>
              </form>\`;

const streamControlsNew = \`              {/* Sync Live Button Only (Input moved to sidebar) */}
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={handleSyncLive}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-2 rounded-lg shrink-0 border border-slate-700 transition-colors flex items-center"
                >
                  <Activity className="h-3 w-3 mr-1" /> Resync Live
                </button>
              </div>\`;
content = content.replace(streamControlsOld, streamControlsNew);

// Insert the Custom URL input above Match Alerts
const matchAlertsOld = \`          {/* Trade Alerts */}
          <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-800 p-5 text-white shadow-md">\`;

const matchAlertsNew = \`          {/* Custom Stream Source Input */}
          <section className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-md">
            <h3 className="font-bold text-sm text-slate-100 flex items-center mb-2">
              <Tv className="h-4 w-4 mr-1 text-emerald-400" />
              Custom Stream Source
            </h3>
            <form onSubmit={handleCustomStream} className="flex gap-2">
              <input
                type="text"
                value={customStreamUrl}
                onChange={(e) => setCustomStreamUrl(e.target.value)}
                placeholder="YouTube ID / M3U8 URL..."
                className="text-xs px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg w-full text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold px-3 py-2 rounded-lg shrink-0 transition-colors"
              >
                Load
              </button>
            </form>
          </section>

          {/* Trade Alerts */}
          <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-800 p-5 text-white shadow-md">\`;
content = content.replace(matchAlertsOld, matchAlertsNew);

fs.writeFileSync(file, content);
