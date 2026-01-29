"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  Scale,
  FileBarChart,
  Bell,
  History,
  Users,
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Cuentas",
    href: "/dashboard/cuentas",
    icon: Wallet,
  },
  {
    title: "Transacciones",
    href: "/dashboard/transacciones",
    icon: ArrowRightLeft,
  },
  {
    title: "Hay vs Debo",
    href: "/dashboard/hay-vs-debo",
    icon: Scale,
  },
  {
    title: "Reportes",
    href: "/dashboard/reportes",
    icon: FileBarChart,
  },
  {
    title: "Flujo de Caja",
    href: "/dashboard/flujo-caja",
    icon: TrendingUp,
  },
  {
    title: "Alertas",
    href: "/dashboard/alertas",
    icon: Bell,
  },
  {
    title: "Historial",
    href: "/dashboard/historial",
    icon: History,
  },
  {
    title: "Bancos",
    href: "/dashboard/bancos",
    icon: Building2,
    adminOnly: true,
  },
  {
    title: "Usuarios",
    href: "/dashboard/usuarios",
    icon: Users,
    adminOnly: true,
  },
  {
    title: "Configuración",
    href: "/dashboard/configuracion",
    icon: Settings,
    adminOnly: true,
  },
];

interface SidebarProps {
  alertCount?: number;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ alertCount = 0, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const isAdmin = session?.user?.role === "ADMIN";

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  // Close mobile sidebar on navigation
  useEffect(() => {
    if (mobileOpen && onMobileClose) {
      onMobileClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Finanzas</span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Wallet className="h-5 w-5 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {filteredNavItems.map((item) => {
          const isActive = item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          const showBadge = item.href === "/dashboard/alertas" && alertCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                collapsed && "justify-center"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.title}</span>
                  {showBadge && (
                    <Badge variant="destructive" className="h-5 w-5 p-0 text-xs flex items-center justify-center">
                      {alertCount}
                    </Badge>
                  )}
                </>
              )}
              {collapsed && showBadge && (
                <span className="absolute right-1 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                  {alertCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Button - desktop only */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 hidden md:flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-accent"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "relative hidden md:flex flex-col border-r bg-card transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onMobileClose} />
          <aside className="relative flex flex-col w-64 h-full bg-card shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
