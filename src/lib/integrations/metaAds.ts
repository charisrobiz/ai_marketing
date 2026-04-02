// Meta (Facebook/Instagram) Ads API 연동

interface MetaAdInsight {
  impressions: number;
  clicks: number;
  spend: number;
  actions?: Array<{ action_type: string; value: string }>;
  ctr: number;
  cpc: number;
  cpm: number;
}

interface MetaCampaignData {
  id: string;
  name: string;
  status: string;
  insights: MetaAdInsight;
}

export async function getMetaAdInsights(
  accessToken: string,
  adAccountId: string,
  dateRange: { since: string; until: string }
): Promise<{ campaigns: MetaCampaignData[]; summary: MetaAdInsight } | null> {
  try {
    // Get campaign insights
    const url = `https://graph.facebook.com/v19.0/${adAccountId}/insights?` +
      `fields=campaign_name,impressions,clicks,spend,actions,ctr,cpc,cpm` +
      `&time_range={"since":"${dateRange.since}","until":"${dateRange.until}"}` +
      `&level=campaign` +
      `&access_token=${accessToken}`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const campaigns: MetaCampaignData[] = (data.data || []).map((row: Record<string, unknown>) => ({
      id: row.campaign_id || '',
      name: row.campaign_name || '',
      status: 'active',
      insights: {
        impressions: parseInt(row.impressions as string) || 0,
        clicks: parseInt(row.clicks as string) || 0,
        spend: parseFloat(row.spend as string) || 0,
        actions: row.actions as MetaAdInsight['actions'],
        ctr: parseFloat(row.ctr as string) || 0,
        cpc: parseFloat(row.cpc as string) || 0,
        cpm: parseFloat(row.cpm as string) || 0,
      },
    }));

    // Summary
    const summary: MetaAdInsight = {
      impressions: campaigns.reduce((s, c) => s + c.insights.impressions, 0),
      clicks: campaigns.reduce((s, c) => s + c.insights.clicks, 0),
      spend: campaigns.reduce((s, c) => s + c.insights.spend, 0),
      ctr: 0,
      cpc: 0,
      cpm: 0,
    };
    if (summary.impressions > 0) {
      summary.ctr = (summary.clicks / summary.impressions) * 100;
      summary.cpm = (summary.spend / summary.impressions) * 1000;
    }
    if (summary.clicks > 0) {
      summary.cpc = summary.spend / summary.clicks;
    }

    return { campaigns, summary };
  } catch {
    return null;
  }
}

// Get app install count from Meta Ads
export function getMetaInstalls(insights: MetaAdInsight): number {
  if (!insights.actions) return 0;
  const installAction = insights.actions.find(
    (a) => a.action_type === 'app_install' || a.action_type === 'omni_app_install'
  );
  return installAction ? parseInt(installAction.value) : 0;
}
