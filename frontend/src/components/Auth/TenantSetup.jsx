import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { tenantService } from '../../services/tenantService';
import useAuthStore from '../../context/useAuthStore';

const TenantSetup = () => {
  const navigate = useNavigate();
  const { fetchMe } = useAuthStore();
  const [tenantName, setTenantName] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await tenantService.createTenant(tenantName.trim());
      await fetchMe();
      toast.success('Workspace created');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await tenantService.acceptInvite(inviteToken.trim());
      await fetchMe();
      toast.success('Joined workspace');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to join workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl border border-slate-200 space-y-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Set up your team workspace</h1>
          <p className="text-slate-500 mt-2">Create a new tenant or join using an invite token.</p>
        </div>

        <form onSubmit={handleCreateTenant} className="space-y-3 border rounded-xl p-4">
          <h2 className="font-bold text-slate-800">Create workspace</h2>
          <input
            type="text"
            required
            placeholder="Workspace name"
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none"
          />
          <button disabled={loading} className="px-5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold">
            Create
          </button>
        </form>

        <form onSubmit={handleAcceptInvite} className="space-y-3 border rounded-xl p-4">
          <h2 className="font-bold text-slate-800">Join with invite token</h2>
          <input
            type="text"
            required
            placeholder="Paste invite token"
            value={inviteToken}
            onChange={(e) => setInviteToken(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none"
          />
          <button disabled={loading} className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-semibold">
            Join
          </button>
        </form>
      </div>
    </div>
  );
};

export default TenantSetup;
