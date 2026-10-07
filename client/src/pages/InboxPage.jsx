import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Inbox,
  Star,
  Send,
  FileEdit,
  Trash2,
  Paperclip,
  Tag,
  Reply,
  Forward,
  Plus,
  X,
  Check,
  RotateCcw,
  Mail,
  MailOpen,
  ArrowLeft,
  Keyboard,
  CheckCheck,
  Save,
  RefreshCw
} from 'lucide-react';
import {
  loadStoredDraft,
  saveStoredDraft,
  clearStoredDraft
} from '../utils/storage';
import { useToast } from '../context/ToastContext';
import { EmptyState } from '../components/common/EmptyState';
import { ThreadListSkeleton } from '../components/common/Skeleton';

export const InboxPage = ({
  emails,
  onUpdateEmails,
  searchQuery,
  prefilledRecipient,
  onClearPrefilledRecipient,
  targetEmailId,
  onClearTargetEmailId
}) => {
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedEmailId, setSelectedEmailId] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [mobileView, setMobileView] = useState('list');
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { addToast } = useToast();

  // Composer and Draft states
  const [isComposing, setIsComposing] = useState(false);
  const [composerTo, setComposerTo] = useState('');
  const [composerSubject, setComposerSubject] = useState('');
  const [composerBody, setComposerBody] = useState('');
  const [draftSaveStatus, setDraftSaveStatus] = useState('idle');
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState(null);
  const [composeSuccess, setComposeSuccess] = useState(false);

  const threadListRef = useRef(null);

  // Deep linking to an email (e.g. from NotificationCenter)
  useEffect(() => {
    if (targetEmailId) {
      setSelectedEmailId(targetEmailId);
      const target = emails.find((e) => e.id === targetEmailId);
      if (target) {
        setSelectedFolder(target.folder || 'inbox');
      }
      setMobileView('reader');
      if (onClearTargetEmailId) onClearTargetEmailId();
    }
  }, [targetEmailId, emails, onClearTargetEmailId]);

  // Modal keyboard listeners (Escape key)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showShortcutsModal) setShowShortcutsModal(false);
        if (isComposing) setIsComposing(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcutsModal, isComposing]);

  // Load persisted draft on mount
  useEffect(() => {
    const savedDraft = loadStoredDraft();
    if (savedDraft) {
      setComposerTo(savedDraft.to || '');
      setComposerSubject(savedDraft.subject || '');
      setComposerBody(savedDraft.body || '');
      setLastDraftSavedAt(savedDraft.lastSavedAt || null);
      if (savedDraft.to || savedDraft.subject || savedDraft.body) {
        setDraftSaveStatus('saved');
      }
    }
  }, []);

  // Handle prefilled recipient from contacts page
  useEffect(() => {
    if (prefilledRecipient) {
      setComposerTo(prefilledRecipient);
      setIsComposing(true);
      if (onClearPrefilledRecipient) {
        onClearPrefilledRecipient();
      }
    }
  }, [prefilledRecipient, onClearPrefilledRecipient]);

  // Persist draft to localStorage on edit
  const handleUpdateComposerField = (field, value) => {
    const nextTo = field === 'to' ? value : composerTo;
    const nextSubject = field === 'subject' ? value : composerSubject;
    const nextBody = field === 'body' ? value : composerBody;

    if (field === 'to') setComposerTo(value);
    if (field === 'subject') setComposerSubject(value);
    if (field === 'body') setComposerBody(value);

    // Save draft if any content exists
    if (nextTo.trim() || nextSubject.trim() || nextBody.trim()) {
      const timestamp = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
      saveStoredDraft({
        to: nextTo,
        subject: nextSubject,
        body: nextBody,
        lastSavedAt: timestamp
      });
      setDraftSaveStatus('saved');
      setLastDraftSavedAt(timestamp);
    }
  };

  // Discard draft
  const handleDiscardDraft = () => {
    clearStoredDraft();
    setComposerTo('');
    setComposerSubject('');
    setComposerBody('');
    setLastDraftSavedAt(null);
    setDraftSaveStatus('idle');
    setIsComposing(false);
    addToast({
      title: 'Draft Discarded',
      message: 'Draft contents cleared.',
      type: 'info'
    });
  };

  // Extract all unique tags dynamically
  const allTags = useMemo(() => {
    const tagsSet = new Set();
    emails.forEach((email) => {
      email.tags?.forEach((tag) => tagsSet.add(tag));
    });
    return Array.from(tagsSet);
  }, [emails]);

  // Filtered emails by folder, tag, and search
  const filteredEmails = useMemo(() => {
    return emails.filter((email) => {
      const matchesFolder =
        selectedFolder === 'starred'
          ? email.starred && email.folder !== 'trash'
          : email.folder === selectedFolder;

      const matchesTag =
        !selectedTag || (email.tags && email.tags.includes(selectedTag));

      const matchesSearch =
        searchQuery.trim() === '' ||
        email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.senderEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (email.tags &&
          email.tags.some((t) =>
            t.toLowerCase().includes(searchQuery.toLowerCase())
          ));

      return matchesFolder && matchesTag && matchesSearch;
    });
  }, [emails, selectedFolder, selectedTag, searchQuery]);

  // Keep a valid email selected
  useEffect(() => {
    if (filteredEmails.length > 0) {
      const exists = filteredEmails.some((e) => e.id === selectedEmailId);
      if (!exists) {
        setSelectedEmailId(filteredEmails[0].id);
      }
    } else {
      setSelectedEmailId('');
    }
  }, [filteredEmails, selectedEmailId]);

  const selectedEmail = emails.find((e) => e.id === selectedEmailId);

  // Folder definitions with live counts
  const folders = [
    {
      id: 'inbox',
      label: 'Inbox',
      icon: Inbox,
      count: emails.filter((e) => e.folder === 'inbox' && e.unread).length
    },
    {
      id: 'starred',
      label: 'Starred',
      icon: Star,
      count: emails.filter((e) => e.starred && e.folder !== 'trash').length
    },
    {
      id: 'sent',
      label: 'Sent',
      icon: Send,
      count: emails.filter((e) => e.folder === 'sent').length
    },
    {
      id: 'drafts',
      label: 'Drafts',
      icon: FileEdit,
      count:
        emails.filter((e) => e.folder === 'drafts').length +
        (lastDraftSavedAt ? 1 : 0)
    },
    {
      id: 'trash',
      label: 'Trash',
      icon: Trash2,
      count: emails.filter((e) => e.folder === 'trash').length
    }
  ];

  // Actions
  const handleToggleRead = (id, e) => {
    e?.stopPropagation();
    onUpdateEmails(
      emails.map((item) =>
        item.id === id ? { ...item, unread: !item.unread } : item
      )
    );
    const target = emails.find((item) => item.id === id);
    if (target) {
      addToast({
        title: target.unread ? 'Marked as Read' : 'Marked as Unread',
        message: target.subject,
        type: 'info'
      });
    }
  };

  const handleToggleStar = (id, e) => {
    e?.stopPropagation();
    onUpdateEmails(
      emails.map((item) =>
        item.id === id ? { ...item, starred: !item.starred } : item
      )
    );
    const target = emails.find((item) => item.id === id);
    if (target) {
      addToast({
        title: target.starred ? 'Removed Star' : 'Starred Message',
        message: target.subject,
        type: 'info'
      });
    }
  };

  const handleMoveToTrash = (id, e) => {
    e?.stopPropagation();
    const target = emails.find((item) => item.id === id);
    onUpdateEmails(
      emails.map((item) =>
        item.id === id ? { ...item, folder: 'trash' } : item
      )
    );
    addToast({
      title: 'Moved to Trash',
      message: target ? target.subject : 'Message moved to Trash.',
      type: 'trash'
    });
  };

  const handleRestoreFromTrash = (id, e) => {
    e?.stopPropagation();
    const target = emails.find((item) => item.id === id);
    onUpdateEmails(
      emails.map((item) =>
        item.id === id ? { ...item, folder: 'inbox' } : item
      )
    );
    addToast({
      title: 'Restored to Inbox',
      message: target ? target.subject : 'Message restored to Inbox.',
      type: 'success'
    });
  };

  const handleDeletePermanently = (id, e) => {
    e?.stopPropagation();
    onUpdateEmails(emails.filter((item) => item.id !== id));
    addToast({
      title: 'Permanently Deleted',
      message: 'Message has been removed from Trash.',
      type: 'trash'
    });
  };

  const handleMarkAllRead = () => {
    onUpdateEmails(
      emails.map((item) => {
        if (
          selectedFolder === 'starred'
            ? item.starred
            : item.folder === selectedFolder
        ) {
          return { ...item, unread: false };
        }
        return item;
      })
    );
    addToast({
      title: 'All Marked Read',
      message: `All messages in ${selectedFolder} marked as read.`,
      type: 'info'
    });
  };

  const handleSimulateRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      addToast({
        title: 'Mailbox Synchronized',
        message: `Updated ${selectedFolder} messages.`,
        type: 'success'
      });
    }, 600);
  };

  // Dispatch Email
  const handleSendEmail = (e) => {
    e.preventDefault();
    if (!composerTo.trim()) return;

    const newEmail = {
      id: `em-${Date.now()}`,
      senderName: 'Alex Rivera',
      senderEmail: 'alex.rivera@relay.dev',
      recipient: composerTo.trim(),
      subject: composerSubject.trim() || '(No Subject)',
      preview:
        composerBody.trim().slice(0, 110) || 'Sent message with no text preview.',
      body: composerBody.trim() || '(No content provided)',
      timestamp: 'Just now',
      unread: false,
      starred: false,
      folder: 'sent',
      tags: ['Sent']
    };

    onUpdateEmails([newEmail, ...emails]);
    clearStoredDraft();
    setComposeSuccess(true);
    addToast({
      title: 'Email Sent',
      message: `Dispatched to ${composerTo.trim()}`,
      type: 'success'
    });

    setTimeout(() => {
      setComposeSuccess(false);
      setIsComposing(false);
      setComposerTo('');
      setComposerSubject('');
      setComposerBody('');
      setLastDraftSavedAt(null);
      setDraftSaveStatus('idle');
    }, 1000);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is inside an input, textarea, or composer
      const targetTag = e.target?.tagName;
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') {
        if (e.key === 'Escape' && isComposing) {
          setIsComposing(false);
        }
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
        return;
      }

      if (e.key === 'Escape') {
        if (showShortcutsModal) {
          setShowShortcutsModal(false);
          return;
        }
        if (isComposing) {
          setIsComposing(false);
          return;
        }
        if (mobileView === 'reader') {
          setMobileView('list');
          return;
        }
      }

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setIsComposing(true);
        return;
      }

      if (filteredEmails.length === 0) return;

      const currentIndex = filteredEmails.findIndex(
        (m) => m.id === selectedEmailId
      );

      // Down / Next email
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        const nextIndex =
          currentIndex < filteredEmails.length - 1 ? currentIndex + 1 : 0;
        setSelectedEmailId(filteredEmails[nextIndex].id);
      }

      // Up / Previous email
      if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        const prevIndex =
          currentIndex > 0 ? currentIndex - 1 : filteredEmails.length - 1;
        setSelectedEmailId(filteredEmails[prevIndex].id);
      }

      // Open email / Mobile reader view
      if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedEmail) {
          setMobileView('reader');
          if (selectedEmail.unread) {
            handleToggleRead(selectedEmail.id);
          }
        }
      }

      // Star / Unstar
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (selectedEmail) {
          handleToggleStar(selectedEmail.id);
        }
      }

      // Mark Read / Unread
      if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        if (selectedEmail) {
          handleToggleRead(selectedEmail.id);
        }
      }

      // Trash / Delete
      if (e.key === 'Delete' || e.key === 'Backspace' || e.key === '#') {
        e.preventDefault();
        if (selectedEmail) {
          if (selectedFolder === 'trash') {
            handleDeletePermanently(selectedEmail.id);
          } else {
            handleMoveToTrash(selectedEmail.id);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    filteredEmails,
    selectedEmailId,
    selectedEmail,
    isComposing,
    showShortcutsModal,
    mobileView,
    selectedFolder
  ]);

  return (
    <div
      className="flex flex-col lg:flex-row h-full overflow-hidden bg-white text-slate-800"
      role="region"
      aria-label="Email Client"
    >

      {/* ─────────────────────────────────────────────────────────────
          COLUMN 1: Mail Folders & Tags Navigation
      ─────────────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-56 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/70 p-3 lg:p-4 shrink-0 flex flex-col justify-between overflow-x-auto lg:overflow-y-auto">
        <div className="space-y-4 w-full">
          {/* Compose CTA Button */}
          <button
            type="button"
            onClick={() => setIsComposing(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Compose new email (Shortcut: C)"
          >
            <Plus className="w-4 h-4" />
            <span>Compose</span>
          </button>

          {/* Folder Navigation */}
          <nav
            className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0"
            aria-label="Mail Folders"
          >
            {folders.map((folder) => {
              const Icon = folder.icon;
              const isActive = selectedFolder === folder.id;
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => {
                    setSelectedFolder(folder.id);
                    setMobileView('list');
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors shrink-0 lg:shrink lg:w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-indigo-600' : 'text-slate-400'
                      }`}
                    />
                    <span>{folder.label}</span>
                  </div>
                  {folder.count !== undefined && folder.count > 0 && (
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-indigo-200/70 text-indigo-800'
                          : 'bg-slate-200/70 text-slate-700'
                      }`}
                    >
                      {folder.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Dynamic Tags Filter Section (Desktop) */}
          <div className="hidden lg:block pt-3 border-t border-slate-200/70">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Tags
              </span>
              {selectedTag && (
                <button
                  type="button"
                  onClick={() => setSelectedTag(null)}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedTag === null
                    ? 'bg-slate-200/60 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>All Tags</span>
                <span className="text-[10px] text-slate-400">
                  {emails.length}
                </span>
              </button>
              {allTags.map((tag) => {
                const isSelected = selectedTag === tag;
                const count = emails.filter((e) => e.tags?.includes(tag)).length;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setSelectedTag((prev) => (prev === tag ? null : tag))
                    }
                    className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Tag
                        className={`w-3 h-3 ${
                          isSelected ? 'text-indigo-600' : 'text-slate-400'
                        }`}
                      />
                      <span>{tag}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Keyboard Helper Link */}
        <div className="pt-2 hidden lg:flex items-center justify-between border-t border-slate-200/70 text-slate-400">
          <button
            type="button"
            onClick={() => setShowShortcutsModal(true)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors p-1 rounded-lg hover:bg-slate-100"
            aria-label="View keyboard shortcuts"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Shortcuts</span>
            <kbd className="px-1 text-[10px] bg-slate-200 text-slate-600 rounded">
              ?
            </kbd>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          COLUMN 2: Thread List with Tag Filter Chips
      ─────────────────────────────────────────────────────────────── */}
      <div
        className={`w-full lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col h-full shrink-0 overflow-hidden ${
          mobileView === 'reader' ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {/* Thread List Header */}
        <div className="px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider capitalize">
              {selectedFolder}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              ({filteredEmails.length})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSimulateRefresh}
              disabled={isRefreshing}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              title="Simulate mailbox sync"
              aria-label="Simulate mailbox sync"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`}
              />
            </button>
            {filteredEmails.some((e) => e.unread) && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                title="Mark all as read in current folder"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Tag Filter Chips Bar */}
        {allTags.length > 0 && (
          <div className="px-3 py-2 bg-slate-50/50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1 shrink-0">
              Tag:
            </span>
            <button
              type="button"
              onClick={() => setSelectedTag(null)}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                selectedTag === null
                  ? 'bg-slate-700 text-white shadow-2xs'
                  : 'bg-slate-200/70 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  setSelectedTag((prev) => (prev === tag ? null : tag))
                }
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                  selectedTag === tag
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-200/70 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tag}</span>
                {selectedTag === tag && <X className="w-2.5 h-2.5" />}
              </button>
            ))}
          </div>
        )}

        {/* Scrollable Email List */}
        <div
          ref={threadListRef}
          role="listbox"
          aria-label="Email list"
          className="flex-1 overflow-y-auto divide-y divide-slate-100"
        >
          {isRefreshing ? (
            <ThreadListSkeleton count={4} />
          ) : filteredEmails.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Mail}
                title="No messages found"
                description={
                  searchQuery
                    ? `No messages matched "${searchQuery}".`
                    : selectedTag
                    ? `No messages found with tag "${selectedTag}".`
                    : `No messages currently in ${selectedFolder}.`
                }
                actionLabel={
                  searchQuery || selectedTag
                    ? 'Clear filters'
                    : selectedFolder !== 'inbox'
                    ? 'Go to Inbox'
                    : 'Compose email'
                }
                onAction={
                  searchQuery || selectedTag
                    ? () => setSelectedTag(null)
                    : selectedFolder !== 'inbox'
                    ? () => setSelectedFolder('inbox')
                    : () => setIsComposing(true)
                }
              />
            </div>
          ) : (
            filteredEmails.map((email) => {
              const isSelected = selectedEmail?.id === email.id;
              return (
                <div
                  key={email.id}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={0}
                  onClick={() => {
                    setSelectedEmailId(email.id);
                    setMobileView('reader');
                    if (email.unread) {
                      handleToggleRead(email.id);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedEmailId(email.id);
                      setMobileView('reader');
                      if (email.unread) {
                        handleToggleRead(email.id);
                      }
                    }
                  }}
                  className={`group relative w-full text-left p-3.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isSelected
                      ? 'bg-indigo-50/60 border-l-4 border-indigo-600'
                      : 'hover:bg-slate-50/80 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {email.unread ? (
                        <span
                          className="w-2 h-2 rounded-full bg-indigo-600 shrink-0"
                          title="Unread"
                        />
                      ) : (
                        <span className="w-2 h-2 shrink-0" />
                      )}
                      <span
                        className={`text-xs truncate ${
                          email.unread
                            ? 'font-bold text-slate-900'
                            : 'font-medium text-slate-700'
                        }`}
                      >
                        {email.senderName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-[10px] text-slate-400">
                        {email.timestamp}
                      </span>
                    </div>
                  </div>

                  <p
                    className={`text-xs truncate mb-1 ${
                      email.unread
                        ? 'font-semibold text-slate-900'
                        : 'text-slate-800'
                    }`}
                  >
                    {email.subject}
                  </p>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {email.preview}
                  </p>

                  {/* Badges & Quick Action Triggers */}
                  <div className="flex items-center justify-between mt-2 pt-1">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      {email.attachmentsCount && (
                        <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                          <Paperclip className="w-3 h-3" />
                          {email.attachmentsCount}
                        </span>
                      )}
                      {email.tags?.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTag(t);
                          }}
                          className={`px-1.5 py-0.2 rounded text-[10px] font-medium transition-colors ${
                            selectedTag === t
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    {/* Action buttons on email item */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => handleToggleStar(email.id, e)}
                        className="p-1 rounded-md text-slate-400 hover:text-amber-500 hover:bg-slate-100"
                        aria-label={email.starred ? 'Unstar' : 'Star'}
                        title={email.starred ? 'Unstar (S)' : 'Star (S)'}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            email.starred
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleToggleRead(email.id, e)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        aria-label={
                          email.unread ? 'Mark as read' : 'Mark as unread'
                        }
                        title={
                          email.unread
                            ? 'Mark as read (U)'
                            : 'Mark as unread (U)'
                        }
                      >
                        {email.unread ? (
                          <MailOpen className="w-3.5 h-3.5 text-indigo-600" />
                        ) : (
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          if (selectedFolder === 'trash') {
                            handleDeletePermanently(email.id, e);
                          } else {
                            handleMoveToTrash(email.id, e);
                          }
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                        aria-label="Delete message"
                        title="Delete (Delete / #)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          COLUMN 3: Detailed Message Reader
      ─────────────────────────────────────────────────────────────── */}
      <div
        className={`flex-1 flex flex-col h-full overflow-hidden bg-slate-50/30 ${
          mobileView === 'list' ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {selectedEmail ? (
          <div className="flex flex-col h-full overflow-y-auto bg-white">
            {/* Mobile Back Button bar */}
            <div className="lg:hidden px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMobileView('list')}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900"
                aria-label="Back to email list"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to {selectedFolder}</span>
              </button>
              <span className="text-[11px] text-slate-400">
                {selectedEmail.timestamp}
              </span>
            </div>

            {/* Header & Action Toolbar */}
            <div className="p-4 sm:p-6 border-b border-slate-200 bg-white">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-base sm:text-xl font-bold text-slate-900 leading-snug">
                    {selectedEmail.subject}
                  </h2>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {selectedEmail.tags?.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSelectedTag(tag)}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                      >
                        <Tag className="w-3 h-3" />
                        <span>{tag}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reader Action Toolbar */}
                <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleToggleStar(selectedEmail.id)}
                    className="p-2 text-slate-500 hover:text-amber-500 hover:bg-white rounded-lg transition-colors"
                    aria-label={selectedEmail.starred ? 'Unstar' : 'Star'}
                    title={selectedEmail.starred ? 'Unstar (S)' : 'Star (S)'}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        selectedEmail.starred
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-400'
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleRead(selectedEmail.id)}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg transition-colors"
                    aria-label={
                      selectedEmail.unread ? 'Mark as read' : 'Mark as unread'
                    }
                    title={
                      selectedEmail.unread
                        ? 'Mark as read (U)'
                        : 'Mark as unread (U)'
                    }
                  >
                    {selectedEmail.unread ? (
                      <MailOpen className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Mail className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {selectedFolder === 'trash' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleRestoreFromTrash(selectedEmail.id)}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"
                        aria-label="Restore to Inbox"
                        title="Restore to Inbox"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleDeletePermanently(selectedEmail.id)
                        }
                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                        aria-label="Delete permanently"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleMoveToTrash(selectedEmail.id)}
                      className="p-2 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                      aria-label="Move to Trash"
                      title="Move to Trash (Delete / #)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Sender Details */}
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center shadow-xs">
                    {selectedEmail.senderName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {selectedEmail.senderName}
                    </div>
                    <div className="text-xs text-slate-400">
                      From: {selectedEmail.senderEmail} • To:{' '}
                      {selectedEmail.recipient}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  {selectedEmail.timestamp}
                </div>
              </div>
            </div>

            {/* Email Body */}
            <div className="p-6 sm:p-8 flex-1 bg-white">
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line max-w-3xl">
                {selectedEmail.body}
              </div>

              {/* Attachments preview */}
              {selectedEmail.attachmentsCount && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Attached Files ({selectedEmail.attachmentsCount})
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700">
                      <Paperclip className="w-4 h-4 text-indigo-600" />
                      <span>Specifications-Brief.pdf</span>
                      <span className="text-slate-400 text-[11px]">
                        (2.4 MB)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setComposerTo(selectedEmail.senderEmail);
                  setComposerSubject(`Re: ${selectedEmail.subject}`);
                  setIsComposing(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
              >
                <Reply className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setComposerSubject(`Fwd: ${selectedEmail.subject}`);
                  setComposerBody(
                    `\n\n--- Forwarded Message ---\nFrom: ${selectedEmail.senderName} <${selectedEmail.senderEmail}>\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.body}`
                  );
                  setIsComposing(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
              >
                <Forward className="w-3.5 h-3.5" />
                <span>Forward</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <EmptyState
              icon={MailOpen}
              title="No message selected"
              description="Choose a conversation from the thread list to view its complete details and history."
              actionLabel="Compose new"
              onAction={() => setIsComposing(true)}
            />
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          COMPOSER MODAL WITH LOCAL PERSISTENCE
      ─────────────────────────────────────────────────────────────── */}
      {isComposing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="compose-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <h3 id="compose-modal-title" className="text-sm font-semibold text-slate-800">
                  New Message (Relay Composer)
                </h3>
                {lastDraftSavedAt && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-md">
                    <Save className="w-3 h-3" />
                    <span>Saved {lastDraftSavedAt}</span>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsComposing(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Close composer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  To
                </label>
                <input
                  type="email"
                  required
                  value={composerTo}
                  onChange={(e) =>
                    handleUpdateComposerField('to', e.target.value)
                  }
                  placeholder="recipient@relay.dev"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={composerSubject}
                  onChange={(e) =>
                    handleUpdateComposerField('subject', e.target.value)
                  }
                  placeholder="Subject line..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Message
                </label>
                <textarea
                  rows={6}
                  required
                  value={composerBody}
                  onChange={(e) =>
                    handleUpdateComposerField('body', e.target.value)
                  }
                  placeholder="Type your message... Draft is auto-saved locally."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  {composeSuccess
                    ? 'Dispatched to Sent folder!'
                    : draftSaveStatus === 'saved'
                    ? 'Draft auto-saved to localStorage'
                    : 'Draft is saved locally'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    Discard Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsComposing(false)}
                    className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Save & Close
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
                  >
                    {composeSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Sent!
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Send
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          KEYBOARD SHORTCUTS MODAL
      ─────────────────────────────────────────────────────────────── */}
      {showShortcutsModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-indigo-600" />
                <h3 id="shortcuts-modal-title" className="text-sm font-semibold text-slate-800">
                  Keyboard Shortcuts
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Next / Previous message</span>
                <div className="flex items-center gap-1 font-mono">
                  <kbd className="px-2 py-0.5 bg-slate-100 rounded border">↓</kbd>
                  <span>/</span>
                  <kbd className="px-2 py-0.5 bg-slate-100 rounded border">↑</kbd>
                  <span className="text-slate-400 text-[10px]">or j / k</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Open message (mobile/reader)</span>
                <kbd className="px-2 py-0.5 bg-slate-100 rounded border font-mono">
                  Enter
                </kbd>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Star / Unstar message</span>
                <kbd className="px-2 py-0.5 bg-slate-100 rounded border font-mono">
                  s
                </kbd>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Mark Read / Unread</span>
                <kbd className="px-2 py-0.5 bg-slate-100 rounded border font-mono">
                  u
                </kbd>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Move to Trash</span>
                <kbd className="px-2 py-0.5 bg-slate-100 rounded border font-mono">
                  Delete / #
                </kbd>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Compose new message</span>
                <kbd className="px-2 py-0.5 bg-slate-100 rounded border font-mono">
                  c
                </kbd>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Close dialog or Back to List</span>
                <kbd className="px-2 py-0.5 bg-slate-100 rounded border font-mono">
                  Esc
                </kbd>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-600">Focus global search</span>
                <kbd className="px-2 py-0.5 bg-slate-100 rounded border font-mono">
                  /
                </kbd>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
