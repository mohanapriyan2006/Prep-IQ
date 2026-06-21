import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Card } from '../components/ui/Card';
import { fetchRoadmapDayDetails } from '../services/api';
import type { RoadmapDayDetail } from '../types/coding';

export default function RoadmapDetail() {
  const { dayId } = useParams<{ dayId: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<RoadmapDayDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!dayId) return;
    setLoading(true);
    setError('');
    void (async () => {
      try {
        const result = await fetchRoadmapDayDetails(Number(dayId));
        setDetail(result);
      } catch {
        setDetail(null);
        setError('Unable to load roadmap day details. Please generate roadmap and try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [dayId]);

  if (loading) {
    return <Card hover={false}>Loading roadmap day details...</Card>;
  }

  if (error || !detail) {
    return (
      <Card hover={false} className="border border-[#7F1D1D]/40 bg-[#7F1D1D]/20 text-sm text-[#FCA5A5]">
        {error || 'Roadmap day details not found.'}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card hover={false} className="space-y-2 border-[#1D4ED8]/30 bg-[#0E1628]">
        <p className="text-xs uppercase tracking-wide text-[#93C5FD]">Roadmap Day {detail.day_number}</p>
        <h2 className="text-lg font-semibold text-[#E2E8F0]">{detail.topic}</h2>
        <p className="text-sm text-[#CBD5E1]">{detail.estimated_minutes} min • {detail.status}</p>
        <div className="flex flex-wrap gap-2">
          {detail.continue_problem_path ? (
            <button
              type="button"
              onClick={() => navigate(detail.continue_problem_path!)}
              className="rounded-lg bg-[#1D4ED8] px-3 py-2 text-xs font-semibold text-white"
            >
              Continue Task
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => navigate(detail.tutorial_path)}
            className="rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white"
          >
            Open Tutorial
          </button>
          <button
            type="button"
            onClick={() => navigate(detail.practice_path)}
            className="rounded-lg border border-[#334155] bg-[#111827] px-3 py-2 text-xs font-semibold text-[#E2E8F0]"
          >
            Practice Problems
          </button>
          {detail.external_resource_link ? (
            <a
              href={detail.external_resource_link}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-[#334155] bg-[#111827] px-3 py-2 text-xs font-semibold text-[#93C5FD]"
            >
              External Resource
            </a>
          ) : null}
          <Link to="/roadmap" className="rounded-lg border border-[#334155] bg-[#111827] px-3 py-2 text-xs font-semibold text-[#E2E8F0]">
            Back To Roadmap
          </Link>
        </div>
      </Card>

      <Card hover={false} className="space-y-3 border-[#1F2937] bg-[#0B1120]">
        <h3 className="text-sm font-semibold text-[#E5E7EB]">Problems</h3>
        <div className="grid gap-2 md:grid-cols-2">
          {detail.problems.map((problem) => (
            <div key={problem.id} className="rounded-xl border border-[#1F2937]/60 bg-[#0F172A] p-3 text-sm text-[#CBD5E1]">
              <p className="font-semibold text-[#E2E8F0]">{problem.title}</p>
              <p className="mt-1 text-xs text-[#94A3B8]">{problem.difficulty} • {problem.topic}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
                <Link to={problem.problem_path} className="text-[#60A5FA] underline underline-offset-2">Open Problem</Link>
                <Link to={problem.editorial_path} className="text-[#93C5FD] underline underline-offset-2">Open Editorial</Link>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
