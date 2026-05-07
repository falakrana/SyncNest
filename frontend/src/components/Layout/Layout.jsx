import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, LogOut, Menu, ShieldCheck, X } from 'lucide-react';
import useAuthStore from '../../context/useAuthStore';
import { tenantService } from '../../services/tenantService';
import toast from 'react-hot-toast';

const Layout = ({ children }) => {
  const { user, logout, fetchMe } = useAuthStore();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [leavingWorkspace, setLeavingWorkspace] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLeaveWorkspace = async () => {
    if (leavingWorkspace) return;
    setLeavingWorkspace(true);
    try {
      await tenantService.leaveWorkspace();
      await fetchMe();
      toast.success('You left the workspace');
      navigate('/tenant-setup');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to leave workspace');
    } finally {
      setLeavingWorkspace(false);
    }
  };
  const isAdminAccount = ['admin', 'owner'].includes((user?.tenant_role || '').toLowerCase());
  const isOwner = (user?.tenant_role || '').toLowerCase() === 'owner';

  const handleTransferOwnership = async () => {
    const email = window.prompt('Enter teammate email to transfer workspace ownership:');
    if (!email || !email.trim()) return;

    try {
      const response = await tenantService.transferOwnership(email.trim());
      await fetchMe();
      toast.success(response?.message || 'Ownership transferred successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to transfer ownership');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar backdrop"
          className="fixed inset-0 z-30 bg-slate-900/45 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col transform transition-transform duration-300 ease-out md:static md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 text-2xl font-bold border-b border-slate-800 flex items-center gap-2">
          <FolderKanban className="text-blue-400" />
          <span>SyncNest</span>
          <button
            type="button"
            aria-label="Close navigation"
            className="ml-auto md:hidden rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/projects"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <FolderKanban size={20} />
            <span>Projects</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              {isAdminAccount && (
                <div className="mb-1">
                  <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-300 border border-sky-400/35">
                    <ShieldCheck size={10} />
                    Admin
                  </span>
                </div>
              )}
              <p className="font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          {isOwner && (
            <button
              onClick={handleTransferOwnership}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-sky-900/30 text-sky-300 transition-colors mt-2"
            >
              <ShieldCheck size={20} />
              <span>Transfer Ownership</span>
            </button>
          )}
          <button
            onClick={handleLeaveWorkspace}
            disabled={leavingWorkspace}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-amber-900/30 text-amber-300 transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <X size={20} />
            <span>{leavingWorkspace ? 'Leaving...' : 'Leave Workspace'}</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-900/30 text-red-400 transition-colors mt-2"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mb-4 md:hidden">
          <button
            type="button"
            aria-label="Open navigation"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-white shadow-sm"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={18} />
            <span className="text-sm font-semibold">Menu</span>
          </button>
        </div>
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
