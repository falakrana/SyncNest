import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-cyan-50 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-5xl font-black text-slate-900 mb-4">SyncNest</h1>
        <p className="text-lg text-slate-600 mb-10">
          Team workspace for projects, tasks, and delivery tracking.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/signup" className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold">
            Sign Up
          </Link>
          <Link to="/login" className="px-6 py-3 rounded-xl border border-slate-300 text-slate-800 font-bold bg-white">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Landing;
