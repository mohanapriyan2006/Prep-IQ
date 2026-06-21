import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';

import { useAuth } from '../../context/useAuth';
import { generateRoadmap, submitSurvey } from '../../services/api';
import type { SurveyPayload } from '../../types/coding';

const defaultSurvey: SurveyPayload = {
  current_year: '3rd',
  dsa_experience_level: 'Beginner',
  target_companies: ['Amazon'],
  weekly_study_hours: 10,
  preferred_language: 'python',
  preparation_start_date: new Date().toISOString().slice(0, 10),
  goal_timeline_months: 6,
};

export function SetupOnboardingModal() {
  const { setupModalOpen, setupRequired, closeSetupModal, completeSetupFlow } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<SurveyPayload>(defaultSurvey);
  const [companiesInput, setCompaniesInput] = useState(defaultSurvey.target_companies.join(', '));
  const [weakAreasInput, setWeakAreasInput] = useState('');
  const [confidence, setConfidence] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const companies = useMemo(
    () => companiesInput.split(',').map((item) => item.trim()).filter(Boolean),
    [companiesInput]
  );
  
  const weakAreas = useMemo(
    () => weakAreasInput.split(',').map((item) => item.trim()).filter(Boolean),
    [weakAreasInput]
  );

  const onCompleteSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      await submitSurvey({ 
        ...form, 
        target_companies: companies, 
        weak_areas: weakAreas, 
        confidence_level: confidence 
      });
      await generateRoadmap();
      completeSetupFlow();
    } catch {
      setError('Failed to complete initial setup. Please verify details and retry.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <AnimatePresence>
      {setupModalOpen ? (
        <>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!setupRequired) {
                closeSetupModal();
              }
            }}
            className="fixed inset-0 z-125 bg-[#020617]/75 backdrop-blur-md"
            aria-label="Close setup dialog"
          />
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="fixed left-1/2 top-1/2 z-126 w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-[#222A33] bg-[#0B1120]"
          >
            <div className="relative border-b border-[#1F2937]/60 px-5 py-4">
              {!setupRequired ? (
                <button
                  onClick={closeSetupModal}
                  className="absolute right-4 top-4 rounded-lg border border-[#1F2937] bg-[#0F172A] p-1.5 text-[#9CA3AF] hover:text-[#E5E7EB]"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#60A5FA]" />
                <p className="text-lg font-semibold text-[#E5E7EB]">Initial Setup - Step {step} of 4</p>
              </div>
              <p className="mt-1 text-xs text-[#94A3B8]">
                Help us customize your learning roadmap perfectly to your goals.
              </p>
            </div>

            <div className="p-6">
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-lg text-white">Your Background</h3>
                  <label className="block space-y-2 text-sm text-[#CBD5E1]">
                    <span>Current Year of Study</span>
                    <select
                      value={form.current_year}
                      onChange={(event) => setForm((prev) => ({ ...prev, current_year: event.target.value as SurveyPayload['current_year'] }))}
                      className="h-11 w-full rounded-xl border border-[#1F2937] bg-[#0B1120] px-3 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="2nd">2nd Year</option>
                      <option value="3rd">3rd Year</option>
                      <option value="Final">Final Year / Graduate</option>
                    </select>
                  </label>
                  <label className="block space-y-2 text-sm text-[#CBD5E1]">
                    <span>Current DSA Experience</span>
                    <select
                      value={form.dsa_experience_level}
                      onChange={(event) => setForm((prev) => ({ ...prev, dsa_experience_level: event.target.value as SurveyPayload['dsa_experience_level'] }))}
                      className="h-11 w-full rounded-xl border border-[#1F2937] bg-[#0B1120] px-3 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Beginner">Beginner (Just starting)</option>
                      <option value="Intermediate">Intermediate (Can solve easy to medium)</option>
                      <option value="Advanced">Advanced (Contest ready)</option>
                    </select>
                  </label>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-lg text-white">Your Targets</h3>
                  <label className="block space-y-2 text-sm text-[#CBD5E1]">
                    <span>Target Companies (comma separated)</span>
                    <input
                      value={companiesInput}
                      onChange={(event) => setCompaniesInput(event.target.value)}
                      className="h-11 w-full rounded-xl border border-[#1F2937] bg-[#0B1120] px-3 focus:ring-2 focus:ring-blue-500"
                      placeholder="Amazon, Google, Microsoft, Startup XYZ"
                    />
                  </label>
                  <label className="block space-y-2 text-sm text-[#CBD5E1]">
                    <span>Preferred Programming Language</span>
                    <select
                      value={form.preferred_language}
                      onChange={(event) => setForm((prev) => ({ ...prev, preferred_language: event.target.value as SurveyPayload['preferred_language'] }))}
                      className="h-11 w-full rounded-xl border border-[#1F2937] bg-[#0B1120] px-3 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                    </select>
                  </label>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-lg text-white">Self Assessment</h3>
                  <label className="block space-y-2 text-sm text-[#CBD5E1]">
                    <span>Which topics do you feel weakest in? (Comma separated)</span>
                    <input
                      value={weakAreasInput}
                      onChange={(event) => setWeakAreasInput(event.target.value)}
                      className="h-11 w-full rounded-xl border border-[#1F2937] bg-[#0B1120] px-3 focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Dynamic Programming, Graphs"
                    />
                  </label>
                  <label className="block space-y-2 text-sm text-[#CBD5E1]">
                    <span>Confidence Level ({confidence}/10)</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={confidence}
                      onChange={(event) => setConfidence(parseInt(event.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </label>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-lg text-white">Commitment</h3>
                  <label className="block space-y-2 text-sm text-[#CBD5E1]">
                    <span>Weekly Study Hours</span>
                    <input
                      type="number"
                      min={1}
                      max={80}
                      value={form.weekly_study_hours}
                      onChange={(event) => setForm((prev) => ({ ...prev, weekly_study_hours: Number(event.target.value) }))}
                      className="h-11 w-full rounded-xl border border-[#1F2937] bg-[#0B1120] px-3 focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="block space-y-2 text-sm text-[#CBD5E1]">
                      <span>Start Date</span>
                      <input
                        type="date"
                        value={form.preparation_start_date}
                        onChange={(event) => setForm((prev) => ({ ...prev, preparation_start_date: event.target.value }))}
                        className="h-11 w-full rounded-xl border border-[#1F2937] bg-[#0B1120] px-3 focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                    <label className="block space-y-2 text-sm text-[#CBD5E1]">
                      <span>Goal Timeline</span>
                      <select
                        value={form.goal_timeline_months}
                        onChange={(event) => setForm((prev) => ({ ...prev, goal_timeline_months: Number(event.target.value) as 3 | 6 }))}
                        className="h-11 w-full rounded-xl border border-[#1F2937] bg-[#0B1120] px-3 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={3}>3 months fast track</option>
                        <option value={6}>6 months comprehensive</option>
                      </select>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-[#1F2937]/60 px-5 py-4 bg-[#0F172A]">
              {error ? <p className="mb-3 text-sm text-[#FCA5A5]">{error}</p> : null}
              <div className="flex justify-between">
                <button
                  onClick={prevStep}
                  disabled={step === 1}
                  className="rounded-lg border border-[#334155] bg-[#11161D] px-4 py-2 text-sm text-[#CBD5E1] disabled:opacity-50"
                >
                  Back
                </button>
                {step < 4 ? (
                  <button
                    onClick={nextStep}
                    className="rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
                  >
                    Next Options
                  </button>
                ) : (
                  <button
                    onClick={() => void onCompleteSetup()}
                    disabled={loading || companies.length === 0}
                    className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 hover:bg-blue-600"
                  >
                    {loading ? 'Initializing Ai...' : 'Generate My Roadmap'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
