import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { taskService } from '../../services/taskService';
import { projectService } from '../../services/projectService';
import { CheckCircle2, Circle, Clock, LayoutDashboard, Target } from 'lucide-react';
import toast from 'react-hot-toast';

const UserTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0]?.payload;
  if (!data) {
    return null;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-md">
      <p className="text-sm font-semibold text-slate-900">{data.name || 'Unknown User'}</p>
      <p className="text-xs text-slate-500">{data.email || 'No email available'}</p>
      <p className="text-sm text-blue-600 mt-1">count : {data.count}</p>
    </div>
  );
};

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchStats();
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const data = await projectService.getProjects();
      setProjects(data);
      if (data.length > 0) {
        setSelectedProjectId(data[0].id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      toast.error('Failed to fetch projects');
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await taskService.getDashboardStats(selectedProjectId);
      setStats(data);
    } catch (error) {
      toast.error('Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#94a3b8', '#3b82f6', '#22c55e'];

  if (projects.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-slate-100 p-6 rounded-full mb-6">
          <LayoutDashboard size={48} className="text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">No projects yet</h2>
        <p className="text-slate-500 mb-8 max-w-md">Create your first project to see dashboard analytics and manage tasks.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Analytics Dashboard</h1>
          <p className="text-slate-500">Track performance and task distribution</p>
        </div>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        >
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="py-20 text-center">Loading analytics...</div>
      ) : stats && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Target size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Total Tasks</p>
                  <h3 className="text-2xl font-black text-slate-900">{stats.total_tasks}</h3>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Completed</p>
                  <h3 className="text-2xl font-black text-slate-900">
                    {stats.by_status.find(s => s.status === 'Done')?.count || 0}
                  </h3>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <Circle size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">In Progress</p>
                  <h3 className="text-2xl font-black text-slate-900">
                    {stats.by_status.find(s => s.status === 'In Progress')?.count || 0}
                  </h3>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Overdue</p>
                  <h3 className="text-2xl font-black text-slate-900">{stats.overdue_count}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-8">Tasks by Status</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.by_status}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="status"
                    >
                      {stats.by_status.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Tasks per User</h3>
              <div className="h-64 px-1 pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.by_user} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} tickMargin={8} />
                    <YAxis allowDecimals={false} />
                    <Tooltip content={<UserTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }} />
                    <Bar
                      dataKey="count"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={900}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-center text-xs text-slate-400 mt-5">Task distribution among team members</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
