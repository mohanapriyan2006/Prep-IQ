import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar,
} from 'recharts';
import { Timer, BrainCircuit, Activity, Lightbulb, Percent, ShieldAlert, Crown, Hash, RefreshCw, Clock3 } from 'lucide-react';
import { motion } from 'framer-motion';

import { AuthRequiredCard } from '../components/auth/AuthRequiredCard';
import { Card } from '../components/ui/Card';
import { ScoreRing } from '../components/ui/ScoreRing';
import { TopicBadge } from '../components/ui/TopicBadge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { useAuth } from '../context/useAuth';
import {
  fetchAnalyticsSummary,
  fetchCompanyReadiness,
  fetchProblems,
  fetchProgressAnalytics,
  fetchRoadmap,
  fetchSubmissions,
  fetchTopicStrength,
  runAIAnalysis,
} from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resumingRoadmap, setResumingRoadmap] = useState(false);
  const [summary, setSummary] = useState<{ accuracy: number; attempt_count: number; avg_runtime_ms: number; difficulty_distribution: Record<string, number> } | null>(null);
  const [progress, setProgress] = useState<{ roadmap_completion: number; consistency: Array<{ date: string; attempts: number }> } | null>(null);
  const [topicStrength, setTopicStrength] = useState<Array<{ topic: string; attempts: number; accuracy: number; classification: string }>>([]);
  const [companyReadiness, setCompanyReadiness] = useState<Record<string, number>>({});
  const [recentSubmissions, setRecentSubmissions] = useState<Array<{ created_at: string; status: string; problem_id: number }>>([]);
  const [analysisNote, setAnalysisNote] = useState('');
  const [aiAnalysisRes, setAiAnalysisRes] = useState<any>(null);

  const refreshDashboard = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }
    setLoading(true);
    try {
      const [analyticsSummary, progressData, topicData, readinessData, submissions] = await Promise.all([
        fetchAnalyticsSummary().catch(() => null),
        fetchProgressAnalytics().catch(() => null),
        fetchTopicStrength().catch(() => ({ topics: [] })),
        fetchCompanyReadiness().catch(() => ({ readiness: {} })),
        fetchSubmissions().catch(() => []),
      ]);
      setSummary(analyticsSummary);
      setProgress(progressData ? { roadmap_completion: progressData.roadmap_completion, consistency: progressData.consistency } : null);
      setTopicStrength(topicData.topics.slice(0, 8));
      setCompanyReadiness(readinessData.readiness ?? {});
      setRecentSubmissions(submissions.slice(0, 6));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refreshDashboard();
  }, [refreshDashboard]);

  const radarData = useMemo(
    () => topicStrength.map((item) => ({ topic: item.topic, strength: Math.round(item.accuracy), fullMark: 100 })),
    [topicStrength]
  );

  const weakTopics = useMemo(() => topicStrength.filter((item) => item.classification === 'weak'), [topicStrength]);
  const avgTopics = useMemo(() => topicStrength.filter((item) => item.classification === 'average'), [topicStrength]);
  const strongTopics = useMemo(() => topicStrength.filter((item) => item.classification === 'strong'), [topicStrength]);

  const companyRows = useMemo(
    () => Object.entries(companyReadiness).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([company, readiness]) => ({ company, readiness: Math.round(readiness) })),
    [companyReadiness]
  );

  const overallReadiness = useMemo(() => {
    if (companyRows.length === 0) return 0;
    return Math.round(companyRows.reduce((acc, item) => acc + item.readiness, 0) / companyRows.length);
  }, [companyRows]);

  const difficultyRows = useMemo(
    () => Object.entries(summary?.difficulty_distribution ?? {}).map(([difficulty, count]) => ({ difficulty, count })),
    [summary]
  );

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const staggerItem = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  };

  const onResumeRoadmap = useCallback(async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setResumingRoadmap(true);
    try {
      const roadmap = await fetchRoadmap().catch(() => null);
      if (!roadmap || roadmap.days.length === 0) {
        navigate('/roadmap');
        return;
      }

      const nextRemaining = roadmap.days
        .slice()
        .sort((a, b) => a.day_number - b.day_number)
        .find((day) => !day.is_completed && day.task_type !== 'weekly-review')
        ?? roadmap.days.slice().sort((a, b) => a.day_number - b.day_number).find((day) => !day.is_completed);

      if (!nextRemaining) {
        navigate('/roadmap');
        return;
      }

      const unsolved = await fetchProblems({
        topic: nextRemaining.topic,
        status: 'unsolved',
        page: 1,
        page_size: 1,
      }).catch(() => []);

      const first = unsolved[0] ?? (await fetchProblems({
        topic: nextRemaining.topic,
        page: 1,
        page_size: 1,
      }).catch(() => []))[0];

      if (first) {
        navigate(`/problems/${first.id}?roadmapDay=${nextRemaining.day_number}&source=roadmap`);
      } else {
        navigate(`/problems?roadmap=roadmap&topic=${encodeURIComponent(nextRemaining.topic)}`);
      }
    } finally {
      setResumingRoadmap(false);
    }
  }, [isAuthenticated, navigate, openAuthModal]);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {!isAuthenticated ? (
        <AuthRequiredCard
          title="Login Required"
          message="Sign in to view dynamic analytics based on your preparation behavior."
        />
      ) : null}

      <div className="flex justify-end">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal('login');
                return;
              }
              void (async () => {
                const result = await runAIAnalysis().catch(() => null);
                if (!result) return;
                setAiAnalysisRes(result);
                setAnalysisNote(result.roadmap_refreshed ? 'AI analysis completed and roadmap refreshed.' : 'AI analysis completed.');
                void refreshDashboard();
              })();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-[#1F2937] bg-[#0F172A] px-3 py-2 text-xs font-semibold text-[#E5E7EB]"
          >
            Run AI Analysis
          </button>
          <button
            onClick={() => void onResumeRoadmap()}
            disabled={resumingRoadmap}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1D4ED8] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {resumingRoadmap ? 'Opening...' : 'Resume Roadmap'}
          </button>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal('login');
                return;
              }
              void refreshDashboard();
            }}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-[#1F2937] bg-[#111827] px-3 py-2 text-xs font-semibold text-[#E5E7EB] disabled:opacity-60"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Analytics
          </button>
        </div>
      </div>

      {analysisNote ? (
        <Card hover={false} className="border-[#1D4ED8]/40 bg-[#1D4ED8]/10 text-sm text-[#BFDBFE]">
          {analysisNote}
        </Card>
      ) : null}

      {/* Top Stats Row */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Submissions', value: summary?.attempt_count ?? 0, sub: 'total tracked attempts', icon: Hash, color: '#6366F1' },
          { label: 'Accuracy Rate', value: `${Math.round(summary?.accuracy ?? 0)}%`, sub: 'overall solved ratio', icon: Percent, color: '#10B981' },
          { label: 'Weak Areas', value: weakTopics.length, sub: 'topics need focus', icon: ShieldAlert, color: '#F43F5E' },
          { label: 'Avg. Runtime', value: `${Math.round(summary?.avg_runtime_ms ?? 0)} ms`, sub: 'across submissions', icon: Timer, color: '#06B6D4' },
        ].map((stat) => (
          <Card key={stat.label} className="p-5!" glow="blue">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold text-[#E5E7EB] mt-1.5">{stat.value}</p>
                <p className="text-xs text-[#9CA3AF] mt-1">{stat.sub}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div
                  className="p-2.5 rounded-xl"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <stat.icon className="w-4.5 h-4.5" style={{ color: stat.color }} />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <motion.div variants={staggerItem} className="lg:col-span-4 space-y-6">
          {/* AI Readiness Score */}
          <Card glow="purple" hover={false}>
            <div className="flex flex-col items-center py-4">
              <ScoreRing score={overallReadiness} label="AI Readiness Score" sublabel="Based on all company patterns" />
            </div>
          </Card>

          {/* Company Readiness */}
          <Card hover={false}>
            <h3 className="text-sm font-semibold text-[#E5E7EB] mb-4 flex items-center gap-2">
              <Crown className="w-4 h-4 text-[#F59E0B]" />
              Company Readiness
            </h3>
            <div className="space-y-4">
              {companyRows.map((c) => (
                <ProgressBar
                  key={c.company}
                  label={c.company}
                  value={c.readiness}
                  color={c.readiness >= 70 ? 'green' : c.readiness >= 50 ? 'yellow' : 'red'}
                />
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Center Column */}
        <motion.div variants={staggerItem} className="lg:col-span-5 space-y-6">
          {/* Radar Chart */}
          <Card hover={false}>
            <h3 className="text-sm font-semibold text-[#E5E7EB] mb-4">Topic Strength Analysis</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="#1F2937" />
                <PolarAngleAxis dataKey="topic" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Strength"
                  dataKey="strength"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </Card>

          {/* Performance Trend */}
          <Card hover={false}>
            <h3 className="text-sm font-semibold text-[#E5E7EB] mb-4">7-Day Performance Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={progress?.consistency ?? []}>
                <defs>
                  <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProblems" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={{ stroke: '#1F2937' }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={{ stroke: '#1F2937' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #1F2937',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="attempts" stroke="#3B82F6" fillOpacity={1} fill="url(#colorAccuracy)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card hover={false}>
            <h3 className="text-sm font-semibold text-[#E5E7EB] mb-4">Difficulty Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={difficultyRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="difficulty" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={{ stroke: '#1F2937' }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={{ stroke: '#1F2937' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Right Column */}
        <motion.div variants={staggerItem} className="lg:col-span-3 space-y-6">
          {/* AI Insight */}
          <Card className="border-[#1E3A8A]/30! bg-[#0B1220]!" hover={false}>
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-4 h-4 text-[#06B6D4]" />
              <h3 className="text-sm font-semibold text-[#E5E7EB]">AI Insight</h3>
            </div>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">
              {weakTopics.length > 0
                ? `${weakTopics[0].topic} is currently your weakest topic (${Math.round(weakTopics[0].accuracy)}% accuracy).`
                : 'Performance is stable. Increase medium and hard problem volume for faster growth.'}
            </p>
          </Card>

          {/* Weakness Analysis */}
          <Card hover={false}>
            <h3 className="text-sm font-semibold text-[#E5E7EB] mb-4">Topic Analysis</h3>
            <div className="space-y-3">
              {topicStrength.slice(0, 8).map((w) => (
                <div key={w.topic} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          w.classification === 'strong' ? '#10B981' :
                          w.classification === 'average' ? '#F59E0B' : '#EF4444'
                      }}
                    />
                    <span className="text-sm text-[#E5E7EB]">{w.topic}</span>
                  </div>
                  <TopicBadge
                    topic={w.classification}
                    variant={w.classification as 'strong' | 'average' | 'weak'}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card hover={false}>
            <h3 className="text-sm font-semibold text-[#E5E7EB] mb-4 flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-[#06B6D4]" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              {recentSubmissions.map((activity, idx) => (
                <div key={`${activity.problem_id}-${idx}`} className="p-3 rounded-xl border border-[#1F2937]/40 bg-[#0B1120]/60">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-[#E5E7EB] truncate">Problem #{activity.problem_id}</p>
                    <span className="text-[10px] text-[#9CA3AF] shrink-0">{new Date(activity.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-[#9CA3AF] mt-1">Submission status: {activity.status}</p>
                </div>
              ))}
              {recentSubmissions.length === 0 ? <p className="text-xs text-[#9CA3AF]">No submissions yet.</p> : null}
            </div>
          </Card>

          {/* Quick Stats */}
          <Card hover={false}>
            <h3 className="text-sm font-semibold text-[#E5E7EB] mb-3">Classification</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-xl bg-[#10B981]/10 border border-[#10B981]/10">
                <p className="text-xl font-bold text-[#10B981]">{strongTopics.length}</p>
                <p className="text-[10px] text-[#9CA3AF] mt-1">Strong</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/10">
                <p className="text-xl font-bold text-[#F59E0B]">{avgTopics.length}</p>
                <p className="text-[10px] text-[#9CA3AF] mt-1">Average</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/10">
                <p className="text-xl font-bold text-[#EF4444]">{weakTopics.length}</p>
                <p className="text-[10px] text-[#9CA3AF] mt-1">Weak</p>
              </div>
            </div>
          </Card>
        </motion.div>

      </div>
      
      {aiAnalysisRes && (
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           className="mt-8 grid gap-6 lg:grid-cols-2"
        >
          <Card hover={false} className="border-[#6366F1]/20">
            <h3 className="text-sm font-semibold text-[#E5E7EB] mb-4 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-[#6366F1]" />
              Smart Recommendations
            </h3>
            <div className="space-y-4">
              {aiAnalysisRes?.recommendations?.length > 0 ? (
                aiAnalysisRes.recommendations.map((rec: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl border border-[#1F2937]/40 bg-[#0B1120]/60">
                    <h4 className="text-sm font-medium text-[#E5E7EB]">{rec.title}</h4>
                    <p className="text-xs text-[#9CA3AF] mt-1 mb-3">{rec.reason}</p>
                    <button 
                      onClick={() => navigate(`/workspace/${rec.problem_id}`)}
                      className="text-xs font-semibold text-white bg-[#6366F1] hover:bg-[#4F46E5] px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {rec.action_item}
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#9CA3AF]">You are perfectly on track! No urgent recommendations right now.</p>
              )}
            </div>
          </Card>
          
          <Card hover={false} className="border-[#10B981]/20">
            <h3 className="text-sm font-semibold text-[#E5E7EB] mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#10B981]" />
              Learning Pattern Detection
            </h3>
            <div className="space-y-3">
              {aiAnalysisRes?.learning_patterns?.length > 0 ? (
                aiAnalysisRes.learning_patterns.map((pattern: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl border border-[#1F2937]/40 bg-[#0B1120]/60">
                     <Lightbulb className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                     <p className="text-xs text-[#E5E7EB] leading-relaxed">{pattern}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#9CA3AF]">Your learning patterns look stable across the board.</p>
              )}
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>

  );
}
