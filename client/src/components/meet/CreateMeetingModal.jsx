import React, { useState } from 'react';
import {
  X,
  Video,
  Calendar,
  Clock,
  Link2,
  Copy,
  Check,
  Sparkles,
  Users,
  AlertCircle
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const CreateMeetingModal = ({
  isOpen,
  onClose,
  onCreate,
  currentUser
}) => {
  const { addToast } = useToast();

  const [title, setTitle] = useState('');
  const [meetingType, setMeetingType] = useState('instant'); // 'instant' | 'scheduled'
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('14:00');
  const [agenda, setAgenda] = useState('');
  const [copied, setCopied] = useState(false);

  // Generate a random meeting code
  const [meetingCode] = useState(() => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const segment = (len) =>
      Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${segment(3)}-${segment(3)}-${segment(3)}`;
  });

  const meetingLink = `https://relay.meet/${meetingCode}`;

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(meetingLink);
    setCopied(true);
    addToast({
      title: 'Link Copied',
      message: `Meeting invitation copied to clipboard: ${meetingLink}`,
      type: 'success'
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalTitle = title.trim() || (meetingType === 'instant' ? 'Instant Team Huddle' : 'Scheduled Meeting');

    const newMeeting = {
      id: `meet-${Date.now()}`,
      title: finalTitle,
      description: agenda.trim() || 'Collaborative team discussion via Relay Meet.',
      hostName: currentUser?.name || 'Alex Rivera',
      hostEmail: currentUser?.email || 'alex.rivera@relay.dev',
      scheduledTime: meetingType === 'instant' ? 'Now (In Progress)' : `${date} at ${time}`,
      status: 'upcoming',
      isLive: meetingType === 'instant',
      meetingCode,
      meetingLink,
      participantsCount: 1,
      attendees: [
        {
          id: currentUser?.id || 'usr-1',
          name: currentUser?.name || 'Alex Rivera',
          role: 'Host',
          isHost: true,
          micMuted: false,
          videoOn: true,
          status: 'speaking'
        }
      ],
      tags: meetingType === 'instant' ? ['Ad-hoc', 'Instant'] : ['Scheduled']
    };

    onCreate(newMeeting, meetingType === 'instant');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-meeting-title"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">

        {/* Modal Header */}
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
                Start an instant video room or schedule a team huddle
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4.5">

          {/* Meeting Type Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMeetingType('instant')}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                meetingType === 'instant'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 shadow-2xs'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold">Start Instant Meeting</span>
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Launch video room now and invite teammates
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMeetingType('scheduled')}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                meetingType === 'scheduled'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 shadow-2xs'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold">Schedule for Later</span>
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Set future date and generate calendar link
              </span>
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Meeting Topic / Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={meetingType === 'instant' ? 'e.g. Frontend Architecture Sync' : 'e.g. Q4 Sprint Planning'}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
          </div>

          {/* Date & Time if Scheduled */}
          {meetingType === 'scheduled' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Time
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Agenda / Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Agenda & Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="What will be discussed during this session?"
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all"
            />
          </div>

          {/* Generated Link Preview */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Meeting Invitation Link
            </span>
            <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 truncate">
                {meetingLink}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Demo notice pill */}
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Demo Session:</strong> Meeting rooms operate in client simulation mode without remote media servers.
            </span>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Video className="w-4 h-4" />
              <span>{meetingType === 'instant' ? 'Start Meeting Now' : 'Save & Schedule'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
