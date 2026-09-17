const fs = require('fs');
const file = 'src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add globalFilter state
content = content.replace(
  'const [syncStatus, setSyncStatus] = useState<"idle" | "synced">("idle");',
  'const [syncStatus, setSyncStatus] = useState<"idle" | "synced">("idle");\n  const [globalFilter, setGlobalFilter] = useState<"All" | "WTT" | "Setka">("All");'
);

// 2. Polymarket API fix
content = content.replace(
  "axios.get('https://gamma-api.polymarket.com/events?closed=false')",
  "axios.get('https://gamma-api.polymarket.com/events?closed=false&tag_slug=table-tennis&limit=100')"
);
content = content.replace(
  "e.title?.toLowerCase().includes('table tennis') ||",
  "true ||" // Since it's pre-filtered by tag, we don't strictly need to filter but let's keep it clean
);

// 3. API Polling label in Header + Global Filter buttons
const headerSearch = `<div className="flex items-center space-x-4 text-xs font-mono text-slate-400">
            <span>POLL: 15s</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
          </div>`;
const headerReplace = `<div className="flex items-center space-x-6">
            <div className="flex bg-slate-800 rounded-lg p-1 space-x-1">
              {(["All", "WTT", "Setka"] as const).map(f => (
                <button 
                  key={f} 
                  onClick={() => setGlobalFilter(f)} 
                  className={\`px-3 py-1 text-xs font-bold rounded-md transition-colors \${globalFilter === f ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-slate-200"}\`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
              <span>API Polling</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
          </div>`;
content = content.replace(headerSearch, headerReplace);

// 4. Live Score Ticker (Arrows, Click to Load Stream, WTT/Setka badge)
const tickerSearch = `{liveScores.map((score) => (
            <div key={score.id} className="flex items-center space-x-3 shrink-0 text-xs bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-md">`;

const tickerReplace = `<div className="flex items-center text-slate-500 font-bold px-2">&lt;</div>
          {liveScores.filter(score => {
             if (globalFilter === "All") return true;
             if (globalFilter === "WTT") return score.league.toLowerCase().includes("wtt");
             if (globalFilter === "Setka") return !score.league.toLowerCase().includes("wtt");
             return true;
          }).map((score) => (
            <div 
              key={score.id} 
              onClick={() => setCustomStreamUrl(\`\${score.p1} vs \${score.p2}\`)}
              className="flex flex-col shrink-0 bg-slate-800/60 hover:bg-slate-700/80 cursor-pointer transition-colors border border-slate-700/60 px-3 py-1.5 rounded-md"
              title="Click to load names into stream player"
            >
              <div className="flex justify-between items-center mb-1">
                <span className={\`text-[9px] font-bold px-1.5 py-0.5 rounded-sm \${score.league.toLowerCase().includes('wtt') ? 'bg-red-950 text-red-400 border border-red-800/50' : 'bg-blue-950 text-blue-400 border border-blue-800/50'}\`}>
                  {score.league.toLowerCase().includes('wtt') ? 'WTT' : 'SETKA'}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs">
`;

// Wait, if I replace the `div`, I need to make sure the closing tags match. 
// It's safer to just write the specific replacements.
