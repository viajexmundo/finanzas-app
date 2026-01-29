"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  CreditCard,
  ArrowRight,
  Loader2,
  DollarSign,
  Target,
  CalendarDays,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface CashFlowData {
  currentBalance: number;
  currentDebt: number;
  projectedEndBalance: number;
  projectedIncome: number;
  projectedExpenses: number;
  lowestPoint: {
    date: string;
    label: string;
    balance: number;
  };
  avgDailyIncome: number;
  avgDailyExpense: number;
  upcomingEvents: {
    date: string;
    type: "ingreso" | "egreso" | "pago_tarjeta";
    amount: number;
    description: string;
    source: "proyectado" | "recurrente" | "tarjeta";
    confidence: "alta" | "media" | "baja";
  }[];
  dailyProjection: {
    date: string;
    label: string;
    saldoProyectado: number;
    ingresos: number;
    egresos: number;
    events: any[];
  }[];
  creditCardPayments: {
    id: string;
    name: string;
    bank: { name: string; shortName: string | null; color: string } | null;
    balance: number;
    paymentDay: number | null;
    cutoffDay: number | null;
  }[];
}

export default function FlujoCajaPage() {
  const [data, setData] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"30" | "60">("30");

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cashflow?days=${period}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      console.error("Error fetching cash flow:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Error al cargar datos</p>
      </div>
    );
  }

  const balanceChange = data.projectedEndBalance - data.currentBalance;
  const balanceChangePercent = data.currentBalance !== 0
    ? ((balanceChange / data.currentBalance) * 100).toFixed(1)
    : "0";

  const getEventIcon = (type: string) => {
    switch (type) {
      case "ingreso":
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case "egreso":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "pago_tarjeta":
        return <CreditCard className="h-4 w-4 text-amber-500" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "alta":
        return <Badge variant="default" className="bg-emerald-500 text-xs">Alta</Badge>;
      case "media":
        return <Badge variant="secondary" className="text-xs">Media</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Baja</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Flujo de Caja Proyectado</h1>
          <p className="text-muted-foreground">
            Visualiza tus ingresos y egresos esperados
          </p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as "30" | "60")}>
          <TabsList>
            <TabsTrigger value="30">30 días</TabsTrigger>
            <TabsTrigger value="60">60 días</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(data.currentBalance)}</p>
            <p className="text-xs text-muted-foreground mt-1">Disponible hoy</p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${balanceChange >= 0 ? "border-l-emerald-500" : "border-l-red-500"}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Proyectado ({period}d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(data.projectedEndBalance)}</p>
            <div className="flex items-center gap-1 mt-1">
              {balanceChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={`text-xs ${balanceChange >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {balanceChange >= 0 ? "+" : ""}{balanceChangePercent}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Punto Más Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(data.lowestPoint.balance)}</p>
            <p className="text-xs text-muted-foreground mt-1">{data.lowestPoint.label}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Flujo Neto Diario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(data.avgDailyIncome - data.avgDailyExpense)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              +{formatCurrency(data.avgDailyIncome)} / -{formatCurrency(data.avgDailyExpense)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Proyección de Saldo
          </CardTitle>
          <CardDescription>
            Evolución esperada de tu saldo disponible
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyProjection}>
                <defs>
                  <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `Q${(v / 1000).toFixed(0)}k`}
                  className="text-muted-foreground"
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Saldo"]}
                  labelFormatter={(label) => `Fecha: ${label}`}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <ReferenceLine
                  y={0}
                  stroke="hsl(var(--destructive))"
                  strokeDasharray="3 3"
                  label={{ value: "Cero", position: "right", fill: "hsl(var(--destructive))" }}
                />
                <ReferenceLine
                  y={data.currentBalance}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                />
                <Area
                  type="monotone"
                  dataKey="saldoProyectado"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorSaldo)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Próximos Movimientos
            </CardTitle>
            <CardDescription>
              Eventos proyectados basados en patrones históricos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.upcomingEvents.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay eventos proyectados
              </p>
            ) : (
              <div className="space-y-3">
                {data.upcomingEvents.map((event, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-background flex items-center justify-center">
                        {getEventIcon(event.type)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{event.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(event.date).toLocaleDateString("es-GT", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                          <span className="text-muted-foreground/50">|</span>
                          {getConfidenceBadge(event.confidence)}
                        </div>
                      </div>
                    </div>
                    <p className={`font-semibold ${
                      event.type === "ingreso" ? "text-emerald-600" : "text-red-600"
                    }`}>
                      {event.type === "ingreso" ? "+" : "-"}{formatCurrency(event.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credit Card Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pagos de Tarjetas
            </CardTitle>
            <CardDescription>
              Próximos pagos de tarjetas de crédito
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.creditCardPayments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay tarjetas de crédito
              </p>
            ) : (
              <div className="space-y-3">
                {data.creditCardPayments.map((card) => {
                  const today = new Date().getDate();
                  const daysUntilPayment = card.paymentDay
                    ? card.paymentDay >= today
                      ? card.paymentDay - today
                      : 30 - today + card.paymentDay
                    : null;

                  return (
                    <div
                      key={card.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        {card.bank ? (
                          <div
                            className="h-10 w-10 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: card.bank.color }}
                          >
                            {card.bank.shortName || card.bank.name.slice(0, 2).toUpperCase()}
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">{card.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {card.paymentDay && (
                              <>
                                <span>Pago: día {card.paymentDay}</span>
                                {daysUntilPayment !== null && (
                                  <Badge
                                    variant={daysUntilPayment <= 5 ? "destructive" : "secondary"}
                                    className="text-xs"
                                  >
                                    {daysUntilPayment === 0
                                      ? "Hoy"
                                      : daysUntilPayment === 1
                                      ? "Mañana"
                                      : `${daysUntilPayment} días`}
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">
                          {formatCurrency(card.balance)}
                        </p>
                        {card.cutoffDay && (
                          <p className="text-xs text-muted-foreground">
                            Corte: día {card.cutoffDay}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Warning if low balance projected */}
      {data.lowestPoint.balance < 0 && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-red-700 dark:text-red-400">
                Alerta: Saldo negativo proyectado
              </p>
              <p className="text-sm text-red-600/80 dark:text-red-400/80">
                El {data.lowestPoint.label} se proyecta un saldo de {formatCurrency(data.lowestPoint.balance)}.
                Considera ajustar tus gastos o asegurar ingresos adicionales.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
