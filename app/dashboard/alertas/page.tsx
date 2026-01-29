"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  AlertTriangle,
  Calendar,
  CreditCard,
  TrendingDown,
  Check,
  X,
  RefreshCw,
} from "lucide-react";

interface Alert {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  isDismissed: boolean;
  data: string | null;
  createdAt: string;
}

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    generateAndFetchAlerts();
  }, []);

  const generateAndFetchAlerts = async () => {
    try {
      // First generate any new alerts based on current data
      await fetch("/api/alerts/generate", { method: "POST" });
      // Then fetch all alerts
      await fetchAlerts();
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "unread") return !alert.isRead && !alert.isDismissed;
    return !alert.isDismissed;
  });

  const handleMarkAsRead = async (alertId: string) => {
    // Optimistic update
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a));

    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      if (!res.ok) {
        // Revert on error
        fetchAlerts();
      }
    } catch (error) {
      console.error("Error marking alert as read:", error);
      fetchAlerts();
    }
  };

  const handleDismiss = async (alertId: string) => {
    // Optimistic update
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isDismissed: true } : a));

    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDismissed: true }),
      });
      if (!res.ok) {
        // Revert on error
        fetchAlerts();
      }
    } catch (error) {
      console.error("Error dismissing alert:", error);
      fetchAlerts();
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "PAYMENT_DUE":
        return Calendar;
      case "HIGH_USAGE":
        return CreditCard;
      case "LOW_BALANCE":
        return TrendingDown;
      case "EXCESS_DEBT":
        return AlertTriangle;
      default:
        return Bell;
    }
  };

  const getAlertBadgeVariant = (type: string): "warning" | "destructive" | "secondary" | "default" => {
    switch (type) {
      case "PAYMENT_DUE":
        return "warning";
      case "HIGH_USAGE":
        return "destructive";
      case "LOW_BALANCE":
        return "secondary";
      case "EXCESS_DEBT":
        return "destructive";
      default:
        return "default";
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case "PAYMENT_DUE":
        return "Pago Próximo";
      case "HIGH_USAGE":
        return "Uso Alto";
      case "LOW_BALANCE":
        return "Saldo Bajo";
      case "EXCESS_DEBT":
        return "Deuda Alta";
      default:
        return type;
    }
  };

  const unreadCount = alerts.filter((a) => !a.isRead && !a.isDismissed).length;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Alertas
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} nuevas</Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            Notificaciones y avisos importantes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Todas
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unread")}
          >
            Sin leer
          </Button>
          <Button variant="outline" size="icon" onClick={fetchAlerts}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Alert Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-warning/20 p-2">
                <Calendar className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagos Próximos</p>
                <p className="text-2xl font-bold">
                  {alerts.filter((a) => a.type === "PAYMENT_DUE" && !a.isDismissed).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-destructive/20 p-2">
                <CreditCard className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Uso Alto</p>
                <p className="text-2xl font-bold">
                  {alerts.filter((a) => a.type === "HIGH_USAGE" && !a.isDismissed).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-secondary p-2">
                <TrendingDown className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo Bajo</p>
                <p className="text-2xl font-bold">
                  {alerts.filter((a) => a.type === "LOW_BALANCE" && !a.isDismissed).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-destructive/20 p-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deuda Alta</p>
                <p className="text-2xl font-bold">
                  {alerts.filter((a) => a.type === "EXCESS_DEBT" && !a.isDismissed).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {filter === "unread" ? "Alertas sin leer" : "Todas las alertas"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAlerts.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No hay alertas</h3>
              <p className="text-muted-foreground">
                {filter === "unread"
                  ? "No tienes alertas sin leer"
                  : "No hay alertas activas"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => {
                const Icon = getAlertIcon(alert.type);
                return (
                  <div
                    key={alert.id}
                    className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                      !alert.isRead
                        ? "bg-primary/5 border-primary/20"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`rounded-full p-2 ${
                          alert.type === "PAYMENT_DUE"
                            ? "bg-warning/20"
                            : alert.type === "HIGH_USAGE" ||
                              alert.type === "EXCESS_DEBT"
                            ? "bg-destructive/20"
                            : "bg-secondary"
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            alert.type === "PAYMENT_DUE"
                              ? "text-warning"
                              : alert.type === "HIGH_USAGE" ||
                                alert.type === "EXCESS_DEBT"
                              ? "text-destructive"
                              : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{alert.message}</p>
                          {!alert.isRead && (
                            <span className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getAlertBadgeVariant(alert.type)}>
                            {getAlertTypeLabel(alert.type)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(alert.createdAt).toLocaleDateString("es-GT", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!alert.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMarkAsRead(alert.id)}
                          title="Marcar como leída"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDismiss(alert.id)}
                        title="Descartar"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
