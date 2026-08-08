import { ScoredNarrative } from '../scoring/engine';
import { escapeHtml } from '../telegram/bot';

/**
 * Formats a number to a currency representation (e.g. $4.82M, $780K, $500).
 */
export function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

/**
 * Formats date into "8 Aug 2026, 12:00 UTC" structure.
 */
export function formatUtcDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getUTCDate();
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes} UTC`;
}

/**
 * Gets a default positive signal description based on the narrative stage.
 */
function getDefaultSignal(stage: string): string {
  switch (stage) {
    case 'Weak':
      return 'Activity is low with minimal market interest.';
    case 'Forming':
      return 'Initial volume and transactions are beginning to cluster.';
    case 'Emerging':
      return 'Buying pressure and coin variety are starting to build.';
    case 'Accelerating':
      return 'Volume and market breadth are increasing.';
    case 'Crowded':
      return 'High participation with significant volume, watch for consolidation.';
    case 'Cooling':
      return 'Narrative steam is slowing down as volume subsides.';
    default:
      return 'Stable meta indicators detected.';
  }
}

/**
 * Returns an emoji flag mapping for each narrative stage.
 */
function getStageEmoji(stage: string): string {
  switch (stage) {
    case 'Accelerating': return '🔥';
    case 'Crowded': return '🚨';
    case 'Cooling': return '❄️';
    case 'Emerging': return '🟢';
    case 'Forming': return '🟡';
    case 'Weak':
    default:
      return '⚪';
  }
}

/**
 * Formats narrative snapshots and metadata into Telegram HTML structure.
 */
export function formatTelegramReport(
  completedAt: Date,
  coinsScanned: number,
  narratives: ScoredNarrative[],
  dexScreenerStatus: 'operational' | 'degraded' | 'outage',
  aiProviderUsed?: string | null
): string {
  const dateStr = formatUtcDate(completedAt);
  
  // Title
  let report = `<b>METIQ - 6H META REPORT</b>\n\n`;
  report += `Updated: ${dateStr}\n`;
  report += `Coins scanned: ${coinsScanned}\n\n`;

  // Select up to top 5 narratives
  const topNarratives = narratives.slice(0, 5);

  topNarratives.forEach((nar, index) => {
    // Show exact delta change
    let changeText = '';
    if (nar.score_change > 0) changeText = ` (+${nar.score_change})`;
    else if (nar.score_change < 0) changeText = ` (${nar.score_change})`;

    const emoji = getStageEmoji(nar.stage);
    const vlRatio = (nar.volume_6h / Math.max(1, nar.liquidity)).toFixed(2);
    
    report += `<b>${index + 1}. ${escapeHtml(nar.name)} - ${nar.score}/100${changeText} ${emoji}</b>\n\n`;
    report += `Stage: <b>${escapeHtml(nar.stage)}</b>\n`;
    report += `6H Volume: ${formatCurrency(nar.volume_6h)}\n`;
    report += `Liquidity: ${formatCurrency(nar.liquidity)}\n`;
    report += `V/L Ratio: <b>${vlRatio}x</b>\n`;
    report += `Active Coins: ${nar.coin_count}\n`;

    const leaderLinks = nar.leaders.map(l => {
      const sym = escapeHtml(l.symbol);
      const url = `https://dexscreener.com/${l.chain.toLowerCase()}/${l.address.toLowerCase()}`;
      return `<a href="${url}">${sym}</a>`;
    });
    report += `Leaders: ${leaderLinks.join(' · ')}\n`;

    // Warnings vs Signals
    if (nar.warnings && nar.warnings.length > 0) {
      report += `Warning: <i>${escapeHtml(nar.warnings.join(' · '))}</i>\n\n`;
    } else {
      const signalText = nar.signal || getDefaultSignal(nar.stage);
      report += `Signal: <i>${escapeHtml(signalText)}</i>\n\n`;
    }
  });

  // Footer status, commands, and disclaimer
  const statusIndicator = dexScreenerStatus === 'operational' ? 'OK' : dexScreenerStatus.toUpperCase();
  const aiSuffix = aiProviderUsed ? ` · AI: ${aiProviderUsed}` : '';
  report += `Data source: DexScreener (${statusIndicator})${aiSuffix}\n`;
  report += `Request fresh scan: /meta\n\n`;
  report += `<i>Informational signals, not financial advice.</i>`;

  return report;
}
