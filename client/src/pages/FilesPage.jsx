
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  FileCode,
  Image as ImageIcon,
  Film,
  UploadCloud,
  HardDrive,
  Download,
  Search,
  X,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  MessageSquare,
  Mail,
  Trash2,
  Share2,
  Eye,
  Clock,
  User,
  FolderOpen,
  AlertCircle,
} from 'lucide-react';

import { useToast } from '../context/ToastContext';
import { EmptyState } from '../components/common/EmptyState';
import {
  getFiles,
  uploadFile,
  deleteFile,
  downloadFile,
} from '../services/api';

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const formatFileSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (date) => {
  if (!date) return '—';

  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime())
    ? '—'
    : parsed.toLocaleDateString();
};

const normalizeFile = (file) => ({
  ...file,
  name: file.name || file.originalName || 'Unnamed file',
  type: file.type || 'document',
  sizeBytes: Number(file.sizeBytes ?? file.size ?? 0),
  size: formatFileSize(Number(file.sizeBytes ?? file.size ?? 0)),
  date: file.date || file.createdAt || null,
  updatedAt: formatDate(file.date || file.createdAt),
  sharedBy: file.sharedBy || 'You',
  relatedContext: file.relatedContext || null,
  previewSnippet: file.previewSnippet || null,
});

