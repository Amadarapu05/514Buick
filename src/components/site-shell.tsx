import { Navbar } from "@/components/navbar";

export function SiteShell({
  children,
  hideNav = false,
}: {
  children: React.ReactNode;
  hideNav?: boolean;
}) {
  return (
    <>
      {!hideNav && <Navbar />}
      <main className={hideNav ? "min-h-screen" : "min-h-screen pt-14"}>
        {children}
      </main>
    </>
  );
}
