/**
 * Server sync bridge for the resume store.
 * Manages debounced sync to Supabase when user is authenticated.
 * localStorage remains the primary store — server is backup/cloud sync.
 */
import { saveResumeToServer, deleteResumeFromServer } from "./resumeServerSync";
import { ResumeData } from "@/types/resume";

// Current user ID — set by AuthProvider on login, cleared on logout
let currentUserId: string | null = null;

export function setSyncUserId(userId: string | null) {
  currentUserId = userId;
}

export function getSyncUserId(): string | null {
  return currentUserId;
}

// Debounced server sync — 3s debounce to batch rapid edits
let serverSyncTimer: ReturnType<typeof setTimeout> | null = null;
let pendingResume: ResumeData | null = null;

export function debouncedSyncToServer(resume: ResumeData) {
  if (!currentUserId) return; // Not logged in — skip silently

  pendingResume = resume;
  if (serverSyncTimer) clearTimeout(serverSyncTimer);

  serverSyncTimer = setTimeout(async () => {
    serverSyncTimer = null;
    if (pendingResume && currentUserId) {
      await saveResumeToServer(pendingResume, currentUserId);
      pendingResume = null;
    }
  }, 3000);
}

// Immediate sync (for create/delete — don't debounce these)
export function syncToServerImmediate(resume: ResumeData) {
  if (!currentUserId) return;
  saveResumeToServer(resume, currentUserId);
}

export function deleteFromServerImmediate(resumeId: string) {
  if (!currentUserId) return;
  deleteResumeFromServer(resumeId);
}
