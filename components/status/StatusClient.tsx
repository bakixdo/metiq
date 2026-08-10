'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  ArrowLeft, 
  Clock, 
  Zap, 
  Database, 
  Bot, 
  Compass, 
  History,
  Radar,
  Brain
} from 'lucide-react';
import { formatUtcDate, formatCurrency } from '@/lib/reports/formatter';

interface UptimeData {
  web: string;
  telegram: string;
  database: string;
  dexscreener: string;
  groq?: string;
}

interface HealthResponse {
  status: 'operational' | 'degraded' | 'outage';
  service: string;
  version: string;
  timestamp: string;
  executionTimeMs: number;
  uptime: UptimeData;
  latestScan: {
    status: string;
    completedAt: string;
    coinsScanned: number;
  };
}

interface ScanRecord {
  id: string;
  status: 'completed' | 'running' | 'failed';
  started_at: string;
  completed_at: string | null;
  coins_scanned: number;
}

interface StatusClientProps {
  initialScans: ScanRecord[];
}

export default function StatusClient({ initialScans }: StatusClientProps) {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [history, setHistory] = useState<ScanRecord[]>(initialScans);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHealth = async () => {
    setIsRefreshing(true);
    const start = Date.now();
    try {
      const res = await fetch('/api/health');
      const latency = Date.now() - start;

      if (!res.ok && res.status !== 503) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Update data
      setHealth(data);
      setError(null);
      setLastChecked(new Date());
    } catch (err: any) {
      console.error('Failed to fetch health status:', err);
      setError('Failed to query live API status. Service may be offline.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Poll status every 10 seconds
  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  // Status Indicator Styles Helper
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'operational':
        return {
          icon: <CheckCircle className="text-lime-text" size={18} />,
          text: 'Operational',
          bg: 'bg-lime/10 border-lime/30 text-lime',
          dot: 'bg-lime shadow-[0_0_10px_#C8FF00]',
        };
      case 'degraded':
        return {
          icon: <AlertTriangle className="text-amber-400" size={18} />,
          text: 'Degraded',
          bg: 'bg-amber-400/10 border-amber-400/30 text-amber-400',
          dot: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]',
        };
      case 'outage':
      default:
        return {
          icon: <XCircle className="text-rose-500" size={18} />,
          text: 'Outage',
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-500',
          dot: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]',
        };
    }
  };

  const overallStatus = health?.status || (error ? 'outage' : 'operational');
  const statusConfig = getStatusConfig(overallStatus);

  return (
    <div className="min-h-screen bg-background text-foreground radar-grid relative flex flex-col justify-between selection:bg-lime selection:text-black">
      
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-lime/20 to-transparent" />

      {/* Header */}
      <header className="border-b border-border-custom bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-mono text-muted-custom hover:text-lime-text transition-colors text-sm">
            <ArrowLeft size={16} /> BACK TO METIQ
          </Link>
          <span className="font-mono text-sm tracking-wider font-bold">SYSTEM STATUS</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-4xl mx-auto px-4 w-full py-12 flex flex-col gap-8">
        
        {/* Overall Status Banner */}
        <section className={`p-6 rounded border ${statusConfig.bg} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-500`}>
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${overallStatus === 'operational' ? 'bg-lime' : overallStatus === 'degraded' ? 'bg-amber-400' : 'bg-rose-500'}`}></span>
              <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${statusConfig.dot.split(' ')[0]}`}></span>
            </span>
            <div>
              <h1 className="text-xl font-bold font-mono tracking-tight">
                {overallStatus === 'operational' && 'ALL SYSTEMS OPERATIONAL'}
                {overallStatus === 'degraded' && 'SOME SERVICES DEGRADED'}
                {overallStatus === 'outage' && 'MAJOR SYSTEM OUTAGE'}
              </h1>
              <p className="text-xs opacity-75 mt-0.5">
                {overallStatus === 'operational' && 'METIQ systems are scanning and alerts are broadcasting normally.'}
                {overallStatus === 'degraded' && 'Scanners or Telegram API integration are experiencing high latencies.'}
                {overallStatus === 'outage' && 'Database connection issues or core services are down.'}
              </p>
            </div>
          </div>

          <button 
            onClick={fetchHealth} 
            disabled={isRefreshing}
            className="px-3.5 py-1.5 rounded border border-white/10 hover:border-lime bg-card-custom/50 hover:bg-card-custom text-xs font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'CHECKING...' : 'REFRESH NOW'}
          </button>
        </section>

        {/* Services Status Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Service: Web App */}
          <div className="p-5 rounded border border-border-custom bg-card-custom/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-zinc-800/50 flex items-center justify-center text-zinc-400">
                <Zap size={18} />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold">Scanning Engine</h3>
                <span className="text-[10px] text-muted-custom font-mono">Web server routes</span>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-lime-text">
              <span className="h-2 w-2 rounded-full bg-lime"></span>
              Operational
            </div>
          </div>

          {/* Service: Database */}
          <div className="p-5 rounded border border-border-custom bg-card-custom/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-zinc-800/50 flex items-center justify-center text-zinc-400">
                <Database size={18} />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold">Database Instance</h3>
                <span className="text-[10px] text-muted-custom font-mono">Supabase Postgres</span>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              {loading ? (
                <span className="text-muted-custom">Checking...</span>
              ) : (
                <>
                  <span className={`h-2 w-2 rounded-full ${health?.uptime.database === 'operational' ? 'bg-lime' : 'bg-rose-500'}`}></span>
                  <span className={health?.uptime.database === 'operational' ? 'text-lime-text' : 'text-rose-500'}>
                    {health?.uptime.database === 'operational' ? 'Operational' : 'Outage'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Service: Telegram Bot */}
          <div className="p-5 rounded border border-border-custom bg-card-custom/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-zinc-800/50 flex items-center justify-center text-zinc-400">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold">Telegram Bot API</h3>
                <span className="text-[10px] text-muted-custom font-mono">Webhook responder</span>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              {loading ? (
                <span className="text-muted-custom">Checking...</span>
              ) : (
                <>
                  <span className={`h-2 w-2 rounded-full ${health?.uptime.telegram === 'operational' ? 'bg-lime' : health?.uptime.telegram === 'degraded' ? 'bg-amber-400' : 'bg-rose-500'}`}></span>
                  <span className={health?.uptime.telegram === 'operational' ? 'text-lime-text' : health?.uptime.telegram === 'degraded' ? 'text-amber-400' : 'text-rose-500'}>
                    {health?.uptime.telegram === 'operational' ? 'Operational' : health?.uptime.telegram === 'degraded' ? 'Degraded' : 'Outage'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Service: DexScreener Collector */}
          <div className="p-5 rounded border border-border-custom bg-card-custom/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-zinc-800/50 flex items-center justify-center text-zinc-400">
                <Compass size={18} />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold">DexScreener API</h3>
                <span className="text-[10px] text-muted-custom font-mono">Discovery feeds</span>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              {loading ? (
                <span className="text-muted-custom">Checking...</span>
              ) : (
                <>
                  <span className={`h-2 w-2 rounded-full ${health?.uptime.dexscreener === 'operational' ? 'bg-lime' : health?.uptime.dexscreener === 'degraded' ? 'bg-amber-400' : 'bg-rose-500'}`}></span>
                  <span className={health?.uptime.dexscreener === 'operational' ? 'text-lime-text' : health?.uptime.dexscreener === 'degraded' ? 'text-amber-400' : 'text-rose-500'}>
                    {health?.uptime.dexscreener === 'operational' ? 'Operational' : health?.uptime.dexscreener === 'degraded' ? 'Degraded' : 'Outage'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Service: Grok AI Engine */}
          <div className="p-5 rounded border border-border-custom bg-card-custom/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-zinc-800/50 flex items-center justify-center text-zinc-400">
                <Brain size={18} />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold">Grok AI Engine</h3>
                <span className="text-[10px] text-muted-custom font-mono">Narrative analysis</span>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              {loading ? (
                <span className="text-muted-custom">Checking...</span>
              ) : (
                <>
                  <span className={`h-2 w-2 rounded-full ${
                    health?.uptime.groq === 'operational' ? 'bg-lime' : 
                    health?.uptime.groq === 'degraded' ? 'bg-amber-400' : 
                    health?.uptime.groq === 'unconfigured' ? 'bg-zinc-500' : 'bg-rose-500'
                  }`}></span>
                  <span className={
                    health?.uptime.groq === 'operational' ? 'text-lime-text' : 
                    health?.uptime.groq === 'degraded' ? 'text-amber-400' : 
                    health?.uptime.groq === 'unconfigured' ? 'text-zinc-500' : 'text-rose-500'
                  }>
                    {
                      health?.uptime.groq === 'operational' ? 'Operational' : 
                      health?.uptime.groq === 'degraded' ? 'Degraded' : 
                      health?.uptime.groq === 'unconfigured' ? 'Unconfigured' : 'Outage'
                    }
                  </span>
                </>
              )}
            </div>
          </div>

        </section>

        {/* Diagnostics & Performance Metrics */}
        <section className="p-5 rounded border border-border-custom bg-card-custom/20 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left font-mono">
          <div className="flex flex-col gap-1 border-b sm:border-b-0 sm:border-r border-border-custom/50 pb-4 sm:pb-0">
            <span className="text-[10px] text-muted-custom flex items-center gap-1.5"><Clock size={12} /> LAST CHECKED</span>
            <span className="text-sm font-bold">
              {lastChecked ? lastChecked.toLocaleTimeString() : 'Checking...'}
            </span>
          </div>

          <div className="flex flex-col gap-1 border-b sm:border-b-0 sm:border-r border-border-custom/50 pb-4 sm:pb-0 sm:pl-4">
            <span className="text-[10px] text-muted-custom flex items-center gap-1.5"><Zap size={12} /> API RESPONSE TIME</span>
            <span className="text-sm font-bold text-lime-text">
              {health ? `${health.executionTimeMs}ms` : 'Checking...'}
            </span>
          </div>

          <div className="flex flex-col gap-1 sm:pl-4">
            <span className="text-[10px] text-muted-custom flex items-center gap-1.5"><Radar size={12} /> LATEST MARKET SCAN</span>
            <span className="text-sm font-bold">
              {health?.latestScan.completedAt !== 'N/A' && health?.latestScan.completedAt 
                ? formatUtcDate(new Date(health.latestScan.completedAt))
                : 'No successful scans'}
            </span>
          </div>
        </section>

        {/* Scan History Section */}
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-mono font-bold flex items-center gap-2">
            <History size={16} className="text-lime-text" /> RECENT SCAN RECORDS
          </h2>

          <div className="rounded border border-border-custom bg-card-custom/25 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs md:text-sm font-mono">
                <thead>
                  <tr className="border-b border-border-custom bg-card-custom/50 text-muted-custom">
                    <th className="p-4">SCAN ID</th>
                    <th className="p-4">STATUS</th>
                    <th className="p-4">COMPLETED AT</th>
                    <th className="p-4">COINS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom text-zinc-300">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-custom italic">
                        No scan records found in database. Run a scan via the bot.
                      </td>
                    </tr>
                  ) : (
                    history.map((scan) => (
                      <tr key={scan.id} className="hover:bg-white/2">
                        <td className="p-4 font-bold text-[11px] text-zinc-500">
                          {scan.id.substring(0, 8)}...
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                            scan.status === 'completed' 
                              ? 'bg-lime-muted text-lime-text border border-lime/20' 
                              : scan.status === 'running'
                              ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                              : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          }`}>
                            {scan.status}
                          </span>
                        </td>
                        <td className="p-4 text-muted-custom">
                          {scan.completed_at ? formatUtcDate(new Date(scan.completed_at)) : 'N/A'}
                        </td>
                        <td className="p-4">
                          {scan.coins_scanned}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border-custom py-6 bg-card-custom/25 font-mono text-[10px] text-muted-custom text-center">
        <p>METIQ Crypto Meta Intelligence Status Monitor © 2026. Refresh rate is 10 seconds.</p>
      </footer>

    </div>
  );
}
