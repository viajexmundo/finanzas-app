"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileBarChart,
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  Wallet,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Activity,
  Calendar,
  Zap,
  PieChart,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

type ReportPeriod = "weekly" | "monthly";

interface ReportData {
  summary: {
    totalDisponible: number;
    totalDeuda: number;
    saldoNeto: number;
    totalIngresos: number;
    totalEgresos: number;
    flujoNeto: number;
    totalTransferencias: number;
    totalPagosTarjeta: number;
    transaccionCount: number;
  };
  creditCards: {
    id: string;
    name: string;
    lastFourDigits: string | null;
    bank: { name: string; shortName: string | null; color: string; logo: string | null } | null;
    balance: number;
    creditLimit: number;
    usagePercent: number;
    availableCredit: number;
    paymentDay: number | null;
    cutoffDay: number | null;
  }[];
  topCategories: {
    category: string;
    total: number;
    count: number;
    percent: number;
  }[];
  typeBreakdown: {
    type: string;
    label: string;
    total: number;
    count: number;
  }[];
  chartData: {
    date: string;
    ingresos: number;
    egresos: number;
  }[];
  recentActivity: {
    avgDailyIncome: number;
    avgDailyExpense: number;
    largestTransaction: {
      amount: number;
      type: string;
      description: string | null;
      date: string;
    } | null;
    busiestDay: { day: string; count: number } | null;
  };
}

const CATEGORY_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  VENTAS: { label: "Ventas", emoji: "💰", color: "#10B981" },
  NOMINA: { label: "Nómina", emoji: "👥", color: "#6366F1" },
  SERVICIOS: { label: "Servicios", emoji: "⚡", color: "#F59E0B" },
  COMPRAS: { label: "Compras", emoji: "🛒", color: "#EF4444" },
  OTROS: { label: "Otros", emoji: "📋", color: "#8B5CF6" },
  SIN_CATEGORIA: { label: "Sin categoría", emoji: "—", color: "#9CA3AF" },
};