export const FilesPage = ({
  files = [],
  onUpdateFiles,
  searchQuery = '',
  onNavigateTab,
}) => {
  const [selectedType, setSelectedType] = useState('All');
  const [localSearch, setLocalSearch] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyFileId, setBusyFileId] = useState(null);

  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const currentFiles = Array.isArray(files) ? files : [];

  // Load files belonging to the authenticated user.
  useEffect(() => {
    let cancelled = false;

    const loadFiles = async () => {
      setIsLoading(true);

      try {
        const response = await getFiles();

        if (cancelled) return;

        const serverFiles = (response.files || []).map(normalizeFile);
        onUpdateFiles?.(serverFiles);
      } catch (error) {
        if (!cancelled) {
          addToast({
            title: 'Could not load files',
            message: error.message || 'Please try again.',
            type: 'error',
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadFiles();

    return () => {
      cancelled = true;
    };
  }, [onUpdateFiles, addToast]);

  // Close the preview drawer with Escape.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedFile(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Keep the selected file synchronized after loading or updating.
  useEffect(() => {
    if (!selectedFile) return;

    const updatedFile = currentFiles.find(
      (file) => file.id === selectedFile.id
    );

    if (updatedFile && updatedFile !== selectedFile) {
      setSelectedFile(updatedFile);
    }
  }, [currentFiles, selectedFile]);

  const fileTypes = [
    'All',
    'document',
    'design',
    'code',
    'image',
    'media',
  ];

  const effectiveQuery = (
    localSearch || searchQuery
  ).trim().toLowerCase();

  const filteredFiles = useMemo(() => {
    return currentFiles.filter((file) => {
      const matchesType =
        selectedType === 'All' ||
        (file.type || 'document').toLowerCase() ===
          selectedType.toLowerCase();

      if (!matchesType) return false;
      if (!effectiveQuery) return true;

      const name = (file.name || '').toLowerCase();
      const sender = (file.sharedBy || '').toLowerCase();
      const type = (file.type || '').toLowerCase();
      const context = (
        file.relatedContext?.title || ''
      ).toLowerCase();

      return (
        name.includes(effectiveQuery) ||
        sender.includes(effectiveQuery) ||
        type.includes(effectiveQuery) ||
        context.includes(effectiveQuery)
      );
    });
  }, [currentFiles, selectedType, effectiveQuery]);

  const sortedFiles = useMemo(() => {
    return [...filteredFiles].sort((a, b) => {
      let comparison = 0;

      if (sortField === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '');
      } else if (sortField === 'sender') {
        comparison = (a.sharedBy || '').localeCompare(
          b.sharedBy || ''
        );
      } else if (sortField === 'size') {
        comparison =
          (a.sizeBytes || 0) - (b.sizeBytes || 0);
      } else if (sortField === 'date') {
        comparison =
          new Date(a.date || 0).getTime() -
          new Date(b.date || 0).getTime();
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredFiles, sortField, sortOrder]);

  const totalStorage = currentFiles.reduce(
    (total, file) => total + (file.sizeBytes || 0),
    0
  );

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder((previous) =>
        previous === 'asc' ? 'desc' : 'asc'
      );
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getFileIcon = (type = 'document') => {
    switch (type.toLowerCase()) {
      case 'design':
        return <Layers className="w-5 h-5 text-pink-600" />;
      case 'code':
        return <FileCode className="w-5 h-5 text-emerald-600" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-purple-600" />;
      case 'media':
        return <Film className="w-5 h-5 text-amber-500" />;
      default:
        return <FileText className="w-5 h-5 text-indigo-600" />;
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();

    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsDragging(false);
    }
  };

  // Upload to the backend; do not create mock file records.
  const processFile = async (file) => {
    setIsDragging(false);

    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      addToast({
        title: 'File too large',
        message: 'The maximum file size is 50 MB.',
        type: 'error',
      });
      return;
    }

    setUploadProgress({
      name: file.name,
      percent: 10,
    });

    try {
      const response = await uploadFile(file);

      if (!response.file) {
        throw new Error('The server did not return the uploaded file.');
      }

      const newFile = normalizeFile(response.file);

      onUpdateFiles?.((previous) => [
        newFile,
        ...(Array.isArray(previous)
          ? previous.filter((item) => item.id !== newFile.id)
          : []),
      ]);

      setUploadProgress({
        name: file.name,
        percent: 100,
      });

      addToast({
        title: 'File uploaded',
        message: `"${file.name}" was saved to the server.`,
        type: 'success',
      });
    } catch (error) {
      addToast({
        title: 'Upload failed',
        message: error.message || 'Could not upload the file.',
        type: 'error',
      });
    } finally {
      setUploadProgress(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      processFile(file);
    }
  };

  const handleManualUpload = (event) => {
    const file = event.target.files?.[0];

    if (file) {
      processFile(file);
    }
  };

  const handleDownloadFile = async (file) => {
    if (!file?.id) return;

    setBusyFileId(file.id);

    try {
      await downloadFile(file.id, file.name);

      addToast({
        title: 'Download started',
        message: `Downloading "${file.name}".`,
        type: 'success',
      });
    } catch (error) {
      addToast({
        title: 'Download failed',
        message: error.message || 'Could not download the file.',
        type: 'error',
      });
    } finally {
      setBusyFileId(null);
    }
  };

  const handleDeleteFile = async (fileId, fileName) => {
    if (!fileId) return;

    setBusyFileId(fileId);

    try {
      await deleteFile(fileId);

      onUpdateFiles?.((previous) =>
        (Array.isArray(previous) ? previous : []).filter(
          (file) => file.id !== fileId
        )
      );

      if (selectedFile?.id === fileId) {
        setSelectedFile(null);
      }

      addToast({
        title: 'File deleted',
        message: `"${fileName}" was deleted from the server.`,
        type: 'success',
      });
    } catch (error) {
      addToast({
        title: 'Delete failed',
        message: error.message || 'Could not delete the file.',
        type: 'error',
      });
    } finally {
      setBusyFileId(null);
    }
  };

  const handleShareInfo = (file) => {
    addToast({
      title: 'Sharing not available yet',
      message: `A shareable link for "${file.name}" has not been configured.`,
      type: 'info',
    });
  };

  return (
    <div
      className="flex flex-col h-full overflow-y-auto bg-slate-50/50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 text-slate-800 dark:text-slate-100"
      role="region"
      aria-label="Shared Files and Media"
    >
      {/* Header and storage usage */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Shared Files &amp; Media
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage files stored in your ChatFlow workspace.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 w-full md:w-80">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Local file storage
            </span>
            <span className="text-slate-400 font-normal">
              {formatFileSize(totalStorage)}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{
                width: `${Math.min(
                  (totalStorage / (50 * 1024 * 1024 * 1024)) * 100,
                  100
                )}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">
            Total size of your uploaded files
          </p>
        </div>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!uploadProgress) fileInputRef.current?.click();
        }}
        className={`relative mb-6 border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all bg-white dark:bg-slate-900 ${
          uploadProgress
            ? 'cursor-wait opacity-80'
            : 'cursor-pointer'
        } ${
          isDragging
            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
            : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleManualUpload}
          disabled={Boolean(uploadProgress)}
          className="hidden"
          aria-label="Upload files"
        />

        {uploadProgress ? (
          <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
            <UploadCloud className="w-8 h-8 text-indigo-600 mb-3 animate-pulse" />
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-xs">
              Uploading: {uploadProgress.name}
            </p>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress.percent}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1.5">
              {uploadProgress.percent}%
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {isDragging
                ? 'Drop file to upload'
                : 'Drop files here or click to browse'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Documents, design files, code, images, and media up to 50 MB
            </p>
          </div>
        )}
      </div>

      {/* Search, sorting and filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={localSearch}
              onChange={(event) => setLocalSearch(event.target.value)}
              placeholder="Search by filename, uploader, or context..."
              className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => setLocalSearch('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
            <span className="text-slate-400 font-medium">Sort:</span>
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(event) => {
                const [field, order] = event.target.value.split('-');
                setSortField(field);
                setSortOrder(order);
              }}
              className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="size-desc">Largest first</option>
              <option value="size-asc">Smallest first</option>
              <option value="sender-asc">Uploader (A-Z)</option>
              <option value="sender-desc">Uploader (Z-A)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1 shrink-0">
            Type:
          </span>

          {fileTypes.map((type) => {
            const count =
              type === 'All'
                ? currentFiles.length
                : currentFiles.filter(
                    (file) =>
                      (file.type || 'document').toLowerCase() ===
                      type.toLowerCase()
                  ).length;

            const isSelected = selectedType === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap ${
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span>{type}</span>
                <span className="text-[10px] opacity-80">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Files table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading your files...
          </div>
        ) : sortedFiles.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={FolderOpen}
              title="No matching files found"
              description={
                effectiveQuery
                  ? `No files matched "${effectiveQuery}".`
                  : selectedType !== 'All'
                    ? `No files found in the "${selectedType}" category.`
                    : 'Upload a file to get started.'
              }
              actionLabel={
                effectiveQuery || selectedType !== 'All'
                  ? 'Reset filters'
                  : undefined
              }
              onAction={() => {
                setLocalSearch('');
                setSelectedType('All');
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th
                    className="py-3 px-4 cursor-pointer"
                    onClick={() => toggleSort('name')}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      File name
                      {sortField === 'name' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3" />
                      )}
                    </span>
                  </th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Origin</th>
                  <th
                    className="py-3 px-4 cursor-pointer"
                    onClick={() => toggleSort('size')}
                  >
                    Size
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer"
                    onClick={() => toggleSort('sender')}
                  >
                    Uploader
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer"
                    onClick={() => toggleSort('date')}
                  >
                    Date
                  </th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedFiles.map((file) => (
                  <tr
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                          {getFileIcon(file.type)}
                        </div>
                        <span className="truncate max-w-xs">
                          {file.name}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                        {file.type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {file.relatedContext ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onNavigateTab?.(
                              file.relatedContext.type === 'email'
                                ? 'inbox'
                                : 'chat'
                            );
                          }}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs bg-slate-50 dark:bg-slate-800"
                        >
                          {file.relatedContext.type === 'email' ? (
                            <Mail className="w-3.5 h-3.5" />
                          ) : (
                            <MessageSquare className="w-3.5 h-3.5" />
                          )}
                          <span className="truncate">
                            {file.relatedContext.title}
                          </span>
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      {file.size}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {(file.sharedBy || 'You')
                            .split(' ')
                            .map((part) => part[0])
                            .join('')
                            .slice(0, 2)}
                        </div>
                        <span className="truncate">
                          {file.sharedBy || 'You'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-xs">
                      {file.updatedAt}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedFile(file);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          title="Preview details"
                          aria-label={`Preview ${file.name}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          disabled={busyFileId === file.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDownloadFile(file);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 disabled:opacity-50"
                          title="Download"
                          aria-label={`Download ${file.name}`}
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          disabled={busyFileId === file.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteFile(file.id, file.name);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 disabled:opacity-50"
                          title="Delete"
                          aria-label={`Delete ${file.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* File preview drawer */}
      {selectedFile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="File details"
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 dark:bg-black/60"
        >
          <button
            type="button"
            className="absolute inset-0 w-full h-full cursor-default"
            onClick={() => setSelectedFile(null)}
            aria-label="Close file preview"
          />

          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col z-10">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                File details
              </span>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label="Close file preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
              <div className="p-4 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 mb-3">
                {getFileIcon(selectedFile.type)}
              </div>

              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white break-all">
                {selectedFile.name}
              </h2>

              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                  {selectedFile.type}
                </span>
                <span className="text-xs text-slate-400">
                  {selectedFile.size}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full mt-6">
                <button
                  type="button"
                  disabled={busyFileId === selectedFile.id}
                  onClick={() => handleDownloadFile(selectedFile)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShareInfo(selectedFile)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  title="Share file"
                  aria-label="Share file"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={busyFileId === selectedFile.id}
                  onClick={() =>
                    handleDeleteFile(
                      selectedFile.id,
                      selectedFile.name
                    )
                  }
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 disabled:opacity-50"
                  title="Delete file"
                  aria-label="Delete file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  File information
                </h3>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Uploader
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-white text-right">
                      {selectedFile.sharedBy || 'You'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Uploaded
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 text-right">
                      {selectedFile.updatedAt}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">File size</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {selectedFile.size}
                    </span>
                  </div>

                  {selectedFile.mimeType && (
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-slate-500">Format</span>
                      <span className="text-slate-800 dark:text-slate-200 text-right break-all">
                        {selectedFile.mimeType}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {selectedFile.relatedContext && (
                <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
                  <h3 className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    {selectedFile.relatedContext.type === 'email' ? (
                      <Mail className="w-3.5 h-3.5" />
                    ) : (
                      <MessageSquare className="w-3.5 h-3.5" />
                    )}
                    Associated{' '}
                    {selectedFile.relatedContext.type === 'email'
                      ? 'Email Thread'
                      : 'Chat'}
                  </h3>

                  <p className="font-semibold text-slate-800 dark:text-white">
                    {selectedFile.relatedContext.title}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      onNavigateTab?.(
                        selectedFile.relatedContext.type === 'email'
                          ? 'inbox'
                          : 'chat'
                      );
                      setSelectedFile(null);
                    }}
                    className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400"
                  >
                    View in{' '}
                    {selectedFile.relatedContext.type === 'email'
                      ? 'Inbox'
                      : 'Chat'}
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>
                  File preview and public sharing links are not configured.
                  Use Download to retrieve the original file.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};