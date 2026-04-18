import { createFileRoute } from "@tanstack/react-router";
import {
  authenticateRequest,
  ensureUserInSupabase,
} from "@/lib/server/clerk";
import { createServerSupabaseClient } from "@/lib/supabase";

export const Route = createFileRoute("/api/resumes")({
  server: {
    handlers: {
      // GET /api/resumes — list all resumes for the authenticated user
      GET: async ({ request }) => {
        const clerkUser = await authenticateRequest(request);
        if (!clerkUser) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const supabase = createServerSupabaseClient();
          const userId = await ensureUserInSupabase(clerkUser, supabase);
          if (!userId) {
            return new Response(
              JSON.stringify({ error: "Failed to get user" }),
              {
                status: 500,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          const { data: resumes, error } = await supabase
            .from("resumes")
            .select("*")
            .eq("user_id", userId)
            .order("updated_at", { ascending: false });

          if (error) throw error;

          return new Response(JSON.stringify({ resumes }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("GET /api/resumes error:", error);
          return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },

      // POST /api/resumes — create or update a resume
      POST: async ({ request }) => {
        const clerkUser = await authenticateRequest(request);
        if (!clerkUser) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const body = await request.json();
          const { id, title, data, template_id } = body;

          if (!id || !data) {
            return new Response(
              JSON.stringify({ error: "Missing required fields: id, data" }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          const supabase = createServerSupabaseClient();
          const userId = await ensureUserInSupabase(clerkUser, supabase);
          if (!userId) {
            return new Response(
              JSON.stringify({ error: "Failed to get user" }),
              {
                status: 500,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          // Check resume count for free tier (1 resume limit)
          const { count } = await supabase
            .from("resumes")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId);

          // Check if this resume already exists (update vs create)
          const { data: existing } = await supabase
            .from("resumes")
            .select("id")
            .eq("id", id)
            .eq("user_id", userId)
            .single();

          if (!existing && (count || 0) >= 1) {
            // Check user plan
            const { data: user } = await supabase
              .from("users")
              .select("plan")
              .eq("id", userId)
              .single();

            if (user?.plan === "free") {
              return new Response(
                JSON.stringify({
                  error: "Free plan limited to 1 resume. Upgrade to Pro for unlimited resumes.",
                  code: "PLAN_LIMIT",
                }),
                {
                  status: 403,
                  headers: { "Content-Type": "application/json" },
                }
              );
            }
          }

          // Upsert resume
          const { data: resume, error } = await supabase
            .from("resumes")
            .upsert(
              {
                id,
                user_id: userId,
                title: title || "Untitled Resume",
                data,
                template_id: template_id || null,
              },
              { onConflict: "id" }
            )
            .select()
            .single();

          if (error) throw error;

          return new Response(JSON.stringify({ resume }), {
            status: existing ? 200 : 201,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("POST /api/resumes error:", error);
          return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },

      // DELETE /api/resumes?id=xxx — delete a resume
      DELETE: async ({ request }) => {
        const clerkUser = await authenticateRequest(request);
        if (!clerkUser) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const url = new URL(request.url);
          const resumeId = url.searchParams.get("id");

          if (!resumeId) {
            return new Response(
              JSON.stringify({ error: "Missing resume id" }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          const supabase = createServerSupabaseClient();
          const userId = await ensureUserInSupabase(clerkUser, supabase);
          if (!userId) {
            return new Response(
              JSON.stringify({ error: "Failed to get user" }),
              {
                status: 500,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          const { error } = await supabase
            .from("resumes")
            .delete()
            .eq("id", resumeId)
            .eq("user_id", userId);

          if (error) throw error;

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("DELETE /api/resumes error:", error);
          return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
