import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpenText } from 'lucide-react';
import { Card } from '../ui/Card';
import { fetchProblemEditorial } from '../../services/api';
import type { EditorialResult } from '../../types/coding';

interface EditorialTabProps {
  problemId: number;
  problemTopic: string;
}

export function EditorialTab({ problemId, problemTopic }: EditorialTabProps) {
  const [loading, setLoading] = useState(false);
  const [editorial, setEditorial] = useState<EditorialResult | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    void (async () => {
      try {
        const result = await fetchProblemEditorial(problemId);
        setEditorial(result);
        setErrorText(null);
      } catch {
        setEditorial(null);
        setErrorText('Editorial is temporarily unavailable. Explore tutorials for this topic and retry.');
      } finally {
        setLoading(false);
      }
    })();
  }, [problemId]);

  const handleTutorialNav = (topic: string) => {
    const topicQuery = encodeURIComponent(topic);
    navigate(`/tutorials?topic=${topicQuery}&from=editorial&problemId=${problemId}`);
  };

  return (
    <Card hover={false} className="space-y-4 border-[#1F2937] bg-[#0B1220]">
      <h3 className="text-sm font-semibold text-[#E2E8F0]">Editorial & Approaches</h3>
      {loading ? <p className="text-xs text-[#94A3B8]">Loading editorial...</p> : null}
      {!loading && errorText ? <p className="text-xs text-[#FCA5A5]">{errorText}</p> : null}
      {editorial ? (
        <div className="space-y-4 text-sm text-[#CBD5E1]">
          <div className="bg-[#151B22] p-3 rounded-lg border border-[#1F2937]">
            <p className="whitespace-pre-wrap">{editorial.concept_explanation}</p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-2">Step-by-step Approach</p>
            <ul className="space-y-2 text-xs">
              {editorial.step_by_step.map((item, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-blue-500 font-bold">{idx + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {editorial.optimized_code && (
            <div className="bg-[#151B22] p-3 rounded-lg border border-[#1F2937]">
              <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Optimized Idea</p>
              <p className="text-xs text-[#C7D2FE] font-mono">{editorial.optimized_code}</p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => handleTutorialNav(editorial.tutorial_topic ?? problemTopic)}
              className="flex items-center gap-2 px-3 py-2 bg-[#2563EB]/10 text-blue-400 text-xs font-semibold rounded-lg hover:bg-[#2563EB]/20 transition"
            >
              <BookOpenText className="w-4 h-4" />
              Open Tutorial In App
            </button>
            {editorial.tutorial_link ? (
              <button
                onClick={() => window.open(editorial.tutorial_link!, '_blank')}
                className="flex items-center gap-2 px-3 py-2 border border-[#1F2937] bg-[#111827] text-[#CBD5E1] text-xs font-semibold rounded-lg hover:border-[#334155] transition"
              >
                External Tutorial
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      {!loading && !editorial && !errorText ? (
        <p className="text-xs text-[#94A3B8]">No editorial has been published for this problem yet.</p>
      ) : null}
    </Card>
  );
}
