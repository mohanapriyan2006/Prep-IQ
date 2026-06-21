import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { AuthRequiredCard } from '../components/auth/AuthRequiredCard';
import { RadarChart } from '../components/profile/RadarChart';
import { RoadmapCalendar } from '../components/profile/RoadmapCalendar';
import { ProfileStats } from '../components/profile/ProfileStats';
// import { StatsIntegrationPanel } from '../components/profile/StatsIntegrationPanel';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/useAuth';
import {
  fetchAnalyticsSummary,
  fetchCompanyReadiness,
  fetchPlatformAccounts,
  fetchPlatformStats,
  fetchProgressAnalytics,
  fetchTopicStrength,
  syncPlatformStats,
  upsertPlatformAccount,
} from '../services/api';
import type { PlatformAccount, PlatformStat } from '../types/coding';

export default function Profile() {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [stats, setStats] = useState<PlatformStat[]>([]);
  const [summary, setSummary] = useState<{
    accuracy: number;
    attempt_count: number;
    avg_runtime_ms: number;
    difficulty_distribution: Record<string, number>;
  } | null>(null);
  const [progress, setProgress] = useState<{
    roadmap_completion: number;
    consistency: Array<{ date: string; attempts: number }>;
  } | null>(null);
  const [companyReadiness, setCompanyReadiness] = useState<Record<string, number>>({});
  const [radarData, setRadarData] = useState<Array<{ topic: string; score: number }>>([]);
  const [leetcode, setLeetcode] = useState('');
  const [gfg, setGfg] = useState('');
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    const [
      accountData,
      statsData,
      analyticsSummary,
      progressData,
      readinessData,
      topicData,
    ] = await Promise.all([
      fetchPlatformAccounts(),
      fetchPlatformStats(),
      fetchAnalyticsSummary().catch(() => null),
      fetchProgressAnalytics().catch(() => null),
      fetchCompanyReadiness().catch(() => ({ readiness: {} })),
      fetchTopicStrength().catch(() => ({ topics: [] })),
    ]);

    setAccounts(accountData);
    setStats(statsData.reverse()); // Show most recent first
    setLeetcode(accountData.find((item) => item.platform === 'leetcode')?.username ?? '');
    setGfg(accountData.find((item) => item.platform === 'geeksforgeeks')?.username ?? '');

    setSummary(
      analyticsSummary
        ? {
            accuracy: analyticsSummary.accuracy,
            attempt_count: analyticsSummary.attempt_count,
            avg_runtime_ms: analyticsSummary.avg_runtime_ms,
            difficulty_distribution: analyticsSummary.difficulty_distribution,
          }
        : null
    );
    setProgress(
      progressData
        ? {
            roadmap_completion: progressData.roadmap_completion,
            consistency: progressData.consistency,
          }
        : null
    );
    setCompanyReadiness(readinessData.readiness ?? {});

    const radar = topicData.topics
      .slice(0, 6)
      .map((item) => ({ topic: item.topic, score: Math.max(0, Math.min(100, item.accuracy)) }));
    setRadarData(
      radar.length > 0
        ? radar
        : [
            { topic: 'Arrays', score: 0 },
            { topic: 'Graphs', score: 0 },
            { topic: 'DP', score: 0 },
            { topic: 'Trees', score: 0 },
            { topic: 'Greedy', score: 0 },
            { topic: 'Recursion', score: 0 },
          ]
    );
  }, [isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onSave = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setLoading(true);
    try {
      if (leetcode.trim()) {
        await upsertPlatformAccount({ platform: 'leetcode', username: leetcode.trim() });
      }
      if (gfg.trim()) {
        await upsertPlatformAccount({ platform: 'geeksforgeeks', username: gfg.trim() });
      }
      await syncPlatformStats();
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const onSync = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setLoading(true);
    try {
      await syncPlatformStats();
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const totalSolved = useMemo(() => stats.reduce((acc, item) => acc + item.total_solved, 0), [stats]);

  const heatmapEntries = useMemo(() => {
    const today = new Date();
    const entries: Array<{ date: string; submissions: number }> = [];
    const consistencyMap = new Map<string, number>();
    for (const item of progress?.consistency ?? []) {
      consistencyMap.set(item.date, item.attempts);
    }

    for (let i = 27; i >= 0; i -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      entries.push({ date: key, submissions: consistencyMap.get(key) ?? 0 });
    }
    return entries;
  }, [progress]);

  const readinessRows = useMemo(
    () =>
      Object.entries(companyReadiness)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6),
    [companyReadiness]
  );

  const difficultyRows = useMemo(
    () =>
      Object.entries(summary?.difficulty_distribution ?? {}).map(([name, value]) => ({
        name,
        value,
      })),
    [summary]
  );

  return (
    <div className="space-y-6">
      {/* {isAuthenticated ? <StatsIntegrationPanel /> : null} */}
      {!isAuthenticated ? (
        <AuthRequiredCard
          title="Login Required"
          message="Connect your LeetCode and GeeksForGeeks profiles to auto-sync solved counts, topics, and submission patterns."
        />
      ) : null}

      <Card hover={false} className="space-y-4 border-[#222A33] bg-[#151B22]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#E2E8F0]">Platform Connectors</h2>
          <button
            onClick={() => void refresh()}
            className="inline-flex items-center gap-2 rounded-lg border border-[#1F2937] bg-[#111827] px-3 py-2 text-xs text-[#CBD5E1]"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Analytics
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-[#94A3B8]">LeetCode Username</label>
            <input
              value={leetcode}
              onChange={(event) => setLeetcode(event.target.value)}
              className="h-11 w-full rounded-xl border border-[#222A33] bg-[#0B0F14] px-3 text-sm text-[#E2E8F0]"
              placeholder="e.g. john_doe"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-[#94A3B8]">GeeksForGeeks Username</label>
            <input
              value={gfg}
              onChange={(event) => setGfg(event.target.value)}
              className="h-11 w-full rounded-xl border border-[#222A33] bg-[#0B0F14] px-3 text-sm text-[#E2E8F0]"
              placeholder="e.g. john_gfg"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => void onSave()} disabled={loading} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            Save & Sync
          </button>
          <button
            onClick={() => void onSync()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-[#1F2937] bg-[#111827] px-4 py-2 text-sm text-[#CBD5E1] disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" />
            Sync Now
          </button>
        </div>
      </Card>

      <ProfileStats
        stats={[
          { label: 'Problems Solved', value: `${totalSolved}` },
          { label: 'Current Streak', value: `${Math.min(14, Math.max(0, progress?.consistency.length ?? 0))} days` },
          { label: 'Total Submissions', value: `${summary?.attempt_count ?? 0}` },
          { label: 'Accuracy', value: `${summary?.accuracy ?? 0}%` },
          { label: 'Avg Solving Time', value: `${Math.round(summary?.avg_runtime_ms ?? 0)} ms` },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <RadarChart data={radarData} />
        <RoadmapCalendar entries={heatmapEntries} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card hover={false} className="border-[#222A33] bg-[#151B22]">
          <p className="mb-3 text-sm font-semibold text-[#E5E7EB]">Weekly Activity Trend</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={(progress?.consistency ?? []).slice(-14)}>
                <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="attempts" stroke="#3B82F6" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card hover={false} className="border-[#222A33] bg-[#151B22]">
          <p className="mb-3 text-sm font-semibold text-[#E5E7EB]">Difficulty Distribution</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={difficultyRows}>
                <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card hover={false} className="border-[#222A33] bg-[#151B22]">
        <p className="mb-3 text-sm font-semibold text-[#E5E7EB]">Company Readiness</p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {readinessRows.length === 0 ? (
            <p className="text-sm text-[#94A3B8]">Readiness will appear after solving and syncing profile data.</p>
          ) : (
            readinessRows.map(([company, score]) => (
              <div key={company} className="rounded-xl border border-[#222A33] bg-[#0F141A] p-3">
                <div className="mb-2 flex items-center justify-between text-sm text-[#CBD5E1]">
                  <span>{company}</span>
                  <span>{Math.round(score)}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#1F2937]">
                  <div className="h-2 rounded-full bg-[#3B82F6]" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {stats.map((stat) => (
          <Card key={stat.platform} hover={false} className="space-y-3 border-[#222A33] bg-[#151B22]">
            <h3 className="text-base font-semibold text-[#E2E8F0]">{stat.platform}</h3>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-300">Easy {stat.easy_solved}</div>
              <div className="rounded-lg bg-amber-500/10 p-2 text-amber-300">Medium {stat.medium_solved}</div>
              <div className="rounded-lg bg-rose-500/10 p-2 text-rose-300">Hard {stat.hard_solved}</div>
              <div className="rounded-lg bg-[#1E293B] p-2 text-[#CBD5E1]">Total {stat.total_solved}</div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[#94A3B8]">Topics</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {stat.topics.length > 0 ? (
                  stat.topics.map((topic) => (
                    <span key={`${stat.platform}-${topic}`} className="rounded-full border border-[#334155] bg-[#0F172A] px-2.5 py-1 text-xs text-[#CBD5E1]">
                      {topic}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#64748B]">No topic distribution found</span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {isAuthenticated && accounts.length === 0 ? (
        <Card hover={false} className="border-[#222A33] bg-[#151B22] text-sm text-[#94A3B8]">Connect at least one platform to see synced stats.</Card>
      ) : null}
    </div>
  );
}
