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
  Save,
  RefreshCw,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

import {
  loadStoredDraft,
  saveStoredDraft,
  clearStoredDraft
} from '../utils/storage';

import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
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

  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return (
        localStorage.getItem('chatflow-inbox-sidebar-collapsed') === 'true'
      );
    } catch {
      return false;
    }
  });

  const { addToast } = useToast();
  const { user: demoUser } = useAuth();

  // Composer / Draft states
  const [isComposing, setIsComposing] = useState(false);
  const [composerTo, setComposerTo] = useState('');
  const [composerSubject, setComposerSubject] = useState('');
  const [composerBody, setComposerBody] = useState('');
  const [draftSaveStatus, setDraftSaveStatus] = useState('idle');
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState(null);
  const [composeSuccess, setComposeSuccess] = useState(false);

  const threadListRef = useRef(null);

  // Persist sidebar state
  useEffect(() => {
    try {
      localStorage.setItem(
        'chatflow-inbox-sidebar-collapsed',
        String(isSidebarCollapsed)
      );
    } catch {
      // Ignore localStorage errors
    }
  }, [isSidebarCollapsed]);

  // ------------------------------------------------------------
  // Deep linking to an email
  // ------------------------------------------------------------
  useEffect(() => {
    if (!targetEmailId) return;

    const target = emails.find((email) => email.id === targetEmailId);

    if (target) {
      setSelectedEmailId(targetEmailId);
      setSelectedFolder(target.folder || 'inbox');
      setMobileView('reader');
    }

    if (onClearTargetEmailId) {
      onClearTargetEmailId();
    }
  }, [targetEmailId, emails, onClearTargetEmailId]);

  // ------------------------------------------------------------
  // Escape handling for modals
  // ------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showShortcutsModal) {
          setShowShortcutsModal(false);
          return;
        }

        if (isComposing) {
          setIsComposing(false);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showShortcutsModal, isComposing]);

  // ------------------------------------------------------------
  // Load saved draft
  // ------------------------------------------------------------
  useEffect(() => {
    const savedDraft = loadStoredDraft();

    if (!savedDraft) return;

    setComposerTo(savedDraft.to || '');
    setComposerSubject(savedDraft.subject || '');
    setComposerBody(savedDraft.body || '');
    setLastDraftSavedAt(savedDraft.lastSavedAt || null);

    if (savedDraft.to || savedDraft.subject || savedDraft.body) {
      setDraftSaveStatus('saved');
    }
  }, []);

  // ------------------------------------------------------------
  // Prefilled recipient
  // ------------------------------------------------------------
  useEffect(() => {
    if (!prefilledRecipient) return;

    setComposerTo(prefilledRecipient);
    setIsComposing(true);

    if (onClearPrefilledRecipient) {
      onClearPrefilledRecipient();
    }
  }, [prefilledRecipient, onClearPrefilledRecipient]);

  // ------------------------------------------------------------
  // Draft handling
  // ------------------------------------------------------------
  const handleUpdateComposerField = (field, value) => {
    const nextTo = field === 'to' ? value : composerTo;
    const nextSubject =
      field === 'subject' ? value : composerSubject;
    const nextBody = field === 'body' ? value : composerBody;

    if (field === 'to') setComposerTo(value);
    if (field === 'subject') setComposerSubject(value);
    if (field === 'body') setComposerBody(value);

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

  // ------------------------------------------------------------
  // Tags
  // ------------------------------------------------------------
  const allTags = useMemo(() => {
    const tagsSet = new Set();

    emails.forEach((email) => {
      email.tags?.forEach((tag) => tagsSet.add(tag));
    });

    return Array.from(tagsSet);
  }, [emails]);

  // ------------------------------------------------------------
  // Filter emails
  // ------------------------------------------------------------
  const filteredEmails = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return emails.filter((email) => {
      const matchesFolder =
        selectedFolder === 'starred'
          ? email.starred && email.folder !== 'trash'
          : email.folder === selectedFolder;

      const matchesTag =
        !selectedTag || email.tags?.includes(selectedTag);

      const matchesSearch =
        query === '' ||
        (email.subject || '').toLowerCase().includes(query) ||
        (email.senderName || '').toLowerCase().includes(query) ||
        (email.senderEmail || '').toLowerCase().includes(query) ||
        (email.body || '').toLowerCase().includes(query) ||
        email.tags?.some((tag) =>
          tag.toLowerCase().includes(query)
        );

      return matchesFolder && matchesTag && matchesSearch;
    });
  }, [emails, selectedFolder, selectedTag, searchQuery]);

  // ------------------------------------------------------------
  // Close reader automatically if selected mail disappears
  // ------------------------------------------------------------
  useEffect(() => {
    if (
      selectedEmailId &&
      !filteredEmails.some(
        (email) => email.id === selectedEmailId
      )
    ) {
      setSelectedEmailId('');
      setMobileView('list');
    }
  }, [filteredEmails, selectedEmailId]);

  const selectedEmail = emails.find(
    (email) => email.id === selectedEmailId
  );

  // ------------------------------------------------------------
  // Folders
  // ------------------------------------------------------------
  const folders = [
    {
      id: 'inbox',
      label: 'Inbox',
      icon: Inbox,
      count: emails.filter(
        (email) => email.folder === 'inbox' && email.unread
      ).length
    },
    {
      id: 'starred',
      label: 'Starred',
      icon: Star,
      count: emails.filter(
        (email) =>
          email.starred && email.folder !== 'trash'
      ).length
    },
    {
      id: 'sent',
      label: 'Sent',
      icon: Send,
      count: emails.filter(
        (email) => email.folder === 'sent'
      ).length
    },
    {
      id: 'drafts',
      label: 'Drafts',
      icon: FileEdit,
      count:
        emails.filter(
          (email) => email.folder === 'drafts'
        ).length + (lastDraftSavedAt ? 1 : 0)
    },
    {
      id: 'trash',
      label: 'Trash',
      icon: Trash2,
      count: emails.filter(
        (email) => email.folder === 'trash'
      ).length
    }
  ];

  // ------------------------------------------------------------
  // Reader close
  // ------------------------------------------------------------
  const closeReader = () => {
    setSelectedEmailId('');
    setMobileView('list');
  };

  // ------------------------------------------------------------
  // Read / Star / Trash actions
  // ------------------------------------------------------------
  const handleToggleRead = (id, e) => {
    e?.stopPropagation();

    onUpdateEmails(
      emails.map((item) =>
        item.id === id
          ? { ...item, unread: !item.unread }
          : item
      )
    );

    const target = emails.find((item) => item.id === id);

    if (target) {
      addToast({
        title: target.unread
          ? 'Marked as Read'
          : 'Marked as Unread',
        message: target.subject,
        type: 'info'
      });
    }
  };

  const handleToggleStar = (id, e) => {
    e?.stopPropagation();

    onUpdateEmails(
      emails.map((item) =>
        item.id === id
          ? { ...item, starred: !item.starred }
          : item
      )
    );

    const target = emails.find((item) => item.id === id);

    if (target) {
      addToast({
        title: target.starred
          ? 'Removed Star'
          : 'Starred Message',
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
        item.id === id
          ? { ...item, folder: 'trash' }
          : item
      )
    );

    if (selectedEmailId === id) {
      closeReader();
    }

    addToast({
      title: 'Moved to Trash',
      message: target
        ? target.subject
        : 'Message moved to Trash.',
      type: 'trash'
    });
  };

  const handleRestoreFromTrash = (id, e) => {
    e?.stopPropagation();

    const target = emails.find((item) => item.id === id);

    onUpdateEmails(
      emails.map((item) =>
        item.id === id
          ? { ...item, folder: 'inbox' }
          : item
      )
    );

    addToast({
      title: 'Restored to Inbox',
      message: target
        ? target.subject
        : 'Message restored to Inbox.',
      type: 'success'
    });

    closeReader();
  };

  const handleDeletePermanently = (id, e) => {
    e?.stopPropagation();

    onUpdateEmails(
      emails.filter((item) => item.id !== id)
    );

    closeReader();

    addToast({
      title: 'Permanently Deleted',
      message: 'Message has been removed from Trash.',
      type: 'trash'
    });
  };

  const handleMarkAllRead = () => {
    onUpdateEmails(
      emails.map((item) => {
        const belongsToFolder =
          selectedFolder === 'starred'
            ? item.starred
            : item.folder === selectedFolder;

        if (belongsToFolder) {
          return {
            ...item,
            unread: false
          };
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

  // ------------------------------------------------------------
  // Refresh
  // ------------------------------------------------------------
  const handleRefresh = () => {
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

  // ------------------------------------------------------------
  // Send email
  // ------------------------------------------------------------
  const handleSendEmail = async (e) => {
    e.preventDefault();

    if (!composerTo.trim()) return;

    try {
      let emailId = `em-${Date.now()}`;
      let senderName = demoUser?.name || 'Alex Rivera';
      let senderEmail = demoUser?.email || 'alex.rivera@relay.dev';

      // Attempt live backend send if Firebase user is authenticated
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
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

          if (response.ok) {
            const data = await response.json();
            if (data.email?.id) emailId = data.email.id;
            if (currentUser.displayName) senderName = currentUser.displayName;
            if (currentUser.email) senderEmail = currentUser.email;
          }
        }
      } catch (networkError) {
        // Fall back seamlessly to client-side demo mode
        console.info('Backend email service not reachable; sending in demo simulation.');
      }

      const newEmail = {
        id: emailId,
        senderName,
        senderEmail,
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


  // ------------------------------------------------------------
  // Keyboard shortcuts
  // ------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      const targetTag = e.target?.tagName;

      if (
        targetTag === 'INPUT' ||
        targetTag === 'TEXTAREA'
      ) {
        if (
          e.key === 'Escape' &&
          isComposing
        ) {
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

        if (selectedEmailId) {
          closeReader();
          return;
        }
      }

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setIsComposing(true);
        return;
      }

      if (filteredEmails.length === 0) return;

      const currentIndex =
        filteredEmails.findIndex(
          (email) =>
            email.id === selectedEmailId
        );

      if (
        e.key === 'ArrowDown' ||
        e.key === 'j'
      ) {
        e.preventDefault();

        const nextIndex =
          currentIndex <
          filteredEmails.length - 1
            ? currentIndex + 1
            : 0;

        setSelectedEmailId(
          filteredEmails[nextIndex].id
        );
      }

      if (
        e.key === 'ArrowUp' ||
        e.key === 'k'
      ) {
        e.preventDefault();

        const previousIndex =
          currentIndex > 0
            ? currentIndex - 1
            : filteredEmails.length - 1;

        setSelectedEmailId(
          filteredEmails[previousIndex].id
        );
      }

      if (e.key === 'Enter') {
        e.preventDefault();

        if (selectedEmail) {
          setMobileView('reader');

          if (selectedEmail.unread) {
            handleToggleRead(
              selectedEmail.id
            );
          }
        }
      }

      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();

        if (selectedEmail) {
          handleToggleStar(
            selectedEmail.id
          );
        }
      }

      if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();

        if (selectedEmail) {
          handleToggleRead(
            selectedEmail.id
          );
        }
      }

      if (
        e.key === 'Delete' ||
        e.key === 'Backspace' ||
        e.key === '#'
      ) {
        e.preventDefault();

        if (selectedEmail) {
          if (selectedFolder === 'trash') {
            handleDeletePermanently(
              selectedEmail.id
            );
          } else {
            handleMoveToTrash(
              selectedEmail.id
            );
          }
        }
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [
    filteredEmails,
    selectedEmailId,
    selectedEmail,
    isComposing,
    showShortcutsModal,
    selectedFolder
  ]);

  // ------------------------------------------------------------
  // Load sent emails
  // ------------------------------------------------------------
  useEffect(() => {
    const loadSentEmails = async () => {
      try {
        const currentUser = auth.currentUser;

        if (!currentUser) return;

        const token =
          await currentUser.getIdToken();

        const response = await fetch(
          'http://localhost:5000/api/emails/sent',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              'Failed to load sent emails'
          );
        }

        const formattedEmails =
          data.emails.map((email) => ({
            id: email.id,
            senderName:
              email.senderName ||
              currentUser.displayName ||
              'You',
            senderEmail:
              email.senderEmail ||
              currentUser.email ||
              '',
            recipient: email.to,
            subject:
              email.subject || '(No Subject)',
            preview:
              email.body?.slice(0, 110) || '',
            body: email.body || '',
            timestamp: email.createdAt
              ? new Date(
                  email.createdAt._seconds *
                    1000
                ).toLocaleString()
              : 'Unknown',
            unread: false,
            starred: false,
            folder: 'sent',
            tags: ['Sent']
          }));

        onUpdateEmails((currentEmails) => {
          const sentIds = new Set(
            formattedEmails.map(
              (email) => email.id
            )
          );

          const otherEmails =
            currentEmails.filter(
              (email) =>
                !sentIds.has(email.id)
            );

          return [
            ...formattedEmails,
            ...otherEmails
          ];
        });
      } catch (error) {
        console.error(
          'Load sent emails error:',
          error
        );
      }
    };

    loadSentEmails();
  }, []);

  // ------------------------------------------------------------
  // Load Gmail inbox
  // ------------------------------------------------------------
  useEffect(() => {
    const loadGmailInbox = async () => {
      try {
        const currentUser = auth.currentUser;

        if (!currentUser) return;

        const token =
          await currentUser.getIdToken();

        const response = await fetch(
          'http://localhost:5000/api/gmail/messages',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              'Failed to load Gmail messages'
          );
        }

        const formattedEmails =
          data.messages.map((email) => {
            const senderMatch =
              email.from.match(
                /^(.*?)\s*<(.+)>$/
              );

            const senderName = senderMatch
              ? senderMatch[1]
                  .replace(/"/g, '')
                  .trim()
              : email.from.split('@')[0];

            const senderEmail =
              senderMatch
                ? senderMatch[2].trim()
                : email.from.trim();

            return {
              id: `gmail-${email.id}`,
              gmailId: email.id,
              threadId: email.threadId,
              senderName,
              senderEmail,
              recipient: email.to,
              subject:
                email.subject ||
                '(No Subject)',
              preview: email.snippet,
              body: email.snippet,
              timestamp: email.date
                ? new Date(
                    email.date
                  ).toLocaleString()
                : 'Unknown',
              unread: false,
              starred: false,
              folder: 'inbox',
              tags: ['Inbox']
            };
          });

        onUpdateEmails((currentEmails) => {
          const nonGmailEmails =
            currentEmails.filter(
              (email) => !email.gmailId
            );

          return [
            ...formattedEmails,
            ...nonGmailEmails
          ];
        });
      } catch (error) {
        console.error(
          'Load Gmail inbox error:',
          error
        );
      }
    };

    loadGmailInbox();
  }, []);

  // ------------------------------------------------------------
  // Connect Gmail
  // ------------------------------------------------------------
  const handleConnectGmail = async () => {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        addToast({
          title: 'Authentication Required',
          message:
            'Please log in again before connecting Gmail.',
          type: 'error'
        });

        return;
      }

      const token =
        await currentUser.getIdToken();

      const response = await fetch(
        'http://localhost:5000/api/gmail/auth',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Failed to start Gmail connection'
        );
      }

      window.open(
        data.authUrl,
        '_blank',
        'noopener,noreferrer'
      );
    } catch (error) {
      console.error(
        'Gmail connection error:',
        error
      );

      addToast({
        title: 'Gmail Connection Failed',
        message:
          error.message ||
          'Unable to connect your Gmail account.',
        type: 'error'
      });
    }
  };

  // ------------------------------------------------------------
  // Select folder
  // ------------------------------------------------------------
  const handleFolderChange = (folderId) => {
    setSelectedFolder(folderId);
    setSelectedEmailId('');
    setSelectedTag(null);
    setMobileView('list');
  };

  // ------------------------------------------------------------
  // Select tag
  // ------------------------------------------------------------
  const handleTagChange = (tag) => {
    if (selectedTag === tag) {
      setSelectedTag(null);
      return;
    }

    setSelectedTag(tag);
    setSelectedEmailId('');
    setMobileView('list');

    const taggedEmail = emails.find((email) =>
      email.tags?.includes(tag)
    );

    if (taggedEmail) {
      setSelectedFolder(
        taggedEmail.folder
      );
    }
  };

  return (
    <div
      className="flex flex-col lg:flex-row h-full min-h-0 overflow-hidden bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors"
      role="region"
      aria-label="Email Client"
    >
      {/* =====================================================
          COLUMN 1 - SIDEBAR
      ====================================================== */}
      <div
        className={`w-full ${
          isSidebarCollapsed
            ? 'lg:w-16'
            : 'lg:w-56'
        } border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3 lg:p-4 shrink-0 flex flex-col justify-between overflow-x-auto lg:overflow-y-auto transition-[width] duration-200`}
      >
        <div className="space-y-4 w-full">
          {/* Sidebar Toggle */}
          <div
            className={`hidden lg:flex ${
              isSidebarCollapsed
                ? 'justify-center'
                : 'justify-end'
            }`}
          >
            <button
              type="button"
              onClick={() =>
                setIsSidebarCollapsed(
                  (prev) => !prev
                )
              }
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title={
                isSidebarCollapsed
                  ? 'Expand sidebar'
                  : 'Collapse sidebar'
              }
              aria-label={
                isSidebarCollapsed
                  ? 'Expand sidebar'
                  : 'Collapse sidebar'
              }
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Compose */}
          <button
            type="button"
            onClick={() =>
              setIsComposing(true)
            }
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              isSidebarCollapsed
                ? 'lg:w-10 lg:h-10 lg:px-0 lg:mx-auto'
                : ''
            }`}
            aria-label="Compose new email"
            title={
              isSidebarCollapsed
                ? 'Compose'
                : undefined
            }
          >
            <Plus className="w-4 h-4 shrink-0" />

            <span
              className={
                isSidebarCollapsed
                  ? 'lg:hidden'
                  : ''
              }
            >
              Compose
            </span>
          </button>
          {/* Connect Gmail */}
          <button
            type="button"
            onClick={handleConnectGmail}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-colors ${
              isSidebarCollapsed
                ? 'lg:w-10 lg:h-10 lg:px-0 lg:mx-auto'
                : ''
            }`}
            aria-label="Connect Gmail"
            title={
              isSidebarCollapsed
                ? 'Connect Gmail'
                : undefined
            }
          >
            <Mail className="w-4 h-4 shrink-0" />

            <span
              className={
                isSidebarCollapsed
                  ? 'lg:hidden'
                  : ''
              }
            >
              Connect Gmail
            </span>
          </button>

          {/* Folder Navigation */}
          <nav
            className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0"
            aria-label="Mail Folders"
          >
            {folders.map((folder) => {
              const Icon = folder.icon;
              const isActive =
                selectedFolder === folder.id;

              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() =>
                    handleFolderChange(
                      folder.id
                    )
                  }
                  className={`relative flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors shrink-0 lg:shrink lg:w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isSidebarCollapsed
                      ? 'lg:w-10 lg:h-10 lg:px-0 lg:mx-auto lg:justify-center'
                      : ''
                  } ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  aria-current={
                    isActive
                      ? 'page'
                      : undefined
                  }
                  title={
                    isSidebarCollapsed
                      ? folder.label
                      : undefined
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />

                    <span
                      className={
                        isSidebarCollapsed
                          ? 'lg:hidden'
                          : ''
                      }
                    >
                      {folder.label}
                    </span>
                  </div>

                  {folder.count > 0 && (
                    <span
                      className={
                        isSidebarCollapsed
                          ? 'absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 flex items-center justify-center rounded-full bg-indigo-600 text-white text-[9px] font-bold'
                          : `text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              isActive
                                ? 'bg-indigo-200/70 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200'
                                : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`
                      }
                    >
                      {folder.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Tags */}
          {!isSidebarCollapsed && (
            <div className="hidden lg:block pt-3 border-t border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Tags
                </span>

                {selectedTag && (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedTag(null)
                    }
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedTag(null)
                  }
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
                  const isSelected =
                    selectedTag === tag;

                  const count = emails.filter(
                    (email) =>
                      email.tags?.includes(tag)
                  ).length;

                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        handleTagChange(tag)
                      }
                      className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Tag
                          className={`w-3 h-3 ${
                            isSelected
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        />

                        <span>{tag}</span>
                      </div>

                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Shortcuts */}
        <div className="pt-2 hidden lg:flex items-center justify-between border-t border-slate-200/70 dark:border-slate-800 text-slate-400 dark:text-slate-500">
          <button
            type="button"
            onClick={() =>
              setShowShortcutsModal(true)
            }
            className={`flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 ${
              isSidebarCollapsed
                ? 'lg:w-10 lg:justify-center lg:mx-auto'
                : ''
            }`}
            aria-label="View keyboard shortcuts"
            title={
              isSidebarCollapsed
                ? 'Keyboard shortcuts'
                : undefined
            }
          >
            <Keyboard className="w-3.5 h-3.5" />

            <span
              className={
                isSidebarCollapsed
                  ? 'lg:hidden'
                  : ''
              }
            >
              Shortcuts
            </span>

            {!isSidebarCollapsed && (
              <kbd className="px-1 text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                ?
              </kbd>
            )}
          </button>
        </div>
      </div>

      {/* =====================================================
          COLUMN 2 - MAIL LIST
          IMPORTANT:
          If reader is closed, this becomes flex-1 and expands.
      ====================================================== */}
      <div
        className={`w-full ${
          selectedEmail
            ? 'lg:w-80 xl:w-96 shrink-0'
            : 'lg:flex-1'
        } border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full min-w-0 overflow-hidden transition-[width] duration-200 ${
          mobileView === 'reader'
            ? 'hidden lg:flex'
            : 'flex'
        }`}
      >
        {/* List Header */}
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
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              title="Refresh mailbox"
              aria-label="Refresh mailbox"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isRefreshing
                    ? 'animate-spin text-indigo-600 dark:text-indigo-400'
                    : ''
                }`}
              />
            </button>

            {filteredEmails.some(
              (email) => email.unread
            ) && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 px-2 py-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="px-3 py-2 bg-slate-900 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1 shrink-0">
              Tag:
            </span>

            <button
              type="button"
              onClick={() =>
                setSelectedTag(null)
              }
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                selectedTag === null
                  ? 'bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900'
                  : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All
            </button>

            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  handleTagChange(tag)
                }
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                  selectedTag === tag
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{tag}</span>

                {selectedTag === tag && (
                  <X className="w-2.5 h-2.5" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Mail List */}
        <div
          ref={threadListRef}
          role="listbox"
          aria-label="Email list"
          className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800"
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
                    ? () =>
                        handleFolderChange(
                          'inbox'
                        )
                    : () =>
                        setIsComposing(true)
                }
              />
            </div>
          ) : (
            filteredEmails.map((email) => {
              const isSelected =
                selectedEmail?.id === email.id;

              return (
                <div
                  key={email.id}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={0}
                  onClick={() => {
                    setSelectedEmailId(
                      email.id
                    );
                    setMobileView('reader');

                    if (email.unread) {
                      handleToggleRead(
                        email.id
                      );
                    }
                  }}
                  onKeyDown={(e) => {
                    if (
                      e.key === 'Enter' ||
                      e.key === ' '
                    ) {
                      e.preventDefault();

                      setSelectedEmailId(
                        email.id
                      );
                      setMobileView('reader');

                      if (email.unread) {
                        handleToggleRead(
                          email.id
                        );
                      }
                    }
                  }}
                  className={`group relative w-full text-left p-3.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isSelected
                      ? 'bg-indigo-50/60 dark:bg-indigo-950/50 border-l-4 border-indigo-600 dark:border-indigo-500'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/60 bg-white dark:bg-slate-900'
                  }`}
                >
                  {/* Sender / Time */}
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

                    <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 ml-2">
                      {email.timestamp}
                    </span>
                  </div>

                  {/* Subject */}
                  <p
                    className={`text-xs truncate mb-1 ${
                      email.unread
                        ? 'font-semibold text-slate-900 dark:text-white'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {email.subject}
                  </p>

                  {/* Preview */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {email.preview}
                  </p>

                  {/* Bottom */}
                  <div className="flex items-center justify-between mt-2 pt-1">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      {email.attachmentsCount && (
                        <span className="flex items-center gap-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                          <Paperclip className="w-3 h-3" />
                          {email.attachmentsCount}
                        </span>
                      )}

                      {email.tags?.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTagChange(tag);
                          }}
                          className={`px-1.5 py-0.2 rounded text-[10px] font-medium transition-colors ${
                            selectedTag === tag
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>

                    {/* Quick actions */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) =>
                          handleToggleStar(
                            email.id,
                            e
                          )
                        }
                        className="p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label={
                          email.starred
                            ? 'Unstar'
                            : 'Star'
                        }
                        title={
                          email.starred
                            ? 'Unstar (S)'
                            : 'Star (S)'
                        }
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
                        onClick={(e) =>
                          handleToggleRead(
                            email.id,
                            e
                          )
                        }
                        className="p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label={
                          email.unread
                            ? 'Mark as read'
                            : 'Mark as unread'
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
                          if (
                            selectedFolder ===
                            'trash'
                          ) {
                            handleDeletePermanently(
                              email.id,
                              e
                            );
                          } else {
                            handleMoveToTrash(
                              email.id,
                              e
                            );
                          }
                        }}
                        className="p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="Delete message"
                        title="Delete"
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

      {/* =====================================================
          COLUMN 3 - READING PANE
          It completely disappears when selectedEmail is empty.
      ====================================================== */}
      {selectedEmail && (
        <div
          className={`flex-1 min-w-0 min-h-0 flex flex-col h-full overflow-hidden bg-slate-50/30 dark:bg-slate-950/40 ${
            mobileView === 'list'
              ? 'hidden lg:flex'
              : 'flex'
          }`}
        >
          <div className="flex flex-col h-full min-h-0 bg-white dark:bg-slate-900 transition-colors">
            {/* Mobile Header */}
            <div className="lg:hidden shrink-0 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <button
                type="button"
                onClick={closeReader}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                aria-label="Close reading pane"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>
                  Back to {selectedFolder}
                </span>
              </button>

              <button
                type="button"
                onClick={closeReader}
                className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Close reading pane"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Reader Header */}
            <div className="shrink-0 p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white leading-snug break-words">
                    {selectedEmail.subject ||
                      '(No Subject)'}
                  </h2>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {selectedEmail.tags?.map(
                      (tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() =>
                            handleTagChange(tag)
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
                        >
                          <Tag className="w-3 h-3" />
                          <span>{tag}</span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Reader actions */}
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleStar(
                          selectedEmail.id
                        )
                      }
                      className="p-2 text-slate-500 dark:text-slate-400 hover:text-amber-500 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                      aria-label={
                        selectedEmail.starred
                          ? 'Unstar'
                          : 'Star'
                      }
                      title={
                        selectedEmail.starred
                          ? 'Unstar (S)'
                          : 'Star (S)'
                      }
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
                      onClick={() =>
                        handleToggleRead(
                          selectedEmail.id
                        )
                      }
                      className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                      aria-label={
                        selectedEmail.unread
                          ? 'Mark as read'
                          : 'Mark as unread'
                      }
                    >
                      {selectedEmail.unread ? (
                        <MailOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      )}
                    </button>

                    {selectedFolder ===
                    'trash' ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            handleRestoreFromTrash(
                              selectedEmail.id
                            )
                          }
                          className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                          title="Restore to Inbox"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeletePermanently(
                              selectedEmail.id
                            )
                          }
                          className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                          title="Delete permanently"
                        >
                          <Trash2 className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          handleMoveToTrash(
                            selectedEmail.id
                          )
                        }
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Move to Trash"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* CLOSE READER */}
                  <button
                    type="button"
                    onClick={closeReader}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    aria-label="Close reading pane"
                    title="Close reading pane"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Sender */}
              <div className="flex items-center justify-between gap-4 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-sm flex items-center justify-center shadow-xs shrink-0">
                    {selectedEmail.senderName
                      ?.slice(0, 2)
                      .toUpperCase() ||
                      '??'}
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {selectedEmail.senderName}
                    </div>

                    <div className="text-xs text-slate-400 dark:text-slate-500 truncate">
                      From:{' '}
                      {selectedEmail.senderEmail}{' '}
                      • To:{' '}
                      {selectedEmail.recipient}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                  {selectedEmail.timestamp}
                </div>
              </div>
            </div>

            {/* Email Body */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 min-h-full">
                <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line max-w-3xl">
                  {selectedEmail.body}
                </div>

                {selectedEmail.attachmentsCount && (
                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                      Attached Files (
                      {
                        selectedEmail.attachmentsCount
                      }
                      )
                    </h4>

                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200">
                        <Paperclip className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>
                          Specifications-Brief.pdf
                        </span>

                        <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                          (2.4 MB)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="shrink-0 p-4 bg-slate-950 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setComposerTo(
                    selectedEmail.senderEmail
                  );

                  setComposerSubject(
                    `Re: ${selectedEmail.subject}`
                  );

                  setIsComposing(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition-colors"
              >
                <Reply className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setComposerSubject(
                    `Fwd: ${selectedEmail.subject}`
                  );

                  setComposerBody(
                    `\n\n--- Forwarded Message ---\nFrom: ${selectedEmail.senderName} <${selectedEmail.senderEmail}>\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.body}`
                  );

                  setIsComposing(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition-colors"
              >
                <Forward className="w-3.5 h-3.5" />
                <span>Forward</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          COMPOSER MODAL
      ====================================================== */}
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
                <h3
                  id="compose-modal-title"
                  className="text-sm font-semibold text-slate-800 dark:text-white"
                >
                  New Message
                </h3>

                {lastDraftSavedAt && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                    <Save className="w-3 h-3" />
                    <span>
                      Saved {lastDraftSavedAt}
                    </span>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsComposing(false)
                }
                className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                aria-label="Close composer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSendEmail}
              className="p-5 space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  To
                </label>

                <input
                  type="email"
                  required
                  value={composerTo}
                  onChange={(e) =>
                    handleUpdateComposerField(
                      'to',
                      e.target.value
                    )
                  }
                  placeholder="recipient@example.com"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    handleUpdateComposerField(
                      'subject',
                      e.target.value
                    )
                  }
                  placeholder="Subject line..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    handleUpdateComposerField(
                      'body',
                      e.target.value
                    )
                  }
                  placeholder="Type your message..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {composeSuccess
                    ? 'Dispatched to Sent folder!'
                    : draftSaveStatus ===
                      'saved'
                    ? 'Draft auto-saved locally'
                    : 'Draft is saved locally'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={
                      handleDiscardDraft
                    }
                    className="px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                  >
                    Discard
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setIsComposing(false)
                    }
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
                        <Check className="w-3.5 h-3.5" />
                        Sent!
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Send
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          KEYBOARD SHORTCUTS MODAL
      ====================================================== */}
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

                <h3
                  id="shortcuts-modal-title"
                  className="text-sm font-semibold text-slate-800 dark:text-white"
                >
                  Keyboard Shortcuts
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowShortcutsModal(false)
                }
                className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              {[
                ['Next / Previous message', '↓ / ↑ or j / k'],
                ['Open message', 'Enter'],
                ['Star / Unstar message', 's'],
                ['Mark Read / Unread', 'u'],
                ['Move to Trash', 'Delete / #'],
                ['Compose new message', 'c'],
                ['Close reader / dialog', 'Esc'],
                ['Show shortcuts', '?']
              ].map(([label, key]) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800 last:border-0"
                >
                  <span className="text-slate-600 dark:text-slate-300">
                    {label}
                  </span>

                  <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 font-mono">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 text-right">
              <button
                type="button"
                onClick={() =>
                  setShowShortcutsModal(false)
                }
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