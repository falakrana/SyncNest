import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../context/useAuthStore';
import { tenantService } from '../../services/tenantService';

const PENDING_INVITE_TOKEN_KEY = 'pendingInviteToken';
const PENDING_INVITE_EMAIL_KEY = 'pendingInviteEmail';

const AcceptInvite = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || localStorage.getItem(PENDING_INVITE_TOKEN_KEY);
  const invitedEmail = (
    params.get('email') || localStorage.getItem(PENDING_INVITE_EMAIL_KEY) || ''
  ).trim().toLowerCase();
  const navigate = useNavigate();
  const { token: authToken, user, fetchMe } = useAuthStore();

  useEffect(() => {
    const accept = async () => {
      if (!token) {
        toast.error('Invite token missing');
        navigate('/');
        return;
      }

      if (!authToken) {
        localStorage.setItem(PENDING_INVITE_TOKEN_KEY, token);
        if (invitedEmail) {
          localStorage.setItem(PENDING_INVITE_EMAIL_KEY, invitedEmail);
        }
        const emailQuery = invitedEmail ? `&inviteEmail=${encodeURIComponent(invitedEmail)}` : '';
        navigate(`/login?inviteToken=${encodeURIComponent(token)}${emailQuery}`);
        return;
      }

      if (invitedEmail && user?.email?.toLowerCase() !== invitedEmail) {
        toast.error(`Please login with ${invitedEmail} to accept this invite`);
        navigate(`/login?inviteToken=${encodeURIComponent(token)}&inviteEmail=${encodeURIComponent(invitedEmail)}`);
        return;
      }

      try {
        await tenantService.acceptInvite(token);
        localStorage.removeItem(PENDING_INVITE_TOKEN_KEY);
        localStorage.removeItem(PENDING_INVITE_EMAIL_KEY);
        await fetchMe();
        toast.success('Invite accepted');
        navigate('/dashboard');
      } catch (error) {
        localStorage.removeItem(PENDING_INVITE_TOKEN_KEY);
        localStorage.removeItem(PENDING_INVITE_EMAIL_KEY);
        toast.error(error.response?.data?.detail || 'Failed to accept invite');
        navigate('/tenant-setup');
      }
    };

    accept();
  }, [token, invitedEmail, authToken, user, navigate, fetchMe]);

  return <div className="min-h-screen flex items-center justify-center">Processing invite...</div>;
};

export default AcceptInvite;
