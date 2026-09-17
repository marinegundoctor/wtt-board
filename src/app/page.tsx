"use client";

import React, { useState, useEffect } from "react";
import { Bell, PlayCircle, Calendar, Activity, TrendingUp, Tv, ExternalLink } from "lucide-react";
import axios from "axios";

export default function Dashboard() {
  const [liveScores, setLiveScores] = useState<any[]>([]);
  const [matchSchedule, setMatchSchedule] = useState<any[]>([
    { time: "10:00", table: "Table 1", players: "S. Yingsha vs M. Ito", category: "WS - R16" },
    { time: "10:45", table: "Table 2", players: "M. Long vs L. Yun-Ju", category: "MS - R16" },
    { time: "11:30", table: "Table 1", players: "Chen/Wang vs Shin/Jeon", category: "WD - QF" },
  ]);
  const [youtubeStreams, setYoutubeStreams] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [customStreamUrl, setCustomStreamUrl] = useState<string>("");
  const [polymarketEvents, setPolymarketEvents] = useState<any[]>([]);
  const [syncKey, setSyncKey] = useState<number>(0);

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

    // 2. Fetch Polymarket Table Tennis Markets
    axios.get('https://gamma-api.polymarket.com/events?closed=false')
      .then(res => {
        const events = res.data || [];
        const ttEvents = events.filter((e: any) => 
          e.title?.toLowerCase().includes('table tennis') || 
          e.title?.toLowerCase().includes('wtt') ||
          e.title?.toLowerCase().includes('setka') ||
          (e.description && e.description.toLowerCase().includes('table tennis'))
        );
        setPolymarketEvents(ttEvents);
      })
      .catch(() => console.log("Polymarket Gamma API unavailable"));
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
          <div className="flex items-center space-x-4 text-xs font-mono text-slate-400">
            <span>POLL: 15s</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
        </div>
      </header>

      {/* BetsAPI Live Score Ticker */}
      <div className="bg-slate-900/90 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center overflow-x-auto no-scrollbar space-x-6">
          <div className="flex items-center space-x-2 text-emerald-400 font-mono font-bold shrink-0 text-xs">
            <Activity className="h-4 w-4 animate-pulse" />
            <span>LIVE MATCHES ({liveScores.length})</span>
          </div>
          {liveScores.length === 0 && (
            <span className="text-xs text-slate-500 italic">No in-play table tennis matches at this second...</span>
          )}
          {liveScores.map((score) => (
            <div key={score.id} className="flex items-center space-x-3 shrink-0 text-xs bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-md">
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
                <span className="text-[10px] text-slate-500">{score.current}</span>
              </div>
            </div>
          ))}
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
                    <Tv className="h-3.5 w-3.5 mr-1 text-emerald-400" /> Live Tables Available:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {youtubeStreams.map((stream, idx) => {
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

              {/* Custom stream URL input */}
              <form onSubmit={handleCustomStream} className="flex gap-2">
                <input
                  type="text"
                  value={customStreamUrl}
                  onChange={(e) => setCustomStreamUrl(e.target.value)}
                  placeholder="Setka Cup / Custom stream URL or YouTube ID..."
                  className="text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg w-full text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg shrink-0 border border-slate-700 transition-colors"
                >
                  Load Stream
                </button>
                <button
                  type="button"
                  onClick={() => setSyncKey(prev => prev + 1)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold px-3 py-2 rounded-lg shrink-0 transition-colors flex items-center"
                  title="Force player to jump to the absolute live edge"
                >
                  <Activity className="h-3 w-3 mr-1 animate-pulse" /> Sync Live
                </button>
              </form>
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
                GAMMA API
              </span>
            </div>
            <div className="p-4">
              {polymarketEvents.length > 0 ? (
                <div className="space-y-3">
                  {polymarketEvents.map((ev, i) => (
                    <div key={i} className="border border-slate-800 p-3 rounded-lg flex justify-between items-center bg-slate-950 hover:border-slate-700 transition-colors">
                      <div>
                        <h4 className="font-semibold text-sm text-slate-100">{ev.title}</h4>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">Volume: ${Number(ev.volume || 0).toLocaleString()}</p>
                      </div>
                      <a
                        href={`https://polymarket.com/event/${ev.slug}`}
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
                  <p className="font-medium">No active Table Tennis markets listed on Polymarket right now.</p>
                  <p className="text-[11px] text-slate-600 mt-1">Markets will automatically populate here as they appear.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
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
              {matchSchedule.map((match, idx) => (
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
