// client/src/components/ui/MobileNav.tsx
// Public-facing mobile bottom nav (for landing/marketing pages)

import { Link, useLocation } from 'wouter';
import { Home, Tag, BookOpen, User } from 'lucide-react';

interface MobileNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: MobileNavItem[] = [
  { label: 'Home', href: '/', icon: <Home className="w-5 h-5" /> },
  { label: 'Pricing', href: '/pricing', icon: <Tag className="w-5 h-5" /> },
  { label: 'Blog', href: '/blog', icon: <BookOpen className="w-5 h-5" /> },
  { label: 'Sign In', href: '/login', icon: <User className="w-5 h-5" /> },
];

export function PublicMobileNav() {
  const [location] = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 pb-safe"
      style={{
        background: 'rgba(10,10,10,0.95)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.label} href={item.href}>
              <button
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                  isActive
                    ? 'text-amber-500'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
