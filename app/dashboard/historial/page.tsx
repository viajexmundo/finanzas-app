"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  History,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  User,
  Calendar,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BalanceHistory {
  id: string;
  previousBalance: number;
  newBalance: number;
  notes: string | null;
  createdAt: string;
  account: {
    id: string;
    name: string;
    currency: "GTQ" | "USD";
    type: string;
  };
  user: {
    name: string;
  };
}

export default function HistorialPage() {
  const [history, setHistory] = useState<BalanceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [accountFilter, setAccountFilter] = useState<string>("all");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  // Demo history
  const demoHistory: BalanceHistory[] = history.length > 0 ? history : [
    {
      id: "1",
      previousBalance: 48000,
      newBalance: 50000,
      notes: "Depósito de ventas del día",
      createdAt: new Date().toISOString(),
      account: { id: "1", name: "Cuenta Monetaria BI", currency: "GTQ", type: "BANK" },
      user: { name: "Admin" },
    },
    {
      id: "2",
      previousBalance: 14000,
      newBalance: 12000,
      notes: "Pago parcial de tarjeta",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      account: { id: "2", name: "Visa BI", currency: "GTQ", type: "CREDIT_CARD" },
      user: { name: "Admin" },
    },
    {
      id: "3",
      previousBalance: 23000,
      newBalance: 25000,
      notes: "Transferencia recibida",
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      account: { id: "3", name: "Cuenta Ahorros BAM", currency: "GTQ", type: "BANK" },
      user: { name: "Editor" },
    },
    {
      id: "4",
      previousBalance: 7000,
      newBalance: 5000,
      notes: "Retiro para caja chica",
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      account: { id: "1", name: "Cuenta Monetaria BI", currency: "GTQ", type: "BANK" },
      user: { name: "Admin" },
    },
    {
      id: "5",
      previousBalance: 8000,
      newBalance: 8500,
      notes: "Cargo por compra en línea",
      createdAt: new Date(Date.now() - 345600000).toISOString(),
      account: { id: "4", name: "Mastercard BAM", currency: "GTQ", type: "CREDIT_CARD" },
      user: { name: "Editor" },
    },
  ];

  const uniqueAccounts = Array.from(
    new Set(demoHistory.map((h) => h.account.name))
  );

  const filteredHistory = demoHistory.filter((item) => {
    const matchesSearch =
      item.account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAccount =
      accountFilter === "all" || item.account.name === accountFilter;

    return matchesSearch && matchesAccount;
  });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Historial de Cambios</h1>
        <p className="text-muted-foreground">
          Registro de todos los cambios de saldo
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cuenta, nota o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={accountFilter} onValueChange={setAccountFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por cuenta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las cuentas</SelectItem>
            {uniqueAccounts.map((account) => (
              <SelectItem key={account} value={account}>
                {account}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* History List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Movimientos ({filteredHistory.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <div className="py-12 text-center">
              <History className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Sin movimientos</h3>
              <p className="text-muted-foreground">
                No hay cambios de saldo registrados
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((item) => {
                const difference = item.newBalance - item.previousBalance;
                const isIncrease = difference > 0;
                const isDebt = item.account.type === "CREDIT_CARD";

                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className={`rounded-full p-2 ${
                        isDebt
                          ? isIncrease
                            ? "bg-destructive/20"
                            : "bg-positive/20"
                          : isIncrease
                          ? "bg-positive/20"
                          : "bg-destructive/20"
                      }`}
                    >
                      {isIncrease ? (
                        <ArrowUpRight
                          className={`h-5 w-5 ${
                            isDebt ? "text-destructive" : "text-positive"
                          }`}
                        />
                      ) : (
                        <ArrowDownRight
                          className={`h-5 w-5 ${
                            isDebt ? "text-positive" : "text-destructive"
                          }`}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {item.account.name}
                        </p>
                        <Badge variant="outline" className="shrink-0">
                          {item.account.currency}
                        </Badge>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <span className="text-muted-foreground">
                          {formatCurrency(item.previousBalance, item.account.currency)}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium">
                          {formatCurrency(item.newBalance, item.account.currency)}
                        </span>
                        <span
                          className={`font-medium whitespace-nowrap ${
                            isDebt
                              ? isIncrease
                                ? "text-destructive"
                                : "text-positive"
                              : isIncrease
                              ? "text-positive"
                              : "text-destructive"
                          }`}
                        >
                          ({isIncrease ? "+" : ""}
                          {formatCurrency(difference, item.account.currency)})
                        </span>
                      </div>

                      {item.notes && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.notes}
                        </p>
                      )}

                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {item.user.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.createdAt).toLocaleDateString("es-GT", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
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
