import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, CircleDashed, Sparkles } from 'lucide-react';

import { AuthRequiredCard } from '../components/auth/AuthRequiredCard';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/useAuth';
import {
  fetchAssessmentProblems,
  fetchAssessmentSummary,
  fetchSurvey,
  generateRoadmap,
  api,
  submitSurvey,
} from '../services/api';
import type { AssessmentProblem, AssessmentSummary, SurveyPayload } from '../types/coding';

const initialState: SurveyPayload = {
  current_year: '3rd',
  dsa_experience_level: 'Beginner',
  target_companies: [],
  weekly_study_hours: 8,
  preferred_language: 'python',
  preparation_start_date: new Date().toISOString().slice(0, 10),
  goal_timeline_months: 6,
};

export default function Onboarding() {
  const { isAuthenticated, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<SurveyPayload>(initialState);
  const [step, setStep] = useState(1);
  const [skipAssessment, setSkipAssessment] = useState(false);
  const [focusAreas, setFocusAreas] = useState<string[]>(['DSA']);
  const [companiesInput, setCompaniesInput] = useState('Amazon, Google');
  const [assessmentProblems, setAssessmentProblems] = useState<AssessmentProblem[]>([]);
  const [assessmentSummary, setAssessmentSummary] = useState<AssessmentSummary | null>(null);

  const [saving, setSaving] = useState(false);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const steps = ['Welcome', 'Preparation Survey', 'Learning Preferences', 'DSA Assessment', 'Roadmap Generated'];

  useEffect(() => {
    if (!isAuthenticated) return;
    void (async () => {
      try {
        const survey = await fetchSurvey();
        setForm({
          current_year: survey.current_year,
          dsa_experience_level: survey.dsa_experience_level,
          target_companies: survey.target_companies,
          weekly_study_hours: survey.weekly_study_hours,
          preferred_language: survey.preferred_language,
          preparation_start_date: survey.preparation_start_date,
          goal_timeline_months: survey.goal_timeline_months,
        });
        setCompaniesInput(survey.target_companies.join(', '));
      } catch {
        // No survey yet.
      }
    })();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || step !== 4 || skipAssessment) return;
    void (async () => {
      try {
        const [problems, summary] = await Promise.all([
          fetchAssessmentProblems(),
          fetchAssessmentSummary().catch(() => null),
        ]);
        setAssessmentProblems(problems);
        setAssessmentSummary(summary);
      } catch {
        setAssessmentProblems([]);
      }
    })();
  }, [isAuthenticated, skipAssessment, step]);

  const companies = useMemo(
    () => companiesInput.split(',').map((item) => item.trim()).filter(Boolean),
    [companiesInput]
  );

  const handleSubmitSurvey = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    setSaving(true);
    setErrorText(null);
    try {
      await submitSurvey({ ...form, target_companies: companies });
      setStatusText('Survey saved. Continue to optional assessment and roadmap generation.');
      setStep(3);
    } catch (error) {
      setErrorText('Unable to save survey. Please verify fields and retry.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    setGeneratingRoadmap(true);
    setErrorText(null);
    setStatusText(null);
    try {
      const plan = await generateRoadmap();
      setStatusText(`Roadmap generated successfully with ${plan.days.length} days.`);
      setStep(5);
    } catch (error) {
      setErrorText('Roadmap generation failed. Ensure survey is saved, then retry generation.');
    } finally {
      setGeneratingRoadmap(false);
    }
  };

  const handleStartDsaAssessment = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    setErrorText(null);
    try {
      const response = await api.post('/assessment/start');
      navigate(`/assessment/${response.data.session_id}/arena`);
    } catch {
      setErrorText('Unable to start DSA assessment. Opening assessment tab instead.');
      navigate('/assessment');
    }
  };

  const toggleFocusArea = (value: string) => {
    setFocusAreas((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      }
      return [...prev, value];
    });
  };

  const canProceedToGenerate = form.weekly_study_hours > 0 && companies.length > 0;

  return (
    <div className="space-y-6">
      {!isAuthenticated ? (
        <AuthRequiredCard
          title="Login Required"
          message="Sign in to submit your onboarding survey and unlock personalized roadmap generation."
        />
      ) : null}

      <Card hover={false} className="space-y-6 border-[#222A33] bg-[#151B22]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#3B82F6]" />
            <h2 className="text-lg font-semibold text-[#E2E8F0]">PrepIQ Setup</h2>
          </div>
          <p className="text-sm text-[#94A3B8]">Step {step} of 5</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-5">
          {steps.map((item, index) => {
            const stepNumber = index + 1;
            const done = stepNumber < step;
            const active = stepNumber === step;
            return (
              <button
                key={item}
                onClick={() => setStep(stepNumber)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs ${
                  active
                    ? 'border-[#3B82F6]/50 bg-[#1D4ED8]/15 text-[#BFDBFE]'
                    : 'border-[#222A33] bg-[#0F141A] text-[#9CA3AF]'
                }`}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : active ? <Circle className="h-3.5 w-3.5" /> : <CircleDashed className="h-3.5 w-3.5" />}
                <span>{item}</span>
              </button>
            );
          })}
        </div>

        {step === 1 ? (
          <div className="space-y-4 rounded-xl border border-[#222A33] bg-[#0F141A] p-5">
            <h3 className="text-base font-semibold text-[#E5E7EB]">Welcome to PrepIQ</h3>
            <p className="text-sm text-[#CBD5E1]">
              PrepIQ builds an adaptive preparation roadmap using your survey profile, assessment signal, and coding behavior.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStep(2)}
                className="rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white"
              >
                Start Setup
              </button>
              <button
                onClick={() => {
                  setSkipAssessment(true);
                  setStep(2);
                }}
                className="rounded-lg border border-[#334155] bg-[#11161D] px-4 py-2 text-sm text-[#CBD5E1]"
              >
                Skip Assessment
              </button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm text-[#CBD5E1]">
            <span>Current Year</span>
            <select
              value={form.current_year}
              onChange={(event) => setForm((prev) => ({ ...prev, current_year: event.target.value as SurveyPayload['current_year'] }))}
              className="h-11 w-full rounded-xl border border-[#1F2937] bg-[#0B1120] px-3"
            >
              <option value="2nd">2nd</option>
              <option value="3rd">3rd</option>
              <option value="Final">Final</option>
            </select>
          </label>

          <label className="space-y-1 text-sm text-[#CBD5E1]">
            <span>DSA Experience</span>
            <select
              value={form.dsa_experience_level}
              onChange={(event) => setForm((prev) => ({ ...prev, dsa_experience_level: event.target.value as SurveyPayload['dsa_experience_level'] }))}
              className="h-11 w-full rounded-xl border border-[#1F2937] bg-[#0B1120] px-3"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </label>

          <label className="space-y-1 text-sm text-[#CBD5E1] md:col-span-2">
            <span>Target Companies (comma separated)</span>
            <input
              value={companiesInput}
              onChange={(event) => setCompaniesInput(event.target.value)}
              className="h-11 w-full rounded-xl border border-[#1F2937] bg-[#0B1120] px-3"
              placeholder="Amazon, Google, Microsoft"
            />
          </label>

          <label className="space-y-1 text-sm text-[#CBD5E1]">
            <span>Weekly Study Hours</span>
            <input
              type="number"
              min={1}
              max={80}
              value={form.weekly_study_hours}
              onChange={(event) => setForm((prev) => ({ ...prev, weekly_study_hours: Number(event.target.value) }))}
              className="h-11 w-full rounded-xl border border-[#1F2937] bg-[#0B1120] px-3"
            />
          </label>

          <label className="space-y-1 text-sm text-[#CBD5E1]">
            <span>Preferred Language</span>
            <select
              value={form.preferred_language}
              onChange={(event) => setForm((prev) => ({ ...prev, preferred_language: event.target.value as SurveyPayload['preferred_language'] }))}
              className="h-11 w-full rounded-xl border border-[#1F2937] bg-[#0B1120] px-3"
            >
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
          </label>

          <label className="space-y-1 text-sm text-[#CBD5E1]">
            <span>Preparation Start Date</span>
            <input
              type="date"
              value={form.preparation_start_date}
              onChange={(event) => setForm((prev) => ({ ...prev, preparation_start_date: event.target.value }))}
              className="h-11 w-full rounded-xl border border-[#1F2937] bg-[#0B1120] px-3"
            />
          </label>

          <label className="space-y-1 text-sm text-[#CBD5E1]">
            <span>Goal Timeline</span>
            <select
              value={form.goal_timeline_months}
              onChange={(event) => setForm((prev) => ({ ...prev, goal_timeline_months: Number(event.target.value) as 3 | 6 }))}
              className="h-11 w-full rounded-xl border border-[#1F2937] bg-[#0B1120] px-3"
            >
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
            </select>
          </label>
            <div className="md:col-span-2 flex gap-2">
              <button
                onClick={() => void handleSubmitSurvey()}
                disabled={saving}
                className="rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Survey & Continue'}
              </button>
              <button
                onClick={() => setStep(1)}
                className="rounded-lg border border-[#334155] bg-[#11161D] px-4 py-2 text-sm text-[#CBD5E1]"
              >
                Back
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4 rounded-xl border border-[#222A33] bg-[#0F141A] p-5">
            <h3 className="text-base font-semibold text-[#E5E7EB]">Learning Preferences</h3>
            <div className="flex flex-wrap gap-2">
              {['DSA', 'Competitive Programming', 'System Design', 'Interview Preparation'].map((item) => {
                const selected = focusAreas.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleFocusArea(item)}
                    className={`rounded-lg border px-3 py-1.5 text-sm ${
                      selected
                        ? 'border-[#3B82F6]/60 bg-[#1D4ED8]/15 text-[#BFDBFE]'
                        : 'border-[#334155] bg-[#11161D] text-[#CBD5E1]'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[#94A3B8]">
              Focus areas are used in client-side prioritization and will be folded into roadmap interpretation.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setStep(4)} className="rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white">
                Continue
              </button>
              <button onClick={() => setStep(2)} className="rounded-lg border border-[#334155] bg-[#11161D] px-4 py-2 text-sm text-[#CBD5E1]">
                Back
              </button>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4 rounded-xl border border-[#222A33] bg-[#0F141A] p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#E5E7EB]">Optional DSA Assessment</h3>
              <button
                onClick={() => setSkipAssessment((prev) => !prev)}
                className="rounded-lg border border-[#334155] bg-[#11161D] px-3 py-1.5 text-xs text-[#CBD5E1]"
              >
                {skipAssessment ? 'Use Assessment' : 'Skip Assessment'}
              </button>
            </div>

            {skipAssessment ? (
              <p className="text-sm text-[#94A3B8]">Assessment skipped. Roadmap will be generated from survey and submission behavior.</p>
            ) : (
              <>
                <p className="text-sm text-[#CBD5E1]">
                  Assessment set: 5 Easy, 3 Medium, 1 Hard over Arrays, Strings, Recursion, Hashing, Binary Search.
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  {assessmentProblems.slice(0, 9).map((item) => (
                    <div key={item.id} className="rounded-lg border border-[#222A33] bg-[#11161D] px-3 py-2">
                      <p className="text-sm text-[#E5E7EB]">{item.title}</p>
                      <p className="text-xs text-[#94A3B8]">{item.topic} • {item.difficulty}</p>
                    </div>
                  ))}
                </div>
                {assessmentSummary ? (
                  <div className="rounded-lg border border-[#222A33] bg-[#11161D] p-3 text-sm text-[#CBD5E1]">
                    Latest metrics: Accuracy {assessmentSummary.accuracy}% • Attempts {assessmentSummary.attempts} • Average runtime {assessmentSummary.avg_runtime_ms}ms
                  </div>
                ) : (
                  <p className="text-xs text-[#94A3B8]">No assessment attempts found yet. You can still generate roadmap.</p>
                )}
              </>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => void handleStartDsaAssessment()}
                disabled={skipAssessment}
                className="rounded-lg border border-[#334155] bg-[#11161D] px-4 py-2 text-sm text-[#CBD5E1] disabled:opacity-50"
              >
                Start DSA Test
              </button>
              <button
                onClick={() => void handleGenerateRoadmap()}
                disabled={!canProceedToGenerate || generatingRoadmap}
                className="rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {generatingRoadmap ? 'Generating...' : 'Generate Initial Roadmap'}
              </button>
              <button onClick={() => setStep(3)} className="rounded-lg border border-[#334155] bg-[#11161D] px-4 py-2 text-sm text-[#CBD5E1]">
                Back
              </button>
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="rounded-xl border border-[#14532D]/40 bg-[#052E16]/30 p-5 text-[#BBF7D0]">
            <h3 className="text-base font-semibold">Roadmap Generated</h3>
            <p className="mt-2 text-sm">Your 30-day roadmap is active. Continue in the Roadmap page to track daily tasks, completion, and progress analytics.</p>
          </div>
        ) : null}

        {statusText ? <p className="text-sm text-[#22C55E]">{statusText}</p> : null}
        {errorText ? <p className="text-sm text-[#FCA5A5]">{errorText}</p> : null}
      </Card>
    </div>
  );
}
