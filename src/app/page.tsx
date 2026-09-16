"use client";

import React, { useState, useEffect } from "react";
import { Bell, Search, PlayCircle, Trophy, Calendar, Filter, ChevronRight, Activity, TrendingUp } from "lucide-react";
import axios from "axios";

export default function Dashboard() {
  const [liveScores, setLiveScores] = useState<any[]>([]);
  const [matchSchedule, setMatchSchedule] = useState<any[]>([
    { time: "10:00", table: "Table 1", players: "S. Yingsha vs M. Ito", category: "WS - R16" },
    { time: "10:45", table: "Table 2", players: "M. Long vs L. Yun-Ju", category: "MS - R16" },
    { time: "11:30", table: "Table 1", players: "Chen/Wang vs Shin/Jeon", category: "WD - QF" },
  ]);
  const [youtubeVideo, setYoutubeVideo] = useState<any>(null);
  const [polymarketEvents, setPolymarketEvents] = useState<any[]>([]);

  // Fetch Live Data
  useEffect(() => {
    // 1. Fetch YouTube Live/Upcoming
    axios.get('/api/youtube?eventType=live')
      .then(res => {
        if (res.data.items && res.data.items.length > 0) {
          setYoutubeVideo(res.data.items[0]);
        }
      })
      .catch(err => console.log("YouTube API not configured or failed, using placeholder."));

    // 2. Fetch BetsAPI Matches
    axios.get('/api/betsapi')
      .then(res => {
        if (res.data.results && res.data.results.length > 0) {
          const mappedScores = res.data.results.slice(0, 10).map((ev: any) => {
             const setScores = ev.ss ? ev.ss.split('-') : ['0', '0'];
             return {
              id: ev.id,
              p1: ev.home?.name || "TBD",
              p2: ev.away?.name || "TBD",
              s1: setScores[0] || 0,
              s2: setScores[1] || 0,
              current: ev.scores && Object.keys(ev.scores).length > 0 
                ? `Current Set: ${Object.values(ev.scores).pop()?.home}-${Object.values(ev.scores).pop()?.away}`
                : ev.league?.name,
              status: ev.time_status === "1" ? 'Live' : (ev.time_status === "3" ? 'Finished' : 'Upcoming')
             };
          });
          setLiveScores(mappedScores);
        }
      })
      .catch(err => console.log("BetsAPI failed, using empty data for demo."));

    // 3. Fetch Polymarket Table Tennis Markets
    axios.get('https://gamma-api.polymarket.com/events?closed=false')
      .then(res => {
        const events = res.data || [];
        // Filter for any mention of table tennis, WTT, or ping pong
        const ttEvents = events.filter((e: any) => 
          e.title.toLowerCase().includes('table tennis') || 
          e.title.toLowerCase().includes('wtt') ||
          (e.description && e.description.toLowerCase().includes('table tennis'))
        );
        setPolymarketEvents(ttEvents);
      })
      .catch(err => console.log("Polymarket Gamma API failed."));
  }, []);

  // Set Interval to poll BetsAPI every 15 seconds (cheap enough for rate limits)
  useEffect(() => {
    const interval = setInterval(() => {
      axios.get('/api/betsapi')
        .then(res => {
          if (res.data.results) {
             const mappedScores = res.data.results.slice(0, 10).map((ev: any) => {
               const setScores = ev.ss ? ev.ss.split('-') : ['0', '0'];
               const currentSetObj: any = ev.scores && Object.keys(ev.scores).length > 0 ? Object.values(ev.scores).pop() : null;
               return {
                id: ev.id,
                p1: ev.home?.name || "TBD",
                p2: ev.away?.name || "TBD",
                s1: setScores[0] || 0,
                s2: setScores[1] || 0,
                current: currentSetObj ? `Points: ${currentSetObj.home}-${currentSetObj.away}` : ev.league?.name,
                status: ev.time_status === "1" ? 'Live' : (ev.time_status === "3" ? 'Finished' : 'Upcoming')
               };
            });
            setLiveScores(mappedScores);
          }
        })
        .catch(console.error);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const dailyResults = [
    { match: "Men's Singles QF", result: "F. Lebrun def. T. Moregard (3-1)" },
    { match: "Women's Singles QF", result: "S. Yingsha def. H. Hayata (3-0)" },
    { match: "Mixed Doubles SF", result: "Wang/Sun def. Lin/Chen (3-2)" },
  ];

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 font-sans">
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-blue-400" />
            <span className="font-bold text-xl tracking-tight">WTT Polymarket Terminal</span>
          </div>
          <div className="hidden md:flex space-x-6 text-sm font-medium">
            <a href="#" className="hover:text-blue-300 transition-colors">Terminal</a>
            <a href="#" className="hover:text-blue-300 transition-colors">Orderbook</a>
            <a href="#" className="hover:text-blue-300 transition-colors">Markets</a>
          </div>
        </div>
      </header>

      {/* BetsAPI Live Score Ticker */}
      <div className="bg-neutral-900 text-white border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center overflow-x-auto no-scrollbar space-x-6">
          <div className="flex items-center space-x-2 text-green-400 font-bold shrink-0 text-sm">
            <Activity className="h-4 w-4 animate-pulse" />
            <span>BETSAPI LIVE</span>
          </div>
          {liveScores.length === 0 && <span className="text-sm text-neutral-500 italic">Fetching live matches...</span>}
          {liveScores.map((score) => (
            <div key={score.id} className="flex items-center space-x-3 shrink-0 text-sm border-l border-neutral-700 pl-6">
              <div className="flex flex-col">
                <span className="font-medium text-white">{score.p1}</span>
                <span className="font-medium text-white">{score.p2}</span>
              </div>
              <div className="flex flex-col items-center justify-center font-bold text-lg px-2 text-green-400">
                <span>{score.s1}</span>
                <span>{score.s2}</span>
              </div>
              <div className="flex flex-col text-xs text-neutral-400 min-w-[80px]">
                <span className={score.status === "Live" ? "text-green-400 font-semibold animate-pulse" : ""}>{score.status}</span>
                <span>{score.current}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Layout */}
      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* YouTube/Video Embed */}
          <section className="bg-white rounded-xl shadow-sm overflow-hidden border border-neutral-200">
            <div className="bg-black aspect-video relative flex items-center justify-center">
              {youtubeVideo ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${youtubeVideo.id?.videoId}`}
                  title={youtubeVideo.snippet?.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="text-center text-white p-6">
                  <PlayCircle className="h-16 w-16 mx-auto mb-4 text-neutral-600 opacity-80" />
                  <h3 className="text-xl font-bold">Live Stream Player</h3>
                  <p className="text-neutral-400 mt-2">Paste Setka Cup stream URL or configure YouTube API Key</p>
                </div>
              )}
            </div>
            <div className="p-3 bg-neutral-50 flex items-center justify-between border-t border-neutral-200">
              <input type="text" placeholder="Custom Stream URL (Twitch, M3U8, YouTube)" className="text-sm px-3 py-2 border rounded-md w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors">
                Load Stream
              </button>
            </div>
          </section>

          {/* Polymarket Odds Panel */}
          <section className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
             <div className="p-4 border-b border-neutral-200 bg-blue-50 flex justify-between items-center">
              <h3 className="font-bold text-blue-900 flex items-center text-lg">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                Polymarket Live Odds
              </h3>
              <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full font-bold">GAMMA API</span>
            </div>
            <div className="p-6">
              {polymarketEvents.length > 0 ? (
                <div className="space-y-4">
                  {polymarketEvents.map((ev, i) => (
                    <div key={i} className="border p-4 rounded-lg flex justify-between items-center hover:bg-neutral-50 cursor-pointer">
                      <div>
                        <h4 className="font-bold">{ev.title}</h4>
                        <p className="text-sm text-neutral-500 mt-1">Volume: ${Number(ev.volume || 0).toLocaleString()}</p>
                      </div>
                      <button className="bg-blue-100 text-blue-700 font-bold px-4 py-2 rounded">View Market</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-neutral-500 font-medium">No active Table Tennis markets found on Polymarket.</p>
                  <p className="text-sm text-neutral-400 mt-2">Markets will appear here automatically when created.</p>
                </div>
              )}
            </div>
          </section>

          {/* Match Schedule */}
          <section className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-neutral-500" />
                <h2 className="font-bold text-lg">Upcoming Matches</h2>
              </div>
            </div>
            <div className="divide-y divide-neutral-100">
              {matchSchedule.map((match, idx) => (
                <div key={idx} className="p-4 hover:bg-neutral-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-center min-w-[60px]">
                      <div className="font-bold text-neutral-900">{match.time}</div>
                      <div className="text-xs text-neutral-500">{match.table}</div>
                    </div>
                    <div className="w-px h-10 bg-neutral-200 hidden sm:block"></div>
                    <div>
                      <div className="text-xs font-semibold text-blue-600 mb-0.5">{match.category}</div>
                      <div className="font-medium text-neutral-800">{match.players}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* Push Notification UI */}
          <section className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-start space-x-4 mb-4">
              <div className="bg-white/20 p-2 rounded-lg">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Trade Alerts</h3>
                <p className="text-blue-100 text-sm mt-1">Get instant push notifications when a match starts or odds shift dramatically.</p>
              </div>
            </div>
            <button className="w-full bg-white text-blue-800 font-bold py-2.5 rounded-lg shadow-sm hover:bg-neutral-100 transition-colors">
              Enable Push Notifications
            </button>
          </section>

          {/* Daily Results */}
          <section className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="p-4 border-b border-neutral-200 bg-neutral-50">
              <h3 className="font-bold text-neutral-800 flex items-center">
                <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                Recent Settlement Results
              </h3>
            </div>
            <div className="divide-y divide-neutral-100 p-2">
              {dailyResults.map((item, idx) => (
                <div key={idx} className="p-3">
                  <div className="text-xs text-neutral-500 mb-1">{item.match}</div>
                  <div className="font-medium text-sm text-neutral-900">{item.result}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
