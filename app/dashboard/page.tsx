"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Building2,
  Banknote,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatCurrency, getAccountTypeLabel } from "@/lib/utils";

interface DashboardData {
  totalAvailable: number;
  totalDebt: number;
  netBalance: number;
  accountsByType: {
    type: string;
    total: number;
    count: number;
    availableCredit?: number;
  }[];
  recentAlerts: {
    id: string;
    type: string;
    message: string;
    createdAt: string;
  }[];
  exchangeRate: number;
}

// Colores específicos por tipo de cuenta
const TYPE_COLORS: Record<string, string> = {
  BANK: "#3B82F6",      // Azul - Bancos
  CASH: "#10B981",      // Verde - Efectivo
  WALLET: "#F59E0B",    // Naranja - Wallets
  CREDIT_CARD: "#8B5CF6", // Morado - Tarjetas de crédito
};
const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#8B5CF6"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const dashboardData = await res.json();
          setData(dashboardData);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Demo data when no real data exists
  const demoData: DashboardData = data || {
    totalAvailable: 125000,
    totalDebt: 45000,
    netBalance: 80000,
    accountsByType: [
      { type: "BANK", total: 100000, count: 2 },
      { type: "CASH", total: 15000, count: 1 },
      { type: "WALLET", total: 10000, count: 2 },
      { type: "CREDIT_CARD", total: 45000, count: 3, availableCredit: 55000 },
    ],
    recentAlerts: [
      {
        id: "1",
        type: "PAYMENT_DUE",
        message: "Pago de Visa BI vence en 3 días",
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        type: "HIGH_USAGE",
        message: "Mastercard BAM al 85% de su límite",
        createdAt: new Date().toISOString(),
      },
    ],
    exchangeRate: 7.85,
  };

  // Para tarjetas de crédito, mostrar crédito disponible; para otros, el balance
  const chartData = demoData.accountsByType.map((item) => ({
    name: getAccountTypeLabel(item.type),
    value: item.type === "CREDIT_CARD" && item.availableCredit !== undefined
      ? item.availableCredit
      : item.total,
    type: item.type,
    fill: TYPE_COLORS[item.type] || "#3B82F6",
    label: item.type === "CREDIT_CARD" ? "Disponible" : "Balance",
  }));

  const pieData = [
    { name: "Disponible", value: demoData.totalAvailable, color: "#10B981" },
    { name: "Deuda", value: demoData.totalDebt, color: "#EF4444" },
  ];

  const getAlertBadgeVariant = (type: string) => {
    switch (type) {
      case "PAYMENT_DUE":
        return "warning";
      case "HIGH_USAGE":
        return "destructive";
      case "LOW_BALANCE":
        return "secondary";
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Disponible"
          value={demoData.totalAvailable}
          icon={Wallet}
          variant="positive"
          subtitle="Bancos + Efectivo + Wallets"
        />
        <StatCard
          title="Total Deuda"
          value={demoData.totalDebt}
          icon={CreditCard}
          variant="negative"
          subtitle="Tarjetas de crédito"
        />
        <StatCard
          title="Saldo Neto"
          value={demoData.netBalance}
          icon={TrendingUp}
          variant={demoData.netBalance >= 0 ? "neutral" : "warning"}
          subtitle="Disponible - Deuda"
        />
      </div>

      {/* Charts and Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dinero Disponible por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    tickFormatter={(value) => `Q${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number, _name: string, props: any) => [
                      formatCurrency(value),
                      props.payload.type === "CREDIT_CARD" ? "Crédito Disponible" : "Balance"
                    ]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[4, 4, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              * Tarjetas muestran crédito disponible (límite - deuda)
            </p>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Distribución Hay vs Debo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) =>
                      `${name}: ${formatCurrency(value)}`
                    }
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Exchange Rate */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Alerts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Alertas Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {demoData.recentAlerts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay alertas pendientes
              </p>
            ) : (
              <div className="space-y-3">
                {demoData.recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                      <div>
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(alert.createdAt).toLocaleDateString("es-GT")}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getAlertBadgeVariant(alert.type)}>
                      {getAlertTypeLabel(alert.type)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exchange Rate Card */}
        <Card>
          <CardHeader>
            <CardTitle>Tipo de Cambio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="text-4xl font-bold text-primary">
                Q{demoData.exchangeRate.toFixed(2)}
              </div>
              <p className="text-muted-foreground">1 USD = Q{demoData.exchangeRate.toFixed(2)}</p>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Equivalentes en USD:
                </p>
                <div className="mt-2 space-y-1 text-sm">
                  <p>
                    Disponible:{" "}
                    <span className="font-semibold text-positive">
                      ${(demoData.totalAvailable / demoData.exchangeRate).toFixed(2)}
                    </span>
                  </p>
                  <p>
                    Deuda:{" "}
                    <span className="font-semibold text-negative">
                      ${(demoData.totalDebt / demoData.exchangeRate).toFixed(2)}
                    </span>
                  </p>
                  <p>
                    Neto:{" "}
                    <span className="font-semibold text-info">
                      ${(demoData.netBalance / demoData.exchangeRate).toFixed(2)}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
