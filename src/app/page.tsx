"use client";

import React, { useState, useEffect } from "react";
import { Bell, PlayCircle, Calendar, Activity, TrendingUp, Tv, ExternalLink } from "lucide-react";
import axios from "axios";

export default function Dashboard() {
  const [liveScores, setLiveScores] = useState<any[]>([]);
  const [matchSchedule, setMatchSchedule] = useState<any[]>([
    { time: "10:00", table: "Table 1", players: "S. Yingsha vs M. Ito", category: "WS - R16", league: "WTT" },
    { time: "10:45", table: "Table 2", players: "M. Long vs L. Yun-Ju", category: "MS - R16", league: "WTT" },
    { time: "11:00", table: "Setka", players: "O. Melashenko vs H. Kulishov", category: "Men Singles", league: "Setka" },
    { time: "11:30", table: "Table 1", players: "Chen/Wang vs Shin/Jeon", category: "WD - QF", league: "WTT" },
    { time: "12:00", table: "Setka", players: "I. Szymanski vs P. Kurek", category: "Men Singles", league: "Setka" },
  ]);
  const [youtubeStreams, setYoutubeStreams] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [customStreamUrl, setCustomStreamUrl] = useState<string>("");

  const [syncKey, setSyncKey] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<"idle" | "synced">("idle");
  const [globalFilter, setGlobalFilter] = useState<"All" | "WTT" | "Setka">("All");

  // 1. Fetch YouTube Live Streams
  useEffect(() => {
    axios.get('/api/youtube?eventType=live')
      .then(res => {
        if (res.data.items && res.data.items.length > 0) {
          setYoutubeStreams(res.data.items);
          // Prefer Bangkok streams, otherwise fallback to first
          const bangkokStream = res.data.items.find((item: any) =>
            item.snippet?.title?.toLowerCase().includes('bangkok')
          );
          setSelectedVideo(bangkokStream || res.data.items[0]);
        }
      })
      .catch(() => console.log("YouTube API using placeholder"));

    // 2. Polymarket events are now derived directly from liveScores 
    // to bypass Gamma API unreliability.
  }, []);

  // 3. Polling BetsAPI for live scores
  const fetchBets = () => {
    axios.get('/api/betsapi')
      .then(res => {
        if (res.data.results && res.data.results.length > 0) {
          const mappedScores = res.data.results.map((ev: any) => {
            const setScores = ev.ss ? ev.ss.split('-') : ['0', '0'];
            const scoresObj = ev.scores ? (Object.values(ev.scores) as any[]) : [];
            const lastSet = scoresObj.length > 0 ? scoresObj[scoresObj.length - 1] : null;

            return {
              id: ev.id,
              league: ev.league?.name || "Table Tennis",
              p1: ev.home?.name || "Player 1",
              p2: ev.away?.name || "Player 2",
              s1: setScores[0] || '0',
              s2: setScores[1] || '0',
              sets: scoresObj,
              current: lastSet ? `Pts: ${lastSet.home ?? 0}-${lastSet.away ?? 0}` : (ev.league?.name || ''),
              status: ev.time_status === "1" ? 'Live' : (ev.time_status === "3" ? 'Finished' : 'Upcoming')
            };
          });
          setLiveScores(mappedScores);
        }
      })
      .catch(() => console.log("BetsAPI fetch failed"));
  };

  useEffect(() => {
    fetchBets();
    const interval = setInterval(fetchBets, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCustomStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStreamUrl) return;

    if (customStreamUrl.includes(' vs ') && !customStreamUrl.startsWith('http')) {
      alert("This is just the match name. Please paste a valid stream URL (YouTube / M3U8) to play.");
      return;
    }

    // Detect YouTube URL to extract videoId if needed
    let videoId = customStreamUrl;
    if (customStreamUrl.includes('v=')) {
      videoId = customStreamUrl.split('v=')[1]?.split('&')[0];
    } else if (customStreamUrl.includes('youtu.be/')) {
      videoId = customStreamUrl.split('youtu.be/')[1]?.split('?')[0];
    }

    setSelectedVideo({
      id: { videoId },
      snippet: { title: "Custom Stream Source" }
    });
  };

  const generatePolymarketUrl = (score: any) => {
    if (score.league.toLowerCase().includes('wtt')) {
      return `https://polymarket.us/markets?query=${encodeURIComponent(score.p1)}`;
    }
    const processName = (name: string) => {
      const parts = name.split(' ').map(p => p.trim()).filter(p => p.length > 0);
      if (parts.length >= 2) {
        const last = parts[0].toLowerCase().replace(/[^a-z]/g, '').substring(0, 3);
        const first = parts[1].toLowerCase().replace(/[^a-z]/g, '').substring(0, 3);
        return `${last}${first}`;
      }
      return name.toLowerCase().replace(/[^a-z]/g, '').substring(0, 6);
    };
    const p1code = processName(score.p1);
    const p2code = processName(score.p2);
    const d = new Date();
    const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    return `https://polymarket.us/sports/setka-cup-ukraine-men/setkameua-${p1code}-${p2code}-${dateStr}`;
  };

  const handleMatchClick = (score: any) => {
    // Attempt to match names
    const p1LastName = score.p1.split(' ').pop()?.toLowerCase() || "";
    const p2LastName = score.p2.split(' ').pop()?.toLowerCase() || "";
    const p1Full = score.p1.toLowerCase();
    const p2Full = score.p2.toLowerCase();
    
    const matchedStream = youtubeStreams.find(s => {
      const title = (s.snippet?.title || "").toLowerCase();
      return title.includes(p1LastName) || title.includes(p2LastName) || title.includes(p1Full) || title.includes(p2Full);
    });
    
    if (matchedStream) {
      setSelectedVideo(matchedStream);
    }
  };

  const handleSyncLive = () => {
    setSyncKey(prev => prev + 1);
    setSyncStatus("synced");
    setTimeout(() => {
      setSyncStatus("idle");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-1.5 rounded-lg text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white">WTT & Setka Terminal</span>
              <span className="ml-2 text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">BETSAPI CONNECTED</span>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex bg-slate-800 rounded-lg p-1 space-x-1">
              {(["All", "WTT", "Setka"] as const).map(f => (
                <button 
                  key={f} 
                  onClick={() => setGlobalFilter(f)} 
                  className={`px-3 py-1 text-[10px] uppercase font-bold rounded-md transition-colors ${globalFilter === f ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
              <span>API Polling</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
          </div>
        </div>
      </header>

      {/* BetsAPI Live Score Ticker */}
      <div className="bg-slate-900/90 border-b border-slate-800 sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-stretch space-x-2 h-20">
          <div className="flex items-center space-x-2 text-emerald-400 font-mono font-bold shrink-0 text-xs pr-4">
            <Activity className="h-4 w-4 animate-pulse" />
            <span>LIVE MATCHES ({liveScores.length})</span>
          </div>

          <button onClick={() => document.getElementById('ticker-scroll')?.scrollBy({left: -300, behavior: 'smooth'})} className="flex items-center justify-center px-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded font-black text-xl shrink-0 transition-colors">
            &lt;
          </button>

          <div id="ticker-scroll" className="flex items-center overflow-x-auto no-scrollbar space-x-4 flex-1 scroll-smooth">
            {liveScores.length === 0 && (
              <span className="text-xs text-slate-500 italic px-4">No in-play table tennis matches at this second...</span>
            )}
            {liveScores.filter(score => {
               if (globalFilter === "All") return true;
               if (globalFilter === "WTT") return score.league.toLowerCase().includes("wtt");
               if (globalFilter === "Setka") return !score.league.toLowerCase().includes("wtt");
               return true;
            }).map((score) => (
              <div 
                key={score.id} 
                className="flex flex-col shrink-0 text-xs bg-slate-800/60 hover:bg-slate-700/80 transition-colors border border-slate-700/60 px-3 py-1.5 rounded-md h-full justify-center"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded-sm ${score.league.toLowerCase().includes('wtt') ? 'bg-red-950 text-red-400 border border-red-800/50' : 'bg-blue-950 text-blue-400 border border-blue-800/50'}`}>
                    {score.league.toLowerCase().includes('wtt') ? 'WTT' : 'SETKA'}
                  </span>
                </div>
                <div className="flex items-center space-x-3 mt-1">
                  <div className="flex flex-col max-w-[130px]">
                    <span className="font-semibold text-white truncate">{score.p1}</span>
                    <span className="text-slate-400 truncate">{score.p2}</span>
                  </div>
                  
                  {/* Scores Area */}
                  <div className="flex items-center space-x-2 font-mono">
                    {/* Previous Sets */}
                    {score.sets && score.sets.slice(0, score.status === 'Live' ? -1 : undefined).map((s: any, idx: number) => {
                      const h = parseInt(s.home||'0'), a = parseInt(s.away||'0');
                      return (
                        <div key={idx} className="flex flex-col items-center text-slate-300 text-[11px]">
                          <span className={h > a ? 'font-bold underline' : ''}>{h}</span>
                          <span className={a > h ? 'font-bold underline' : ''}>{a}</span>
                        </div>
                      )
                    })}
                    
                    {/* Current Set / Live Score */}
                    {score.status === 'Live' && score.sets && score.sets.length > 0 && (() => {
                      const last = score.sets[score.sets.length - 1];
                      const h = parseInt(last.home||'0'), a = parseInt(last.away||'0');
                      return (
                        <div className="flex flex-col items-center text-sm ml-1">
                          <span className={`font-bold ${h > a ? 'text-emerald-400' : h < a ? 'text-red-400' : 'text-emerald-400'}`}>{h}</span>
                          <span className={`font-bold ${a > h ? 'text-emerald-400' : a < h ? 'text-red-400' : 'text-emerald-400'}`}>{a}</span>
                        </div>
                      )
                    })()}
                  </div>

                  <div className="flex flex-col items-end min-w-[50px]">
                    <span className={`text-[10px] uppercase font-bold ${score.status === "Live" ? "text-emerald-400" : "text-slate-500"}`}>
                      {score.status === "Live" ? "LIVE" : (score.status === "Finished" ? "FINISHED" : "PENDING")}
                    </span>
                    <button 
                      onClick={(e) => {
                         e.stopPropagation();
                         if (score.league.toLowerCase().includes('wtt')) {
                           handleMatchClick(score);
                           window.scrollTo({ top: 0, behavior: 'smooth' });
                         } else {
                           window.open(generatePolymarketUrl(score), '_blank');
                         }
                      }}
                      className="mt-1 bg-slate-700/80 hover:bg-slate-600 px-2 py-0.5 rounded text-[8px] font-bold text-white flex items-center transition-colors"
                    >
                       {score.league.toLowerCase().includes('wtt') ? 'WATCH' : 'WATCH ON POLY'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => document.getElementById('ticker-scroll')?.scrollBy({left: 300, behavior: 'smooth'})} className="flex items-center justify-center px-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded font-black text-xl shrink-0 transition-colors">
            &gt;
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Stream Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Video Player */}
          <section className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-xl">
            <div className="bg-black aspect-video relative flex items-center justify-center">
              {selectedVideo?.id?.videoId ? (
                <iframe
                  key={syncKey}
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${selectedVideo.id.videoId}?autoplay=1&mute=1`}
                  title={selectedVideo.snippet?.title || "Live Stream"}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="text-center text-slate-300 p-6">
                  <PlayCircle className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                  <h3 className="text-lg font-bold">No Stream Selected</h3>
                  <p className="text-slate-500 text-xs mt-1">Select a live table below or paste a stream link</p>
                </div>
              )}
            </div>

            {/* Table Selector & Stream Switcher */}
            <div className="p-3 bg-slate-900/90 border-t border-slate-800 space-y-3">
              {youtubeStreams.length > 0 && (
                <div>
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 flex items-center">
                    <Tv className="h-3.5 w-3.5 mr-1 text-emerald-400" /> Live Tables Available {globalFilter === "WTT" ? "in WTT" : globalFilter === "Setka" ? "in Setka" : ""}:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {youtubeStreams.filter(stream => {
                      if (globalFilter === "All") return true;
                      if (globalFilter === "Setka") return false; // We only pull WTT streams currently
                      if (globalFilter === "WTT") return true;
                      return true;
                    }).map((stream, idx) => {
                      const isSelected = selectedVideo?.id?.videoId === stream.id?.videoId;
                      const title = stream.snippet?.title || `Feed #${idx + 1}`;
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedVideo(stream)}
                          className={`text-xs px-2.5 py-1 rounded font-medium transition-all ${
                            isSelected
                              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {title.length > 35 ? title.substring(0, 35) + '...' : title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sync Live Button Only (Input moved to sidebar) */}
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={handleSyncLive}
                  className={`text-xs font-bold px-3 py-2 rounded-lg shrink-0 transition-colors flex items-center ${
                    syncStatus === "synced" 
                      ? "bg-emerald-600 text-slate-950 border border-emerald-500" 
                      : "bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600"
                  }`}
                  title="Force player to jump to the absolute live edge"
                >
                  <Activity className={`h-3 w-3 mr-1 ${syncStatus === "synced" ? "animate-pulse" : ""}`} /> 
                  {syncStatus === "synced" ? "Live Feed Synced" : "Resync Live"}
                </button>
              </div>
              
              {/* YouTube Live Indicator Explanation */}
              <div className="text-[10px] text-slate-500 mt-2 flex items-center bg-slate-950/50 p-2 rounded border border-slate-800/50">
                <span className="h-2 w-2 rounded-full bg-red-600 mr-2 flex-shrink-0 animate-pulse"></span>
                <p>
                  <strong>YouTube Tip:</strong> If you pause the video, you will fall behind real-time play. You can also click the red <strong>"Live"</strong> text inside the YouTube player controls to instantly snap back to the live edge.
                </p>
              </div>
            </div>
          </section>

          {/* Polymarket Odds Panel */}
          <section className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="p-3.5 border-b border-slate-800 bg-slate-900/80 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center text-sm">
                <TrendingUp className="h-4 w-4 mr-2 text-indigo-400" />
                Polymarket Live Odds
              </h3>
              <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/80 px-2 py-0.5 rounded">
                BETSAPI SYNC
              </span>
            </div>
            <div className="p-4">
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
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">
                          {score.league} <span className="mx-1">&bull;</span> {score.status === 'Live' ? 'In Play' : score.status}
                        </p>
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
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs">
                  <p className="font-medium">No active Table Tennis markets matched right now.</p>
                  <p className="text-[11px] text-slate-600 mt-1">Markets will automatically populate here as they appear.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* Custom Stream Source Input */}
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
          <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-800 p-5 text-white shadow-md">
            <div className="flex items-start space-x-3 mb-3">
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-lg text-emerald-400">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Match & Price Alerts</h3>
                <p className="text-slate-400 text-xs mt-0.5">Desktop push alerts when sessions start.</p>
              </div>
            </div>
            <button
              onClick={() => {
                if ("Notification" in window) {
                  Notification.requestPermission().then(p => alert(`Notifications: ${p}`));
                }
              }}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-lg text-xs transition-colors"
            >
              Enable Browser Alerts
            </button>
          </section>

          {/* Schedule */}
          <section className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-3.5 border-b border-slate-800 bg-slate-900/80 flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <h2 className="font-bold text-sm text-white">Upcoming Matches</h2>
            </div>
            <div className="divide-y divide-slate-800/60">
                  {matchSchedule.filter(m => {
                    if (globalFilter === "All") return true;
                    if (globalFilter === "WTT") return m.league === "WTT";
                    if (globalFilter === "Setka") return m.league === "Setka";
                    return true;
                  }).map((match, idx) => (
                <div key={idx} className="p-3 hover:bg-slate-800/40 transition-colors flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="text-center font-mono">
                      <div className="font-bold text-slate-200">{match.time}</div>
                      <div className="text-[10px] text-slate-500">{match.table}</div>
                    </div>
                    <div className="w-px h-6 bg-slate-800"></div>
                    <div>
                      <div className="text-[10px] font-semibold text-emerald-400">{match.category}</div>
                      <div className="font-medium text-slate-300">{match.players}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
