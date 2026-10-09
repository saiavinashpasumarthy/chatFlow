import React, { useState } from 'react';
import {
  X,
  Video,
  Calendar,
  Clock,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  LoaderCircle,
  Link2,
} from 'lucide-react';
import { auth } from "../../config/firebase";
import { useToast } from '../../context/ToastContext';

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');

export const CreateMeetingModal = ({
  isOpen,
  onClose,
  onCreate,
  currentUser,
}) => {
  const { addToast } = useToast();

  const [title, setTitle] = useState('');
  const [meetingType, setMeetingType] = useState('instant');
  const [date, setDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [time, setTime] = useState('14:00');
  const [agenda, setAgenda] = useState('');
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdMeeting, setCreatedMeeting] = useState(null);

  if (!isOpen) return null;

  const meetingLink = createdMeeting?.meetingLink || '';

  const handleCopyLink = async () => {
    if (!meetingLink) {
      addToast({
        title: 'Meeting link not ready',
        message: 'Create the meeting first to generate its invitation link.',
        type: 'error',
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(meetingLink);
      setCopied(true);

      addToast({
        title: 'Link copied',
        message: 'The meeting invitation link is ready to share.',
        type: 'success',
      });

      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy meeting link error:', error);

      addToast({
        title: 'Could not copy link',
        message: 'Please copy the meeting link manually.',
        type: 'error',
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (creating) return;

    const user = auth.currentUser;

    if (!user) {
      addToast({
        title: 'Authentication required',
        message: 'Please sign in before creating a meeting.',
        type: 'error',
      });
      return;
    }

    const finalTitle =
      title.trim() ||
      (meetingType === 'instant'
        ? 'Instant Team Huddle'
        : 'Scheduled Meeting');

    let scheduledAt = null;

    if (meetingType === 'scheduled') {
      const localDateTime = new Date(`${date}T${time}`);

      if (
        !date ||
        !time ||
        Number.isNaN(localDateTime.getTime()) ||
        localDateTime.getTime() <= Date.now()
      ) {
        addToast({
          title: 'Invalid schedule',
          message: 'Choose a valid date and time in the future.',
          type: 'error',
        });
        return;
      }

      scheduledAt = localDateTime.toISOString();
    }

    setCreating(true);

    try {
      const idToken = await user.getIdToken();

      const response = await fetch(`${API_URL}/api/meetings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: finalTitle,
          agenda: agenda.trim(),
          scheduledAt,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success || !result.meeting) {
        throw new Error(result.message || 'Failed to create meeting.');
      }

      const savedMeeting = result.meeting;

      if (!savedMeeting.code) {
        throw new Error('The server did not return a meeting code.');
      }

      const code = savedMeeting.code;
      const meetingUrl = `${window.location.origin}/meet/${encodeURIComponent(code)}`;

      // Adapt the backend response to the existing meeting-list UI.
      const meetingForUI = {
        ...savedMeeting,
        id: savedMeeting.id || code,
        meetingCode: code,
        meetingLink: meetingUrl,
        description: savedMeeting.agenda || '',
        hostName:
          savedMeeting.hostName ||
          user.displayName ||
          user.email ||
          currentUser?.name ||
          'Meeting host',
        hostEmail: savedMeeting.hostEmail || user.email || null,
        scheduledTime: scheduledAt
          ? new Date(scheduledAt).toLocaleString()
          : 'Now (In Progress)',
        status: meetingType === 'instant' ? 'active' : 'upcoming',
        isLive: meetingType === 'instant',
        participantsCount: savedMeeting.participantIds?.length || 1,
        attendees: (savedMeeting.participants || []).map((participant) => ({
          id: participant.uid,
          name: participant.name || participant.email || 'Participant',
          role: participant.uid === savedMeeting.hostId ? 'Host' : 'Participant',
          isHost: participant.uid === savedMeeting.hostId,
          micMuted: false,
          videoOn: true,
          status: 'joined',
        })),
        tags: meetingType === 'instant' ? ['Instant'] : ['Scheduled'],
      };

      setCreatedMeeting(meetingForUI);

      // Notify the parent only after the backend has successfully saved it.
      await Promise.resolve(
        onCreate?.(meetingForUI, meetingType === 'instant')
      );

      addToast({
        title:
          meetingType === 'instant'
            ? 'Meeting created'
            : 'Meeting scheduled',
        message: `Meeting code: ${code}`,
        type: 'success',
      });

      onClose();
    } catch (error) {
      console.error('Create meeting error:', error);

      addToast({
        title: 'Could not create meeting',
        message: error.message || 'Please try again.',
        type: 'error',
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-meeting-title"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Video className="w-5 h-5" />
            </div>

            <div>
              <h2
                id="create-meeting-title"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                Create New Meeting
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create an instant meeting or schedule one for later
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4.5">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={creating}
              onClick={() => setMeetingType('instant')}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                meetingType === 'instant'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold">
                  Start Instant Meeting
                </span>
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Launch a room now and invite teammates
              </span>
            </button>

            <button
              type="button"
              disabled={creating}
              onClick={() => setMeetingType('scheduled')}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                meetingType === 'scheduled'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold">Schedule for Later</span>
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Choose a future date and time
              </span>
            </button>
          </div>

          <div>
            <label
              htmlFor="meeting-title"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Meeting Topic / Title
            </label>
            <input
              id="meeting-title"
              type="text"
              maxLength={120}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={
                meetingType === 'instant'
                  ? 'e.g. Frontend Architecture Sync'
                  : 'e.g. Sprint Planning'
              }
              disabled={creating}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {meetingType === 'scheduled' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="meeting-date"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    id="meeting-date"
                    type="date"
                    min={date}
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    disabled={creating}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="meeting-time"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Time
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    id="meeting-time"
                    type="time"
                    value={time}
                    onChange={(event) => setTime(event.target.value)}
                    disabled={creating}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="meeting-agenda"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Agenda & Notes (Optional)
            </label>
            <textarea
              id="meeting-agenda"
              rows={2}
              maxLength={2000}
              value={agenda}
              onChange={(event) => setAgenda(event.target.value)}
              placeholder="What will be discussed during this session?"
              disabled={creating}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Meeting Invitation Link
            </span>

            <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 min-w-0">
                <Link2 className="w-4 h-4 shrink-0 text-indigo-500" />
                <span className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate">
                  {meetingLink || 'Generated after the meeting is created'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                disabled={!meetingLink || creating}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>
              Your meeting details will be saved to ChatFlow. Live audio and
              video will be connected in the meeting room.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={creating}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {creating ? (
                <LoaderCircle className="w-4 h-4 animate-spin" />
              ) : (
                <Video className="w-4 h-4" />
              )}
              <span>
                {creating
                  ? 'Saving Meeting...'
                  : meetingType === 'instant'
                    ? 'Start Meeting Now'
                    : 'Save & Schedule'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};