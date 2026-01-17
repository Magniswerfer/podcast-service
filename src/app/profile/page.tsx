'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ClipboardDocumentIcon, CheckIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { formatDate, useDateFormat, type DateFormat } from '@/lib/date-format';

interface Profile {
  id: string;
  email: string;
  apiKey: string;
  fullApiKey: string;
  defaultSettings: {
    episodeFilter?: 'all' | 'unplayed' | 'uncompleted' | 'in-progress';
    episodeSort?: 'newest' | 'oldest';
    dateFormat?: DateFormat;
  };
  createdAt: string;
  hasPassword: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter settings
  const [episodeFilter, setEpisodeFilter] = useState<string>('all');
  const [episodeSort, setEpisodeSort] = useState<string>('newest');
  const [dateFormat, setDateFormat] = useState<DateFormat>('MM/DD/YYYY');
  
  // Get user's date format preference
  const userDateFormat = useDateFormat();

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Modals
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch profile');
      }
      const data = await response.json();
      setProfile(data);
      setEpisodeFilter(data.defaultSettings?.episodeFilter || 'all');
      setEpisodeSort(data.defaultSettings?.episodeSort || 'newest');
      setDateFormat(data.defaultSettings?.dateFormat || 'MM/DD/YYYY');
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const copyApiKey = async () => {
    if (!profile) return;
    try {
      await navigator.clipboard.writeText(profile.fullApiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  const saveDefaultSettings = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultSettings: {
            episodeFilter,
            episodeSort,
            dateFormat,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save settings');
      }

      setSuccess('Default settings saved successfully');
      // Clear cached date format to refresh
      sessionStorage.removeItem('userDateFormat');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const regenerateApiKey = async () => {
    setRegenerating(true);
    setError('');

    try {
      const response = await fetch('/api/profile/regenerate-api-key', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to regenerate API key');
      }

      const data = await response.json();
      setProfile(prev => prev ? { ...prev, apiKey: data.apiKey.slice(0, 8) + '****' + data.apiKey.slice(-4), fullApiKey: data.apiKey } : null);
      setSuccess('API key regenerated. Please update any applications using the old key.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate API key');
    } finally {
      setRegenerating(false);
      setShowRegenModal(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    setChangingPassword(true);

    try {
      const response = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPassword || undefined,
          newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to change password');
      }

      setPasswordSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setProfile(prev => prev ? { ...prev, hasPassword: true } : null);
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const resetSubscriptions = async () => {
    setResetting(true);
    setError('');

    try {
      const response = await fetch('/api/profile/reset-subscriptions', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reset subscriptions');
      }

      const data = await response.json();
      setSuccess(`Reset complete. Deleted ${data.deleted.subscriptions} subscriptions, ${data.deleted.queue} queue items, ${data.deleted.history} history entries, ${data.deleted.playlists} playlists.`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset subscriptions');
    } finally {
      setResetting(false);
      setShowResetModal(false);
    }
  };

  const formatProfileDate = (dateString: string) => {
    return formatDate(dateString, userDateFormat);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-[#a0a0a0]">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-[#a0a0a0]">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Profile Settings</h1>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 bg-red-900/20 border border-red-800 rounded-[12px] p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-6 bg-green-900/20 border border-green-800 rounded-[12px] p-4">
          <p className="text-sm text-green-400">{success}</p>
        </div>
      )}

      {/* Account Info */}
      <Card hover={false} className="p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#a0a0a0] mb-1">Email</label>
            <p className="text-white">{profile.email}</p>
          </div>
          <div>
            <label className="block text-sm text-[#a0a0a0] mb-1">Member Since</label>
            <p className="text-white">{formatProfileDate(profile.createdAt)}</p>
          </div>
        </div>
      </Card>

      {/* API Keys */}
      <Card hover={false} className="p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">API Key</h2>
        <p className="text-sm text-[#a0a0a0] mb-4">
          Use this key to authenticate with external applications (e.g., iOS app, automation scripts).
        </p>
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-[12px] px-4 py-2 font-mono text-sm">
            {showApiKey ? profile.fullApiKey : profile.apiKey}
          </div>
          <Button
            variant="icon"
            onClick={() => setShowApiKey(!showApiKey)}
            title={showApiKey ? 'Hide API key' : 'Show API key'}
          >
            {showApiKey ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </Button>
          <Button
            variant="icon"
            onClick={copyApiKey}
            title="Copy API key"
          >
            {copied ? <CheckIcon className="h-5 w-5 text-green-500" /> : <ClipboardDocumentIcon className="h-5 w-5" />}
          </Button>
        </div>
        <Button
          variant="secondary"
          onClick={() => setShowRegenModal(true)}
          disabled={regenerating}
        >
          {regenerating ? 'Regenerating...' : 'Regenerate API Key'}
        </Button>
        <p className="text-xs text-[#a0a0a0] mt-2">
          Warning: Regenerating your API key will invalidate the current key. Any applications using it will need to be updated.
        </p>
      </Card>

      {/* Default Filtering */}
      <Card hover={false} className="p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Default Filtering</h2>
        <p className="text-sm text-[#a0a0a0] mb-4">
          Set default episode filter and sort order. These can be overridden per podcast.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-[#e5e5e5] mb-2">
              Episode Filter
            </label>
            <select
              value={episodeFilter}
              onChange={(e) => setEpisodeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-[#2a2a2a] rounded-[12px] bg-[#1a1a1a] text-white focus:outline-none focus:border-[#FF3B30] transition-all duration-200"
            >
              <option value="all">All Episodes</option>
              <option value="unplayed">Unplayed</option>
              <option value="uncompleted">Uncompleted</option>
              <option value="in-progress">In Progress</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#e5e5e5] mb-2">
              Sort Order
            </label>
            <select
              value={episodeSort}
              onChange={(e) => setEpisodeSort(e.target.value)}
              className="w-full px-4 py-2 border border-[#2a2a2a] rounded-[12px] bg-[#1a1a1a] text-white focus:outline-none focus:border-[#FF3B30] transition-all duration-200"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={saveDefaultSettings}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Default Settings'}
        </Button>
      </Card>

      {/* Date Format */}
      <Card hover={false} className="p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Date Format</h2>
        <p className="text-sm text-[#a0a0a0] mb-4">
          Choose how dates are displayed throughout the application.
        </p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#e5e5e5] mb-2">
            Date Format
          </label>
          <select
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value as DateFormat)}
            className="w-full max-w-md px-4 py-2 border border-[#2a2a2a] rounded-[12px] bg-[#1a1a1a] text-white focus:outline-none focus:border-[#FF3B30] transition-all duration-200"
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY (e.g., 01/17/2026)</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY (e.g., 17/01/2026)</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD (e.g., 2026-01-17)</option>
          </select>
        </div>
        <Button
          variant="primary"
          onClick={saveDefaultSettings}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Date Format'}
        </Button>
      </Card>

      {/* Security */}
      <Card hover={false} className="p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Security</h2>
        <form onSubmit={changePassword} className="space-y-4">
          {passwordError && (
            <div className="bg-red-900/20 border border-red-800 rounded-[12px] p-3">
              <p className="text-sm text-red-400">{passwordError}</p>
            </div>
          )}
          {passwordSuccess && (
            <div className="bg-green-900/20 border border-green-800 rounded-[12px] p-3">
              <p className="text-sm text-green-400">{passwordSuccess}</p>
            </div>
          )}
          
          {profile.hasPassword && (
            <div>
              <label className="block text-sm font-medium text-[#e5e5e5] mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border border-[#2a2a2a] rounded-[12px] bg-[#1a1a1a] text-white placeholder-[#a0a0a0] focus:outline-none focus:border-[#FF3B30] transition-all duration-200"
                placeholder="Enter current password"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[#e5e5e5] mb-2">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-[#2a2a2a] rounded-[12px] bg-[#1a1a1a] text-white placeholder-[#a0a0a0] focus:outline-none focus:border-[#FF3B30] transition-all duration-200"
              placeholder="Enter new password (min 8 characters)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#e5e5e5] mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-[#2a2a2a] rounded-[12px] bg-[#1a1a1a] text-white placeholder-[#a0a0a0] focus:outline-none focus:border-[#FF3B30] transition-all duration-200"
              placeholder="Confirm new password"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={changingPassword || !newPassword || !confirmPassword}
          >
            {changingPassword ? 'Changing...' : profile.hasPassword ? 'Change Password' : 'Set Password'}
          </Button>
        </form>
      </Card>

      {/* Danger Zone */}
      <Card hover={false} className="p-6 border-red-900/50">
        <h2 className="text-xl font-semibold text-red-400 mb-4">Danger Zone</h2>
        <p className="text-sm text-[#a0a0a0] mb-4">
          This will permanently delete all your subscriptions, playlists, queue items, favorites, and listening history. Your account and API key will remain intact.
        </p>
        <Button
          variant="secondary"
          onClick={() => setShowResetModal(true)}
          disabled={resetting}
          className="border-red-900 hover:border-red-700 text-red-400 hover:text-red-300"
        >
          {resetting ? 'Resetting...' : 'Reset All Subscriptions'}
        </Button>
      </Card>

      {/* Regenerate API Key Modal */}
      {showRegenModal && (
        <ConfirmModal
          title="Regenerate API Key?"
          message="This will invalidate your current API key. Any applications using it will stop working until updated with the new key."
          confirmText="Regenerate"
          cancelText="Cancel"
          onConfirm={regenerateApiKey}
          onCancel={() => setShowRegenModal(false)}
        />
      )}

      {/* Reset Subscriptions Modal */}
      {showResetModal && (
        <ConfirmModal
          title="Reset All Subscriptions?"
          message="This will permanently delete ALL your subscriptions, playlists, queue items, favorites, and listening history. This action cannot be undone."
          confirmText="Reset Everything"
          cancelText="Cancel"
          onConfirm={resetSubscriptions}
          onCancel={() => setShowResetModal(false)}
        />
      )}
    </div>
  );
}
