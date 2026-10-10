
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
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
  AlertCircle,
  Volume2,
  LoaderCircle,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { auth } from '../../config/firebase';
import { useToast } from '../../context/ToastContext';

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;

  return [
    ...(hours ? [String(hours).padStart(2, '0')] : []),
    String(minutes).padStart(2, '0'),
    String(remaining).padStart(2, '0'),
  ].join(':');
}

function getInitials(name = 'Participant') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase();
}

function VideoTile({
  name,
  role,
  stream,
  muted = false,
  cameraOff = false,
  local = false,
}) {
  const videoRef = useRef(null);
  const [hasVideo, setHasVideo] = useState(false);


  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    video.srcObject = stream || null;

    const updateVideoState = () => {
      const activeVideo = Boolean(
        stream?.getVideoTracks().some(
          (track) => track.readyState === 'live' && track.enabled
        )
      );

      setHasVideo(activeVideo && !cameraOff);
    };

    updateVideoState();
    stream?.getVideoTracks().forEach((track) => {
      track.addEventListener('mute', updateVideoState);
      track.addEventListener('unmute', updateVideoState);
      track.addEventListener('ended', updateVideoState);
    });

    return () => {
      stream?.getVideoTracks().forEach((track) => {
        track.removeEventListener('mute', updateVideoState);
        track.removeEventListener('unmute', updateVideoState);
        track.removeEventListener('ended', updateVideoState);
      });

      if (video) video.srcObject = null;
    };
  }, [stream, cameraOff]);

  return (
    <div className="relative flex min-h-0 min-w-0 aspect-video items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-200/80 shadow-md transition-colors dark:border-slate-800 dark:bg-slate-900 dark:shadow-lg">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`absolute inset-0 h-full w-full object-cover ${
          hasVideo ? 'block' : 'hidden'
        } ${local && hasVideo ? '-scale-x-100' : ''}`}
      />

      {!hasVideo && (
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-300 bg-white text-xl font-bold text-indigo-600 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-300">
            {getInitials(name)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            {cameraOff || !stream?.getVideoTracks().length ? (
              <>
                <VideoOff className="h-3.5 w-3.5" />
                Camera off
              </>
            ) : (
              <>
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                Waiting for video
              </>
            )}
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-8">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-xs font-semibold text-white">
            {name}
            {local ? ' (You)' : ''}
          </span>
          {role === 'Host' && (
            <span className="rounded-md bg-indigo-500/30 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-200">
              Host
            </span>
          )}
        </div>
        <Volume2 className="h-3.5 w-3.5 shrink-0 text-slate-300" />
      </div>
    </div>
  );
}

export const MeetingRoom = ({ meeting, onLeave, currentUser }) => {
  const { addToast } = useToast();

  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [participants, setParticipants] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [roomError, setRoomError] = useState('');
  const [mediaError, setMediaError] = useState('');
  const [isLeaving, setIsLeaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(
  Boolean(document.fullscreenElement)
);

  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const pendingCandidatesRef = useRef(new Map());
  const localVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const startedAtRef = useRef(Date.now());
  const joinedRef = useRef(false);
  const leavingRef = useRef(false);
  const activeRef = useRef(true);

  const meetingCode = String(
    meeting?.meetingCode || meeting?.code || ''
  ).trim().toUpperCase();

  const currentName =
    currentUser?.displayName ||
    currentUser?.name ||
    auth.currentUser?.displayName ||
    auth.currentUser?.email ||
    'You';

  const currentUid =
    auth.currentUser?.uid || currentUser?.uid || currentUser?.id;

  const hostId = meeting?.hostId;

  const isHost = Boolean(currentUid && hostId && currentUid === hostId);

  const getAuthHeaders = useCallback(async () => {
    if (!auth.currentUser) {
      throw new Error('Please sign in again to join this meeting.');
    }

    const token = await auth.currentUser.getIdToken();

    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, []);
const handleToggleFullscreen = async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  } catch (error) {
    console.error('Fullscreen toggle failed:', error);

    addToast({
      title: 'Fullscreen unavailable',
      message: 'Your browser could not switch to fullscreen.',
      type: 'error',
    });
  }
};
  const stopScreenSharing = useCallback(async () => {
    const screenStream = screenStreamRef.current;
    if (!screenStream) return;

    screenStream.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;

    const cameraTrack = localStreamRef.current?.getVideoTracks()[0];

    for (const pc of peerConnectionsRef.current.values()) {
      const sender = pc.getSenders().find(
        (item) => item.track?.kind === 'video'
      );

      if (sender && cameraTrack) {
        try {
          await sender.replaceTrack(cameraTrack);
        } catch (error) {
          console.error('Could not restore camera track:', error);
        }
      }
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }

    setIsScreenSharing(false);
  }, []);

  useEffect(() => {
    activeRef.current = true;
    leavingRef.current = false;
    joinedRef.current = false;

    if (!meetingCode) {
      setRoomError('This meeting has no valid meeting code.');
      setConnectionStatus('error');
      return undefined;
    }

    let disposed = false;

    const emitError = (message) => {
      if (disposed) return;
      setRoomError(message || 'Unable to connect to the meeting.');
      setConnectionStatus('error');
      addToast({
        title: 'Meeting Error',
        message: message || 'Unable to connect to the meeting.',
        type: 'error',
      });
    };

    const removePeer = (socketId) => {
      const pc = peerConnectionsRef.current.get(socketId);

      if (pc) {
        pc.onicecandidate = null;
        pc.ontrack = null;
        pc.close();
        peerConnectionsRef.current.delete(socketId);
      }

      pendingCandidatesRef.current.delete(socketId);

      setRemoteStreams((previous) => {
        const next = { ...previous };
        delete next[socketId];
        return next;
      });

      setParticipants((previous) =>
        previous.filter((participant) => participant.socketId !== socketId)
      );
    };

    const createPeerConnection = (peer) => {
      const existing = peerConnectionsRef.current.get(peer.socketId);
      if (existing) return existing;

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionsRef.current.set(peer.socketId, pc);
      pendingCandidatesRef.current.set(peer.socketId, []);

      const localStream = localStreamRef.current;

      localStream?.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;

        socketRef.current?.emit('webrtc:ice-candidate', {
          targetSocketId: peer.socketId,
          candidate: event.candidate,
        });
      };

      pc.ontrack = (event) => {
        if (disposed) return;

        const incomingStream =
          event.streams?.[0] || new MediaStream([event.track]);

        setRemoteStreams((previous) => ({
          ...previous,
          [peer.socketId]: incomingStream,
        }));
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          if (pc.connectionState === 'failed') {
            console.warn('WebRTC connection failed:', peer.socketId);
          }
        }
      };

      return pc;
    };

    const flushCandidates = async (socketId, pc) => {
      const candidates = pendingCandidatesRef.current.get(socketId) || [];
      pendingCandidatesRef.current.set(socketId, []);

      for (const candidate of candidates) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.warn('Could not add queued ICE candidate:', error);
        }
      }
    };

    const startOffer = async (peer) => {
      if (!peer?.socketId || peer.socketId === socketRef.current?.id) return;

      try {
        const pc = createPeerConnection(peer);

        if (pc.signalingState !== 'stable') return;

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socketRef.current?.emit('webrtc:offer', {
          targetSocketId: peer.socketId,
          offer: pc.localDescription,
        });
      } catch (error) {
        console.error('Could not create WebRTC offer:', error);
      }
    };

    const handleOffer = async ({
      fromSocketId,
      fromUser,
      offer,
    } = {}) => {
      if (!fromSocketId || !offer || disposed) return;

      try {
        const peer = {
          ...fromUser,
          socketId: fromSocketId,
        };

        const pc = createPeerConnection(peer);

        if (pc.signalingState !== 'stable') {
          console.warn('Ignoring offer because connection is not stable.');
          return;
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await flushCandidates(fromSocketId, pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketRef.current?.emit('webrtc:answer', {
          targetSocketId: fromSocketId,
          answer: pc.localDescription,
        });
      } catch (error) {
        console.error('Could not handle WebRTC offer:', error);
      }
    };

    const handleAnswer = async ({ fromSocketId, answer } = {}) => {
      const pc = peerConnectionsRef.current.get(fromSocketId);
      if (!pc || !answer) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await flushCandidates(fromSocketId, pc);
      } catch (error) {
        console.error('Could not apply WebRTC answer:', error);
      }
    };

    const handleIceCandidate = async ({
      fromSocketId,
      candidate,
    } = {}) => {
      if (!fromSocketId || !candidate) return;

      const pc = peerConnectionsRef.current.get(fromSocketId);

      if (!pc || !pc.remoteDescription) {
        const queue = pendingCandidatesRef.current.get(fromSocketId) || [];
        queue.push(candidate);
        pendingCandidatesRef.current.set(fromSocketId, queue);
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.warn('Could not apply ICE candidate:', error);
      }
    };

    const handleParticipantJoined = (participant) => {
      if (!participant?.socketId) return;

      setParticipants((previous) => {
        if (previous.some((item) => item.socketId === participant.socketId)) {
          return previous;
        }

        return [...previous, participant];
      });
    };

    const handleParticipantLeft = ({ socketId } = {}) => {
      if (socketId) removePeer(socketId);
    };

    const handleChatMessage = (message) => {
      if (!message?.id || !message?.text) return;

      setChatMessages((previous) => {
        if (previous.some((item) => item.id === message.id)) return previous;
        return [...previous, message];
      });
    };

    const handleMeetingJoined = ({ self, participants: existing = [] } = {}) => {
      if (disposed) return;

      joinedRef.current = true;
      setConnectionStatus('connected');
      setRoomError('');

      setParticipants([
        ...(self ? [{ ...self, isSelf: true }] : []),
        ...existing.filter(
          (participant) => participant.socketId !== self?.socketId
        ),
      ]);

      // The newly joined client initiates offers to everyone already in the room.
      existing.forEach((participant) => startOffer(participant));
    };

    const handleMeetingError = ({ message } = {}) => {
      emitError(message);
    };

    const connect = async () => {
      try {
        if (!auth.currentUser) {
          throw new Error('Please sign in before joining the meeting.');
        }

        setConnectionStatus('connecting');
        setRoomError('');

        const headers = await getAuthHeaders();

        // Register this user as a meeting participant in the backend first.
        const joinResponse = await fetch(
          `${API_URL}/api/meetings/${encodeURIComponent(meetingCode)}/join`,
          {
            method: 'POST',
            headers,
          }
        );

        const joinData = await joinResponse.json().catch(() => ({}));

        if (!joinResponse.ok) {
          throw new Error(
            joinData.message || joinData.error || 'Could not join this meeting.'
          );
        }

        if (disposed) return;

        // Request actual camera and microphone access.
        try {
          localStreamRef.current =
            await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: true,
            });

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        } catch (error) {
          console.warn('Camera/microphone unavailable:', error);

          localStreamRef.current = new MediaStream();

          const message =
            error.name === 'NotAllowedError'
              ? 'Camera/microphone permission was denied. You can still join without them.'
              : 'Camera/microphone could not start. Check your device settings.';

          setMediaError(message);

          addToast({
            title: 'Media Unavailable',
            message,
            type: 'warning',
          });
        }

        if (disposed) return;

        const socket = io(API_URL, {
          autoConnect: false,
          reconnection: true,
          reconnectionAttempts: 5,
        });

        socketRef.current = socket;

        socket.on('connect', async () => {
          try {
            const token = await auth.currentUser?.getIdToken();

            if (!token || disposed) return;

            socket.emit('meeting:join', {
              code: meetingCode,
              token,
            });
          } catch (error) {
            emitError(error.message);
          }
        });

        socket.on('meeting:joined', handleMeetingJoined);
        socket.on('meeting:error', handleMeetingError);
        socket.on('meeting:participant-joined', handleParticipantJoined);
        socket.on('meeting:participant-left', handleParticipantLeft);
        socket.on('meeting:chat-message', handleChatMessage);
        socket.on('webrtc:offer', handleOffer);
        socket.on('webrtc:answer', handleAnswer);
        socket.on('webrtc:ice-candidate', handleIceCandidate);

        socket.on('disconnect', () => {
          if (!disposed) setConnectionStatus('reconnecting');
        });

        socket.on('connect_error', (error) => {
          if (!disposed) {
            setConnectionStatus('reconnecting');
            setRoomError(error.message || 'Signaling connection interrupted.');
          }
        });

        socket.connect();
      } catch (error) {
        emitError(error.message);
      }
    };

    connect();

    return () => {
      disposed = true;
      activeRef.current = false;

      const socket = socketRef.current;

      if (socket) {
        socket.emit('meeting:leave');
        socket.removeAllListeners();
        socket.disconnect();
        socketRef.current = null;
      }

      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      pendingCandidatesRef.current.clear();

      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;

      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    };
  }, [meetingCode, getAuthHeaders, addToast]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const video = localVideoRef.current;
    if (video && localStreamRef.current) {
      video.srcObject = localStreamRef.current;
    }
  }, [isVideoOff]);

  const handleToggleMic = () => {
    const nextMuted = !isMicMuted;

    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });

    setIsMicMuted(nextMuted);
  };

  const handleToggleVideo = () => {
    const nextOff = !isVideoOff;

    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = !nextOff;
    });

    setIsVideoOff(nextOff);
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      await stopScreenSharing();
      return;
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
      addToast({
        title: 'Screen Sharing Unavailable',
        message: 'Use a supported browser and a secure connection to share your screen.',
        type: 'error',
      });
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      screenStreamRef.current = displayStream;

      const screenTrack = displayStream.getVideoTracks()[0];

      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = displayStream;
      }

      for (const pc of peerConnectionsRef.current.values()) {
        const sender = pc.getSenders().find(
          (item) => item.track?.kind === 'video'
        );

        if (sender) {
          await sender.replaceTrack(screenTrack);
        } else {
          pc.addTrack(screenTrack, displayStream);
        }
      }

      screenTrack.onended = () => {
        stopScreenSharing();
      };

      setIsScreenSharing(true);

      addToast({
        title: 'Screen Sharing Started',
        message: 'Your selected screen is now being shared.',
        type: 'success',
      });
    } catch (error) {
      if (error.name !== 'NotAllowedError') {
        addToast({
          title: 'Could Not Share Screen',
          message: error.message || 'Screen sharing failed.',
          type: 'error',
        });
      }
    }
  };

