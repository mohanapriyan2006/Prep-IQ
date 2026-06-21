/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { fetchExternalStats, syncExternalStats } from '../../services/api';
import { RefreshCw } from 'lucide-react';

export function StatsIntegrationPanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const [lcUser, setLcUser] = useState('');
  const [gfgUser, setGfgUser] = useState('');

  const loadData = async () => {
    try {
      const res = await fetchExternalStats();
      setData(res);
      if (res?.leetcode_data?.username) setLcUser(res.leetcode_data.username);
      if (res?.gfg_data?.username) setGfgUser(res.gfg_data.username);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSync = async () => {
    setLoading(true);
    try {
      await syncExternalStats({
        leetcode_username: lcUser || undefined,
        gfg_username: gfgUser || undefined
      });
      await loadData();
      alert('Sync complete!');
    } catch (e) {
      alert('Failed to sync via scraping. You might need to manually fallback.' + e);
    } finally {
      setLoading(false);
    }
  };

  // Derived unified metrics
  const leetcodeSolved = data?.leetcode_data?.total_solved || 0;
  const gfgSolved = data?.gfg_data?.problems_solved || 0;
  const lcContest = data?.leetcode_data?.contest_rating || 'N/A';
  const gfgScore = data?.gfg_data?.coding_score || 'N/A';

  return (
    <Card className="col-span-full">
      <div className="mb-4 flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold text-[#E5E7EB]">External Connected Platforms</h3>
        <button onClick={handleSync} disabled={loading} className="p-2 bg-[#1F2937] hover:bg-[#374151] rounded-lg transition" title="Sync External Stats">
          <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex border rounded border-[#1F2937] overflow-hidden">
            <span className="bg-[#1F2937] px-3 py-2 text-sm text-gray-400 font-medium">LeetCode Username</span>
            <input 
              type="text" 
              value={lcUser} 
              onChange={e => setLcUser(e.target.value)} 
              className="flex-1 bg-transparent px-3 text-white focus:outline-none" 
              placeholder="e.g. neetcode"
            />
          </div>
          <div className="flex border rounded border-[#1F2937] overflow-hidden">
            <span className="bg-[#1F2937] px-3 py-2 text-sm text-gray-400 font-medium">GFG Username</span>
            <input 
              type="text" 
              value={gfgUser} 
              onChange={e => setGfgUser(e.target.value)} 
              className="flex-1 bg-transparent px-3 text-white focus:outline-none" 
              placeholder="e.g. gaurav123"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-[#0F172A] p-4 rounded-xl shadow-inner border border-[#1E293B]">
            <p className="text-xs text-gray-500 font-semibold mb-1">Total LeetCode Solved</p>
            <p className="text-2xl text-blue-400 font-bold">{leetcodeSolved}</p>
          </div>
          <div className="bg-[#0F172A] p-4 rounded-xl shadow-inner border border-[#1E293B]">
            <p className="text-xs text-gray-500 font-semibold mb-1">LeetCode Contest Rating</p>
            <p className="text-2xl text-purple-400 font-bold">{lcContest}</p>
          </div>
          <div className="bg-[#0F172A] p-4 rounded-xl shadow-inner border border-[#1E293B]">
            <p className="text-xs text-gray-500 font-semibold mb-1">Total GFG Solved</p>
            <p className="text-2xl text-green-400 font-bold">{gfgSolved}</p>
          </div>
          <div className="bg-[#0F172A] p-4 rounded-xl shadow-inner border border-[#1E293B]">
            <p className="text-xs text-gray-500 font-semibold mb-1">GFG Coding Score</p>
            <p className="text-2xl text-yellow-400 font-bold">{gfgScore}</p>
          </div>
        </div>
        
        {data?.last_synced && (
          <p className="text-xs text-gray-600 mt-4 text-right">
            Last synced: {new Date(data.last_synced).toLocaleString()}
          </p>
        )}
      </div>
    </Card>
  );
}
