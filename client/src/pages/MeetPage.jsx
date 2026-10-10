
import React, { useState, useEffect, useCallback } from 'react';
import {
  Video,
  Plus,
  Search,
  CalendarDays,
  Clock,
  Users,
  Copy,
  Check,
  Link2,
  ArrowRight,
  Radio,
  LoaderCircle,
  RefreshCw,
  AlertCircle,
  LogIn,
  X,
  History,
} from 'lucide-react';

import { auth } from '../config/firebase';
import { useToast } from '../context/ToastContext';
import {CreateMeetingModal} from '../components/meet/CreateMeetingModal';
import {MeetingDetailsModal} from '../components/meet/MeetingDetailsModal';
import {MeetingRoom} from '../components/meet/MeetingRoom';

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');

const getMeetingCode = (meeting) =>
  meeting?.code || meeting?.meetingCode || meeting?.id || '';

const getDateValue = (value) => {
  if (!value) return null;

  if (typeof value === 'object' && value._seconds) {
    return new Date(value._seconds * 1000);
  }

  if (typeof value === 'object' && value.seconds) {
    return new Date(value.seconds * 1000);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeMeeting = (item) => {
  const code = getMeetingCode(item);
  const scheduledAt = getDateValue(item.scheduledAt);

  const participants = Array.isArray(item.participants)
    ? item.participants
    : [];

  const participantIds = Array.isArray(item.participantIds)
    ? item.participantIds
    : participants.map((participant) => participant.uid).filter(Boolean);

  return {
    ...item,
    id: item.id || code,
    code,
    meetingCode: code,
    title: item.title || 'Untitled meeting',
    description: item.description || item.agenda || '',
    agenda: item.agenda || item.description || '',
    hostName: item.hostName || item.hostEmail || 'Meeting host',
    hostEmail: item.hostEmail || '',
    hostId: item.hostId || '',
    status: item.status || 'scheduled',
    scheduledAt: scheduledAt?.toISOString() || null,
    scheduledTime: scheduledAt
      ? scheduledAt.toLocaleString()
      : item.status === 'active'
        ? 'In progress'
        : 'Not scheduled',
    isLive: item.status === 'active',
    participantsCount: participantIds.length,
    participantIds,
    participants,
    attendees: participants.map((person) => ({
      id: person.uid,
      name: person.name || person.email || 'Participant',
      email: person.email || '',
      role: person.uid === item.hostId ? 'Host' : 'Participant',
      isHost: person.uid === item.hostId,
    })),
    meetingLink:
      item.meetingLink ||
      (code
        ? `${window.location.origin}/meet/${encodeURIComponent(code)}`
        : ''),
  };
};

export default function MeetPage({
  currentUser,
  searchQuery = '',
}) {
  const { addToast } = useToast();

  const [meetings, setMeetings] = useState([]);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [selectedDetailsMeeting, setSelectedDetailsMeeting] =
    useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTabFilter, setActiveTabFilter] = useState('upcoming');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const [isLoadingMeetings, setIsLoadingMeetings] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [meetingsError, setMeetingsError] = useState('');

  const getAuthHeaders = useCallback(async () => {
    const user = auth.currentUser;

    if (!user) {
      throw new Error('Please sign in before accessing meetings.');
    }

    const token = await user.getIdToken();

    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, []);

  const apiRequest = useCallback(
    async (path, options = {}) => {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Request failed with status ${response.status}.`
        );
      }

      return data;
    },
    [getAuthHeaders]
  );

  const loadMeetings = useCallback(async () => {
    if (!auth.currentUser) {
      setMeetings([]);
      setIsLoadingMeetings(false);
      return;
    }

    setIsLoadingMeetings(true);
    setMeetingsError('');

    try {
      const data = await apiRequest('/api/meetings');

      const items = Array.isArray(data)
        ? data
        : data.meetings || data.data || [];

      setMeetings(items.map(normalizeMeeting));
    } catch (error) {
      setMeetingsError(
        error.message || 'Could not load your meetings.'
      );
    } finally {
      setIsLoadingMeetings(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  const showToast = useCallback(
    (title, message, type = 'success') => {
      addToast({ title, message, type });
    },
    [addToast]
  );

  const handleStartInstantMeeting = async () => {
    if (isStarting) return;

    setIsStarting(true);

    try {
      const data = await apiRequest('/api/meetings', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Instant Team Huddle',
          agenda: 'Instant team meeting',
          scheduledAt: null,
        }),
      });

      const rawMeeting = data.meeting || data.data || data;
      const meeting = normalizeMeeting(rawMeeting);

      if (!meeting.meetingCode) {
        throw new Error(
          'The server created a response without a meeting code.'
        );
      }

      await loadMeetings();
      setActiveMeeting(meeting);

      showToast(
        'Meeting created',
        `Your meeting code is ${meeting.meetingCode}.`
      );
    } catch (error) {
      showToast(
        'Could not start meeting',
        error.message || 'Please try again.',
        'error'
      );
    } finally {
      setIsStarting(false);
    }
  };

  const handleJoinByCode = async (event) => {
    event?.preventDefault();

    const code = joinCodeInput.trim().toUpperCase();

    if (!code) {
      showToast(
        'Meeting code required',
        'Enter the meeting code you received.',
        'error'
      );
      return;
    }

    if (isJoining) return;

    setIsJoining(true);

    try {
      // Register this user as a meeting participant first.
      await apiRequest(
        `/api/meetings/${encodeURIComponent(code)}/join`,
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );

      // Fetch the actual meeting after joining.
      const data = await apiRequest(
        `/api/meetings/${encodeURIComponent(code)}`
      );

      const rawMeeting = data.meeting || data.data || data;
      const meeting = normalizeMeeting({
        ...rawMeeting,
        code: rawMeeting.code || code,
      });

      setJoinCodeInput('');
      await loadMeetings();
      setSelectedDetailsMeeting(null);
      setActiveMeeting(meeting);

      showToast(
        'Joining meeting',
        `Connecting to ${meeting.title}.`
      );
    } catch (error) {
      showToast(
        'Unable to join meeting',
        error.message ||
          'Check the meeting code and try again.',
        'error'
      );
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateMeeting = async (
    newMeeting,
    joinImmediately = false
  ) => {
    const meeting = normalizeMeeting(
      newMeeting?.meeting || newMeeting?.data || newMeeting
    );

    setIsCreateModalOpen(false);
    await loadMeetings();

    if (joinImmediately) {
      setActiveMeeting(meeting);
      showToast('Meeting ready', 'Opening your meeting room.');
    } else {
      showToast(
        'Meeting scheduled',
        'Your meeting has been saved.'
      );
    }
  };

  const handleLeaveMeeting = async () => {
    const meeting = activeMeeting;

    if (!meeting) {
      setActiveMeeting(null);
      return;
    }

    try {
      await apiRequest(
        `/api/meetings/${encodeURIComponent(
          meeting.meetingCode
        )}/leave`,
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );
    } catch (error) {
      console.error('Could not update meeting leave status:', error);
    } finally {
      setActiveMeeting(null);
      await loadMeetings();
      showToast('Meeting left', 'You have left the meeting.');
    }
  };

  const handleCopyLink = async (meeting) => {
    const link =
      meeting.meetingLink ||
      `${window.location.origin}/meet/${encodeURIComponent(
        meeting.meetingCode
      )}`;

    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(meeting.id);

      showToast('Link copied', 'Meeting link copied to clipboard.');

      window.setTimeout(() => {
        setCopiedId((previous) =>
          previous === meeting.id ? null : previous
        );
      }, 1800);
    } catch {
      showToast(
        'Could not copy link',
        'Your browser blocked clipboard access.',
        'error'
      );
    }
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredMeetings = meetings.filter((meeting) => {
    const matchesSearch =
      !normalizedSearch ||
      [
        meeting.title,
        meeting.meetingCode,
        meeting.description,
        meeting.hostName,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(normalizedSearch)
        );

    if (!matchesSearch) return false;

    if (activeTabFilter === 'upcoming') {
      return meeting.status === 'scheduled' || meeting.status === 'active';
    }

    if (activeTabFilter === 'live') {
      return meeting.status === 'active';
    }

    if (activeTabFilter === 'past') {
      return meeting.status === 'ended' || meeting.status === 'completed';
    }

    return true;
  });

  const upcomingCount = meetings.filter(
    (meeting) =>
      meeting.status === 'scheduled' || meeting.status === 'active'
  ).length;

  const liveCount = meetings.filter(
    (meeting) => meeting.status === 'active'
  ).length;

  const pastCount = meetings.filter(
    (meeting) =>
      meeting.status === 'ended' || meeting.status === 'completed'
  ).length;

  if (activeMeeting) {
    return (
      <MeetingRoom
        meeting={activeMeeting}
        currentUser={currentUser || auth.currentUser}
        onLeave={handleLeaveMeeting}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 transition-colors duration-150 dark:bg-[#0B1220] dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
              <Video size={17} />
              <span>Real-time meetings</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Meet
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base">
              Create a room, join your team, and collaborate face to face.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleStartInstantMeeting}
              disabled={isStarting}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-700"
            >
              {isStarting ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <Video size={18} />
              )}
              {isStarting ? 'Creating room…' : 'Start instant meeting'}
            </button>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/15 transition hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              <Plus size={19} />
              Schedule meeting
            </button>
          </div>
        </div>

        {/* Join by code */}
        <section className="relative overflow-hidden rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-white p-5 shadow-xs transition-colors dark:border-blue-400/20 dark:from-blue-500/10 dark:via-[#111C30] dark:to-[#111827] sm:p-7">
          <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                <LogIn size={22} />
              </div>

              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Join a meeting
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Have a meeting code? Enter it here to join the room.
              </p>
            </div>

            <form
              onSubmit={handleJoinByCode}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <label className="sr-only" htmlFor="meeting-code">
                Meeting code
              </label>

              <input
                id="meeting-code"
                type="text"
                autoComplete="off"
                value={joinCodeInput}
                onChange={(event) =>
                  setJoinCodeInput(event.target.value.toUpperCase())
                }
                placeholder="Enter meeting code"
                className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm tracking-wider text-slate-900 outline-none transition placeholder:tracking-normal placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-[#0B1220]/80 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-400"
              />

              <button
                type="submit"
                disabled={isJoining || !joinCodeInput.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400"
              >
                {isJoining ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <ArrowRight size={17} />
                )}
                {isJoining ? 'Joining…' : 'Join meeting'}
              </button>
            </form>
          </div>
        </section>

        {/* Meeting statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-colors dark:border-slate-800 dark:bg-[#111827]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Upcoming meetings</span>
              <CalendarDays size={19} className="text-blue-600 dark:text-blue-400" />
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
              {upcomingCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-colors dark:border-slate-800 dark:bg-[#111827]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Live now</span>
              <Radio size={19} className="text-emerald-500 dark:text-emerald-400" />
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{liveCount}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-colors dark:border-slate-800 dark:bg-[#111827]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Past meetings</span>
              <History size={19} className="text-violet-600 dark:text-violet-400" />
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{pastCount}</p>
          </div>
        </div>

        {/* Meeting list */}
        <section>
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Your meetings
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Meetings associated with your account.
              </p>
            </div>

            <button
              type="button"
              onClick={loadMeetings}
              disabled={isLoadingMeetings}
              className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 dark:border-slate-700 dark:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white sm:self-auto"
            >
              <RefreshCw
                size={15}
                className={isLoadingMeetings ? 'animate-spin' : ''}
              />
              Refresh
            </button>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {[
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'live', label: 'Live' },
              { id: 'past', label: 'Past' },
              { id: 'all', label: 'All meetings' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTabFilter(tab.id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTabFilter === tab.id
                    ? 'bg-blue-600 text-white dark:bg-blue-500'
                    : 'border border-slate-200 bg-white text-slate-600 shadow-2xs hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-[#111827] dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isLoadingMeetings ? (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111827]">
              <LoaderCircle
                size={28}
                className="animate-spin text-blue-600 dark:text-blue-400"
              />
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Loading your meetings…
              </p>
            </div>
          ) : meetingsError ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
              <AlertCircle
                size={28}
                className="mx-auto text-red-500 dark:text-red-400"
              />
              <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">
                Could not load meetings
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
                {meetingsError}
              </p>
              <button
                type="button"
                onClick={loadMeetings}
                className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
              >
                Try again
              </button>
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 px-5 text-center dark:border-slate-700 dark:bg-[#111827]/60">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {activeTabFilter === 'past' ? (
                  <History size={25} />
                ) : (
                  <Video size={25} />
                )}
              </div>

              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                {normalizedSearch
                  ? 'No matching meetings'
                  : activeTabFilter === 'past'
                    ? 'No past meetings yet'
                    : activeTabFilter === 'live'
                      ? 'No live meetings right now'
                      : 'No meetings yet'}
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                {normalizedSearch
                  ? 'Try another search term.'
                  : 'Start an instant meeting or schedule one to see it here.'}
              </p>

              {!normalizedSearch && (
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
                >
                  <Plus size={17} />
                  Schedule a meeting
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {filteredMeetings.map((meeting) => {
                const isLive = meeting.status === 'active';
                const isPast =
                  meeting.status === 'ended' ||
                  meeting.status === 'completed';

                return (
                  <article
                    key={meeting.id || meeting.meetingCode}
                    className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300 hover:bg-slate-50/60 dark:border-slate-800 dark:bg-[#111827] dark:hover:border-slate-700 dark:hover:bg-[#131D2E] sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                            isLive
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {isLive ? (
                            <Radio size={21} />
                          ) : (
                            <Video size={21} />
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="break-words text-base font-semibold text-slate-900 dark:text-white">
                            {meeting.title}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Code:{' '}
                            <span className="font-mono tracking-wider text-slate-700 dark:text-slate-300">
                              {meeting.meetingCode}
                            </span>
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                          isLive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : isPast
                              ? 'bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-400'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-300'
                        }`}
                      >
                        {isLive
                          ? 'Live'
                          : isPast
                            ? 'Ended'
                            : 'Scheduled'}
                      </span>
                    </div>

                    {meeting.description && (
                      <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                        {meeting.description}
                      </p>
                    )}

                    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-2">
                        <Clock size={15} className="text-slate-400 dark:text-slate-500" />
                        {meeting.scheduledTime}
                      </span>

                      <span className="inline-flex items-center gap-2">
                        <Users size={15} className="text-slate-400 dark:text-slate-500" />
                        {meeting.participantsCount}{' '}
                        {meeting.participantsCount === 1
                          ? 'participant'
                          : 'participants'}
                      </span>
                    </div>

                    <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                        Hosted by{' '}
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {meeting.hostName}
                        </span>
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        {!isPast && (
                          <button
                            type="button"
                            onClick={() => {
                              if (!meeting.meetingCode) {
                                showToast(
                                  'Missing meeting code',
                                  'This meeting cannot be opened.',
                                  'error'
                                );
                                return;
                              }

                              setJoinCodeInput(meeting.meetingCode);
                              handleJoinByCodeFromCard(meeting.meetingCode);
                            }}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
                          >
                            <Video size={16} />
                            {isLive ? 'Join now' : 'Join meeting'}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedDetailsMeeting(meeting)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                        >
                          Details
                        </button>

                        {!isPast && (
                          <button
                            type="button"
                            onClick={() => handleCopyLink(meeting)}
                            title="Copy meeting link"
                            aria-label="Copy meeting link"
                            className="ml-auto inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                          >
                            {copiedId === meeting.id ? (
                              <Check size={16} className="text-emerald-500 dark:text-emerald-400" />
                            ) : (
                              <Copy size={16} />
                            )}
                            <span className="hidden sm:inline">
                              {copiedId === meeting.id ? 'Copied' : 'Copy link'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <CreateMeetingModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateMeeting}
        />

        {selectedDetailsMeeting && (
          <MeetingDetailsModal
            meeting={selectedDetailsMeeting}
            onClose={() => setSelectedDetailsMeeting(null)}
            onJoin={(meeting) => {
              const code = getMeetingCode(meeting);

              setSelectedDetailsMeeting(null);

              if (code) {
                handleJoinByCodeFromCard(code);
              } else {
                showToast(
                  'Missing meeting code',
                  'This meeting cannot be joined.',
                  'error'
                );
              }
            }}
          />
        )}
      </div>
    </div>
  );

  async function handleJoinByCodeFromCard(codeValue) {
    const code = String(codeValue || '').trim().toUpperCase();

    if (!code || isJoining) return;

    setIsJoining(true);

    try {
      await apiRequest(
        `/api/meetings/${encodeURIComponent(code)}/join`,
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );

      const data = await apiRequest(
        `/api/meetings/${encodeURIComponent(code)}`
      );

      const rawMeeting = data.meeting || data.data || data;
      const meeting = normalizeMeeting({
        ...rawMeeting,
        code: rawMeeting.code || code,
      });

      await loadMeetings();
      setActiveMeeting(meeting);

      showToast('Joining meeting', `Connecting to ${meeting.title}.`);
    } catch (error) {
      showToast(
        'Unable to join meeting',
        error.message || 'Please check the meeting code.',
        'error'
      );
    } finally {
      setIsJoining(false);
    }
  }
}