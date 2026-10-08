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
import { auth } from '../config/firebase';

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
  !selectedTag || email.tags?.includes(selectedTag);

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

// Keep the current selection only if it still exists.
// Do not automatically open/select the first email.
useEffect(() => {
  if (
    selectedEmailId &&
    !filteredEmails.some((email) => email.id === selectedEmailId)
  ) {
    setSelectedEmailId('');
    setMobileView('list');
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
const handleSendEmail = async (e) => {
  e.preventDefault();

  if (!composerTo.trim()) return;

  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      addToast({
        title: 'Authentication Required',
        message: 'Please log in again before sending an email.',
        type: 'error'
      });
      return;
    }

    const token = await currentUser.getIdToken();

    const response = await fetch('http://localhost:5000/api/emails/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        to: composerTo.trim(),
        subject: composerSubject.trim() || '(No Subject)',
        body: composerBody.trim() || '(No content provided)'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send email');
    }

    const newEmail = {
      id: data.email.id,
      senderName: currentUser.displayName || 'You',
      senderEmail: currentUser.email || '',
      recipient: composerTo.trim(),
      subject: composerSubject.trim() || '(No Subject)',
      preview:
        composerBody.trim().slice(0, 110) ||
        'Sent message with no text preview.',
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
      message: `Email successfully sent to ${composerTo.trim()}`,
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
  } catch (error) {
    console.error('Send email error:', error);

    addToast({
      title: 'Email Failed',
      message: error.message || 'Unable to send email.',
      type: 'error'
    });
  }
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
useEffect(() => {
  const loadSentEmails = async () => {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      const token = await currentUser.getIdToken();

      const response = await fetch(
        'http://localhost:5000/api/emails/sent',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load sent emails');
      }

      const formattedEmails = data.emails.map((email) => ({
        id: email.id,
        senderName: email.senderName || currentUser.displayName || 'You',
        senderEmail: email.senderEmail || currentUser.email || '',
        recipient: email.to,
        subject: email.subject,
        preview: email.body?.slice(0, 110) || '',
        body: email.body || '',
        timestamp: email.createdAt
          ? new Date(email.createdAt._seconds * 1000).toLocaleString()
          : 'Unknown',
        unread: false,
        starred: false,
        folder: 'sent',
        tags: ['Sent'],
      }));

      onUpdateEmails(formattedEmails);
    } catch (error) {
      console.error('Load sent emails error:', error);
    }
  };

  loadSentEmails();
}, []);
useEffect(() => {
  const loadGmailInbox = async () => {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      const token = await currentUser.getIdToken();

      const response = await fetch(
        'http://localhost:5000/api/gmail/messages',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load Gmail messages');
      }

      const formattedEmails = data.messages.map((email) => {
        const senderMatch = email.from.match(/^(.*?)\s*<(.+)>$/);

        const senderName = senderMatch
          ? senderMatch[1].replace(/"/g, '').trim()
          : email.from.split('@')[0];

        const senderEmail = senderMatch
          ? senderMatch[2].trim()
          : email.from.trim();

        return {
          id: `gmail-${email.id}`,
          gmailId: email.id,
          threadId: email.threadId,
          senderName,
          senderEmail,
          recipient: email.to,
          subject: email.subject,
          preview: email.snippet,
          body: email.snippet,
          timestamp: email.date
            ? new Date(email.date).toLocaleString()
            : 'Unknown',
          unread: false,
          starred: false,
          folder: 'inbox',
          tags: ['Inbox'],
        };
      });

      onUpdateEmails((currentEmails) => {
        const nonGmailEmails = currentEmails.filter(
          (email) => !email.gmailId
        );

        return [...formattedEmails, ...nonGmailEmails];
      });
    } catch (error) {
      console.error('Load Gmail inbox error:', error);
    }
  };

  loadGmailInbox();
}, []);
  return (
    <div
      className="flex flex-col lg:flex-row h-full overflow-hidden bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors"
      role="region"
      aria-label="Email Client"
    >

      {/* ─────────────────────────────────────────────────────────────
          COLUMN 1: Mail Folders & Tags Navigation
      ─────────────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-56 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3 lg:p-4 shrink-0 flex flex-col justify-between overflow-x-auto lg:overflow-y-auto">
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
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span>{folder.label}</span>
                  </div>
                  {folder.count !== undefined && folder.count > 0 && (
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-indigo-200/70 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200'
                          : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
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
          <div className="hidden lg:block pt-3 border-t border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Tags
              </span>
              {selectedTag && (
                <button
                  type="button"
                  onClick={() => setSelectedTag(null)}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
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
                    ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>All Tags</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
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
                    onClick={() => {
  if (selectedTag === tag) {
    setSelectedTag(null);
    return;
  }

  setSelectedTag(tag);

  const taggedEmail = emails.find((email) =>
    email.tags?.includes(tag)
  );

  if (taggedEmail) {
    setSelectedFolder(taggedEmail.folder);
    setMobileView('list');
  }
}}
                  >
                    <div className="flex items-center gap-2">
                      <Tag
                        className={`w-3 h-3 ${
                          isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      />
                      <span>{tag}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Keyboard Helper Link */}
        <div className="pt-2 hidden lg:flex items-center justify-between border-t border-slate-200/70 dark:border-slate-800 text-slate-400 dark:text-slate-500">
          <button
            type="button"
            onClick={() => setShowShortcutsModal(true)}
            className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="View keyboard shortcuts"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Shortcuts</span>
            <kbd className="px-1 text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
              ?
            </kbd>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          COLUMN 2: Thread List with Tag Filter Chips
      ─────────────────────────────────────────────────────────────── */}
      <div
        className={`w-full lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full shrink-0 overflow-hidden ${
          mobileView === 'reader' ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {/* Thread List Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-slate-800 dark:text-white tracking-wider capitalize">
              {selectedFolder}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              ({filteredEmails.length})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSimulateRefresh}
              disabled={isRefreshing}
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              title="Simulate mailbox sync"
              aria-label="Simulate mailbox sync"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''}`}
              />
            </button>
            {filteredEmails.some((e) => e.unread) && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 px-2 py-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                title="Mark all as read in current folder"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Tag Filter Chips Bar */}
        {allTags.length > 0 && (
          <div className="px-3 py-2 bg-slate-50/50 dark:bg-slate-850/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1 shrink-0">
              Tag:
            </span>
            <button
              type="button"
              onClick={() => setSelectedTag(null)}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                selectedTag === null
                  ? 'bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900 shadow-2xs'
                  : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
  if (selectedTag === tag) {
    setSelectedTag(null);
    return;
  }

  setSelectedTag(tag);

  const taggedEmail = emails.find((email) =>
    email.tags?.includes(tag)
  );

  if (taggedEmail) {
    setSelectedFolder(taggedEmail.folder);
    setMobileView('list');
  }
}}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                  selectedTag === tag
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
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
          className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800"
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
                      ? 'bg-indigo-50/60 dark:bg-indigo-950/50 border-l-4 border-indigo-600 dark:border-indigo-500'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/60 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {email.unread ? (
                        <span
                          className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0"
                          title="Unread"
                        />
                      ) : (
                        <span className="w-2 h-2 shrink-0" />
                      )}
                      <span
                        className={`text-xs truncate ${
                          email.unread
                            ? 'font-bold text-slate-900 dark:text-white'
                            : 'font-medium text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {email.senderName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {email.timestamp}
                      </span>
                    </div>
                  </div>

                  <p
                    className={`text-xs truncate mb-1 ${
                      email.unread
                        ? 'font-semibold text-slate-900 dark:text-white'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {email.subject}
                  </p>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {email.preview}
                  </p>

                  {/* Badges & Quick Action Triggers */}
                  <div className="flex items-center justify-between mt-2 pt-1">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      {email.attachmentsCount && (
                        <span className="flex items-center gap-0.5 text-[10px] text-slate-400 dark:text-slate-500">
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

  const taggedEmail = emails.find((email) =>
    email.tags?.includes(t)
  );

  if (taggedEmail) {
    setSelectedFolder(taggedEmail.folder);
    setMobileView('list');
  }
}}
                          className={`px-1.5 py-0.2 rounded text-[10px] font-medium transition-colors ${
                            selectedTag === t
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
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
                        className="p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label={email.starred ? 'Unstar' : 'Star'}
                        title={email.starred ? 'Unstar (S)' : 'Star (S)'}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            email.starred
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleToggleRead(email.id, e)}
                        className="p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                          <MailOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
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
                        className="p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800"
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
        className={`flex-1 flex flex-col h-full overflow-hidden bg-slate-50/30 dark:bg-slate-950/40 ${
          mobileView === 'list' ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {selectedEmail ? (
          <div className="flex flex-col h-full overflow-y-auto bg-white dark:bg-slate-900 transition-colors">
            {/* Mobile Back Button bar */}
            <div className="lg:hidden px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMobileView('list')}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white"
                aria-label="Back to email list"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to {selectedFolder}</span>
              </button>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {selectedEmail.timestamp}
              </span>
            </div>

            {/* Header & Action Toolbar */}
            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                    {selectedEmail.subject}
                  </h2>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {selectedEmail.tags?.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSelectedTag(tag)}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
                      >
                        <Tag className="w-3 h-3" />
                        <span>{tag}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reader Action Toolbar */}
                <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => handleToggleStar(selectedEmail.id)}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-amber-500 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                    aria-label={selectedEmail.starred ? 'Unstar' : 'Star'}
                    title={selectedEmail.starred ? 'Unstar (S)' : 'Star (S)'}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        selectedEmail.starred
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleRead(selectedEmail.id)}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
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
                      <MailOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    )}
                  </button>

                  {selectedFolder === 'trash' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleRestoreFromTrash(selectedEmail.id)}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
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
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                        aria-label="Delete permanently"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleMoveToTrash(selectedEmail.id)}
                      className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                      aria-label="Move to Trash"
                      title="Move to Trash (Delete / #)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Sender Details */}
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-sm flex items-center justify-center shadow-xs">
                    {selectedEmail.senderName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {selectedEmail.senderName}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">
                      From: {selectedEmail.senderEmail} • To:{' '}
                      {selectedEmail.recipient}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500">
                  {selectedEmail.timestamp}
                </div>
              </div>
            </div>

            {/* Email Body */}
            <div className="p-6 sm:p-8 flex-1 bg-white dark:bg-slate-900">
              <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line max-w-3xl">
                {selectedEmail.body}
              </div>

              {/* Attachments preview */}
              {selectedEmail.attachmentsCount && (
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                    Attached Files ({selectedEmail.attachmentsCount})
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200">
                      <Paperclip className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Specifications-Brief.pdf</span>
                      <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                        (2.4 MB)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setComposerTo(selectedEmail.senderEmail);
                  setComposerSubject(`Re: ${selectedEmail.subject}`);
                  setIsComposing(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition-colors"
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
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition-colors"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80">
              <div className="flex items-center gap-2">
                <h3 id="compose-modal-title" className="text-sm font-semibold text-slate-800 dark:text-white">
                  New Message (Relay Composer)
                </h3>
                {lastDraftSavedAt && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                    <Save className="w-3 h-3" />
                    <span>Saved {lastDraftSavedAt}</span>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsComposing(false)}
                className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Close composer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
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
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
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
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
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
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
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
                    className="px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                  >
                    Discard Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsComposing(false)}
                    className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 id="shortcuts-modal-title" className="text-sm font-semibold text-slate-800 dark:text-white">
                  Keyboard Shortcuts
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-300">Next / Previous message</span>
                <div className="flex items-center gap-1 font-mono">
                  <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">↓</kbd>
                  <span>/</span>
                  <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">↑</kbd>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px]">or j / k</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-300">Open message (mobile/reader)</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 font-mono">
                  Enter
                </kbd>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-300">Star / Unstar message</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 font-mono">
                  s
                </kbd>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-300">Mark Read / Unread</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 font-mono">
                  u
                </kbd>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-300">Move to Trash</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 font-mono">
                  Delete / #
                </kbd>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-300">Compose new message</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 font-mono">
                  c
                </kbd>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-300">Close dialog or Back to List</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 font-mono">
                  Esc
                </kbd>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-600 dark:text-slate-300">Focus global search</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 font-mono">
                  /
                </kbd>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 text-right">
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
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
