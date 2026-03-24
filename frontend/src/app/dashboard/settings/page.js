"use client";

import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';

function ToggleRow({ id, title, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-surface-alt/30 p-4">
      <div>
        <p className="text-sm font-semibold text-charcoal">{title}</p>
        <p className="text-xs text-text-muted mt-1">{description}</p>
      </div>

      <label htmlFor={id} className="relative inline-flex h-7 w-12 cursor-pointer items-center">
        <input
          id={id}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="h-7 w-12 rounded-full bg-border transition-colors peer-checked:bg-primary" />
        <span className="absolute left-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
      </label>
    </div>
  );
}

const DEFAULT_SETTINGS = {
  notificationPreferences: {
    emailSessionReminders: true,
    emailCommunityReplies: true,
    inAppSessionUpdates: true,
    inAppForumActivity: true,
    marketingEmails: false,
  },
  accountPreferences: {
    privateProfile: false,
    twoFactorEnabled: false,
  },
};

export default function DashboardSettingsPage() {
  const { logout } = useAuth();
  const { settings, updateSettings, deleteAccount } = useSettings();

  const [draftForm, setDraftForm] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteForm, setDeleteForm] = useState({ currentPassword: '', confirmText: '' });
  const [deleteSubmitAttempted, setDeleteSubmitAttempted] = useState(false);

  const normalizedDeleteConfirmText = deleteForm.confirmText.trim();
  const normalizedDeletePassword = deleteForm.currentPassword.trim();

  const isDeletePasswordPresent = normalizedDeletePassword.length > 0;
  const isDeletePasswordFormatValid = normalizedDeletePassword.length >= 8;
  const isDeleteKeywordValid = normalizedDeleteConfirmText === 'DELETE';
  const isDeleteConfirmationValid = isDeletePasswordFormatValid && isDeleteKeywordValid;

  const persistedForm = useMemo(() => {
    return {
      notificationPreferences: {
        ...DEFAULT_SETTINGS.notificationPreferences,
        ...settings.data?.notificationPreferences,
      },
      accountPreferences: {
        ...DEFAULT_SETTINGS.accountPreferences,
        ...settings.data?.accountPreferences,
      },
    };
  }, [settings.data]);

  const form = draftForm ?? persistedForm;

  const hasChanges = useMemo(() => {
    if (!settings.data) return false;
    return JSON.stringify(form) !== JSON.stringify(persistedForm);
  }, [form, persistedForm, settings.data]);

  const updateNotificationPreference = (key, value) => {
    setDraftForm((current) => {
      const base = current ?? form;
      return {
        ...base,
        notificationPreferences: {
          ...base.notificationPreferences,
          [key]: value,
        },
      };
    });
  };

  const updateAccountPreference = (key, value) => {
    setDraftForm((current) => {
      const base = current ?? form;
      return {
        ...base,
        accountPreferences: {
          ...base.accountPreferences,
          [key]: value,
        },
      };
    });
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(form);
      setDraftForm(null);
      toast.success('Settings saved');
    } catch (error) {
      toast.error(error.message || 'Failed to save settings');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteAccount.isPending) return;

    if (!isDeleteConfirmationValid) {
      setDeleteSubmitAttempted(true);
      toast.error('Enter your current password and type DELETE exactly to confirm.');
      return;
    }

    try {
      await deleteAccount.mutateAsync({
        currentPassword: normalizedDeletePassword,
        confirmText: 'DELETE',
      });
      toast.success('Your account has been deleted');
      setIsDeleteModalOpen(false);
      setDeleteForm({ currentPassword: '', confirmText: '' });
      setDeleteSubmitAttempted(false);
      logout();
    } catch (error) {
      toast.error(error.message || 'Failed to delete account');
    }
  };

  const handleDeleteSubmit = (e) => {
    e.preventDefault();
    setDeleteSubmitAttempted(true);
    handleDeleteAccount();
  };

  if (settings.isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (settings.error) {
    return (
      <div className="bg-red-50 p-6 rounded-2xl border border-red-200">
        <ErrorMessage message={String(settings.error)} />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-h3 font-bold text-charcoal">Settings</h1>
          <p className="mt-1 text-base text-text-muted">Manage your notifications, privacy, and account controls.</p>
        </div>

        <Card>
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Choose when SoulSupport should notify you.</CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-3">
            <ToggleRow
              id="emailSessionReminders"
              title="Email reminders for sessions"
              description="Get reminder emails before upcoming sessions."
              checked={form.notificationPreferences.emailSessionReminders}
              onChange={(value) => updateNotificationPreference('emailSessionReminders', value)}
            />

            <ToggleRow
              id="emailCommunityReplies"
              title="Email updates for forum replies"
              description="Receive email updates when someone replies to your posts or comments."
              checked={form.notificationPreferences.emailCommunityReplies}
              onChange={(value) => updateNotificationPreference('emailCommunityReplies', value)}
            />

            <ToggleRow
              id="inAppSessionUpdates"
              title="In-app session updates"
              description="Show in-app notifications for bookings, changes, and cancellations."
              checked={form.notificationPreferences.inAppSessionUpdates}
              onChange={(value) => updateNotificationPreference('inAppSessionUpdates', value)}
            />

            <ToggleRow
              id="inAppForumActivity"
              title="In-app community activity"
              description="Notify me when my forum content gets likes or comments."
              checked={form.notificationPreferences.inAppForumActivity}
              onChange={(value) => updateNotificationPreference('inAppForumActivity', value)}
            />

            <ToggleRow
              id="marketingEmails"
              title="Product updates and wellness tips"
              description="Receive occasional product updates, feature announcements, and helpful resources."
              checked={form.notificationPreferences.marketingEmails}
              onChange={(value) => updateNotificationPreference('marketingEmails', value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle>Privacy and Security</CardTitle>
            <CardDescription>Control visibility and extra account safeguards.</CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-3">
            <ToggleRow
              id="privateProfile"
              title="Private profile"
              description="Hide your profile from public discovery pages."
              checked={form.accountPreferences.privateProfile}
              onChange={(value) => updateAccountPreference('privateProfile', value)}
            />

            <ToggleRow
              id="twoFactorEnabled"
              title="Two-factor authentication"
              description="Require an extra verification step during sign-in."
              checked={form.accountPreferences.twoFactorEnabled}
              onChange={(value) => updateAccountPreference('twoFactorEnabled', value)}
            />
          </CardContent>

          <CardFooter className="bg-surface-alt/30 border-t border-border/50">
            <div className="flex justify-end w-full">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || updateSettings.isPending}
                isLoading={updateSettings.isPending}
              >
                Save Preferences
              </Button>
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle>Account Controls</CardTitle>
            <CardDescription>Manage your login session and account lifecycle.</CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            <div className="rounded-xl border border-border/50 bg-surface-alt/30 p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-charcoal">Sign out</p>
                <p className="text-xs text-text-muted mt-1">End your current session on this device.</p>
              </div>
              <Button variant="outline" onClick={logout}>Sign Out</Button>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-red-700">Delete account</p>
                <p className="text-xs text-red-600 mt-1">Permanently remove your account and profile data.</p>
              </div>
              <Button variant="danger" onClick={() => setIsDeleteModalOpen(true)}>
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal
        open={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteForm({ currentPassword: '', confirmText: '' });
          setDeleteSubmitAttempted(false);
        }}
        title="Delete account"
        description="This action cannot be undone. Confirm with your password and type DELETE."
        actions={(
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeleteForm({ currentPassword: '', confirmText: '' });
                setDeleteSubmitAttempted(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={isDeleteConfirmationValid ? 'danger' : 'secondary'}
              form="delete-account-form"
              type="submit"
              className={isDeleteConfirmationValid ? 'bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-700 shadow-md' : 'text-text-muted'}
              isLoading={deleteAccount.isPending}
              disabled={!isDeleteConfirmationValid || deleteAccount.isPending}
              aria-disabled={!isDeleteConfirmationValid || deleteAccount.isPending}
            >
              Confirm Delete
            </Button>
          </div>
        )}
      >
        <form id="delete-account-form" className="space-y-4" onSubmit={handleDeleteSubmit}>
          <Input
            id="delete-account-password"
            name="currentPassword"
            type="password"
            label="Current password"
            autoComplete="current-password"
            value={deleteForm.currentPassword}
            error={deleteSubmitAttempted && !isDeletePasswordPresent ? 'Current password is required.' : undefined}
            onChange={(e) => {
              const nextValue = e.target?.value ?? '';
              setDeleteForm((current) => ({ ...current, currentPassword: nextValue }));
            }}
            onInput={(e) => {
              const nextValue = e.currentTarget?.value ?? e.target?.value ?? '';
              setDeleteForm((current) => ({ ...current, currentPassword: nextValue }));
            }}
            placeholder="Enter your current password"
          />

          {deleteSubmitAttempted && isDeletePasswordPresent && !isDeletePasswordFormatValid && (
            <p className="text-xs text-coral" role="alert">
              Password must be at least 8 characters.
            </p>
          )}

          <Input
            id="delete-account-confirm"
            name="confirmText"
            label='Type "DELETE" to confirm'
            autoComplete="off"
            value={deleteForm.confirmText}
            error={deleteSubmitAttempted && normalizedDeleteConfirmText.length === 0 ? 'Please type DELETE to confirm.' : undefined}
            onChange={(e) => {
              const nextValue = e.target?.value ?? '';
              setDeleteForm((current) => ({ ...current, confirmText: nextValue }));
            }}
            placeholder="DELETE"
          />

          <p className="text-xs text-text-muted">
            To continue, enter your current password and type DELETE in the confirmation field.
          </p>
          {deleteSubmitAttempted && normalizedDeleteConfirmText.length > 0 && !isDeleteKeywordValid && (
            <p className="text-xs text-coral" role="alert">
              Confirmation text must be exactly DELETE.
            </p>
          )}
        </form>
      </Modal>
    </>
  );
}