useEffect(() => {
  const handleFullscreenChange = () => {
    setIsFullscreen(Boolean(document.fullscreenElement));
  };

  document.addEventListener('fullscreenchange', handleFullscreenChange);

  return () => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
  };
}, []);
  const handleSendMessage = (event) => {
    event.preventDefault();

    const text = chatInput.trim();
    if (!text || !socketRef.current?.connected) return;

    socketRef.current.emit('meeting:chat', { text });
    setChatInput('');
  };

  const handleCopyLink = async () => {
    const link =
      meeting?.meetingLink ||
      `${window.location.origin}/meet/${encodeURIComponent(meetingCode)}`;

    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);

      addToast({
        title: 'Meeting Link Copied',
        message: 'Share the link with an invited participant.',
        type: 'success',
      });

      window.setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      addToast({
        title: 'Could Not Copy Link',
        message: 'Please copy the meeting link from your browser address bar.',
        type: 'error',
      });
    }
  };

  const handleLeave = async () => {
    if (leavingRef.current) return;

    leavingRef.current = true;
    setIsLeaving(true);

    try {
      await stopScreenSharing();

      const socket = socketRef.current;
      socket?.emit('meeting:leave');

      const headers = await getAuthHeaders();

      await fetch(
        `${API_URL}/api/meetings/${encodeURIComponent(meetingCode)}/leave`,
        {
          method: 'POST',
          headers,
        }
      );
    } catch (error) {
      console.error('Meeting leave request failed:', error);
    } finally {
      socketRef.current?.disconnect();

      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();

      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;

      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;

      onLeave?.();
    }
  };

  const selfParticipant = {
    uid: currentUid || 'self',
    name: currentName,
    socketId: 'self',
    isSelf: true,
  };

  const displayedParticipants = [
    selfParticipant,
    ...participants.filter(
      (participant) =>
        !participant.isSelf &&
        participant.socketId !== socketRef.current?.id
    ),
  ];
  

  return (
    <div className="relative flex h-[calc(100vh-4rem)] w-full select-none flex-col overflow-hidden bg-slate-100 font-sans text-slate-900 transition-colors duration-150 dark:bg-slate-950 dark:text-white">
      <header className="z-20 flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <VideoIcon className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <h1 className="max-w-md truncate text-sm font-bold text-slate-900 dark:text-white">
              {meeting?.title || 'Meeting Room'}
            </h1>

            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-mono text-indigo-600 dark:text-indigo-300">{meetingCode}</span>
              <span>·</span>
              <span className="font-mono">{formatDuration(secondsElapsed)}</span>
              <span>·</span>
              <span
                className={
                  connectionStatus === 'connected'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : connectionStatus === 'error'
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-amber-600 dark:text-amber-300'
                }
              >
                {connectionStatus === 'connected'
                  ? 'Connected'
                  : connectionStatus === 'error'
                    ? 'Connection error'
                    : connectionStatus === 'reconnecting'
                      ? 'Reconnecting…'
                      : 'Connecting…'}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggleFullscreen}
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-indigo-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:bg-slate-700"
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          </span>
        </button>
        <button
          type="button"
          onClick={handleCopyLink}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {copiedLink ? (
            <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {copiedLink ? 'Copied' : 'Invite'}
          </span>
        </button>
      </header>

      {(roomError || mediaError) && (
        <div className="z-10 flex shrink-0 items-start gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{roomError || mediaError}</span>
        </div>
      )}

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <main className="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:p-4">
          {isScreenSharing && (
            <section className="relative min-h-[200px] flex-1 overflow-hidden rounded-2xl border border-indigo-400/50 bg-slate-200 dark:border-indigo-500/40 dark:bg-slate-900">
              <video
                ref={screenVideoRef}
                autoPlay
                playsInline
                muted
                className="h-full max-h-[55vh] min-h-[200px] w-full object-contain"
              />
              <div className="absolute left-3 top-3 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-900 shadow-xs dark:border-slate-700 dark:bg-slate-950/80 dark:text-white">
                <Monitor className="mr-2 inline h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                Your screen is being shared
              </div>
            </section>
          )}

          <div
            className={`grid w-full flex-1 content-center gap-3 ${
              displayedParticipants.length === 1
                ? 'mx-auto max-w-4xl grid-cols-1'
                : displayedParticipants.length <= 4
                  ? 'mx-auto w-full max-w-6xl grid-cols-1 sm:grid-cols-2'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            <VideoTile
              name={currentName}
              role={isHost ? 'Host' : 'Participant'}
              stream={localStreamRef.current}
              muted
              cameraOff={isVideoOff}
              local
            />

            {participants
              .filter(
                (participant) =>
                  !participant.isSelf &&
                  participant.socketId !== socketRef.current?.id
              )
              .map((participant) => (
                <VideoTile
                  key={participant.socketId}
                  name={
                    participant.name ||
                    participant.email ||
                    'Participant'
                  }
                  role={participant.uid === hostId ? 'Host' : 'Participant'}
                  stream={remoteStreams[participant.socketId]}
                />
              ))}
          </div>

          {connectionStatus === 'connected' && participants.length === 0 && (
            <p className="text-center text-xs text-slate-500">
              Waiting for other participants to join…
            </p>
          )}
        </main>

        {activeDrawer && (
          <aside className="absolute inset-y-0 right-0 z-20 flex w-full max-w-sm flex-col border-l border-slate-200 bg-white text-slate-900 shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:relative sm:w-80 sm:shrink-0">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {activeDrawer === 'participants' ? (
                  <>
                    <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Participants ({displayedParticipants.length})
                    </h2>
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      In-call chat
                    </h2>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setActiveDrawer(null)}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {activeDrawer === 'participants' ? (
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {displayedParticipants.map((participant) => (
                  <div
                    key={participant.socketId || participant.uid}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-xs font-bold text-white">
                      {getInitials(participant.name || participant.email)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                        {participant.name || participant.email || 'Participant'}
                        {participant.isSelf ? ' (You)' : ''}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {participant.uid === hostId || (participant.isSelf && isHost)
                          ? 'Host'
                          : 'Participant'}
                      </p>
                    </div>

                    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 dark:bg-emerald-400" title="Connected" />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 py-2.5 text-xs font-semibold text-indigo-600 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-slate-700"
                >
                  <Link2 className="h-4 w-4" />
                  Copy meeting link
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto p-3">
                  {chatMessages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                      <MessageSquare className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        No messages yet
                      </p>
                      <p className="max-w-[220px] text-[11px] text-slate-500">
                        Messages sent here are delivered to connected meeting participants.
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60"
                      >
                        <div className="mb-1.5 flex items-start justify-between gap-2">
                          <span className="truncate text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                            {message.sender || 'Participant'}
                          </span>
                          <span className="shrink-0 text-[10px] text-slate-400 dark:text-slate-500">
                            {message.timestamp
                              ? new Date(message.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                          {message.text}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2 border-t border-slate-200 p-3 dark:border-slate-800"
                >
                  <input
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    maxLength={4000}
                    placeholder="Message everyone…"
                    className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || connectionStatus !== 'connected'}
                    className="rounded-xl bg-indigo-600 p-2.5 text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </>
            )}
          </aside>
        )}
      </div>

      <footer className="z-20 flex shrink-0 items-center justify-between gap-2 border-t border-slate-200 bg-white/95 px-3 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 sm:px-5">
        <div className="hidden min-w-0 flex-1 md:block">
          <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-300">
            {meeting?.title || 'Meeting Room'}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">
            {displayedParticipants.length} participant
            {displayedParticipants.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleToggleMic}
            aria-label={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
            title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
            className={`rounded-2xl border p-3 transition ${
              isMicMuted
                ? 'border-rose-500 bg-rose-600 text-white'
                : 'border-slate-200 bg-slate-100 text-emerald-600 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-300 dark:hover:bg-slate-700'
            }`}
          >
            {isMicMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={handleToggleVideo}
            aria-label={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
            className={`rounded-2xl border p-3 transition ${
              isVideoOff
                ? 'border-rose-500 bg-rose-600 text-white'
                : 'border-slate-200 bg-slate-100 text-indigo-600 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-slate-700'
            }`}
          >
            {isVideoOff ? <VideoOff className="h-5 w-5" /> : <VideoIcon className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={handleToggleScreenShare}
            aria-label={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
            title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
            className={`rounded-2xl border p-3 transition ${
              isScreenSharing
                ? 'border-indigo-400 bg-indigo-600 text-white'
                : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Monitor className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveDrawer((previous) =>
                previous === 'participants' ? null : 'participants'
              )
            }
            aria-label="Toggle participants"
            title="Participants"
            className={`relative rounded-2xl border p-3 transition ${
              activeDrawer === 'participants'
                ? 'border-indigo-400 bg-indigo-600 text-white'
                : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Users className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[9px] font-bold text-white">
              {displayedParticipants.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveDrawer((previous) =>
                previous === 'chat' ? null : 'chat'
              )
            }
            aria-label="Toggle in-call chat"
            title="In-call chat"
            className={`rounded-2xl border p-3 transition ${
              activeDrawer === 'chat'
                ? 'border-indigo-400 bg-indigo-600 text-white'
                : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <MessageSquare className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={handleLeave}
            disabled={isLeaving}
            aria-label="Leave meeting"
            className="flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-xs font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60 sm:px-5 sm:text-sm"
          >
            {isLeaving ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <PhoneOff className="h-4 w-4" />
            )}
            <span>{isLeaving ? 'Leaving…' : 'Leave'}</span>
          </button>
        </div>

        <div className="hidden flex-1 justify-end md:flex">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <Link2 className="h-4 w-4" />
            Copy link
          </button>
        </div>
      </footer>
    </div>
  );
};

export default MeetingRoom;