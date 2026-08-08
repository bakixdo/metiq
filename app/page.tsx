import Link from 'next/link';
import { 
  Radar, 
  Zap, 
  TrendingUp, 
  Bot, 
  Layers, 
  Terminal, 
  ShieldAlert, 
  Activity,
  ArrowRight,
  Database,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function LandingPage() {
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'MetiqBot';
  const telegramUrl = `https://t.me/${botUsername}`;

  return (
    <div className="min-h-screen bg-background text-foreground radar-grid radar-sweep relative flex flex-col justify-between selection:bg-lime selection:text-black">
      
      {/* Decorative top grid line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-lime/20 to-transparent" />

      {/* Header Navigation */}
      <header className="border-b border-border-custom bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-mono tracking-wider text-xl font-bold group">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-lime"></span>
            </span>
            METIQ
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-mono text-muted-custom">
            <a href="#how-it-works" className="hover:text-lime transition-colors">How It Works</a>
            <a href="#metrics" className="hover:text-lime transition-colors">Scoring Model</a>
            <a href="#commands" className="hover:text-lime transition-colors">Commands</a>
            <Link href="/status" className="hover:text-lime transition-colors">System Status</Link>
          </nav>

          <div className="flex items-center gap-4">
            <a 
              id="nav-telegram-btn"
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer" 
              className="px-4 py-1.5 rounded border border-lime text-lime hover:bg-lime hover:text-black font-mono text-xs tracking-wider transition-all duration-300 flex items-center gap-1.5"
            >
              OPEN TELEGRAM <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-6xl mx-auto px-4 w-full py-12 md:py-20 flex flex-col gap-24">
        
        {/* Hero Section */}
        <section className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8 justify-between">
          <div className="flex-1 flex flex-col gap-6 text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-lime/30 bg-lime-muted/50 text-lime font-mono text-xs w-fit">
              <Radar size={14} className="animate-spin-slow" />
              CRYPTO META INTELLIGENCE
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Detect emerging crypto narratives before they become <span className="text-lime">obvious</span>.
            </h1>
            
            <p className="text-lg text-muted-custom leading-relaxed">
              Automatic crypto meta reports every six hours, scanned from decentralized markets and delivered directly to Telegram. Request manual scans on-demand.
            </p>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-4">
              <a 
                id="cta-telegram"
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3.5 rounded bg-lime hover:bg-lime-hover text-black font-mono text-sm font-semibold tracking-wider text-center glow-hover transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Bot size={16} /> LAUNCH TELEGRAM BOT
              </a>
              <Link 
                id="cta-status"
                href="/status"
                className="px-8 py-3.5 rounded border border-border-custom bg-card-custom/50 hover:border-lime text-foreground hover:text-lime font-mono text-sm tracking-wider text-center transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Activity size={16} /> VIEW LIVE STATUS
              </Link>
            </div>
          </div>

          {/* Example Telegram Report Card */}
          <div className="flex-1 w-full max-w-md relative">
            <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-lime/20 to-transparent blur opacity-50" />
            <div className="relative rounded-lg border border-border-custom bg-card-custom/80 overflow-hidden shadow-2xl">
              
              {/* Telegram Window Header */}
              <div className="bg-background px-4 py-3 border-b border-border-custom flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-lime/10 flex items-center justify-center text-lime font-mono font-bold text-xs">
                    MQ
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs leading-none">METIQ Bot</h3>
                    <span className="text-[10px] text-muted-custom">bot</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[9px] font-mono rounded bg-white/5 text-muted-custom">STATIC PREVIEW (EXAMPLE)</span>
              </div>

              {/* Chat Bubble Message */}
              <div className="p-4 flex flex-col gap-3 font-mono text-xs text-zinc-300 leading-normal max-h-[360px] overflow-y-auto">
                <div className="bg-background/60 p-3 rounded border border-white/5">
                  <p><b>METIQ - 6H META REPORT</b></p>
                  <p>Updated: 8 Aug 2026, 12:00 UTC</p>
                  <p>Coins scanned: 126</p>
                  <br />
                  <p><b>1. AI Compute - 84/100 ↑</b></p>
                  <p>Stage: Accelerating</p>
                  <p>6H Volume: $4.82M</p>
                  <p>Liquidity: $1.21M</p>
                  <p>Active Coins: 12</p>
                  <p>Leaders: $AAA · $BBB · $CCC</p>
                  <p>Signal: Volume and market breadth are increasing.</p>
                  <br />
                  <p><b>2. Stock Memes - 76/100 ↑</b></p>
                  <p>Stage: Emerging</p>
                  <p>6H Volume: $2.14M</p>
                  <p>Liquidity: $780K</p>
                  <p>Active Coins: 9</p>
                  <p>Leaders: $DDD · $EEE</p>
                  <p>Warning: Narrative currently depends heavily on two coins.</p>
                  <br />
                  <p>Data source: DexScreener (OK)</p>
                  <p>Request fresh scan: /meta</p>
                  <br />
                  <p><i>Informational signals, not financial advice.</i></p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="border-t border-border-custom/50 pt-16 flex flex-col gap-12">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-3">
            <h2 className="text-2xl md:text-3xl font-mono font-bold tracking-tight">HOW IT WORKS</h2>
            <p className="text-sm text-muted-custom">Four step intelligence model that runs autonomously every six hours.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded border border-border-custom bg-card-custom/20 flex flex-col gap-4">
              <div className="w-10 h-10 rounded bg-lime-muted flex items-center justify-center text-lime">
                <Radar size={20} />
              </div>
              <h3 className="font-mono text-sm font-bold">1. SCAN</h3>
              <p className="text-xs text-muted-custom leading-relaxed">
                Gathers token boosts and profile activity across multiple blockchains including Solana, Base, Ethereum, and Arbitrum.
              </p>
            </div>

            <div className="p-6 rounded border border-border-custom bg-card-custom/20 flex flex-col gap-4">
              <div className="w-10 h-10 rounded bg-lime-muted flex items-center justify-center text-lime">
                <Layers size={20} />
              </div>
              <h3 className="font-mono text-sm font-bold">2. CLUSTER</h3>
              <p className="text-xs text-muted-custom leading-relaxed">
                Applies explainable, weighted keyword matching logic to filter and group candidates into narrative pools.
              </p>
            </div>

            <div className="p-6 rounded border border-border-custom bg-card-custom/20 flex flex-col gap-4">
              <div className="w-10 h-10 rounded bg-lime-muted flex items-center justify-center text-lime">
                <TrendingUp size={20} />
              </div>
              <h3 className="font-mono text-sm font-bold">3. SCORE</h3>
              <p className="text-xs text-muted-custom leading-relaxed">
                Rates each narrative from 0 to 100 using volumes, market breadth, transaction counts, price acceleration, and penalties.
              </p>
            </div>

            <div className="p-6 rounded border border-border-custom bg-card-custom/20 flex flex-col gap-4">
              <div className="w-10 h-10 rounded bg-lime-muted flex items-center justify-center text-lime">
                <Bot size={20} />
              </div>
              <h3 className="font-mono text-sm font-bold">4. ALERT</h3>
              <p className="text-xs text-muted-custom leading-relaxed">
                Caches report snapshots and pushes the top-ranked summaries directly to Telegram subscribers and chats.
              </p>
            </div>
          </div>
        </section>

        {/* Metrics/Scoring Model Section */}
        <section id="metrics" className="border-t border-border-custom/50 pt-16 flex flex-col gap-12">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="flex-1 flex flex-col gap-6">
              <h2 className="text-2xl md:text-3xl font-mono font-bold tracking-tight">THE SCORING FORMULA</h2>
              <p className="text-sm text-muted-custom leading-relaxed">
                Unlike complex black-box AI tools, METIQ calculates narrative ratings using an explainable mathematical formula based purely on verified market actions.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-lime/10 flex items-center justify-center text-lime font-mono text-xs font-bold shrink-0 mt-0.5">25</div>
                  <div>
                    <h4 className="text-sm font-bold font-mono">6H Market Volume</h4>
                    <p className="text-xs text-muted-custom">Logarithmic scaling tracking absolute volume transacted in the last six hours.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-lime/10 flex items-center justify-center text-lime font-mono text-xs font-bold shrink-0 mt-0.5">20</div>
                  <div>
                    <h4 className="text-sm font-bold font-mono">Narrative Breadth</h4>
                    <p className="text-xs text-muted-custom">Reward distribution based on the number of independently active tokens belonging to the narrative.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-lime/10 flex items-center justify-center text-lime font-mono text-xs font-bold shrink-0 mt-0.5">15</div>
                  <div>
                    <h4 className="text-sm font-bold font-mono">Liquidity Quality & Momentum</h4>
                    <p className="text-xs text-muted-custom">Evaluation of pool liquidity depth (15 points) and 6H transaction buys/sells (15 points).</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-lime/10 flex items-center justify-center text-lime font-mono text-xs font-bold shrink-0 mt-0.5">10</div>
                  <div>
                    <h4 className="text-sm font-bold font-mono">Launches & Price Acceleration</h4>
                    <p className="text-xs text-muted-custom">Detection of fresh token launches (10 points) and rate of short-term volume/price acceleration (10 points).</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full p-6 rounded border border-border-custom bg-card-custom/30 flex flex-col gap-6">
              <h3 className="font-mono text-sm font-bold flex items-center gap-2">
                <ShieldAlert size={16} className="text-lime" /> AUTOMATIC DAMPENING & PENALTIES
              </h3>
              <p className="text-xs text-zinc-400">
                To prevent manipulative wash-trading, paid campaigns, or pump-and-dump loops from gaming the system, we apply strict dynamic score dampeners:
              </p>
              
              <ul className="space-y-3 text-xs">
                <li className="flex items-center gap-2.5 border-b border-border-custom pb-2.5">
                  <span className="text-lime font-bold font-mono shrink-0">-15 PTS</span>
                  <span className="text-muted-custom"><b>Single Token Concentration:</b> Deducted if a single token controls &gt;75% of narrative volume.</span>
                </li>
                <li className="flex items-center gap-2.5 border-b border-border-custom pb-2.5">
                  <span className="text-lime font-bold font-mono shrink-0">-20 PTS</span>
                  <span className="text-muted-custom"><b>Extreme Low Liquidity:</b> Deducted if combined narrative pool depth is below $10,000 USD.</span>
                </li>
                <li className="flex items-center gap-2.5 border-b border-border-custom pb-2.5">
                  <span className="text-lime font-bold font-mono shrink-0">-15 PTS</span>
                  <span className="text-muted-custom"><b>Volume Disproportions:</b> Applied if volume exceeds pool liquidity by 5x (wash trade warning).</span>
                </li>
                <li className="flex items-center gap-2.5 border-b border-border-custom pb-2.5">
                  <span className="text-lime font-bold font-mono shrink-0">-10 PTS</span>
                  <span className="text-muted-custom"><b>Low Activity:</b> Triggered if total narrative transaction count is below 100.</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-lime font-bold font-mono shrink-0">WARNING</span>
                  <span className="text-muted-custom"><b>Boost Saturated:</b> Highlights if narrative consists of &gt;80% promoted tokens.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Telegram Commands Section */}
        <section id="commands" className="border-t border-border-custom/50 pt-16 flex flex-col gap-12">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-3">
            <h2 className="text-2xl md:text-3xl font-mono font-bold tracking-tight">TELEGRAM COMMANDS</h2>
            <p className="text-sm text-muted-custom">Control the intelligence engine directly using standard bot triggers.</p>
          </div>

          <div className="rounded border border-border-custom bg-card-custom/25 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-border-custom bg-card-custom/50 font-mono text-lime">
                    <th className="p-4 font-bold">COMMAND</th>
                    <th className="p-4 font-bold">FUNCTION</th>
                    <th className="p-4 font-bold">FLOW / TIMING</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom font-mono text-zinc-300">
                  <tr>
                    <td className="p-4 font-bold">/start</td>
                    <td className="p-4">Register chat ID and initiate 6H automatic reports.</td>
                    <td className="p-4 text-muted-custom">Instant / Auto-subscribe</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold">/meta</td>
                    <td className="p-4">Perform a fresh on-demand market scan.</td>
                    <td className="p-4 text-muted-custom">Subject to 120s cooldown</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold">/latest</td>
                    <td className="p-4">Return the last cached report immediately.</td>
                    <td className="p-4 text-muted-custom">No cooldown limit</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold">/subscribe</td>
                    <td className="p-4">Re-enable automatic 6-hour reports for this chat.</td>
                    <td className="p-4 text-muted-custom">Scheduled broadcast</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold">/unsubscribe</td>
                    <td className="p-4">Stop scheduled alerts while preserving manual triggers.</td>
                    <td className="p-4 text-muted-custom">Alert pause</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold">/status</td>
                    <td className="p-4">Check bot, database, subscriber totals, and schedule info.</td>
                    <td className="p-4 text-muted-custom">Public diagnostics</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border-custom bg-card-custom/30 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col text-left gap-1">
            <span className="font-mono text-sm font-bold tracking-wider">METIQ</span>
            <span className="text-[10px] text-muted-custom">Crypto Meta Intelligence © 2026.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-mono text-xs text-muted-custom">
            <Link href="/status" className="hover:text-lime transition-colors">Live Status</Link>
            <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-lime transition-colors">Telegram</a>
            <Link href="/api/health" className="hover:text-lime transition-colors">API Health</Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 mt-6 border-t border-border-custom/50 pt-6">
          <p className="text-[10px] text-muted-custom/75 leading-relaxed text-center">
            Disclaimer: METIQ is an informational analytics tool. None of the signals, scores, or reports generated constitute financial, investment, or trading advice. Cryptocurrencies represent highly volatile and high-risk speculative vehicles.
          </p>
        </div>
      </footer>

    </div>
  );
}
