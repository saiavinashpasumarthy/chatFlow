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
  Sparkles,
  ShieldCheck,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { EmptyState } from '../components/common/EmptyState';
import { ChatMessageSkeleton } from '../components/common/Skeleton';

export const ChatPage = ({
  conversations,
  onUpdateConversations,
  initialMessages,
  searchQuery = '',
  targetContactChat = null,
  onClearTargetContactChat,
  targetConversationId = null,
  onClearTargetConversationId
}) => {
  const [activeConvId, setActiveConvId] = useState(conversations[0]?.id || 'c-1');
  const [messagesState, setMessagesState] = useState(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'channels' | 'direct' | 'unread'
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'thread'
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { addToast } = useToast();

  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Deep linking to conversation
  useEffect(() => {
    if (targetConversationId) {
      setActiveConvId(targetConversationId);
      setMobileView('thread');
      if (onClearTargetConversationId) {
        onClearTargetConversationId();
      }
    }
  }, [targetConversationId, onClearTargetConversationId]);

  // Close emoji picker on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showEmojiPicker) {
        setShowEmojiPicker(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showEmojiPicker]);

  // If a contact was clicked in ContactsPage, switch to that conversation
  useEffect(() => {
    if (targetContactChat) {
      const match = conversations.find(
        (c) =>
          c.type === 'direct' &&
          c.name.toLowerCase() === targetContactChat.toLowerCase()
      );
      if (match) {
        setActiveConvId(match.id);
        setMobileView('thread');
      }
      if (onClearTargetContactChat) {
        onClearTargetContactChat();
      }
    }
  }, [targetContactChat, conversations, onClearTargetContactChat]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      // Type filtering
      if (filterType === 'channels' && c.type !== 'channel') return false;
      if (filterType === 'direct' && c.type !== 'direct') return false;
      if (filterType === 'unread' && c.unreadCount === 0) return false;

      // Text query filtering (sidebar query or top bar global query)
      const q = (sidebarSearch || searchQuery).trim().toLowerCase();
      if (!q) return true;

      return (
        c.name.toLowerCase().includes(q) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(q)) ||
        (c.topic && c.topic.toLowerCase().includes(q))
      );
    });
  }, [conversations, filterType, sidebarSearch, searchQuery]);

  // Keep a valid active conversation
  useEffect(() => {
    if (filteredConversations.length > 0) {
      const exists = filteredConversations.some((c) => c.id === activeConvId);
      if (!exists) {
        setActiveConvId(filteredConversations[0].id);
      }
    }
  }, [filteredConversations, activeConvId]);

  const activeConversation =
    conversations.find((c) => c.id === activeConvId) || conversations[0];
  const currentMessages = messagesState[activeConvId] || [];

  // Scroll to bottom whenever messages update or active conversation changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConvId, currentMessages.length]);

  // Select conversation & clear its unread count
  const handleSelectConversation = (convId) => {
    setActiveConvId(convId);
    setMobileView('thread');

    if (onUpdateConversations) {
      onUpdateConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
      );
    }
  };

  // Send message
  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() && !attachedFile) return;

    const time = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    const newMessage = {
      id: `m-${Date.now()}`,
      senderId: 'usr-1',
      senderName: 'Alex Rivera',
      content: inputMessage.trim(),
      timestamp: time,
      date: 'Today',
      status: 'sent',
      attachment: attachedFile ? { ...attachedFile } : null,
      isSelf: true
    };

    // Update message history
    setMessagesState((prev) => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] || []), newMessage]
    }));

    // Update conversation last message in list
    if (onUpdateConversations) {
      onUpdateConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? {
                ...c,
                lastMessage: inputMessage.trim() || `Sent attachment: ${attachedFile.name}`,
                timestamp: time
              }
            : c
        )
      );
    }

    setInputMessage('');
    setAttachedFile(null);
    setShowEmojiPicker(false);

    addToast({
      title: 'Message Sent',
      message: `Delivered to ${activeConversation?.name}`,
      type: 'success'
    });

    // Simulate optimistic delivery acknowledgement
    setTimeout(() => {
      setMessagesState((prev) => {
        const list = prev[activeConvId] || [];
        return {
          ...prev,
          [activeConvId]: list.map((m) =>
            m.id === newMessage.id ? { ...m, status: 'delivered' } : m
          )
        };
      });
    }, 900);
  };

  // Keyboard shortcut for Enter to send (Shift+Enter for newline)
  const handleKeyDownComposer = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Insert emoji
  const handleInsertEmoji = (emoji) => {
    setInputMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Simulated file attachment
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachedFile({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.name.split('.').pop() || 'file'
      });
      addToast({
        title: 'Attachment Added',
        message: `Attached "${file.name}" (Simulated preview)`,
        type: 'info'
      });
    }
  };

  const handleSimulateRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      addToast({
        title: 'Chat Synchronized',
        message: `Buffered latest messages for ${activeConversation?.name}.`,
        type: 'success'
      });
    }, 600);
  };

  const sampleEmojis = [
    '👍', '❤️', '😊', '🚀', '🎉', '🔥', '👀', '🙌',
    '✨', '💡', '👏', '💯', '🎯', '👌', '🤝', '👋'
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
      className="flex h-full overflow-hidden bg-white text-slate-800"
      role="region"
      aria-label="Chat Workspace"
    >

      {/* ─────────────────────────────────────────────────────────────
          COLUMN 1: Conversations List & Search Filters
      ─────────────────────────────────────────────────────────────── */}
      <div
        className={`w-full sm:w-80 lg:w-88 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/60 dark:bg-slate-900/60 shrink-0 h-full overflow-hidden ${
          mobileView === 'thread' ? 'hidden sm:flex' : 'flex'
        }`}
      >
        {/* Header & Local Search */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Messages
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {filteredConversations.length} total
            </span>
          </div>

          {/* In-sidebar Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800"
            />
            {sidebarSearch && (
              <button
                type="button"
                onClick={() => setSidebarSearch('')}
                className="absolute right-2.5 top-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
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
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterType === tab.id
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div
          role="listbox"
          aria-label="Conversation list"
          className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2 space-y-1"
        >
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
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              const isChannel = conv.type === 'channel';

              return (
                <div
                  key={conv.id}
                  role="option"
                  aria-selected={isActive}
                  tabIndex={0}
                  onClick={() => handleSelectConversation(conv.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleSelectConversation(conv.id);
                    }
                  }}
                  className={`group relative flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isActive
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 font-semibold shadow-2xs border-l-4 border-indigo-600 dark:border-indigo-500'
                      : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900'
                  }`}
                >
                  {/* Left Avatar / Channel Icon */}
                  <div className="relative shrink-0">
                    {isChannel ? (
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900'
                        }`}
                      >
                        <Hash className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="relative">
                        <div
                          className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center ${
                            isActive
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {conv.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${getStatusColor(
                            conv.status || (conv.isOnline ? 'online' : 'offline')
                          )}`}
                          title={`Status: ${conv.status || (conv.isOnline ? 'online' : 'offline')}`}
                        />
                      </div>
                    )}
                  </div>

                  {/* Conversation Meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className={`text-xs truncate ${
                          isActive
                            ? 'font-bold text-indigo-950 dark:text-white'
                            : conv.unreadCount > 0
                            ? 'font-bold text-slate-900 dark:text-white'
                            : 'font-semibold text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {conv.name}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 ml-1">
                        {conv.timestamp}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1 leading-relaxed">
                      {conv.lastMessage || conv.topic || 'No recent messages'}
                    </p>
                  </div>

                  {/* Unread Pill */}
                  {conv.unreadCount > 0 && (
                    <span className="self-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-indigo-600 text-white shrink-0 shadow-2xs">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          COLUMN 2: Active Chat Message Stream & Composer
      ─────────────────────────────────────────────────────────────── */}
      <div
        className={`flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900 transition-colors ${
          mobileView === 'list' ? 'hidden sm:flex' : 'flex'
        }`}
      >
        {/* Chat Header */}
        <div className="h-16 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Back Button */}
            <button
              type="button"
              onClick={() => setMobileView('list')}
              className="sm:hidden p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Back to conversations list"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {activeConversation?.type === 'channel' ? (
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Hash className="w-5 h-5" />
              </div>
            ) : (
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                  {activeConversation?.name.slice(0, 2).toUpperCase()}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${getStatusColor(
                    activeConversation?.status ||
                      (activeConversation?.isOnline ? 'online' : 'offline')
                  )}`}
                />
              </div>
            )}

            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {activeConversation?.name}
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                {activeConversation?.topic ||
                  activeConversation?.role ||
                  (activeConversation?.isOnline ? 'Online now' : 'Offline')}
              </p>
            </div>
          </div>

          {/* Right Header Badges */}
          <div className="flex items-center gap-1.5">
            {activeConversation?.membersCount && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
                <Users className="w-3.5 h-3.5" />
                <span>{activeConversation.membersCount} members</span>
              </div>
            )}
            <button
              type="button"
              onClick={handleSimulateRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              title="Simulate conversation sync"
              aria-label="Simulate conversation sync"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''}`}
              />
            </button>
            <button
              type="button"
              onClick={() =>
                addToast({
                  title: 'Conversation Info',
                  message: `${activeConversation?.name} (${activeConversation?.type})`,
                  type: 'info'
                })
              }
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              title="Conversation details"
              aria-label="Conversation details"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-slate-50/30 dark:bg-slate-950/40">
          {isRefreshing ? (
            <ChatMessageSkeleton count={4} />
          ) : currentMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <EmptyState
                icon={MessageSquare}
                title="No messages yet"
                description={`This is the start of the discussion in ${activeConversation?.name}. Say hello!`}
              />
            </div>
          ) : (
            currentMessages.map((msg, index) => {
              const prevMsg = currentMessages[index - 1];

              // Check if date changed
              const isDifferentDate = !prevMsg || prevMsg.date !== msg.date;

              // Sender grouping: group if contiguous from same sender on same date
              const isSameSenderAsPrev =
                prevMsg &&
                prevMsg.senderId === msg.senderId &&
                prevMsg.date === msg.date;

              return (
                <React.Fragment key={msg.id}>
                  {/* Date Separator Pill */}
                  {isDifferentDate && (
                    <div className="flex items-center justify-center my-4">
                      <span className="px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                        {msg.date || 'Today'}
                      </span>
                    </div>
                  )}

                  {/* Message Bubble Row */}
                  <div
                    className={`flex gap-2.5 max-w-xl ${
                      msg.isSelf ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    } ${isSameSenderAsPrev ? 'mt-1' : 'mt-3.5'}`}
                  >
                    {/* Avatar on left for other users (only on first message in group) */}
                    {!msg.isSelf && (
                      <div className="w-8 shrink-0">
                        {!isSameSenderAsPrev ? (
                          <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shadow-2xs">
                            {msg.senderName.slice(0, 2).toUpperCase()}
                          </div>
                        ) : (
                          <div className="w-8" />
                        )}
                      </div>
                    )}

                    {/* Bubble Content */}
                    <div
                      className={`flex flex-col ${
                        msg.isSelf ? 'items-end' : 'items-start'
                      }`}
                    >
                      {/* Sender Name (only on first message of group) */}
                      {!msg.isSelf && !isSameSenderAsPrev && (
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 ml-1">
                          {msg.senderName}
                        </span>
                      )}

                      <div
                        className={`px-4 py-2.5 text-xs sm:text-sm leading-relaxed transition-all ${
                          msg.isSelf
                            ? 'bg-indigo-600 text-white rounded-2xl rounded-br-xs shadow-2xs'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-2xl rounded-bl-xs shadow-2xs'
                        }`}
                      >
                        {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

                        {/* Attachment chip if present */}
                        {msg.attachment && (
                          <div
                            className={`flex items-center gap-2 p-2 mt-2 rounded-xl text-xs font-medium border ${
                              msg.isSelf
                                ? 'bg-indigo-700/60 border-indigo-500 text-white'
                                : 'bg-slate-50 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {msg.attachment.type === 'pdf' ? (
                              <FileText className="w-4 h-4 text-indigo-300" />
                            ) : msg.attachment.type === 'code' ? (
                              <FileCode className="w-4 h-4 text-emerald-300" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-pink-300" />
                            )}
                            <div className="truncate">
                              <p className="truncate font-semibold">{msg.attachment.name}</p>
                              <p className="text-[10px] opacity-75">{msg.attachment.size}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Timestamp & Read Receipts */}
                      <div
                        className={`flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 dark:text-slate-500 px-1`}
                      >
                        <span>{msg.timestamp}</span>
                        {msg.isSelf && (
                          <span title={`Status: ${msg.status || 'sent'}`}>
                            {msg.status === 'read' ? (
                              <CheckCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            ) : msg.status === 'delivered' ? (
                              <CheckCheck className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ─────────────────────────────────────────────────────────────
            COMPOSER AREA WITH EMOJI & ATTACHMENT CONTROLS
        ─────────────────────────────────────────────────────────────── */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 relative transition-colors">
          {/* Simulated Attachment Preview Chip */}
          {attachedFile && (
            <div className="mb-2 flex items-center justify-between p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-xs">
              <div className="flex items-center gap-2 truncate">
                <Paperclip className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="font-semibold truncate">{attachedFile.name}</span>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 shrink-0">
                  ({attachedFile.size})
                </span>
                <span className="text-[10px] bg-indigo-200/80 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-1.5 py-0.5 rounded-md shrink-0">
                  Simulated attachment
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="p-1 text-indigo-400 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-white rounded-md"
                aria-label="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Emoji Picker Popover */}
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-18 right-6 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-3 w-64 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Quick Emojis</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Interactive control</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xl text-center">
                {sampleEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleInsertEmoji(emoji)}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-transform active:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            aria-hidden="true"
          />

          {/* Message Form */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              title="Attach File (Simulated preview)"
              aria-label="Attach File"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <div className="relative flex-1">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDownComposer}
                placeholder={`Message #${activeConversation?.name || 'chat'}...`}
                className="w-full pl-4 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className="absolute right-2.5 top-2.5 p-1 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-md transition-colors"
                title="Insert Emoji"
                aria-label="Insert Emoji"
              >
                <Smile className="w-4 h-4" />
              </button>
            </div>

            <button
              type="submit"
              disabled={!inputMessage.trim() && !attachedFile}
              className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              title="Send message"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Local state footer hint */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-2 px-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              <span>Optimistic local state • Enter to send</span>
            </span>
            <span>WebSocket protocol pending backend</span>
          </div>
        </div>
      </div>
    </div>
  );
};
