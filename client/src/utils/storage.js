const EMAIL_STORAGE_KEY = 'relay_emails_v1';
const DRAFT_STORAGE_KEY = 'relay_active_draft_v1';

export function loadStoredEmails(fallback) {
  try {
    const raw = localStorage.getItem(EMAIL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read emails from localStorage:', err);
  }
  return fallback;
}

export function saveStoredEmails(emails) {
  try {
    localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(emails));
  } catch (err) {
    console.error('Failed to save emails to localStorage:', err);
  }
}

export function loadStoredDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to read draft from localStorage:', err);
  }
  return null;
}

export function saveStoredDraft(draft) {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch (err) {
    console.error('Failed to save draft to localStorage:', err);
  }
}

export function clearStoredDraft() {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear draft from localStorage:', err);
  }
}
