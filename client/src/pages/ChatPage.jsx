
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Hash,
  Send,
  Paperclip,
  Smile,
  Users,
  Info,
  Check,
  CheckCheck,
  Search,
  X,
  ArrowLeft,
  FileText,
  FileCode,
  Image as ImageIcon,
  ShieldCheck,
  MessageSquare,
  RefreshCw
} from 'lucide-react';

import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/common/EmptyState';
import { ChatMessageSkeleton } from '../components/common/Skeleton';
import { socket } from '../services/socket';

import {
  getChats,
  getMessages,
  sendMessage,
  uploadFile
} from '../services/api';

export const ChatPage = ({
  conversations,
  onUpdateConversations,
  initialMessages,
  searchQuery = '',
  targetConversationId = null,
  onClearTargetConversationId
}) => {
  const [activeConvId, setActiveConvId] = useState(
    conversations[0]?.id || null
  );

  const [messagesState, setMessagesState] = useState(initialMessages || {});
  const [inputMessage, setInputMessage] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [mobileView, setMobileView] = useState('list');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { addToast } = useToast();
  const { user } = useAuth();

  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);

  /*
   * Resolve the selected conversation.
   */
  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) =>
          String(conversation.id) === String(activeConvId)
      ) || null,
    [conversations, activeConvId]
  );

  /*
   * Resolve the other participant's name.
   *
   * Supports common conversation fields and participant arrays.
   * For direct chats, the conversation name is used as a fallback.
   */
  const activeChatName = useMemo(() => {
    const conversation = activeConversation;

    if (!conversation) return 'Select a conversation';

    const isChannel = conversation.type === 'channel';

    if (isChannel) {
      return (
        conversation.name ||
        conversation.displayName ||
        'Channel'
      );
    }

    const directName =
      conversation.recipientName ||
      conversation.receiverName ||
      conversation.otherUserName ||
      conversation.memberName ||
      conversation.contactName;

    if (directName) return directName;

    const participants =
      conversation.participants ||
      conversation.members ||
      conversation.users ||
      [];

    if (Array.isArray(participants) && participants.length > 0) {
      const otherParticipant = participants.find((participant) => {
        const participantId =
          typeof participant === 'string'
            ? participant
            : participant?.uid ||
              participant?.id ||
              participant?.userId;

        return (
          participantId &&
          String(participantId) !== String(user?.id)
        );
      });

      if (otherParticipant && typeof otherParticipant === 'object') {
        const name =
          otherParticipant.name ||
          otherParticipant.displayName ||
          otherParticipant.fullName ||
          otherParticipant.email;

        if (name) return name;
      }
    }

    return (
      conversation.displayName ||
      conversation.name ||
      conversation.memberEmail ||
      conversation.email ||
      'Chat'
    );
  }, [activeConversation, user?.id]);

  /*
   * Connect Socket.IO.
   */
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.disconnect();
    };
  }, []);

  /*
   * Join the active conversation.
   */
  useEffect(() => {
    if (!activeConvId) return;

    const joinConversation = () => {
      socket.emit('join_conversation', activeConvId);
    };

    if (socket.connected) {
      joinConversation();
    } else {
      socket.once('connect', joinConversation);
    }

    return () => {
      socket.off('connect', joinConversation);

      if (socket.connected) {
        socket.emit('leave_conversation', activeConvId);
      }
    };
  }, [activeConvId]);

  /*
   * Load conversations from the backend.
   */
  useEffect(() => {
    let cancelled = false;

    const loadChats = async () => {
      try {
        const data = await getChats();

        if (cancelled) return;

        const backendConversations = data.conversations || [];

        if (backendConversations.length > 0) {
          onUpdateConversations(backendConversations);
        }

        if (targetConversationId) {
          const targetExists = backendConversations.some(
            (conversation) =>
              String(conversation.id) ===
              String(targetConversationId)
          );

          if (targetExists) {
            setActiveConvId(targetConversationId);
            setMobileView('thread');
          }
        } else if (backendConversations.length > 0) {
          setActiveConvId((currentId) => {
            const stillExists = backendConversations.some(
              (conversation) =>
                String(conversation.id) === String(currentId)
            );

            return stillExists
              ? currentId
              : backendConversations[0].id;
          });
        }
      } catch (error) {
        console.error('Chats API error:', error);
      }
    };

    loadChats();

    return () => {
      cancelled = true;
    };
  }, [onUpdateConversations, targetConversationId]);

  /*
   * Open a conversation selected from Contacts.
   */
  useEffect(() => {
    if (!targetConversationId) return;

    setActiveConvId(targetConversationId);
    setMobileView('thread');

    onClearTargetConversationId?.();
  }, [targetConversationId, onClearTargetConversationId]);

  /*
   * Load messages for the active conversation.
   */
  useEffect(() => {
    if (!activeConvId) return;

    let cancelled = false;

    const loadMessages = async () => {
      try {
        const data = await getMessages(activeConvId);

        if (cancelled) return;

        setMessagesState((previous) => ({
          ...previous,
          [activeConvId]: data.messages || []
        }));
      } catch (error) {
        console.error('Messages API error:', error);
      }
    };

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [activeConvId]);

  /*
   * Listen for incoming messages.
   * Refresh from the backend when a message arrives in this conversation.
   */
  useEffect(() => {
    if (!activeConvId) return;

    const handleIncomingMessage = (incoming) => {
      const incomingConversationId =
        incoming?.conversationId ||
        incoming?.chatId;

      if (
        incomingConversationId &&
        String(incomingConversationId) === String(activeConvId)
      ) {
        getMessages(activeConvId)
          .then((data) => {
            setMessagesState((previous) => ({
              ...previous,
              [activeConvId]: data.messages || []
            }));
          })
          .catch((error) => {
            console.error('Incoming message refresh error:', error);
          });
      }
    };

    socket.on('new_message', handleIncomingMessage);

    return () => {
      socket.off('new_message', handleIncomingMessage);
    };
  }, [activeConvId]);

  /*
   * Close emoji picker on Escape.
   */
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowEmojiPicker(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  /*
   * Close emoji picker when clicking outside.
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /*
   * Filter conversations.
   */
  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      if (
        filterType === 'channels' &&
        conversation.type !== 'channel'
      ) {
        return false;
      }

      if (
        filterType === 'direct' &&
        conversation.type !== 'direct'
      ) {
        return false;
      }

      if (
        filterType === 'unread' &&
        !(conversation.unreadCount > 0)
      ) {
        return false;
      }

      const query = (sidebarSearch || searchQuery)
        .trim()
        .toLowerCase();

      if (!query) return true;

      return [
        conversation.name,
        conversation.lastMessage,
        conversation.topic
      ].some((value) =>
        String(value || '').toLowerCase().includes(query)
      );
    });
  }, [conversations, filterType, sidebarSearch, searchQuery]);

  /*
   * Keep a valid active conversation.
   */
  useEffect(() => {
    if (filteredConversations.length === 0) return;

    const exists = filteredConversations.some(
      (conversation) =>
        String(conversation.id) === String(activeConvId)
    );

    if (!exists) {
      setActiveConvId(filteredConversations[0].id);
    }
  }, [filteredConversations, activeConvId]);

  const currentMessages = messagesState[activeConvId] || [];

  /*
   * Scroll to the latest message.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [activeConvId, currentMessages.length]);

  /*
   * Select a conversation.
   */
  const handleSelectConversation = (conversationId) => {
    setActiveConvId(conversationId);
    setMobileView('thread');

    if (onUpdateConversations) {
      onUpdateConversations((previous) =>
        previous.map((conversation) =>
          String(conversation.id) === String(conversationId)
            ? { ...conversation, unreadCount: 0 }
            : conversation
        )
      );
    }
  };

  /*
   * Send a message.
   */
  const handleSendMessage = async (event) => {
    event?.preventDefault();

    if (!activeConvId) {
      addToast({
        title: 'No conversation selected',
        message: 'Select a conversation before sending a message.',
        type: 'error'
      });
      return;
    }

    const content = inputMessage.trim();

    if (!content && !attachedFile) return;

    const conversationId = activeConvId;

    try {
      let attachment = null;

      if (attachedFile?.file) {
        addToast({
          title: 'Uploading File',
          message: `Uploading "${attachedFile.name}"...`,
          type: 'info'
        });

        const uploadResponse = await uploadFile(attachedFile.file);
        const uploadedFile = uploadResponse.file;

        attachment = {
          name: attachedFile.name,
          size: attachedFile.size,
          type: attachedFile.type,
          url: uploadedFile.url,
          publicId: uploadedFile.publicId,
          resourceType: uploadedFile.resourceType,
          format: uploadedFile.format,
          bytes: uploadedFile.bytes
        };
      }

      const data = await sendMessage(conversationId, {
        content,
        attachment
      });

      const newMessage = data.message;

      setMessagesState((previous) => ({
        ...previous,
        [conversationId]: [
          ...(previous[conversationId] || []),
          newMessage
        ]
      }));

      if (onUpdateConversations) {
        onUpdateConversations((previous) =>
          previous.map((conversation) =>
            String(conversation.id) === String(conversationId)
              ? {
                  ...conversation,
                  lastMessage:
                    content ||
                    `📎 ${attachment?.name || 'Attachment'}`,
                  updatedAt: new Date()
                }
              : conversation
          )
        );
      }

      setInputMessage('');
      setAttachedFile(null);
      setShowEmojiPicker(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      addToast({
        title: 'Message Sent',
        message: `Sent to ${activeChatName}`,
        type: 'success'
      });
    } catch (error) {
      console.warn('Backend message endpoint unavailable; sending in demo mode:', error.message);

      const demoMsg = {
        id: `msg-${Date.now()}`,
        conversationId,
        senderId: user?.id || 'demo-usr-1',
        senderName: user?.name || 'Alex Rivera',
        content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'delivered',
        isSelf: true
      };

      setMessagesState((previous) => ({
        ...previous,
        [conversationId]: [
          ...(previous[conversationId] || []),
          demoMsg
        ]
      }));

      if (onUpdateConversations) {
        onUpdateConversations((previous) =>
          previous.map((conversation) =>
            String(conversation.id) === String(conversationId)
              ? {
                  ...conversation,
                  lastMessage: content || '📎 Attachment',
                  updatedAt: new Date()
                }
              : conversation
          )
        );
      }

      setInputMessage('');
      setAttachedFile(null);
      setShowEmojiPicker(false);

      addToast({
        title: 'Message Sent',
        message: `Sent to ${activeChatName} (Demo Mode)`,
        type: 'success'
      });
    }
  };

  /*
   * Enter sends; Shift+Enter is not used by this single-line input.
   */
  const handleKeyDownComposer = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  /*
   * Insert an emoji.
   */
  const handleInsertEmoji = (emoji) => {
    setInputMessage((previous) => previous + emoji);
    setShowEmojiPicker(false);
  };

  /*
   * File attachment.
   */
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      addToast({
        title: 'File Too Large',
        message: 'Please select a file smaller than or equal to 10 MB.',
        type: 'error'
      });

      event.target.value = '';
      return;
    }

    const extension = file.name.includes('.')
      ? file.name.split('.').pop().toLowerCase()
      : 'file';

    setAttachedFile({
      file,
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      type: extension
    });

    addToast({
      title: 'Attachment Added',
      message: `Attached "${file.name}"`,
      type: 'info'
    });
  };

  /*
   * Refresh messages.
   */
  const handleRefresh = async () => {
    if (!activeConvId) return;

    setIsRefreshing(true);

    try {
      const data = await getMessages(activeConvId);

      setMessagesState((previous) => ({
        ...previous,
        [activeConvId]: data.messages || []
      }));

      addToast({
        title: 'Chat Synchronized',
        message: 'Latest messages loaded.',
        type: 'success'
      });
    } catch (error) {
      console.error('Refresh messages error:', error);

      addToast({
        title: 'Refresh Failed',
        message: 'Failed to load latest messages.',
        type: 'error'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const sampleEmojis = [
    '👍', '❤️', '😊', '🚀',
    '🎉', '🔥', '👀', '🙌',
    '✨', '💡', '👏', '💯',
    '🎯', '👌', '🤝', '👋'
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'bg-emerald-500';
      case 'away':
        return 'bg-amber-400';
      default:
        return 'bg-slate-300';
    }
  };

  return (
    <div
      className="flex h-full overflow-hidden bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100"
      role="region"
      aria-label="Chat Workspace"
    >
      {/* CONVERSATIONS LIST */}
      <div
        className={`w-full sm:w-80 lg:w-88 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/60 dark:bg-slate-900/60 shrink-0 h-full overflow-hidden ${
          mobileView === 'thread' ? 'hidden sm:flex' : 'flex'
        }`}
      >
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Messages
              </h2>
            </div>

            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {filteredConversations.length} total
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5 pointer-events-none" />

            <input
              type="text"
              value={sidebarSearch}
              onChange={(event) => setSidebarSearch(event.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />

            {sidebarSearch && (
              <button
                type="button"
                onClick={() => setSidebarSearch('')}
                className="absolute right-2.5 top-2 text-slate-400"
                aria-label="Clear conversation search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { id: 'all', label: 'All' },
              { id: 'channels', label: 'Channels' },
              { id: 'direct', label: 'Direct' },
              { id: 'unread', label: 'Unread' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  filterType === tab.id
                    ? 'bg-slate-900 text-white dark:bg-indigo-600'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gradient-to-b from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
          {filteredConversations.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={MessageSquare}
                title="No conversations"
                description={
                  sidebarSearch || searchQuery
                    ? `No matches for "${sidebarSearch || searchQuery}".`
                    : 'No conversations found in this category.'
                }
                actionLabel={sidebarSearch ? 'Clear search' : undefined}
                onAction={() => setSidebarSearch('')}
              />
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const isActive =
                String(conversation.id) === String(activeConvId);

              const isChannel = conversation.type === 'channel';

              const conversationName =
                conversation.name ||
                conversation.displayName ||
                conversation.recipientName ||
                conversation.memberName ||
                conversation.email ||
                'Chat';

              return (
                <div
                  key={conversation.id}
                  role="option"
                  aria-selected={isActive}
                  tabIndex={0}
                  onClick={() =>
                    handleSelectConversation(conversation.id)
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' ||
                      event.key === ' '
                    ) {
                      event.preventDefault();
                      handleSelectConversation(conversation.id);
                    }
                  }}
                  className={`group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer border ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-950 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-100 dark:border-indigo-800'
                      : 'hover:bg-slate-100 text-slate-700 bg-white border-transparent dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="relative shrink-0">
                    {isChannel ? (
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                        <Hash className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-white">
                          {conversationName
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>

                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${getStatusColor(
                            conversation.status ||
                              (conversation.isOnline
                                ? 'online'
                                : 'offline')
                          )}`}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs truncate font-semibold">
                        {conversationName}
                      </span>

                      <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                        {conversation.timestamp || ''}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-1">
                      {conversation.lastMessage ||
                        conversation.topic ||
                        'No recent messages'}
                    </p>
                  </div>

                  {conversation.unreadCount > 0 && (
                    <span className="self-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-600 text-white">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CHAT */}
      <div
        className={`flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-white dark:bg-slate-900 ${
          mobileView === 'list' ? 'hidden sm:flex' : 'flex'
        }`}
      >
        {/* HEADER */}
        <div className="h-16 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileView('list')}
              className="sm:hidden p-1.5 rounded-lg text-slate-500 dark:text-slate-300"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {activeConversation?.type === 'channel' ? (
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                <Hash className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200 font-bold text-xs flex items-center justify-center">
                {activeConversation
                  ? activeChatName.slice(0, 2).toUpperCase()
                  : '?'}
              </div>
            )}

            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {activeConversation
                  ? activeChatName
                  : 'Select a conversation'}
              </h1>

              <p className="text-xs text-slate-400 truncate">
                {activeConversation?.topic ||
                  activeConversation?.role ||
                  (activeConversation?.isOnline
                    ? 'Online now'
                    : 'Offline')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {activeConversation?.membersCount && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-1 rounded-xl">
                <Users className="w-3.5 h-3.5" />
                <span>
                  {activeConversation.membersCount} members
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || !activeConvId}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              title="Refresh conversation"
              aria-label="Refresh conversation"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  isRefreshing ? 'animate-spin text-indigo-600' : ''
                }`}
              />
            </button>

            <button
              type="button"
              onClick={() =>
                addToast({
                  title: 'Conversation Info',
                  message: `${activeChatName} (${
                    activeConversation?.type || 'unknown'
                  })`,
                  type: 'info'
                })
              }
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              title="Conversation information"
              aria-label="Conversation information"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-gradient-to-b from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
          {isRefreshing ? (
            <ChatMessageSkeleton count={4} />
          ) : currentMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <EmptyState
                icon={MessageSquare}
                title="No messages yet"
                description={
                  activeConversation
                    ? `This is the start of the discussion with ${activeChatName}. Say hello!`
                    : 'Select a conversation to start chatting.'
                }
              />
            </div>
          ) : (
            <div className="space-y-1">
              {currentMessages.map((message, index) => {
                const previousMessage = currentMessages[index - 1];

                const isDifferentDate =
                  !previousMessage ||
                  previousMessage.date !== message.date;

                const isSameSenderAsPrevious =
                  previousMessage &&
                  previousMessage.senderId === message.senderId &&
                  previousMessage.date === message.date;

                const isSelf =
                  message.isSelf === true ||
                  (
                    Boolean(user?.id) &&
                    message.senderId != null &&
                    String(message.senderId) === String(user.id)
                  );

                return (
                  <React.Fragment
                    key={
                      message.id ||
                      `${message.senderId}-${index}`
                    }
                  >
                    {isDifferentDate && (
                      <div className="flex items-center justify-center my-4">
                        <span className="px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {message.date || 'Today'}
                        </span>
                      </div>
                    )}

                    <div
                      className={`flex w-full ${
                        isSelf ? 'justify-end' : 'justify-start'
                      } ${
                        isSameSenderAsPrevious ? 'mt-1' : 'mt-4'
                      }`}
                    >
                      <div
                        className={`flex min-w-0 max-w-[90%] sm:max-w-[72%] gap-2.5 ${
                          isSelf ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        {!isSelf && (
                          <div className="w-8 shrink-0">
                            {!isSameSenderAsPrevious && (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-200 text-xs font-bold text-indigo-700 ring-2 ring-white dark:ring-slate-900">
                                {(message.senderName || 'U')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                            )}
                          </div>
                        )}

                        <div
                          className={`flex min-w-0 flex-col ${
                            isSelf ? 'items-end' : 'items-start'
                          }`}
                        >
                          {!isSelf && !isSameSenderAsPrevious && (
                            <span className="mb-1.5 ml-1 text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-300">
                              {message.senderName ||
                                message.senderEmail ||
                                'User'}
                            </span>
                          )}

                          <div
                            className={`min-w-0 max-w-full overflow-hidden break-words px-4 py-3 text-[13px] sm:text-sm leading-6 shadow-sm ${
                              isSelf
                                ? 'rounded-2xl rounded-br-md bg-gradient-to-br from-indigo-600 to-blue-600 text-white'
                                : 'rounded-2xl rounded-bl-md border border-slate-200 bg-white text-slate-800 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-50'
                            }`}
                          >
                            {message.content && (
                              <p className="whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                            )}

                            {message.attachment && (
                              <a
                                href={message.attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={message.attachment.name}
                                onClick={(event) =>
                                  event.stopPropagation()
                                }
                                className={`mt-2.5 flex min-w-0 items-center gap-3 rounded-xl border p-3 transition-colors ${
                                  isSelf
                                    ? 'border-white/20 bg-blue-700 hover:bg-blue-800'
                                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-blue-800 dark:bg-slate-900 dark:hover:bg-slate-800'
                                }`}
                              >
                                <div
                                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                                    isSelf
                                      ? 'bg-white/15 text-white'
                                      : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300'
                                  }`}
                                >
                                  {message.attachment.type === 'pdf' ? (
                                    <FileText className="h-5 w-5" />
                                  ) : [
                                      'js', 'jsx', 'ts', 'tsx', 'py',
                                      'java', 'cpp', 'c', 'html', 'css'
                                    ].includes(message.attachment.type) ? (
                                    <FileCode className="h-5 w-5" />
                                  ) : (
                                    <ImageIcon className="h-5 w-5" />
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-semibold">
                                    {message.attachment.name ||
                                      'Attached file'}
                                  </p>

                                  <p
                                    className={`mt-0.5 text-[10px] ${
                                      isSelf
                                        ? 'text-indigo-100'
                                        : 'text-slate-500 dark:text-slate-400'
                                    }`}
                                  >
                                    {message.attachment.size ||
                                      'Attachment'}{' '}
                                    · Click to open
                                  </p>
                                </div>
                              </a>
                            )}
                          </div>

                          <div
                            className={`mt-1.5 flex items-center gap-1.5 px-1 text-[10px] text-slate-400 ${
                              isSelf ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <span>{message.timestamp || ''}</span>

                            {isSelf && (
                              <span className="inline-flex">
                                {message.status === 'read' ? (
                                  <CheckCheck className="h-3.5 w-3.5 text-indigo-500" />
                                ) : message.status === 'delivered' ? (
                                  <CheckCheck className="h-3.5 w-3.5" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* COMPOSER */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 relative shrink-0">
          {attachedFile && (
            <div className="mb-2 flex items-center justify-between p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-100">
              <div className="flex items-center gap-2 truncate">
                <Paperclip className="w-3.5 h-3.5 shrink-0" />
                <span className="font-semibold truncate">
                  {attachedFile.name}
                </span>
                <span className="text-[11px] shrink-0">
                  ({attachedFile.size})
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAttachedFile(null);

                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="p-1"
                aria-label="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-18 right-6 z-50 bg-white dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-3 w-64"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-xs font-bold">
                  Quick Emojis
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xl text-center">
                {sampleEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleInsertEmoji(emoji)}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            aria-hidden="true"
          />

          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 rounded-xl"
              title="Attach File"
              aria-label="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <div className="relative flex-1 min-w-0">
              <input
                type="text"
                value={inputMessage}
                onChange={(event) =>
                  setInputMessage(event.target.value)
                }
                onKeyDown={handleKeyDownComposer}
                placeholder={`Message ${
                  activeConversation ? activeChatName : 'chat'
                }...`}
                autoComplete="off"
                disabled={!activeConvId}
                className="w-full pl-4 pr-10 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() =>
                  setShowEmojiPicker((previous) => !previous)
                }
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                title="Insert emoji"
                aria-label="Insert emoji"
              >
                <Smile className="w-4 h-4" />
              </button>
            </div>

            <button
              type="submit"
              disabled={
                !activeConvId ||
                (!inputMessage.trim() && !attachedFile)
              }
              className="p-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              aria-label="Send message"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Enter to send</span>
            </span>

            <span>Socket.IO enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
};