import { SiteShell } from "@/components/site-shell";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteShell>{children}</SiteShell>;
}
