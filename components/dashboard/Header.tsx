"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, RefreshCw, Menu, Bell } from "lucide-react";
import { getRoleLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  onRefresh?: () => void;
  lastUpdated?: Date;
  onMenuToggle?: () => void;
}

export function Header({ onRefresh, lastUpdated, onMenuToggle }: HeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        // Only get the count, don't generate (to avoid duplicates)
        const res = await fetch("/api/alerts");
        if (res.ok) {
          const alerts = await res.json();
          const unreadCount = alerts.filter((a: any) => !a.isRead && !a.isDismissed).length;
          setAlertCount(unreadCount);
        }
      } catch (error) {
        console.error("Error fetching alerts:", error);
      }
    };

    fetchAlertCount();
    // Refresh alert count every minute
    const interval = setInterval(fetchAlertCount, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "default";
      case "EDITOR":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuToggle}>
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-lg md:text-xl font-semibold truncate">
          Panel de Control
        </h1>
        {lastUpdated && (
          <span className="hidden sm:inline text-xs text-muted-foreground">
            Actualizado: {lastUpdated.toLocaleTimeString("es-GT")}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} className="hidden sm:flex">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        )}

        {/* Alert Bell */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => router.push("/dashboard/alertas")}
        >
          <Bell className="h-5 w-5" />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {alertCount > 9 ? "9+" : alertCount}
            </span>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {session?.user?.name ? getInitials(session.user.name) : "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-2">
                <p className="text-sm font-medium leading-none">
                  {session?.user?.name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session?.user?.email}
                </p>
                <Badge
                  variant={getRoleBadgeVariant(session?.user?.role || "")}
                  className="w-fit"
                >
                  {getRoleLabel(session?.user?.role || "")}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Mi Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
