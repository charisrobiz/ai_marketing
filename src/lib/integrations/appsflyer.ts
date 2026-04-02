// AppsFlyer API 연동 - 어트리뷰션 (오가닉/페이드 구분)

interface AppsFlyerOverview {
  installs: number;
  organicInstalls: number;
  nonOrganicInstalls: number;
  organicRatio: number;
  paidRatio: number;
}

interface AppsFlyerChannelData {
  mediaSource: string;
  installs: number;
  clicks: number;
  impressions: number;
  cost: number;
  cpi: number;
}

export async function getAppsFlyerOverview(
  apiToken: string,
  appId: string,
  dateRange: { from: string; to: string }
): Promise<AppsFlyerOverview | null> {
  try {
    const res = await fetch(
      `https://hq1.appsflyer.com/api/agg-data/export/app/${appId}/partners_report/v5?` +
      `from=${dateRange.from}&to=${dateRange.to}&` +
      `groupings=pid&kpis=installs,clicks,impressions,cost`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!res.ok) return null;

    const csvText = await res.text();
    const lines = csvText.split('\n').slice(1); // skip header

    let totalInstalls = 0;
    let organicInstalls = 0;
    let nonOrganicInstalls = 0;

    for (const line of lines) {
      if (!line.trim()) continue;
      const cols = line.split(',');
      const source = cols[0] || '';
      const installs = parseInt(cols[1] || '0');

      totalInstalls += installs;
      if (source === 'organic' || source === 'Organic') {
        organicInstalls += installs;
      } else {
        nonOrganicInstalls += installs;
      }
    }

    return {
      installs: totalInstalls,
      organicInstalls,
      nonOrganicInstalls,
      organicRatio: totalInstalls > 0 ? Math.round((organicInstalls / totalInstalls) * 100) : 0,
      paidRatio: totalInstalls > 0 ? Math.round((nonOrganicInstalls / totalInstalls) * 100) : 0,
    };
  } catch {
    return null;
  }
}

export async function getAppsFlyerChannels(
  apiToken: string,
  appId: string,
  dateRange: { from: string; to: string }
): Promise<AppsFlyerChannelData[]> {
  try {
    const res = await fetch(
      `https://hq1.appsflyer.com/api/agg-data/export/app/${appId}/partners_report/v5?` +
      `from=${dateRange.from}&to=${dateRange.to}&` +
      `groupings=pid&kpis=installs,clicks,impressions,cost`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!res.ok) return [];

    const csvText = await res.text();
    const lines = csvText.split('\n').slice(1);
    const channels: AppsFlyerChannelData[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      const cols = line.split(',');
      const installs = parseInt(cols[1] || '0');
      const cost = parseFloat(cols[4] || '0');

      channels.push({
        mediaSource: cols[0] || 'unknown',
        installs,
        clicks: parseInt(cols[2] || '0'),
        impressions: parseInt(cols[3] || '0'),
        cost,
        cpi: installs > 0 ? cost / installs : 0,
      });
    }

    return channels.sort((a, b) => b.installs - a.installs);
  } catch {
    return [];
  }
}
