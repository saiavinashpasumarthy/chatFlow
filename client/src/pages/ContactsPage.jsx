import React, { useEffect, useMemo, useState } from "react";
import {
  Mail,
  MessageSquare,
  Phone,
  Building,
  Search,
  X,
  MapPin,
  Clock,
  LayoutGrid,
  ListFilter,
  ChevronRight,
  Users,
} from "lucide-react";

import { useToast } from "../context/ToastContext";
import { EmptyState } from "../components/common/EmptyState";
import { createConversation } from "../services/api";

export const ContactsPage = ({
  contacts = [],
  searchQuery = "",
  onStartChat,
  onSendEmail,
}) => {
  const [selectedDept, setSelectedDept] = useState("All");
  const [localSearch, setLocalSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedContact, setSelectedContact] = useState(null);

  const { addToast } = useToast();

  // Close profile drawer on Escape
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && selectedContact) {
        setSelectedContact(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedContact]);

  // Extract departments from real contacts
  const departments = useMemo(() => {
    const departmentSet = new Set();

    contacts.forEach((contact) => {
      if (contact.department) {
        departmentSet.add(contact.department);
      }
    });

    return ["All", ...Array.from(departmentSet)];
  }, [contacts]);

  const effectiveQuery = (localSearch || searchQuery)
    .trim()
    .toLowerCase();

  // Filter real contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const department = contact.department || "";
      const name = contact.name || "";
      const email = contact.email || "";
      const role = contact.role || "";
      const location = contact.location || "";

      const matchesDept =
        selectedDept === "All" ||
        department.toLowerCase() === selectedDept.toLowerCase();

      if (!effectiveQuery) {
        return matchesDept;
      }

      const matchesSearch =
        name.toLowerCase().includes(effectiveQuery) ||
        email.toLowerCase().includes(effectiveQuery) ||
        department.toLowerCase().includes(effectiveQuery) ||
        role.toLowerCase().includes(effectiveQuery) ||
        location.toLowerCase().includes(effectiveQuery);

      return matchesDept && matchesSearch;
    });
  }, [contacts, selectedDept, effectiveQuery]);

  // Group contacts by department
  const groupedContacts = useMemo(() => {
    const groups = {};

    filteredContacts.forEach((contact) => {
      const department = contact.department || "Other";

      if (!groups[department]) {
        groups[department] = [];
      }

      groups[department].push(contact);
    });

    return groups;
  }, [filteredContacts]);

  const getStatusInfo = (status) => {
    switch (status) {
      case "online":
        return {
          dotColor: "bg-emerald-500",
          textColor:
            "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
          label: "Online",
        };

      case "away":
        return {
          dotColor: "bg-amber-400",
          textColor:
            "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
          label: "Away",
        };

      default:
        return {
          dotColor: "bg-slate-300 dark:bg-slate-600",
          textColor:
            "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
          label: "Offline",
        };
    }
  };

  // Open an existing conversation or create a real Firebase conversation
  const handleStartChat = async (contact) => {
    if (!contact?.email) {
      addToast({
        title: "Chat Failed",
        message: "This contact does not have an email address.",
        type: "error",
      });

      return;
    }

    try {
      const data = await createConversation({
        memberEmail: contact.email,
        type: "direct",
      });

      const conversation = data.conversation;

      addToast({
        title: data.existing ? "Chat Opened" : "Chat Created",
        message: data.existing
          ? `Opened your conversation with ${contact.name}`
          : `Started a new conversation with ${contact.name}`,
        type: "success",
      });

      if (onStartChat) {
        onStartChat(contact, conversation.id);
      }

      setSelectedContact(null);
    } catch (error) {
      console.error("Start chat error:", error);

      addToast({
        title: "Chat Failed",
        message: error.message || "Unable to start conversation.",
        type: "error",
      });
    }
  };

  return (
    <div
      className="flex flex-col h-full overflow-y-auto bg-slate-50/50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 text-slate-800 dark:text-slate-100"
      role="region"
      aria-label="Contacts Directory"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              People & Contacts
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Directory of teammates, departments, and communication channels
            across Relay.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-2xs self-start md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === "grid"
                ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-semibold"
                : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
            title="Grid View"
            aria-label="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setViewMode("grouped")}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === "grouped"
                ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-semibold"
                : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
            title="Group by Department"
            aria-label="Group by Department"
          >
            <ListFilter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search and Department Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 mb-6 shadow-2xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />

          <input
            type="text"
            value={localSearch}
            onChange={(event) => setLocalSearch(event.target.value)}
            placeholder="Search by name, email, department, or role..."
            className="w-full pl-10 pr-10 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 transition-all"
          />

          {localSearch && (
            <button
              type="button"
              onClick={() => setLocalSearch("")}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              aria-label="Clear contact search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1 shrink-0">
            Department:
          </span>

          {departments.map((dept) => {
            const isSelected = selectedDept === dept;

            const count =
              dept === "All"
                ? contacts.length
                : contacts.filter(
                    (contact) => contact.department === dept
                  ).length;

            return (
              <button
                key={dept}
                type="button"
                onClick={() => setSelectedDept(dept)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>{dept}</span>

                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected
                      ? "bg-indigo-700 text-white"
                      : "bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contacts */}
      {filteredContacts.length === 0 ? (
        <div className="py-6">
          <EmptyState
            icon={Users}
            title="No contacts found"
            description={
              effectiveQuery
                ? `No contacts matched "${effectiveQuery}".`
                : selectedDept !== "All"
                ? `No contacts found in the ${selectedDept} department.`
                : "No contacts are currently registered in the directory."
            }
            actionLabel={
              effectiveQuery || selectedDept !== "All"
                ? "Reset filters"
                : undefined
            }
            onAction={
              effectiveQuery || selectedDept !== "All"
                ? () => {
                    setLocalSearch("");
                    setSelectedDept("All");
                  }
                : undefined
            }
          />
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              getStatusInfo={getStatusInfo}
              onSelect={() => setSelectedContact(contact)}
              onSendEmail={onSendEmail}
              onStartChat={handleStartChat}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedContacts).map(
            ([department, deptContacts]) => (
              <div key={department} className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />

                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      {department}
                    </h2>

                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {deptContacts.length}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {deptContacts.map((contact) => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      getStatusInfo={getStatusInfo}
                      onSelect={() => setSelectedContact(contact)}
                      onSendEmail={onSendEmail}
                      onStartChat={handleStartChat}
                    />
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Contact Details Drawer */}
      {selectedContact && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Contact profile drawer"
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs"
        >
          <div
            className="fixed inset-0"
            onClick={() => setSelectedContact(null)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/80">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Contact Profile
              </span>

              <button
                type="button"
                onClick={() => setSelectedContact(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                aria-label="Close profile drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Hero */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 text-center flex flex-col items-center">
              <div className="relative mb-3">
                <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-2xl flex items-center justify-center shadow-xs">
                  {selectedContact.name
                    ?.split(" ")
                    .map((name) => name[0])
                    .join("") || "?"}
                </div>

                <span
                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ring-4 ring-white dark:ring-slate-900 ${
                    getStatusInfo(selectedContact.status).dotColor
                  }`}
                  title={`Status: ${selectedContact.status || "offline"}`}
                />
              </div>

              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {selectedContact.name}
              </h2>

              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {selectedContact.role || "Team Member"}
              </p>

              <div className="flex items-center gap-2 mt-2">
                {selectedContact.department && (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {selectedContact.department}
                  </span>
                )}

                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    getStatusInfo(selectedContact.status).textColor
                  }`}
                >
                  {getStatusInfo(selectedContact.status).label}
                </span>
              </div>

              {/* Primary Actions */}
              <div className="flex items-center gap-3 w-full mt-6">
                <button
                  type="button"
                  onClick={() => {
                    if (onSendEmail) {
                      onSendEmail(selectedContact.email);
                    }

                    setSelectedContact(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <Mail className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Send Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStartChat(selectedContact)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Start Chat</span>
                </button>
              </div>
            </div>

            {/* Profile Details */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {selectedContact.bio && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    About
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    {selectedContact.bio}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Contact Information
                </h3>

                <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-200">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400">
                      Email Address
                    </p>

                    <p className="font-medium truncate">
                      {selectedContact.email}
                    </p>
                  </div>
                </div>

                {selectedContact.phone && (
                  <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-200">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400">
                        Direct Phone
                      </p>

                      <p className="font-medium truncate">
                        {selectedContact.phone}
                      </p>
                    </div>
                  </div>
                )}

                {selectedContact.location && (
                  <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-200">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      <MapPin className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400">
                        Timezone & Location
                      </p>

                      <p className="font-medium truncate">
                        {selectedContact.location}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {selectedContact.recentActivity && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Recent Activity
                  </h3>

                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 text-xs text-slate-700 dark:text-slate-300">
                    <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />

                    <p className="leading-relaxed">
                      {selectedContact.recentActivity}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Individual Contact Card
const ContactCard = ({
  contact,
  getStatusInfo,
  onSelect,
  onSendEmail,
  onStartChat,
}) => {
  const statusInfo = getStatusInfo(contact.status);

  const initials =
    contact.name
      ?.split(" ")
      .map((name) => name[0])
      .join("") || "?";

  return (
    <div
      role="article"
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group focus-within:ring-2 focus-within:ring-indigo-500"
    >
      <div>
        {/* Top */}
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex items-center gap-3 cursor-pointer min-w-0"
            onClick={onSelect}
          >
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-sm flex items-center justify-center shadow-2xs group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/60 transition-colors">
                {initials}
              </div>

              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${statusInfo.dotColor}`}
                title={`Status: ${contact.status || "offline"}`}
              />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                {contact.name}
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                {contact.role || "Team Member"}
              </p>
            </div>
          </div>

          {contact.department && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize shrink-0">
              {contact.department}
            </span>
          )}
        </div>

        {/* Contact Information */}
        <div className="mt-4 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 truncate">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{contact.email}</span>
          </div>

          {contact.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{contact.phone}</span>
            </div>
          )}

          {contact.location && (
            <div className="flex items-center gap-2 truncate text-slate-400 text-[11px]">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{contact.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSendEmail(contact.email)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label={`Send email to ${contact.name}`}
        >
          <Mail className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>Email</span>
        </button>

        <button
          type="button"
          onClick={() => onStartChat(contact)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-transparent dark:border-indigo-800/60 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label={`Start chat with ${contact.name}`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Message</span>
        </button>

        <button
          type="button"
          onClick={onSelect}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="View profile details"
          aria-label={`View profile for ${contact.name}`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};