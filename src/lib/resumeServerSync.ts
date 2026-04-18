/**
 * Resume server sync module.
 * Provides functions to sync resume data between Zustand store and Supabase.
 * Designed to be called from the resume store — keeps localStorage as offline cache.
 */
import { supabase } from "@/lib/supabase";
import { ResumeData } from "@/types/resume";

/**
 * Save a resume to the server.
 * Called on debounced updates from the store.
 */
export async function saveResumeToServer(
  resume: ResumeData,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from("resumes").upsert(
      {
        id: resume.id,
        user_id: userId,
        title: resume.title,
        data: resume as any,
        template_id: resume.templateId || null,
      },
      { onConflict: "id" }
    );

    if (error) {
      console.error("Failed to save resume to server:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Server sync error:", err);
    return false;
  }
}

/**
 * Delete a resume from the server.
 */
export async function deleteResumeFromServer(
  resumeId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("resumes")
      .delete()
      .eq("id", resumeId);

    if (error) {
      console.error("Failed to delete resume from server:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Server delete error:", err);
    return false;
  }
}

/**
 * Load all resumes from the server for a user.
 * Returns a Record<id, ResumeData> compatible with the store.
 */
export async function loadResumesFromServer(
  userId: string
): Promise<Record<string, ResumeData>> {
  try {
    const { data: resumes, error } = await supabase
      .from("resumes")
      .select("id, data")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Failed to load resumes from server:", error);
      return {};
    }

    const resumeMap: Record<string, ResumeData> = {};
    for (const row of resumes || []) {
      resumeMap[row.id] = row.data as unknown as ResumeData;
    }
    return resumeMap;
  } catch (err) {
    console.error("Server load error:", err);
    return {};
  }
}
