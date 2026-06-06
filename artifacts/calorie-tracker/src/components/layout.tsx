import { Link, useLocation } from "wouter";
import { Home, Calendar as CalendarIcon, Settings, Bookmark } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Today" },
    { path: "/calendar", icon: CalendarIcon, label: "Calendar" },
    { path: "/saved", icon: Bookmark, label: "Saved" },
    { path: "/settings", icon: Settings, label: "Settings" }
  ];

  const isActive = (path: string) => {
    if (path === "/calendar") return location === "/calendar" || location.startsWith('/day/');
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <div className="min-h-[100dvh] pb-[calc(4rem+env(safe-area-inset-bottom))] bg-gray-50 flex flex-col">
      <main className="flex-1 w-full max-w-lg mx-auto bg-white shadow-sm overflow-hidden flex flex-col">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)] z-50">
        <div className="w-full max-w-lg mx-auto flex justify-around items-center h-16">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${active ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <item.icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
