import React, { useState } from 'react';
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Users,
  Link2,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Play
} from 'lucide-react';
import { mockMeetings } from '../data/mockData';
import { useToast } from '../context/ToastContext';
import { CreateMeetingModal } from '../components/meet/CreateMeetingModal';
import { MeetingDetailsModal } from '../components/meet/MeetingDetailsModal';
import { MeetingRoom } from '../components/meet/MeetingRoom';

export const MeetPage = ({
  currentUser,
  searchQuery = ''
}) => {
  const { addToast } = useToast();

  const [meetings, setMeetings] = useState(mockMeetings);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [selectedDetailsMeeting, setSelectedDetailsMeeting] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTabFilter, setActiveTabFilter] = useState('upcoming'); // 'upcoming' | 'recent'
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // If in an active video call, render the full meeting room canvas
  if (activeMeeting) {
    return (
      <MeetingRoom
        meeting={activeMeeting}
        onLeave={() => {
          setActiveMeeting(null);
          addToast({
            title: 'Call Ended',
            message: 'You have left the video meeting.',
            type: 'info'
          });
        }}
        currentUser={currentUser}
      />
    );
  }

  // Handle instant meeting start from quick card
  const handleStartInstantMeeting = () => {
    const code = `rel-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
    const instantMeeting = {
      id: `meet-${Date.now()}`,
      title: 'Instant Team Huddle',
      description: 'Ad-hoc video call initiated by team member.',
      hostName: currentUser?.name || 'Alex Rivera',
      hostEmail: currentUser?.email || 'alex.rivera@relay.dev',
      scheduledTime: 'Now (In Progress)',
      status: 'upcoming',
      isLive: true,
      meetingCode: code,
      meetingLink: `https://relay.meet/${code}`,
      participantsCount: 1,
      attendees: [
        {
          id: currentUser?.id || 'usr-1',
          name: currentUser?.name || 'Alex Rivera',
          role: 'Host',
          isHost: true,
          micMuted: false,
          videoOn: true
        }
      ],
      tags: ['Ad-hoc', 'Instant']
    };

    setMeetings((prev) => [instantMeeting, ...prev]);
    setActiveMeeting(instantMeeting);
    addToast({
      title: 'Meeting Started',
      message: 'Instant video room launched.',
      type: 'success'
    });
  };

  // Handle Join with code or link input
  const handleJoinByCode = (e) => {
    e.preventDefault();
    const raw = joinCodeInput.trim();
    if (!raw) {
      addToast({
        title: 'Meeting Code Required',
        message: 'Please enter a valid meeting code or link (e.g. arc-web-syn).',
        type: 'warning'
      });
      return;
    }

    // Extract code from link if pasted
    const cleanCode = raw.includes('/') ? raw.split('/').pop() : raw;

    // Check if an existing meeting matches
    const existing = meetings.find(
      (m) => m.meetingCode.toLowerCase() === cleanCode.toLowerCase()
    );

    if (existing) {
      setActiveMeeting(existing);
      addToast({
        title: 'Joined Meeting',
        message: `Connected to ${existing.title}`,
        type: 'success'
      });
    } else {
      // Create ad-hoc room with given code
      const adHoc = {
        id: `meet-${Date.now()}`,
        title: `Team Room (${cleanCode})`,
        description: 'Joined via meeting code.',
        hostName: currentUser?.name || 'Alex Rivera',
        hostEmail: currentUser?.email || 'alex.rivera@relay.dev',
        scheduledTime: 'Now (In Progress)',
        status: 'upcoming',
        isLive: true,
        meetingCode: cleanCode,
        meetingLink: `https://relay.meet/${cleanCode}`,
        participantsCount: 2,
        attendees: [
          { id: currentUser?.id || 'usr-1', name: currentUser?.name || 'Alex Rivera', role: 'Participant', isHost: false },
          { id: 'usr-2', name: 'Sarah Jenkins', role: 'Host', isHost: true }
        ],
        tags: ['Code-Join']
      };
      setMeetings((prev) => [adHoc, ...prev]);
      setActiveMeeting(adHoc);
      addToast({
        title: 'Joined Meeting Room',
        message: `Connected to room: ${cleanCode}`,
        type: 'success'
      });
    }

    setJoinCodeInput('');
  };

  const handleCreateMeeting = (newMeeting, joinImmediately) => {
    setMeetings((prev) => [newMeeting, ...prev]);
    if (joinImmediately) {
      setActiveMeeting(newMeeting);
      addToast({
        title: 'Room Started',
        message: `You are now in ${newMeeting.title}`,
        type: 'success'
      });
    } else {
      addToast({
        title: 'Meeting Scheduled',
        message: `Scheduled ${newMeeting.title} for ${newMeeting.scheduledTime}.`,
        type: 'success'
      });
    }
  };

  const handleCopyLink = (meeting, e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(meeting.meetingLink || `https://relay.meet/${meeting.meetingCode}`);
    setCopiedId(meeting.id);
    addToast({
      title: 'Link Copied',
      message: `Meeting link copied to clipboard: ${meeting.meetingCode}`,
      type: 'success'
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter meetings based on active tab and search query
  const upcomingMeetings = meetings.filter((m) => m.status !== 'completed');
  const recentMeetings = meetings.filter((m) => m.status === 'completed');

  const currentList = activeTabFilter === 'upcoming' ? upcomingMeetings : recentMeetings;
  const filteredMeetings = currentList.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.meetingCode.toLowerCase().includes(q) ||
      m.hostName.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

      {/* ─────────────────────────────────────────────────────────────
          PAGE HEADER: Title, Subtitle & Primary Actions
      ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Relay Meet
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              HD Video & Audio
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Instant team video huddles, collaborative screen-sharing, and scheduled sessions.
          </p>
        </div>

        {/* Primary CTA */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <Plus className="w-4 h-4" />
            <span>New Meeting</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          QUICK ACTIONS CARDS
          1. Start Instant Meeting | 2. Schedule for Later | 3. Join with Code
      ─────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* 1. Start Instant Meeting */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-200 dark:border-indigo-900/50 bg-white dark:bg-slate-900 flex flex-col justify-between shadow-xs hover:border-indigo-400 dark:hover:border-indigo-700 transition-all">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm mb-3">
              <Video className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Start Instant Meeting
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Launch a simulated video room right now and invite colleagues via link.
            </p>
          </div>
          <button
            type="button"
            onClick={handleStartInstantMeeting}
            className="mt-4 flex items-center justify-between w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Start Meeting Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. Schedule Meeting for Later */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-2xs mb-3 border border-slate-200 dark:border-slate-700">
              <Calendar className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Schedule for Later
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Plan upcoming sprint reviews or 1:1 sessions with agenda notes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 flex items-center justify-between w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <span>Set Schedule</span>
            <Calendar className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3. Join with Code / Link */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-2xs mb-3 border border-slate-200 dark:border-slate-700">
              <Link2 className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Join with Code or Link
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Enter a meeting code (e.g. <span className="font-mono text-indigo-600 dark:text-indigo-400">arc-web-syn</span>) to jump into the call.
            </p>
          </div>

          <form onSubmit={handleJoinByCode} className="mt-4 flex items-center gap-2">
            <input
              type="text"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value)}
              placeholder="Enter meeting code..."
              className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white text-xs font-semibold rounded-xl transition-colors shrink-0"
            >
              Join
            </button>
          </form>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MEETINGS SECTION: Upcoming vs Recent Tabs & Cards List
      ─────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">

        {/* Tab Headers */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTabFilter('upcoming')}
              className={`text-xs sm:text-sm font-bold pb-1 transition-all relative ${
                activeTabFilter === 'upcoming'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Upcoming Meetings ({upcomingMeetings.length})
              {activeTabFilter === 'upcoming' && (
                <span className="absolute bottom-[-16px] left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTabFilter('recent')}
              className={`text-xs sm:text-sm font-bold pb-1 transition-all relative ${
                activeTabFilter === 'recent'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Recent History ({recentMeetings.length})
              {activeTabFilter === 'recent' && (
                <span className="absolute bottom-[-16px] left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}
            </button>
          </div>

          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {filteredMeetings.length} sessions
          </span>
        </div>

        {/* Meetings List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredMeetings.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No meetings found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {searchQuery ? `No results matching "${searchQuery}".` : 'No sessions currently in this category.'}
              </p>
            </div>
          ) : (
            filteredMeetings.map((item) => {
              const isLive = item.isLive;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedDetailsMeeting(item)}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
                >
                  {/* Left: Meeting Info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${
                      isLive
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/30'
                        : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                    }`}>
                      <Video className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {item.title}
                        </h3>

                        {isLive && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            LIVE NOW
                          </span>
                        )}

                        <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {item.meetingCode}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 max-w-xl">
                        {item.description}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 dark:text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {item.scheduledTime}
                        </span>
                        <span>•</span>
                        <span>Host: {item.hostName}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {item.participantsCount} participants
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => handleCopyLink(item, e)}
                      className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Copy meeting link"
                      aria-label="Copy meeting link"
                    >
                      {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedDetailsMeeting(item)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Details
                    </button>

                    {item.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMeeting(item);
                          addToast({
                            title: 'Joined Meeting',
                            message: `Connected to ${item.title}`,
                            type: 'success'
                          });
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Join</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          CLEAR DEMO ARCHITECTURE NOTICE
      ─────────────────────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">
            Relay Meet Architecture Notice:
          </strong>
          This interface is an interactive frontend demonstration powered by client state and mock conference datasets. Full multi-party live media calling requires backend infrastructure including meeting room persistence, token-authenticated participant authorization, WebRTC signaling (WebSocket/STUN/TURN), and media SFU routing (e.g. LiveKit, Mediasoup, or Twilio).
        </div>
      </div>

      {/* Modals */}
      <CreateMeetingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateMeeting}
        currentUser={currentUser}
      />

      <MeetingDetailsModal
        isOpen={Boolean(selectedDetailsMeeting)}
        onClose={() => setSelectedDetailsMeeting(null)}
        meeting={selectedDetailsMeeting}
        onJoin={(m) => {
          setSelectedDetailsMeeting(null);
          setActiveMeeting(m);
        }}
      />
    </div>
  );
};