export default function ReportesPage() {
  const [period, setPeriod] = useState<ReportPeriod>("monthly");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reportes?period=${period}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [period]);

  const handleExport = () => {
    window.open(`/api/reportes/export?period=${period}`, "_blank");
  };

  if (loading && !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) return null;

  const s = data.summary;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reportes</h1>
          <p className="text-muted-foreground">
            Análisis financiero — {period === "weekly" ? "Últimos 7 días" : "Últimos 30 días"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={period} onValueChange={(v: ReportPeriod) => setPeriod(v)}>
            <SelectTrigger className="w-32 sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensual</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchReport} disabled={loading}>
            <RefreshCw className={`h-4 w-4 sm:mr-2 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </Button>
        </div>
      </div>

      {/* ============ KPI CARDS ============ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Disponible */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Wallet className="h-4 w-4" /> Disponible Total
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(s.totalDisponible)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deuda */}
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <CreditCard className="h-4 w-4" /> Deuda Total
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(s.totalDeuda)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saldo Neto */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Activity className="h-4 w-4" /> Saldo Neto
                </p>
                <p className={`text-2xl font-bold ${s.saldoNeto >= 0 ? "text-blue-600" : "text-red-600"}`}>
                  {formatCurrency(s.saldoNeto)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ingresos */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <ArrowDownLeft className="h-4 w-4 text-emerald-500" /> Ingresos del Período
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(s.totalIngresos)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Promedio diario: {formatCurrency(data.recentActivity.avgDailyIncome)}
                </p>
              </div>
              <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                <TrendingUp className="h-3 w-3 mr-1" />
                {data.typeBreakdown.find((t) => t.type === "INGRESO")?.count || 0} mov.
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Egresos */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <ArrowUpRight className="h-4 w-4 text-red-500" /> Egresos del Período
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(s.totalEgresos)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Promedio diario: {formatCurrency(data.recentActivity.avgDailyExpense)}
                </p>
              </div>
              <Badge variant="outline" className="text-red-600 border-red-200">
                <TrendingDown className="h-3 w-3 mr-1" />
                {data.typeBreakdown.find((t) => t.type === "EGRESO")?.count || 0} mov.
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Flujo Neto */}
        <Card className={s.flujoNeto >= 0 ? "border-l-4 border-l-emerald-400" : "border-l-4 border-l-red-400"}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Zap className="h-4 w-4" /> Flujo Neto
                </p>
                <p className={`text-2xl font-bold ${s.flujoNeto >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {s.flujoNeto >= 0 ? "+" : ""}{formatCurrency(s.flujoNeto)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ingresos - Egresos
                </p>
              </div>
              {s.flujoNeto >= 0 ? (
                <TrendingUp className="h-8 w-8 text-emerald-400" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-400" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============ CREDIT CARDS KPI ============ */}
      {data.creditCards.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Tarjetas de Crédito
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.creditCards.map((card) => (
              <Card key={card.id} className="relative overflow-hidden">
                {card.bank && (
                  <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: card.bank.color }} />
                )}
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {card.bank?.logo ? (
                        <img src={card.bank.logo} alt={card.bank.name}
                          className="h-10 w-10 rounded-lg object-contain bg-muted p-1" />
                      ) : card.bank ? (
                        <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: card.bank.color }}>
                          {card.bank.shortName || card.bank.name.slice(0, 2).toUpperCase()}
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-sm">
                          {card.name}
                          {card.lastFourDigits && (
                            <span className="text-muted-foreground font-normal ml-1">••••{card.lastFourDigits}</span>
                          )}
                        </p>
                        {card.bank && <p className="text-xs text-muted-foreground">{card.bank.name}</p>}
                      </div>
                    </div>
                    <Badge
                      variant={card.usagePercent > 80 ? "destructive" : card.usagePercent > 50 ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {card.usagePercent}%
                    </Badge>
                  </div>

                  {/* Usage bar */}
                  <div className="space-y-2">
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          card.usagePercent > 80
                            ? "bg-red-500"
                            : card.usagePercent > 50
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(card.usagePercent, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        Deuda: <span className="text-foreground font-medium">{formatCurrency(card.balance)}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Límite: <span className="text-foreground font-medium">{formatCurrency(card.creditLimit)}</span>
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-emerald-600 font-medium">
                        Disponible: {formatCurrency(card.availableCredit)}
                      </span>
                      <span className="text-muted-foreground">
                        {card.paymentDay ? `Pago: día ${card.paymentDay}` : ""}
                        {card.cutoffDay ? ` · Corte: día ${card.cutoffDay}` : ""}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ============ CHARTS ROW ============ */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Income vs Expense Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5" />
              Ingresos vs Egresos — {period === "weekly" ? "Últimos 7 días" : "Últimos 30 días"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.chartData.length > 0 && data.chartData.some((d) => d.ingresos > 0 || d.egresos > 0) ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false}
                      tickFormatter={(v) => v >= 1000 ? `Q${(v / 1000).toFixed(0)}k` : `Q${v}`} />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === "ingresos" ? "Ingresos" : "Egresos",
                      ]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="ingresos" name="Ingresos" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="egresos" name="Egresos" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="mx-auto h-10 w-10 mb-2 opacity-50" />
                  <p>No hay datos de transacciones en este período</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChart className="h-5 w-5" />
              Top Categorías
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topCategories.length > 0 ? (
              <div className="space-y-4">
                {data.topCategories.map((cat) => {
                  const info = CATEGORY_LABELS[cat.category] || CATEGORY_LABELS.SIN_CATEGORIA;
                  return (
                    <div key={cat.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span>{info.emoji}</span>
                          <span className="font-medium">{info.label}</span>
                        </span>
                        <span className="text-muted-foreground">
                          {formatCurrency(cat.total)}
                          <span className="ml-1 text-xs">({cat.count})</span>
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${cat.percent}%`, backgroundColor: info.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <PieChart className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Sin datos de categorías</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============ ACTIVITY & TYPE BREAKDOWN ============ */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowRightLeft className="h-5 w-5" />
              Desglose por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.typeBreakdown.map((tb) => {
                const colors: Record<string, string> = {
                  INGRESO: "#10B981",
                  EGRESO: "#EF4444",
                  TRANSFERENCIA: "#3B82F6",
                  PAGO_TARJETA: "#F59E0B",
                };
                const icons: Record<string, typeof ArrowDownLeft> = {
                  INGRESO: ArrowDownLeft,
                  EGRESO: ArrowUpRight,
                  TRANSFERENCIA: ArrowRightLeft,
                  PAGO_TARJETA: CreditCard,
                };
                const Icon = icons[tb.type] || ArrowRightLeft;
                const totalAll = data.typeBreakdown.reduce((s, t) => s + t.total, 0);
                const pct = totalAll > 0 ? Math.round((tb.total / totalAll) * 100) : 0;

                return (
                  <div key={tb.type} className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${colors[tb.type]}15` }}>
                      <Icon className="h-4 w-4" style={{ color: colors[tb.type] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium">{tb.label}</span>
                        <span className="text-muted-foreground">{tb.count} mov.</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors[tb.type] }} />
                      </div>
                    </div>
                    <span className="text-sm font-semibold w-24 text-right">{formatCurrency(tb.total)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-5 w-5" />
              Resumen de Actividad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-emerald-50 p-4 text-center">
                  <p className="text-xs text-emerald-700 mb-1">Promedio Ingreso/día</p>
                  <p className="text-lg font-bold text-emerald-700">
                    {formatCurrency(data.recentActivity.avgDailyIncome)}
                  </p>
                </div>
                <div className="rounded-xl bg-red-50 p-4 text-center">
                  <p className="text-xs text-red-700 mb-1">Promedio Egreso/día</p>
                  <p className="text-lg font-bold text-red-700">
                    {formatCurrency(data.recentActivity.avgDailyExpense)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileBarChart className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total Transacciones</p>
                    <p className="text-xs text-muted-foreground">{s.transaccionCount} movimientos registrados</p>
                  </div>
                </div>

                {data.recentActivity.largestTransaction && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Mayor Transacción</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(data.recentActivity.largestTransaction.amount)}
                        {data.recentActivity.largestTransaction.description
                          ? ` — ${data.recentActivity.largestTransaction.description}`
                          : ""}
                      </p>
                    </div>
                  </div>
                )}

                {data.recentActivity.busiestDay && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Día más Activo</p>
                      <p className="text-xs text-muted-foreground">
                        {data.recentActivity.busiestDay.day} — {data.recentActivity.busiestDay.count} transacciones
                      </p>
                    </div>
                  </div>
                )}

                {s.totalTransferencias > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                      <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Transferencias</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(s.totalTransferencias)} movidos entre cuentas</p>
                    </div>
                  </div>
                )}

                {s.totalPagosTarjeta > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Pagos a Tarjetas</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(s.totalPagosTarjeta)} pagados en deuda</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
