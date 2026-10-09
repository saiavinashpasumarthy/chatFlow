import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Monitor,
  PhoneOff,
  Users,
  MessageSquare,
  Link2,
  Copy,
  Check,
  X,
  Send,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  MoreVertical,
  Volume2,
  Maximize2
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const MeetingRoom = ({
  meeting,
  onLeave,
  currentUser
}) => {
  const { addToast } = useToast();

  // Local device media control states
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Drawer states
  const [activeDrawer, setActiveDrawer] = useState(null); // 'participants' | 'chat' | null

  // Timer state
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Link copy state
  const [copiedLink, setCopiedLink] = useState(false);

  // In-call chat state
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'msg-1',
      sender: 'Sarah Jenkins',
      text: 'Hey team! Let me know if you can see the latest architecture diagrams.',
      time: '11:32 AM'
    },
    {
      id: 'msg-2',
      sender: 'Marcus Vance',
      text: 'Connected. Screen resolution and typography contrast look very sharp.',
      time: '11:33 AM'
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Active speaker simulation
  const [activeSpeaker, setActiveSpeaker] = useState('Sarah Jenkins');

  // Increment call timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format seconds to mm:ss
  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Attendees list
  const defaultAttendees = [
    {
      id: currentUser?.id || 'usr-1',
      name: `${currentUser?.name || 'Alex Rivera'} (You)`,
      role: 'Host',
      isYou: true,
      avatarInitials: (currentUser?.name || 'Alex Rivera').split(' ').map((n) => n[0]).join(''),
      micMuted: isMicMuted,
      videoOff: isVideoOff,
      isSpeaking: !isMicMuted && activeSpeaker === (currentUser?.name || 'Alex Rivera')
    },
    {
      id: 'usr-2',
      name: 'Sarah Jenkins',
      role: 'Staff Engineer',
      isYou: false,
      avatarInitials: 'SJ',
      micMuted: false,
      videoOff: false,
      isSpeaking: activeSpeaker === 'Sarah Jenkins'
    },
    {
      id: 'usr-3',
      name: 'Marcus Vance',
      role: 'Design Lead',
      isYou: false,
      avatarInitials: 'MV',
      micMuted: true,
      videoOff: false,
      isSpeaking: false
    },
    {
      id: 'usr-4',
      name: 'Elena Rostova',
      role: 'Frontend Engineer',
      isYou: false,
      avatarInitials: 'ER',
      micMuted: true,
      videoOff: true,
      isSpeaking: false
    }
  ];

  const handleCopyLink = () => {
    const link = meeting?.meetingLink || `https://relay.meet/${meeting?.meetingCode || 'arc-web-syn'}`;
    navigator.clipboard?.writeText(link);
    setCopiedLink(true);
    addToast({
      title: 'Meeting Link Copied',
      message: `Invitation copied: ${link}`,
      type: 'success'
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleToggleScreenShare = () => {
    setIsScreenSharing((prev) => {
      const nextState = !prev;
      addToast({
        title: nextState ? 'Screen Share Simulated' : 'Screen Sharing Stopped',
        message: nextState
          ? 'Screen sharing canvas is now active (WebRTC getDisplayMedia simulation).'
          : 'You are no longer sharing your screen.',
        type: nextState ? 'info' : 'default'
      });
      return nextState;
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      id: `call-msg-${Date.now()}`,
      sender: currentUser?.name || 'Alex Rivera',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full bg-slate-950 text-white overflow-hidden relative font-sans select-none">

      {/* ─────────────────────────────────────────────────────────────
          TOP BAR: Meeting Details, Timer & Demo Badge
      ─────────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md z-20 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-600 text-white shadow-xs shrink-0">
            <VideoIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
              {meeting?.title || 'Relay Video Meeting'}
            </h1>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
              <span className="font-mono text-indigo-400">{meeting?.meetingCode || 'arc-web-syn'}</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {formatTimer(secondsElapsed)}
              </span>
            </div>
          </div>
        </div>

        {/* Demo Indicator Pill & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Demo Room • WebRTC Simulated</span>
          </span>

          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            title="Copy invitation link"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{copiedLink ? 'Copied' : 'Invite'}</span>
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          MAIN CONTENT AREA: Video Tiles + Optional Side Drawer
      ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">

        {/* Center: Video Grid Container */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto flex flex-col justify-center items-center">

          {/* Screen Share Stage (if active) */}
          {isScreenSharing ? (
            <div className="w-full h-full flex flex-col gap-3">
              {/* Screen Share Screen */}
              <div className="flex-1 min-h-[300px] rounded-2xl bg-slate-900 border border-indigo-500/40 relative overflow-hidden flex flex-col shadow-2xl">
                <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-indigo-400" />
                    <span className="font-semibold text-white">
                      {currentUser?.name || 'Alex Rivera'} is sharing their screen
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      1080p • 60 FPS
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    relay-webrtc-stream.canvas
                  </span>
                </div>

                {/* Simulated Presentation Canvas */}
                <div className="flex-1 p-6 flex flex-col justify-center items-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/40 text-center font-mono">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 shadow-lg">
                    <Monitor className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">
                    Relay Unified Client Architecture (Simulated Stream)
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mb-4 leading-relaxed font-sans">
                    Displaying interactive design system tokens, WebRTC signaling channels, and client-side reactive state components.
                  </p>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-indigo-300 text-left max-w-md w-full">
                    <span className="text-slate-500">// Simulated WebRTC MediaStream</span><br />
                    <span>const peerConnection = new RTCPeerConnection(iceServers);</span><br />
                    <span className="text-emerald-400">peerConnection.addTrack(displayMediaStream.getVideoTracks()[0]);</span>
                  </div>
                </div>
              </div>

              {/* Bottom Strip of Participant Video Thumbnails */}
              <div className="h-28 flex gap-3 overflow-x-auto pb-1">
                {defaultAttendees.map((attendee) => (
                  <div
                    key={attendee.id}
                    className={`h-full aspect-video rounded-xl bg-slate-900 border relative overflow-hidden flex items-center justify-center shrink-0 ${
                      attendee.isSpeaking
                        ? 'border-emerald-500 shadow-xs shadow-emerald-500/20'
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                      {attendee.avatarInitials}
                    </div>
                    <div className="absolute bottom-1.5 left-2 flex items-center gap-1 bg-slate-950/80 px-1.5 py-0.5 rounded text-[10px] text-white">
                      <span className="truncate max-w-[80px]">{attendee.name}</span>
                      {attendee.micMuted ? <MicOff className="w-2.5 h-2.5 text-rose-400" /> : <Mic className="w-2.5 h-2.5 text-emerald-400" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Standard Participant Video Grid (2x2) */
            <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 my-auto">
              {defaultAttendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className={`aspect-video w-full rounded-2xl bg-slate-900 border relative overflow-hidden flex flex-col justify-between p-3.5 transition-all shadow-lg ${
                    attendee.isSpeaking
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'border-slate-800/90'
                  }`}
                >
                  {/* Top-right Status Indicators */}
                  <div className="flex items-center justify-between w-full z-10">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-950/60 backdrop-blur-xs text-slate-300 border border-slate-800">
                      {attendee.role}
                    </span>
                    {attendee.isSpeaking && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <Volume2 className="w-3 h-3 animate-pulse" />
                        Speaking
                      </span>
                    )}
                  </div>

                  {/* Center Video / Avatar Simulation */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {attendee.videoOff ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-slate-800 border border-slate-700 text-white font-bold text-lg sm:text-xl flex items-center justify-center shadow-md">
                          {attendee.avatarInitials}
                        </div>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                          <VideoOff className="w-3 h-3 text-slate-500" />
                          Camera off
                        </span>
                      </div>
                    ) : (
                      /* Simulated active camera stream with subtle gradient animation */
                      <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800/70 to-indigo-950/40">
                        <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-2xl bg-indigo-600 text-white font-bold text-xl sm:text-2xl flex items-center justify-center shadow-xl relative z-10">
                          {attendee.avatarInitials}
                        </div>
                        {attendee.isSpeaking && (
                          <div className="absolute w-24 h-24 rounded-full bg-emerald-500/10 animate-ping pointer-events-none" />
                        )}
                        <span className="absolute top-3 left-3 text-[10px] font-mono text-slate-500">
                          HD 1080p
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Participant Info Tag */}
                  <div className="relative z-10 flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-xs px-2.5 py-1 rounded-xl border border-slate-800 text-xs font-semibold text-white">
                      <span>{attendee.name}</span>
                      {attendee.micMuted ? (
                        <MicOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      ) : (
                        <Mic className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            SIDE DRAWER: Participants List or In-Call Chat
        ─────────────────────────────────────────────────────────────── */}
        {activeDrawer && (
          <aside className="w-80 border-l border-slate-800 bg-slate-900/95 flex flex-col z-20 animate-in slide-in-from-right duration-150">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {activeDrawer === 'participants' ? (
                  <>
                    <Users className="w-4 h-4 text-indigo-400" />
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                      Participants ({defaultAttendees.length})
                    </h2>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                      In-Call Chat
                    </h2>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveDrawer(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                aria-label="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Participants View */}
            {activeDrawer === 'participants' && (
              <div className="flex-1 p-3 overflow-y-auto space-y-2">
                {defaultAttendees.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-800"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {attendee.avatarInitials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {attendee.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {attendee.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
                      {attendee.micMuted ? (
                        <MicOff className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <Mic className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      {attendee.videoOff ? (
                        <VideoOff className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <VideoIcon className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                    </div>
                  </div>
                ))}

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-indigo-300 border border-slate-700 transition-colors"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Copy Meeting Link</span>
                  </button>
                </div>
              </div>
            )}

            {/* Chat View */}
            {activeDrawer === 'chat' && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Messages List */}
                <div className="flex-1 p-3 overflow-y-auto space-y-3">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className="text-xs bg-slate-800/60 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-indigo-300">{msg.sender}</span>
                        <span className="text-[10px] text-slate-500">{msg.time}</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed">{msg.text}</p>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Send message to everyone..."
                    className="flex-1 px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shrink-0"
                    aria-label="Send message"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BOTTOM FLOATING CONTROLS BAR
          Microphone, Camera, Screen-Share, Participants, Chat & Leave
      ─────────────────────────────────────────────────────────────── */}
      <footer className="p-3 sm:p-4 bg-slate-900/95 border-t border-slate-800/80 backdrop-blur-md flex items-center justify-between z-20 shrink-0">

        {/* Left spacer / Meeting info */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 min-w-[120px]">
          <span>{meeting?.title || 'Relay Room'}</span>
        </div>

        {/* Center: Essential Call Controls */}
        <div className="flex items-center gap-2 sm:gap-3 mx-auto">

          {/* 1. Microphone Toggle */}
          <button
            type="button"
            onClick={() => setIsMicMuted((prev) => !prev)}
            aria-label={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
            className={`p-3 rounded-2xl transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              isMicMuted
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
            title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-400" />}
          </button>

          {/* 2. Camera Toggle */}
          <button
            type="button"
            onClick={() => setIsVideoOff((prev) => !prev)}
            aria-label={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
            className={`p-3 rounded-2xl transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              isVideoOff
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5 text-indigo-400" />}
          </button>

          {/* 3. Screen Share Toggle */}
          <button
            type="button"
            onClick={handleToggleScreenShare}
            aria-label={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
            className={`p-3 rounded-2xl transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              isScreenSharing
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white ring-2 ring-indigo-400'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
            title={isScreenSharing ? 'Stop sharing screen' : 'Share screen (Simulated)'}
          >
            <Monitor className="w-5 h-5" />
          </button>

          {/* 4. Participants Drawer Toggle */}
          <button
            type="button"
            onClick={() => setActiveDrawer((prev) => (prev === 'participants' ? null : 'participants'))}
            aria-label="Toggle participants list"
            className={`p-3 rounded-2xl transition-all shadow-sm relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              activeDrawer === 'participants'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
            title="Participants"
          >
            <Users className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 text-[10px] font-bold flex items-center justify-center text-white">
              {defaultAttendees.length}
            </span>
          </button>

          {/* 5. In-Call Chat Drawer Toggle */}
          <button
            type="button"
            onClick={() => setActiveDrawer((prev) => (prev === 'chat' ? null : 'chat'))}
            aria-label="Toggle in-call chat"
            className={`p-3 rounded-2xl transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              activeDrawer === 'chat'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
            title="In-call chat"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* 6. Leave Call Action */}
          <button
            type="button"
            onClick={onLeave}
            aria-label="Leave meeting"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm shadow-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            title="Leave meeting"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Leave</span>
          </button>
        </div>

        {/* Right side helper / invite button */}
        <div className="hidden md:flex items-center justify-end min-w-[120px]">
          <button
            type="button"
            onClick={handleCopyLink}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Copy Link</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
