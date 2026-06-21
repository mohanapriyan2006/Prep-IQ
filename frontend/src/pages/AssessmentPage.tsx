import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';

import { api } from '../services/api';

interface Session {
  id: number;
  type: string;
  status: string;
  total_score: number | null;
  accuracy: number | null;
  start_time: string;
}

const AssessmentPage: React.FC = () => {
  
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await api.get('/assessment/sessions');
        setSessions(response.data);
      } catch (err) {
        console.error('Failed to load sessions', err);
      }
    };
    fetchSessions();
  }, []);

  const handleStartDSA = async () => {
    try {
      setLoading(true);
      const response = await api.post('/assessment/start');
      navigate(`/assessment/${response.data.session_id}/arena`);
    } catch (err) {
      console.error(err);
      alert('Failed to start assessment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Assessment Center"  />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-[#E5E7EB]">Core DSA Assessment</h3>
          </div>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              A 90-minute timed test containing 9 problems across various difficulties (5 Easy, 3 Medium, 1 Hard).
            </p>
            <ul className="text-sm space-y-1 text-gray-500">
              <li>• Evaluates Arrays, Strings, Recursion, Hashing, Binary Search</li>
              <li>• Performance updates your AI roadmap</li>
              <li>• Automatic submission on timeout</li>
            </ul>
            <button 
              onClick={handleStartDSA} 
              disabled={loading}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Start New Assessment
            </button>
          </div>
        </Card>

        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-[#E5E7EB]">Other Options</h3>
          </div>
          <div className="space-y-4">
            <button 
              onClick={() => navigate('/mock-test')}
              className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <div className="font-semibold">Mock Tests</div>
              <div className="text-xs text-gray-500">Practice full-length tech interviews</div>
            </button>
            <button 
              onClick={() => navigate('/onboarding')}
              className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <div className="font-semibold">Take Survey</div>
              <div className="text-xs text-gray-500">Update your preferences & goals</div>
            </button>
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-[#E5E7EB]">Previous Assessments</h3>
        </div>
        <div>
          {sessions.length === 0 ? (
            <p className="text-gray-500 text-sm">No assessments taken yet.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-auto">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {sessions.map(s => (
                  <tr key={s.id}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">{new Date(s.start_time).toLocaleDateString()}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm capitalize">{s.type.replace('-', ' ')}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${s.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold">
                      {s.total_score !== null ? `${s.total_score} / 9` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AssessmentPage;
