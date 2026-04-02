// Google Ads API 연동

interface GoogleAdMetrics {
  impressions: number;
  clicks: number;
  cost: number; // micros (1/1,000,000)
  conversions: number;
  ctr: number;
  avgCpc: number;
}

export async function getGoogleAdsMetrics(
  oauthToken: string,
  developerToken: string,
  customerId: string,
  dateRange: { startDate: string; endDate: string }
): Promise<GoogleAdMetrics | null> {
  try {
    const customerIdClean = customerId.replace(/-/g, '');

    const query = `
      SELECT
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr,
        metrics.average_cpc
      FROM campaign
      WHERE segments.date BETWEEN '${dateRange.startDate}' AND '${dateRange.endDate}'
    `;

    const res = await fetch(
      `https://googleads.googleapis.com/v16/customers/${customerIdClean}/googleAds:searchStream`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${oauthToken}`,
          'developer-token': developerToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalCostMicros = 0;
    let totalConversions = 0;

    for (const result of data) {
      for (const row of result.results || []) {
        const m = row.metrics || {};
        totalImpressions += parseInt(m.impressions || '0');
        totalClicks += parseInt(m.clicks || '0');
        totalCostMicros += parseInt(m.costMicros || '0');
        totalConversions += parseFloat(m.conversions || '0');
      }
    }

    const cost = totalCostMicros / 1_000_000;
    return {
      impressions: totalImpressions,
      clicks: totalClicks,
      cost,
      conversions: totalConversions,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      avgCpc: totalClicks > 0 ? cost / totalClicks : 0,
    };
  } catch {
    return null;
  }
}
