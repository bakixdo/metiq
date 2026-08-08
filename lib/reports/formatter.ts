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
      return 'Activity is decreasing and momentum is slowing.';
    default:
      return 'Monitor narrative for further volume confirmation.';
  }
}

/**
 * Formats narrative snapshots and metadata into Telegram HTML structure.
 */
export function formatTelegramReport(
  completedAt: Date,
  coinsScanned: number,
  narratives: ScoredNarrative[],
  dexScreenerStatus: 'operational' | 'degraded' | 'outage'
): string {
  const dateStr = formatUtcDate(completedAt);
  
  // Title
  let report = `<b>METIQ - 6H META REPORT</b>\n\n`;
  report += `Updated: ${dateStr}\n`;
  report += `Coins scanned: ${coinsScanned}\n\n`;

  // Select up to top 5 narratives
  const topNarratives = narratives.slice(0, 5);

  topNarratives.forEach((nar, index) => {
    // Arrow based on score change
    let arrow = '';
    if (nar.score_change > 0) arrow = ' ↑';
    else if (nar.score_change < 0) arrow = ' ↓';
    
    report += `<b>${index + 1}. ${escapeHtml(nar.name)} - ${nar.score}/100${arrow}</b>\n\n`;
    report += `Stage: ${escapeHtml(nar.stage)}\n`;
    report += `6H Volume: ${formatCurrency(nar.volume_6h)}\n`;
    report += `Liquidity: ${formatCurrency(nar.liquidity)}\n`;
    report += `Active Coins: ${nar.coin_count}\n`;
    report += `Leaders: ${escapeHtml(nar.leaders.join(' · '))}\n`;

    // Warnings vs Signals
    if (nar.warnings && nar.warnings.length > 0) {
      report += `Warning: ${escapeHtml(nar.warnings.join(' · '))}\n\n`;
    } else {
      report += `Signal: ${escapeHtml(getDefaultSignal(nar.stage))}\n\n`;
    }
  });

  // Footer status, commands, and disclaimer
  const statusIndicator = dexScreenerStatus === 'operational' ? 'OK' : dexScreenerStatus.toUpperCase();
  report += `Data source: DexScreener (${statusIndicator})\n`;
  report += `Request fresh scan: /meta\n\n`;
  report += `<i>Informational signals, not financial advice.</i>`;

  return report;
}
