import React, { useState } from 'react';
import {
  X,
  Video,
  Calendar,
  Clock,
  Users,
  Copy,
  Check,
  Share2,
  AlertCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const MeetingDetailsModal = ({
  isOpen,
  onClose,
  meeting,
  onJoin
}) => {
  const { addToast } = useToast();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  if (!isOpen || !meeting) return null;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(meeting.meetingLink || `https://relay.meet/${meeting.meetingCode}`);
    setCopiedLink(true);
    addToast({
      title: 'Link Copied',
      message: 'Meeting link copied to clipboard.',
      type: 'success'
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyFullInvitation = () => {
    const text = `You're invited to Relay Meet: ${meeting.title}\nTime: ${meeting.scheduledTime}\nJoin Link: ${meeting.meetingLink}\nMeeting Code: ${meeting.meetingCode}`;
    navigator.clipboard?.writeText(text);
    setCopiedInvite(true);
    addToast({
      title: 'Invitation Copied',
      message: 'Full meeting invitation details copied to clipboard.',
      type: 'success'
    });
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const isCompleted = meeting.status === 'completed';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="meeting-details-title"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              meeting.isLive
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
            }`}>
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="meeting-details-title"
                  className="text-base font-bold text-slate-900 dark:text-white"
                >
                  Meeting Overview
                </h2>
                {meeting.isLive && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE NOW
                  </span>
                )}
                {isCompleted && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    COMPLETED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Code: <span className="font-mono text-indigo-600 dark:text-indigo-400">{meeting.meetingCode}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">

          {/* Meeting Title & Description */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {meeting.title}
            </h3>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {meeting.description || 'No agenda notes provided for this meeting.'}
            </p>
          </div>

          {/* Time & Host Information */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                <Clock className="w-3.5 h-3.5" />
                Schedule
              </span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {meeting.scheduledTime}
              </p>
              {meeting.duration && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Duration: {meeting.duration}
                </span>
              )}
            </div>

            <div>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                <Users className="w-3.5 h-3.5" />
                Host
              </span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {meeting.hostName}
              </p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
                {meeting.hostEmail}
              </span>
            </div>
          </div>

          {/* Join Link & Code */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Access Credentials
            </span>
            <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 truncate">
                {meeting.meetingLink}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-white dark:hover:bg-slate-900 transition-colors shadow-2xs shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Attendees List */}
          {meeting.attendees && meeting.attendees.length > 0 && (
            <div>
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Confirmed Attendees ({meeting.attendees.length})
              </span>
              <div className="space-y-1.5">
                {meeting.attendees.map((attendee, index) => (
                  <div
                    key={attendee.id || index}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center">
                        {attendee.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {attendee.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {attendee.role || (attendee.isHost ? 'Host' : 'Participant')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Demo Action Note */}
          <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              <strong>Relay Meet Simulation:</strong> Live WebRTC streaming requires backend signaling infrastructure.
            </span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <button
            type="button"
            onClick={handleCopyFullInvitation}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {copiedInvite ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedInvite ? 'Copied Invitation' : 'Share Invitation'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            {!isCompleted && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onJoin(meeting);
                }}
                className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Video className="w-4 h-4" />
                <span>Join Meeting</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
