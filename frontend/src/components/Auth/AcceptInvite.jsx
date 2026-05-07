import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../context/useAuthStore';
import { tenantService } from '../../services/tenantService';

const AcceptInvite = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const { token: authToken, fetchMe } = useAuthStore();

  useEffect(() => {
    const accept = async () => {
      if (!token) {
        toast.error('Invite token missing');
        navigate('/');
        return;
      }

      if (!authToken) {
        navigate(`/login?inviteToken=${encodeURIComponent(token)}`);
        return;
      }

      try {
        await tenantService.acceptInvite(token);
        await fetchMe();
        toast.success('Invite accepted');
        navigate('/dashboard');
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to accept invite');
        navigate('/tenant-setup');
      }
    };

    accept();
  }, [token, authToken, navigate, fetchMe]);

  return <div className="min-h-screen flex items-center justify-center">Processing invite...</div>;
};

export default AcceptInvite;
