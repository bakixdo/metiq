'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  Radar, 
  Zap, 
  TrendingUp, 
  Bot, 
  Layers, 
  Terminal, 
  Activity,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Send,
  Sparkles,
  Search,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface BotProfile {
  first_name: string;
  username: string;
  photoUrl: string;
}

interface Message {
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  buttons?: string[];
}

export default function LandingClient({ 
  botProfile, 
  telegramUrl 
}: { 
  botProfile: BotProfile | null; 
  telegramUrl: string;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: `<b>Welcome to METIQ - Crypto Meta Intelligence</b>\n\nDetect emerging crypto narratives before they become obvious.\nMETIQ automatically scans decentralized markets every six hours and delivers reports directly to you.\n\n<i>Your chat is now subscribed to the automatic six-hour reports.</i>`,
      timestamp: '12:00 PM',
      buttons: ['🔍 Scan Meta', '📊 Latest Report', '🔔 Alerts Info', '❓ Help']
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // FAQ Accordion State
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({
    0: true, // First one open by default
  });

  const toggleFaq = (index: number) => {
    setFaqOpen(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const formatTime = () => {
    const d = new Date();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const handleCommandResponse = (command: string) => {
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      let replyText = '';
      let buttons: string[] = ['🔍 Scan Meta', '📊 Latest Report', '🔔 Alerts Info', '❓ Help'];

      const cmd = command.toLowerCase().trim();

      if (cmd === '/start') {
        replyText = `<b>Welcome to METIQ - Crypto Meta Intelligence</b>\n\nDetect emerging crypto narratives before they become obvious.\nMETIQ automatically scans decentralized markets every six hours and delivers reports directly to you.\n\n<i>Your chat is now subscribed to the automatic six-hour reports.</i>`;
      } else if (cmd === '/meta' || cmd === '🔍 scan meta') {
        replyText = `<b>METIQ - 6H META REPORT</b>\n\nUpdated: 8 Aug 2026, 12:00 UTC\nCoins scanned: 142\n\n<b>1. AI Agents - 88/100 (+12) 🔥</b>\nStage: <b>Accelerating</b>\n6H Volume: $6.48M\nLiquidity: $2.10M\nV/L Ratio: <b>3.09x</b>\nActive Coins: 18\nLeaders: <a href="https://dexscreener.com/solana/0x123" target="_blank" class="text-lime underline">ELIZA</a> · <a href="https://dexscreener.com/solana/0x456" target="_blank" class="text-lime underline">FARTCOIN</a>\nSignal: <i>Volume surges as autonomous agent frameworks expand.</i>\n\n<b>2. DePIN - 72/100 (+4) 🟢</b>\nStage: <b>Emerging</b>\n6H Volume: $1.85M\nLiquidity: $920K\nV/L Ratio: <b>2.01x</b>\nActive Coins: 11\nLeaders: <a href="https://dexscreener.com/solana/0x789" target="_blank" class="text-lime underline">HNT</a> · <a href="https://dexscreener.com/solana/0xabc" target="_blank" class="text-lime underline">IO</a>\nSignal: <i>Hardware resources and storage networks showing stable inflows.</i>\n\n<b>3. RWA - 42/100 (-8) 🟡</b>\nStage: <b>Forming</b>\n6H Volume: $420K\nLiquidity: $680K\nV/L Ratio: <b>0.62x</b>\nActive Coins: 4\nLeaders: <a href="https://dexscreener.com/solana/0xdef" target="_blank" class="text-lime underline">ONDO</a>\nWarning: <i>Narrative currently depends heavily on one coin: ONDO.</i>\n\nData source: DexScreener (OK) · AI: Grok\nRequest fresh scan: /meta\n\n<i>Informational signals, not financial advice.</i>`;
      } else if (cmd === '/latest' || cmd === '📊 latest report') {
        replyText = `<b>METIQ - 6H META REPORT</b>\n\nUpdated: 8 Aug 2026, 11:50 UTC\nCoins scanned: 94\n\n<b>1. AI Agents - 88/100 (+12) 🔥</b>\nStage: <b>Accelerating</b>\n6H Volume: $6.48M\nLiquidity: $2.10M\nV/L Ratio: <b>3.09x</b>\nActive Coins: 18\nLeaders: <a href="https://dexscreener.com/solana/0x123" target="_blank" class="text-lime underline">ELIZA</a>\nSignal: <i>Volume surges as autonomous agent frameworks expand.</i>\n\nData source: DexScreener (OK) · AI: Grok\nRequest fresh scan: /meta\n\n<i>Informational signals, not financial advice.</i>`;
      } else if (cmd === '/status' || cmd === '📊 status' || cmd === 'alerts info' || cmd === '🔔 alerts info') {
        replyText = `📊 <b>METIQ System Status</b>\n\n• Bot API: Operational\n• DexScreener: OK\n• Database: Operational\n• Last Scan: 8 Aug 2026, 11:50 UTC\n• Next Scheduled Scan: 8 Aug 2026, 18:00 UTC\n\n• Active Report Subscribers: <b>1,482</b>\n\n<i>Private chat parameters are redacted for privacy.</i>`;
      } else if (cmd === '/subscribe') {
        replyText = `🔔 <b>METIQ Alerts Enabled</b>\n\nThis chat will receive automatic reports every six hours (00:00, 06:00, 12:00, 18:00 UTC).\nUse /unsubscribe to stop alerts.`;
      } else if (cmd === '/unsubscribe') {
        replyText = `🔕 <b>METIQ Alerts Disabled</b>\n\nYou have unsubscribed from automatic reports. Manual commands like /meta and /latest remain fully functional.\nUse /subscribe to re-enable alerts.`;
      } else if (cmd === '/help' || cmd === '❓ help') {
        replyText = `❓ <b>METIQ Bot Help & Commands</b>\n\n/meta - Run a fresh narrative scan (with a cooldown limitation).\n/latest - Get the latest completed report immediately.\n/subscribe - Enable automatic reports every six hours.\n/unsubscribe - Disable automatic reports.\n/status - View service connectivity status.\n/help - Show this instructions page.`;
      } else {
        replyText = `🤖 Unrecognized command. Use the buttons below or type one of the supported commands:\n/meta, /latest, /subscribe, /unsubscribe, /status, /help`;
      }

      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: replyText,
          timestamp: formatTime(),
          buttons
        }
      ]);
    }, 1000);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setInputValue('');

    setMessages(prev => [
      ...prev,
      {
        sender: 'user',
        text: userText,
        timestamp: formatTime()
      }
    ]);

    handleCommandResponse(userText);
  };

  const botName = botProfile?.first_name || 'METIQ Bot';
  const botUser = botProfile?.username || 'MetiqBot';
  const botInitial = botName.substring(0, 2).toUpperCase();

  const faqs = [
    {
      q: "How does the METIQ scoring algorithm determine meta scores?",
      a: "METIQ combines logarithmic volume tracking (40%), Shannon Entropy narrative breadth analysis (20%), liquidity depth calculations (20%), and exponential volume momentum shifts (20%). It also subtracts progressive penalties for high HHI (market centralization around one token) and wash-trading (disproportionate V/L ratios) to filter out fake FOMO spikes."
    },
    {
      q: "What blockchains are tracked by METIQ?",
      a: "We actively query top pools, boosts, and volume metrics across Solana, Base, Ethereum, and Arbitrum. This captures the vast majority of decentralized narrative movement."
    },
    {
      q: "Are the reports sent automatically, or do I need to query them?",
      a: "Both! When you start the bot or type /subscribe, you register your chat to receive automatically compiled 6-hour broadcasts (at 00:00, 06:00, 12:00, and 18:00 UTC). You can also type /meta at any time to execute an on-demand scan."
    },
    {
      q: "How does the cooldown timer work for manual scans?",
      a: "To prevent hitting DexScreener API limits and wasting AI credits, manual scanning triggers have a 2-minute global cooldown. If you trigger a scan during cooldown, the bot returns the latest completed report and alerts you of the remaining cooldown time."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground radar-grid relative flex flex-col selection:bg-lime selection:text-black">
      
      {/* Decorative top grid line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-lime/20 to-transparent" />

      {/* Header Navigation */}
      <header className="border-b border-border-custom bg-background/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-mono tracking-wider text-xl font-bold group">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-lime"></span>
            </span>
            <span className="text-zinc-900">METIQ Bot</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-mono text-muted-custom">
            <a href="#simulator" className="hover:text-lime transition-colors">Bot Simulator</a>
            <a href="#how-it-works" className="hover:text-lime transition-colors">How It Works</a>
            <a href="#faq" className="hover:text-lime transition-colors">FAQs</a>
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
              LAUNCH TELEGRAM <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-6xl mx-auto px-4 w-full pt-10 pb-20 flex flex-col gap-24 relative z-10">
        
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start py-8">
          <div className="lg:col-span-7 flex flex-col gap-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-lime/30 bg-lime-muted/50 text-lime font-mono text-xs w-fit">
              <Radar size={14} className="animate-spin-slow" />
              CRYPTO META INTELLIGENCE TERMINAL
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-zinc-900">
              Frontrun the next crypto meta before it becomes <span className="text-lime">obvious</span>.
            </h1>
            
            <p className="text-base md:text-lg text-zinc-700 leading-relaxed">
              METIQ automatically scans top pools across Solana, Base, Ethereum, and Arbitrum. Using entropy breadth formulas and wash-trading filter models, we deliver clear, actionable reports straight to Telegram.
            </p>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-2">
              <a 
                id="cta-telegram"
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded bg-lime hover:bg-lime-hover text-black font-mono text-sm font-semibold tracking-wider text-center glow-hover transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Bot size={16} /> OPEN TELEGRAM BOT
              </a>
              <a 
                href="#simulator"
                className="px-6 py-3 rounded border border-border-custom bg-white hover:border-lime text-zinc-800 hover:text-lime font-mono text-sm tracking-wider text-center transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Terminal size={16} /> TRY WEB SIMULATOR
              </a>
            </div>
          </div>

          {/* Interactive Telegram Simulator Mockup */}
          <div id="simulator" className="lg:col-span-5 w-full max-w-md relative mx-auto lg:mx-0">
            <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-lime/20 to-transparent blur opacity-45" />
            <div className="relative rounded-lg border border-border-custom bg-card-custom overflow-hidden shadow-xl flex flex-col h-[520px]">
              
              {/* Telegram Header */}
              <div className="bg-background px-4 py-3 border-b border-border-custom flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {botProfile?.photoUrl ? (
                    <img 
                      src={botProfile.photoUrl} 
                      alt={botName} 
                      className="w-9 h-9 rounded-full object-cover border border-border-custom"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-lime/10 flex items-center justify-center text-lime font-mono font-bold text-xs border border-lime/30">
                      {botInitial}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-xs leading-none">{botName}</h3>
                    <span className="text-[10px] text-lime">bot</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[9px] font-mono rounded bg-lime-muted text-lime border border-lime/25">INTERACTIVE WEB SIMULATOR</span>
              </div>

              {/* Chat Messages Panel */}
              <div className="flex-grow p-4 overflow-y-auto flex flex-col gap-4 bg-zinc-50/50">
                {messages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`flex flex-col max-w-[85%] ${
                      msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
                    }`}
                  >
                    <div 
                      className={`p-3 rounded-lg text-xs leading-relaxed font-mono ${
                        msg.sender === 'user' 
                          ? 'bg-lime text-black rounded-tr-none' 
                          : 'bg-white border border-border-custom text-zinc-800 rounded-tl-none shadow-sm'
                      }`}
                      dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }}
                    />
                    <span className="text-[9px] text-muted-custom mt-1 px-1 font-mono">{msg.timestamp}</span>

                    {/* Quick Action Telegram Buttons */}
                    {msg.sender === 'bot' && msg.buttons && msg.buttons.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-2 w-full max-w-[280px]">
                        {msg.buttons.map((btn, btnIdx) => (
                          <button
                            key={btnIdx}
                            onClick={() => {
                              setMessages(prev => [
                                ...prev,
                                { sender: 'user', text: btn, timestamp: formatTime() }
                              ]);
                              handleCommandResponse(btn);
                            }}
                            className="px-3 py-2 text-[10px] font-mono font-bold text-center rounded border border-border-custom bg-white hover:bg-zinc-50 hover:border-lime active:bg-zinc-100 transition-all shadow-sm text-zinc-700 pointer-events-auto cursor-pointer"
                          >
                            {btn}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Simulated Typing Indicator */}
                {isTyping && (
                  <div className="self-start items-start flex flex-col">
                    <div className="p-3 rounded-lg text-xs font-mono bg-white border border-border-custom text-zinc-400 rounded-tl-none flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Field */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-border-custom bg-white flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a command (/meta, /latest, /help)..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-grow bg-zinc-50 border border-border-custom rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-lime text-zinc-800"
                />
                <button 
                  type="submit"
                  className="p-2 rounded bg-lime hover:bg-lime-hover text-black transition-colors"
                >
                  <Send size={14} />
                </button>
              </form>
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

        {/* FAQs Section (Interactive) */}
        <section id="faq" className="border-t border-border-custom/50 pt-16 flex flex-col gap-12">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-3">
            <h2 className="text-2xl md:text-3xl font-mono font-bold tracking-tight">FREQUENTLY ASKED QUESTIONS</h2>
            <p className="text-sm text-muted-custom">Quick explanations regarding METIQ's operations and narrative models.</p>
          </div>

          <div className="max-w-3xl mx-auto w-full flex flex-col gap-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="rounded border border-border-custom bg-card-custom overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-5 text-left font-mono font-bold text-sm flex items-center justify-between gap-4 hover:bg-zinc-50/50"
                >
                  <span className="flex items-center gap-2 text-zinc-800">
                    <HelpCircle size={16} className="text-lime" />
                    {faq.q}
                  </span>
                  <ChevronDown 
                    size={16} 
                    className={`text-zinc-500 transition-transform duration-300 ${
                      faqOpen[index] ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                
                {faqOpen[index] && (
                  <div className="px-5 pb-5 pt-1 border-t border-border-custom/50 text-xs text-muted-custom font-mono leading-relaxed bg-zinc-50/20">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border-custom py-8 bg-card-custom/20 font-mono text-[10px] text-muted-custom text-center flex flex-col gap-2">
        <p>METIQ Bot Crypto Meta Intelligence Monitor © 2026.</p>
        <p className="text-[9px] text-zinc-400">Trading high-volatility DEX pools carries extreme risks. Informational signals only.</p>
      </footer>

    </div>
  );
}
