import { createFileRoute, Outlet } from "@tanstack/react-router";
import DashboardLayout from "@/app/app/dashboard/client";
import { AuthGuard } from "@/components/auth/AuthGuard";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex,nofollow" }]
  }),
  ssr: false,
  component: DashboardRouteLayout
});

function DashboardRouteLayout() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
    </AuthGuard>
  );
}
