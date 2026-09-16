"use client";

import React, { useState, useEffect } from "react";
import { Bell, Search, PlayCircle, Trophy, Calendar, Filter, ChevronRight, Activity } from "lucide-react";
import axios from "axios";

export default function Dashboard() {
  const [liveScores, setLiveScores] = useState<any[]>([
    { id: 1, p1: "Lin Shidong", p2: "Tomokazu Harimoto", s1: 2, s2: 1, current: "11-9, 8-11, 11-5, 4-2", status: "Live" },
    { id: 2, p1: "Felix Lebrun", p2: "Hugo Calderano", s1: 0, s2: 0, current: "5-7", status: "Live" },
    { id: 3, p1: "Wang Chuqin", p2: "Dang Qiu", s1: 3, s2: 0, current: "11-4, 11-8, 11-6", status: "Finished" },
  ]);

  const [matchSchedule, setMatchSchedule] = useState<any[]>([
    { time: "10:00", table: "Table 1", players: "S. Yingsha vs M. Ito", category: "WS - R16" },
    { time: "10:45", table: "Table 2", players: "M. Long vs L. Yun-Ju", category: "MS - R16" },
    { time: "11:30", table: "Table 1", players: "Chen/Wang vs Shin/Jeon", category: "WD - QF" },
  ]);

  const [youtubeVideo, setYoutubeVideo] = useState<any>(null);

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

    // 2. Fetch Sofascore Matches
    axios.get('/api/sofascore')
      .then(res => {
        if (res.data.events && res.data.events.length > 0) {
          // Map Sofascore events to our ticker/schedule format
          const mappedScores = res.data.events.slice(0, 5).map((ev: any) => ({
            id: ev.id,
            p1: ev.homeTeam?.name || "TBD",
            p2: ev.awayTeam?.name || "TBD",
            s1: ev.homeScore?.display || 0,
            s2: ev.awayScore?.display || 0,
            current: ev.status?.description,
            status: ev.status?.type === 'inprogress' ? 'Live' : 'Finished'
          }));
          setLiveScores(mappedScores);
        }
      })
      .catch(err => console.log("Sofascore API blocked or failed, using mock data for demo."));
  }, []);

  const dailyResults = [
    { match: "Men's Singles QF", result: "F. Lebrun def. T. Moregard (3-1)" },
    { match: "Women's Singles QF", result: "S. Yingsha def. H. Hayata (3-0)" },
    { match: "Mixed Doubles SF", result: "Wang/Sun def. Lin/Chen (3-2)" },
  ];

  const upcomingBroadcasts = [
    { time: "18:00 (Local)", event: "Men's Singles Semi-Finals" },
    { time: "19:30 (Local)", event: "Women's Singles Semi-Finals" },
    { time: "21:00 (Local)", event: "Mixed Doubles Final" },
  ];

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 font-sans">
      {/* Header */}
      <header className="bg-red-700 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="h-6 w-6" />
            <span className="font-bold text-xl tracking-tight">WTT Feeder Bangkok 2026</span>
          </div>
          <div className="hidden md:flex space-x-6 text-sm font-medium">
            <a href="#" className="hover:text-red-200 transition-colors">Home</a>
            <a href="#" className="hover:text-red-200 transition-colors">Draws</a>
            <a href="#" className="hover:text-red-200 transition-colors">Players</a>
            <a href="#" className="hover:text-red-200 transition-colors">News</a>
          </div>
        </div>
      </header>

      {/* Live Score Ticker */}
      <div className="bg-neutral-900 text-white border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center overflow-x-auto no-scrollbar space-x-6">
          <div className="flex items-center space-x-2 text-red-500 font-bold shrink-0 text-sm">
            <Activity className="h-4 w-4 animate-pulse" />
            <span>SOFASCORE LIVE</span>
          </div>
          {liveScores.map((score) => (
            <div key={score.id} className="flex items-center space-x-3 shrink-0 text-sm border-l border-neutral-700 pl-6">
              <div className="flex flex-col">
                <span className="font-medium">{score.p1}</span>
                <span className="font-medium text-neutral-400">{score.p2}</span>
              </div>
              <div className="flex flex-col items-center justify-center font-bold text-lg px-2 text-red-400">
                <span>{score.s1}</span>
                <span>{score.s2}</span>
              </div>
              <div className="flex flex-col text-xs text-neutral-400 min-w-[80px]">
                <span className={score.status === "Live" ? "text-red-500 font-semibold" : ""}>{score.status}</span>
                <span>{score.current}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Layout */}
      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* YouTube Embed */}
          <section className="bg-white rounded-xl shadow-sm overflow-hidden border border-neutral-200">
            <div className="bg-neutral-900 aspect-video relative flex items-center justify-center">
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
                  <PlayCircle className="h-16 w-16 mx-auto mb-4 text-red-600 opacity-80" />
                  <h3 className="text-xl font-bold">WTT Feeder Bangkok 2026 - Table 1 LIVE</h3>
                  <p className="text-neutral-400 mt-2">Stream will begin shortly (or configure YouTube API Key).</p>
                </div>
              )}
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg">{youtubeVideo ? youtubeVideo.snippet?.title : "Table 1 - Session 1"}</h2>
                <p className="text-sm text-neutral-500">Live coverage of Men's & Women's Singles Quarterfinals</p>
              </div>
              <a 
                href={youtubeVideo ? `https://youtube.com/watch?v=${youtubeVideo.id?.videoId}` : "#"}
                target="_blank" rel="noopener noreferrer"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors block"
              >
                Watch on YouTube
              </a>
            </div>
          </section>

          {/* Match Schedule Filter Component */}
          <section className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-neutral-500" />
                <h2 className="font-bold text-lg">Match Schedule</h2>
              </div>
              <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                <button className="px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm font-medium border border-red-200 whitespace-nowrap">All Matches</button>
                <button className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full text-sm font-medium whitespace-nowrap transition-colors">Men's Singles</button>
                <button className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full text-sm font-medium whitespace-nowrap transition-colors">Women's Singles</button>
                <button className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full text-sm font-medium whitespace-nowrap transition-colors">Doubles</button>
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
                      <div className="text-xs font-semibold text-red-600 mb-0.5">{match.category}</div>
                      <div className="font-medium text-neutral-800">{match.players}</div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-neutral-400" />
                </div>
              ))}
            </div>
            <div className="p-3 bg-neutral-50 text-center border-t border-neutral-200">
              <button className="text-sm font-medium text-red-600 hover:text-red-800">View Full Schedule</button>
            </div>
          </section>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* Push Notification UI */}
          <section className="bg-gradient-to-br from-red-600 to-red-800 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-start space-x-4 mb-4">
              <div className="bg-white/20 p-2 rounded-lg">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Never Miss a Match</h3>
                <p className="text-red-100 text-sm mt-1">Get instant alerts when your favorite players step to the table.</p>
              </div>
            </div>
            <button className="w-full bg-white text-red-700 font-bold py-2.5 rounded-lg shadow-sm hover:bg-neutral-100 transition-colors">
              Enable Push Notifications
            </button>
          </section>

          {/* Daily Results */}
          <section className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="p-4 border-b border-neutral-200 bg-neutral-50">
              <h3 className="font-bold text-neutral-800 flex items-center">
                <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                Daily Results
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

          {/* Upcoming Broadcasts */}
          <section className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="p-4 border-b border-neutral-200 bg-neutral-50">
              <h3 className="font-bold text-neutral-800 flex items-center">
                <PlayCircle className="h-4 w-4 mr-2 text-red-500" />
                Upcoming Broadcasts
              </h3>
            </div>
            <div className="p-2 space-y-1">
              {upcomingBroadcasts.map((item, idx) => (
                <div key={idx} className="flex items-start p-3 hover:bg-neutral-50 rounded-lg transition-colors">
                  <div className="bg-neutral-100 text-neutral-600 text-xs font-bold px-2 py-1 rounded mr-3 shrink-0 mt-0.5">
                    {item.time}
                  </div>
                  <div className="text-sm font-medium text-neutral-800">
                    {item.event}
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
