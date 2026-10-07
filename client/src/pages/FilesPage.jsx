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
  Check,
  CheckCircle2,
  AlertCircle,
  Eye,
  Clock,
  User,
  Sparkles,
  FolderOpen
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { EmptyState } from '../components/common/EmptyState';

export const FilesPage = ({
  files,
  onUpdateFiles,
  searchQuery = '',
  onNavigateTab
}) => {
  const [selectedType, setSelectedType] = useState('All');
  const [localSearch, setLocalSearch] = useState('');
  const [sortField, setSortField] = useState('date'); // 'name' | 'date' | 'size' | 'sender'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // null | { name, percent }

  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  // Close preview drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedFile) {
        setSelectedFile(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFile]);

  const fileTypes = ['All', 'document', 'design', 'code', 'image'];

  // Combined search query
  const effectiveQuery = (localSearch || searchQuery).trim().toLowerCase();

  // Filtered files
  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const matchesType =
        selectedType === 'All' ||
        f.type.toLowerCase() === selectedType.toLowerCase();

      if (!effectiveQuery) return matchesType;

      const matchesSearch =
        f.name.toLowerCase().includes(effectiveQuery) ||
        f.sharedBy.toLowerCase().includes(effectiveQuery) ||
        f.type.toLowerCase().includes(effectiveQuery) ||
        (f.relatedContext?.title &&
          f.relatedContext.title.toLowerCase().includes(effectiveQuery));

      return matchesType && matchesSearch;
    });
  }, [files, selectedType, effectiveQuery]);

  // Sorted files
  const sortedFiles = useMemo(() => {
    return [...filteredFiles].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'sender') {
        comparison = a.sharedBy.localeCompare(b.sharedBy);
      } else if (sortField === 'size') {
        const sizeA = a.sizeBytes || 0;
        const sizeB = b.sizeBytes || 0;
        comparison = sizeA - sizeB;
      } else if (sortField === 'date') {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        comparison = dateA - dateB;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredFiles, sortField, sortOrder]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getFileIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'document':
        return <FileText className="w-5 h-5 text-indigo-600" />;
      case 'design':
        return <Layers className="w-5 h-5 text-pink-600" />;
      case 'code':
        return <FileCode className="w-5 h-5 text-emerald-600" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-purple-600" />;
      case 'media':
        return <Film className="w-5 h-5 text-amber-500" />;
      default:
        return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  // Drag and drop events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processSimulatedFile = (file) => {
    setIsDragging(false);
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    let inferredType = 'document';
    if (['fig', 'sketch', 'psd', 'ai'].includes(ext)) inferredType = 'design';
    if (['js', 'jsx', 'ts', 'tsx', 'json', 'md', 'html', 'css'].includes(ext))
      inferredType = 'code';
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext))
      inferredType = 'image';

    setUploadProgress({ name: file.name, percent: 15 });

    // Simulate animated upload progression
    const interval = setInterval(() => {
      setUploadProgress((curr) => {
        if (!curr) return null;
        if (curr.percent >= 90) {
          clearInterval(interval);
          return { ...curr, percent: 100 };
        }
        return { ...curr, percent: curr.percent + 25 };
      });
    }, 250);

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(null);

      const newFile = {
        id: `f-${Date.now()}`,
        name: file.name,
        size: `${(file.size / (1024 * 1024) > 1
          ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
          : (file.size / 1024).toFixed(0) + ' KB')}`,
        sizeBytes: file.size,
        type: inferredType,
        updatedAt: 'Just now',
        date: new Date().toISOString(),
        sharedBy: 'Alex Rivera',
        relatedContext: {
          type: 'chat',
          title: '#frontend-core',
          snippet: 'Uploaded locally to Relay'
        },
        previewSnippet: `Locally staged file (${file.name}). Simulated upload placeholder.`
      };

      if (onUpdateFiles) {
        onUpdateFiles((prev) => [newFile, ...prev]);
      }

      addToast({
        title: 'File Uploaded',
        message: `Added "${file.name}" to files list (Simulation only)`,
        type: 'success'
      });
    }, 1400);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSimulatedFile(e.dataTransfer.files[0]);
    }
  };

  const handleManualUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      processSimulatedFile(e.target.files[0]);
    }
  };

  // Delete file
  const handleDeleteFile = (fileId, fileName) => {
    if (onUpdateFiles) {
      onUpdateFiles((prev) => prev.filter((f) => f.id !== fileId));
    }
    if (selectedFile?.id === fileId) {
      setSelectedFile(null);
    }
    addToast({
      title: 'File Deleted',
      message: `Deleted "${fileName}".`,
      type: 'trash'
    });
  };

  return (
    <div
      className="flex flex-col h-full overflow-y-auto bg-slate-50/50 p-4 sm:p-6 lg:p-8 text-slate-800"
      role="region"
      aria-label="Shared Files & Media"
    >
      {/* Header & Storage Quota */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Shared Files & Media
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Collaborative attachments and assets linked across Relay conversations and email threads.
          </p>
        </div>

        {/* Storage Bar Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs w-full md:w-80">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
              Relay Simulated Storage
            </span>
            <span className="text-slate-400 font-normal">24.5 / 50 GB</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-indigo-600 h-2 rounded-full w-[49%]" />
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">
            Local session allocation • 51% available
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          DRAG & DROP UPLOAD ZONE (UI-ONLY PLACEHOLDER STATE)
      ─────────────────────────────────────────────────────────────── */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative mb-6 border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer bg-white ${
          isDragging
            ? 'border-indigo-600 bg-indigo-50/50 scale-[1.008]'
            : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleManualUpload}
          className="hidden"
          aria-label="Upload files"
        />

        {uploadProgress ? (
          <div className="flex flex-col items-center justify-center max-w-sm mx-auto pointer-events-none">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 animate-pulse">
              <UploadCloud className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-900 truncate max-w-xs">
              Simulating upload: {uploadProgress.name}
            </p>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.percent}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1.5">
              {uploadProgress.percent}% completed (UI-only simulation)
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pointer-events-none">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 transition-transform ${
                isDragging ? 'bg-indigo-600 text-white scale-110' : 'bg-indigo-50 text-indigo-600'
              }`}
            >
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-900">
              {isDragging ? 'Drop file to stage local preview' : 'Drop files here or click to browse'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Supports documents, design binaries, code files, and images up to 50MB
            </p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              Client-side simulation only — files are not stored on remote servers
            </span>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SEARCH, TYPE FILTER TABS, AND SORT CONTROLS
      ─────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by filename, author, or context..."
              className="w-full pl-9 pr-9 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 placeholder-slate-400 transition-all"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => setLocalSearch('')}
                className="absolute right-3 top-2 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort By Dropdown (for mobile/tablet convenience) */}
          <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
            <span className="text-slate-400 font-medium text-[11px]">Sort:</span>
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortField(field);
                setSortOrder(order);
              }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="size-desc">Size (Largest)</option>
              <option value="size-asc">Size (Smallest)</option>
              <option value="sender-asc">Sender (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Type Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1 shrink-0">
            File Type:
          </span>
          {fileTypes.map((type) => {
            const isSelected = selectedType === type;
            const count =
              type === 'All'
                ? files.length
                : files.filter((f) => f.type.toLowerCase() === type.toLowerCase()).length;

            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <span>{type}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          FILES DATA TABLE (WITH SORTABLE HEADERS)
      ─────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        {sortedFiles.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={FolderOpen}
              title="No matching files found"
              description={
                effectiveQuery
                  ? `No files matched "${effectiveQuery}".`
                  : selectedType !== 'All'
                  ? `No files found in the "${selectedType}" category.`
                  : 'No files are currently stored in your workspace.'
              }
              actionLabel={effectiveQuery || selectedType !== 'All' ? 'Reset filters' : undefined}
              onAction={() => {
                setLocalSearch('');
                setSelectedType('All');
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider select-none">
                <tr>
                  {/* Name column */}
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-slate-800 transition-colors"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>File Name</span>
                      {sortField === 'name' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                  </th>

                  {/* Type column */}
                  <th className="py-3 px-4">Type</th>

                  {/* Related Context column */}
                  <th className="py-3 px-4">Origin / Context</th>

                  {/* Size column */}
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-slate-800 transition-colors"
                    onClick={() => toggleSort('size')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Size</span>
                      {sortField === 'size' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                  </th>

                  {/* Sender column */}
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-slate-800 transition-colors"
                    onClick={() => toggleSort('sender')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Shared By</span>
                      {sortField === 'sender' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                  </th>

                  {/* Date column */}
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-slate-800 transition-colors"
                    onClick={() => toggleSort('date')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Date</span>
                      {sortField === 'date' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                  </th>

                  {/* Actions */}
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sortedFiles.map((file) => (
                  <tr
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Name & Icon */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-slate-100 shrink-0 group-hover:bg-indigo-50 transition-colors">
                          {getFileIcon(file.type)}
                        </div>
                        <span className="truncate max-w-xs group-hover:text-indigo-600 transition-colors">
                          {file.name}
                        </span>
                      </div>
                    </td>

                    {/* Type badge */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 capitalize">
                        {file.type}
                      </span>
                    </td>

                    {/* Origin / Context */}
                    <td className="py-3.5 px-4">
                      {file.relatedContext ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onNavigateTab) {
                              onNavigateTab(file.relatedContext.type === 'email' ? 'inbox' : 'chat');
                            }
                          }}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition-colors max-w-xs truncate"
                          title={`Navigate to ${file.relatedContext.type}: ${file.relatedContext.title}`}
                        >
                          {file.relatedContext.type === 'email' ? (
                            <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          ) : (
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          )}
                          <span className="truncate">{file.relatedContext.title}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Size */}
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {file.size}
                    </td>

                    {/* Shared By */}
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {file.sharedBy.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <span className="truncate">{file.sharedBy}</span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-400 text-xs">
                      {file.updatedAt}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(file);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Preview details"
                          aria-label={`Preview ${file.name}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToast({
                              title: 'Download Started',
                              message: `Simulating download of "${file.name}"...`,
                              type: 'info'
                            });
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                          title="Download"
                          aria-label={`Download ${file.name}`}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFile(file.id, file.name);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
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

      {/* ─────────────────────────────────────────────────────────────
          FILE PREVIEW & DETAILS DRAWER (SLIDE-OVER)
      ─────────────────────────────────────────────────────────────── */}
      {selectedFile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="File preview drawer"
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs"
        >
          <div
            className="fixed inset-0"
            onClick={() => setSelectedFile(null)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                File Details & Preview
              </span>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Close file preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* File Icon & Info Hero */}
            <div className="p-6 border-b border-slate-100 flex flex-col items-center text-center">
              <div className="p-4 rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-600 mb-3 shadow-xs">
                {getFileIcon(selectedFile.type)}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-sm">
                {selectedFile.name}
              </h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 capitalize">
                  {selectedFile.type}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {selectedFile.size}
                </span>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 w-full mt-6">
                <button
                  type="button"
                  onClick={() =>
                    addToast({
                      title: 'Download Started',
                      message: `Simulating download of "${selectedFile.name}"...`,
                      type: 'info'
                    })
                  }
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    addToast({
                      title: 'Link Copied',
                      message: `Simulated shareable link copied for "${selectedFile.name}"!`,
                      type: 'info'
                    })
                  }
                  className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  title="Share link"
                  aria-label="Share file"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteFile(selectedFile.id, selectedFile.name)}
                  className="p-2.5 rounded-xl border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Delete file"
                  aria-label="Delete file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Preview & Meta Details */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Content Preview Box */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Sample Content Preview
                </h3>
                <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed overflow-x-auto shadow-2xs">
                  {selectedFile.previewSnippet ||
                    `Binary payload for ${selectedFile.name}. Rendering sample mock representation.`}
                </div>
              </div>

              {/* Origin / Association Details */}
              {selectedFile.relatedContext && (
                <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
                  <h3 className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    {selectedFile.relatedContext.type === 'email' ? (
                      <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    ) : (
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    <span>Associated {selectedFile.relatedContext.type === 'email' ? 'Email Thread' : 'Chat Channel'}</span>
                  </h3>
                  <p className="font-semibold text-slate-800">
                    {selectedFile.relatedContext.title}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {selectedFile.relatedContext.snippet}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateTab) {
                        onNavigateTab(selectedFile.relatedContext.type === 'email' ? 'inbox' : 'chat');
                        setSelectedFile(null);
                      }
                    }}
                    className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    <span>View in {selectedFile.relatedContext.type === 'email' ? 'Inbox' : 'Chat'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Metadata list */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Metadata
                </h3>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <User className="w-3.5 h-3.5" /> Uploader
                  </span>
                  <span className="font-semibold text-slate-800">{selectedFile.sharedBy}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5" /> Date Modified
                  </span>
                  <span>{selectedFile.updatedAt}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400">Security Scan</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified Clean
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
