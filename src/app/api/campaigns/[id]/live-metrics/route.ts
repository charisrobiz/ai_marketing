import { NextResponse } from 'next/server';
import db from '@/lib/db/database';
import { getMetaAdInsights, getMetaInstalls } from '@/lib/integrations/metaAds';
import { getGoogleAdsMetrics } from '@/lib/integrations/googleAds';
import { getFirebaseAnalytics, getFirebaseRetention } from '@/lib/integrations/firebase';
import { getAppsFlyerOverview } from '@/lib/integrations/appsflyer';

function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string }>;
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return map;
}

// GET: 실제 외부 API에서 실시간 지표 수집
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const settings = getSettings();

  // Date range: last 7 days
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const format = (d: Date) => d.toISOString().slice(0, 10);

  const results: Record<string, unknown> = {
    campaignId: id,
    fetchedAt: now.toISOString(),
    sources: {} as Record<string, unknown>,
    connected: [] as string[],
    notConnected: [] as string[],
  };

  const sources = results.sources as Record<string, unknown>;
  const connected = results.connected as string[];
  const notConnected = results.notConnected as string[];

  // === Meta Ads ===
  if (settings.metaAdsToken && settings.metaAdAccountId) {
    const meta = await getMetaAdInsights(settings.metaAdsToken, settings.metaAdAccountId, {
      since: format(weekAgo),
      until: format(now),
    });
    if (meta) {
      const installs = meta.campaigns.reduce((sum, c) => sum + getMetaInstalls(c.insights), 0);
      sources.metaAds = {
        connected: true,
        impressions: meta.summary.impressions,
        clicks: meta.summary.clicks,
        spend: meta.summary.spend,
        ctr: Math.round(meta.summary.ctr * 100) / 100,
        cpc: Math.round(meta.summary.cpc),
        installs,
        cpa: installs > 0 ? Math.round(meta.summary.spend / installs) : null,
        campaigns: meta.campaigns.length,
      };
      connected.push('Meta Ads');
    } else {
      sources.metaAds = { connected: false, error: '토큰이 만료되었거나 잘못되었습니다' };
      notConnected.push('Meta Ads');
    }
  } else {
    sources.metaAds = { connected: false };
    notConnected.push('Meta Ads');
  }

  // === Google Ads ===
  if (settings.googleAdsToken && settings.googleAdsDeveloperToken && settings.googleAdsCustomerId) {
    const google = await getGoogleAdsMetrics(
      settings.googleAdsToken,
      settings.googleAdsDeveloperToken,
      settings.googleAdsCustomerId,
      { startDate: format(weekAgo), endDate: format(now) }
    );
    if (google) {
      sources.googleAds = {
        connected: true,
        impressions: google.impressions,
        clicks: google.clicks,
        cost: Math.round(google.cost),
        ctr: Math.round(google.ctr * 100) / 100,
        avgCpc: Math.round(google.avgCpc),
        conversions: google.conversions,
      };
      connected.push('Google Ads');
    } else {
      sources.googleAds = { connected: false, error: '연동 실패' };
      notConnected.push('Google Ads');
    }
  } else {
    sources.googleAds = { connected: false };
    notConnected.push('Google Ads');
  }

  // === Firebase Analytics ===
  if (settings.firebaseProjectId && settings.firebaseServiceAccountKey) {
    const firebase = await getFirebaseAnalytics(
      settings.firebaseProjectId,
      settings.firebaseServiceAccountKey,
      { startDate: format(weekAgo), endDate: format(now) }
    );
    const retention = await getFirebaseRetention(
      settings.firebaseProjectId,
      settings.firebaseServiceAccountKey
    );

    if (firebase) {
      sources.firebase = {
        connected: true,
        activeUsers: firebase.activeUsers,
        newUsers: firebase.newUsers,
        sessions: firebase.sessions,
        retention: retention || undefined,
      };
      connected.push('Firebase');
    } else {
      sources.firebase = { connected: false, error: '프로젝트 ID 또는 키 확인 필요' };
      notConnected.push('Firebase');
    }
  } else {
    sources.firebase = { connected: false };
    notConnected.push('Firebase');
  }

  // === AppsFlyer ===
  if (settings.appsflyerApiToken && settings.appsflyerAppId) {
    const af = await getAppsFlyerOverview(settings.appsflyerApiToken, settings.appsflyerAppId, {
      from: format(weekAgo),
      to: format(now),
    });
    if (af) {
      sources.appsflyer = {
        connected: true,
        totalInstalls: af.installs,
        organicInstalls: af.organicInstalls,
        paidInstalls: af.nonOrganicInstalls,
        organicRatio: af.organicRatio,
        paidRatio: af.paidRatio,
      };
      connected.push('AppsFlyer');
    } else {
      sources.appsflyer = { connected: false, error: '토큰 확인 필요' };
      notConnected.push('AppsFlyer');
    }
  } else {
    sources.appsflyer = { connected: false };
    notConnected.push('AppsFlyer');
  }

  // === 통합 요약 ===
  const metaData = sources.metaAds as Record<string, unknown> | undefined;
  const googleData = sources.googleAds as Record<string, unknown> | undefined;
  const firebaseData = sources.firebase as Record<string, unknown> | undefined;
  const afData = sources.appsflyer as Record<string, unknown> | undefined;

  const totalSpend = ((metaData?.connected ? metaData.spend : 0) as number || 0) +
                     ((googleData?.connected ? googleData.cost : 0) as number || 0);
  const totalClicks = ((metaData?.connected ? metaData.clicks : 0) as number || 0) +
                      ((googleData?.connected ? googleData.clicks : 0) as number || 0);
  const totalImpressions = ((metaData?.connected ? metaData.impressions : 0) as number || 0) +
                           ((googleData?.connected ? googleData.impressions : 0) as number || 0);

  results.summary = {
    totalSpend: Math.round(totalSpend),
    totalClicks,
    totalImpressions,
    overallCtr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0,
    newUsers: firebaseData?.connected ? (firebaseData.newUsers as number) : null,
    activeUsers: firebaseData?.connected ? (firebaseData.activeUsers as number) : null,
    organicRatio: afData?.connected ? (afData.organicRatio as number) : null,
    connectedServices: connected.length,
    totalServices: connected.length + notConnected.length,
  };

  return NextResponse.json(results);
}
