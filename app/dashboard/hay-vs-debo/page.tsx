"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  TrendingDown,
  Building2,
  Banknote,
  Wallet,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Account {
  id: string;
  name: string;
  type: string;
  currency: "GTQ" | "USD";
  balance: number;
  bank: {
    name: string;
    color: string;
    logo: string | null;
  } | null;
}

interface HayVsDebData {
  hay: Account[];
  debo: Account[];
  totalHay: number;
  totalDebo: number;
  saldoNeto: number;
  exchangeRate: number;
}

export default function HayVsDebPage() {
  const [data, setData] = useState<HayVsDebData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/hay-vs-debo");
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Demo data
  const demoData: HayVsDebData = data || {
    hay: [
      { id: "1", name: "Cuenta Monetaria BI", type: "BANK", currency: "GTQ", balance: 50000, bank: { name: "Banco Industrial", color: "#003B7A", logo: null } },
      { id: "2", name: "Cuenta Ahorros BAM", type: "BANK", currency: "GTQ", balance: 25000, bank: { name: "BAM", color: "#D4A017", logo: null } },
      { id: "3", name: "Caja Chica", type: "CASH", currency: "GTQ", balance: 5000, bank: null },
      { id: "4", name: "PayPal", type: "WALLET", currency: "USD", balance: 1200, bank: null },
    ],
    debo: [
      { id: "5", name: "Visa BI", type: "CREDIT_CARD", currency: "GTQ", balance: 12000, bank: { name: "Banco Industrial", color: "#003B7A", logo: null } },
      { id: "6", name: "Mastercard BAM", type: "CREDIT_CARD", currency: "GTQ", balance: 8500, bank: { name: "BAM", color: "#D4A017", logo: null } },
    ],
    totalHay: 89420,
    totalDebo: 20500,
    saldoNeto: 68920,
    exchangeRate: 7.85,
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "BANK":
        return Building2;
      case "CASH":
        return Banknote;
      case "WALLET":
        return Wallet;
      case "CREDIT_CARD":
        return CreditCard;
      default:
        return Wallet;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Hay vs Debo</h1>
        <p className="text-muted-foreground">
          Vista comparativa de activos y deudas
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Total HAY
                </p>
                <p className="text-3xl font-bold text-emerald-800 dark:text-emerald-200">
                  {formatCurrency(demoData.totalHay)}
                </p>
              </div>
              <div className="rounded-full bg-emerald-200 p-3 dark:bg-emerald-800">
                <TrendingUp className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  Total DEBO
                </p>
                <p className="text-3xl font-bold text-red-800 dark:text-red-200">
                  {formatCurrency(demoData.totalDebo)}
                </p>
              </div>
              <div className="rounded-full bg-red-200 p-3 dark:bg-red-800">
                <TrendingDown className="h-6 w-6 text-red-700 dark:text-red-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`${
            demoData.saldoNeto >= 0
              ? "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200"
              : "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200"
          }`}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm font-medium ${
                    demoData.saldoNeto >= 0
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-orange-700 dark:text-orange-300"
                  }`}
                >
                  Saldo Neto
                </p>
                <p
                  className={`text-3xl font-bold ${
                    demoData.saldoNeto >= 0
                      ? "text-blue-800 dark:text-blue-200"
                      : "text-orange-800 dark:text-orange-200"
                  }`}
                >
                  {formatCurrency(demoData.saldoNeto)}
                </p>
              </div>
              <div
                className={`rounded-full p-3 ${
                  demoData.saldoNeto >= 0
                    ? "bg-blue-200 dark:bg-blue-800"
                    : "bg-orange-200 dark:bg-orange-800"
                }`}
              >
                <ArrowRight
                  className={`h-6 w-6 ${
                    demoData.saldoNeto >= 0
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-orange-700 dark:text-orange-300"
                  }`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* HAY Column */}
        <Card className="border-2 border-emerald-200 dark:border-emerald-800">
          <CardHeader className="bg-emerald-50 dark:bg-emerald-950">
            <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
              <TrendingUp className="h-5 w-5" />
              HAY (Lo que tengo)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {demoData.hay.map((account) => {
                const Icon = getIcon(account.type);
                return (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {account.bank?.logo ? (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border overflow-hidden">
                          <img
                            src={account.bank.logo}
                            alt={account.bank.name}
                            className="h-8 w-8 object-contain"
                          />
                        </div>
                      ) : (
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{
                            backgroundColor: account.bank?.color
                              ? `${account.bank.color}20`
                              : "hsl(var(--muted))",
                          }}
                        >
                          <Icon
                            className="h-5 w-5"
                            style={{
                              color: account.bank?.color || "hsl(var(--muted-foreground))",
                            }}
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{account.name}</p>
                        {account.bank && (
                          <p className="text-xs text-muted-foreground">
                            {account.bank.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600">
                        {formatCurrency(account.balance, account.currency)}
                      </p>
                      {account.currency === "USD" && (
                        <p className="text-xs text-muted-foreground">
                          ≈ {formatCurrency(account.balance * demoData.exchangeRate, "GTQ")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <Separator />
            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950">
              <p className="font-bold text-emerald-800 dark:text-emerald-200">
                TOTAL HAY
              </p>
              <p className="text-xl font-bold text-emerald-600">
                {formatCurrency(demoData.totalHay)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* DEBO Column */}
        <Card className="border-2 border-red-200 dark:border-red-800">
          <CardHeader className="bg-red-50 dark:bg-red-950">
            <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <TrendingDown className="h-5 w-5" />
              DEBO (Lo que debo)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {demoData.debo.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <CreditCard className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>No tienes deudas registradas</p>
                </div>
              ) : (
                demoData.debo.map((account) => {
                  const Icon = getIcon(account.type);
                  return (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        {account.bank?.logo ? (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border overflow-hidden">
                            <img
                              src={account.bank.logo}
                              alt={account.bank.name}
                              className="h-8 w-8 object-contain"
                            />
                          </div>
                        ) : (
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-lg"
                            style={{
                              backgroundColor: account.bank?.color
                                ? `${account.bank.color}20`
                                : "hsl(var(--muted))",
                            }}
                          >
                            <Icon
                              className="h-5 w-5"
                              style={{
                                color: account.bank?.color || "hsl(var(--muted-foreground))",
                              }}
                            />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{account.name}</p>
                          {account.bank && (
                            <p className="text-xs text-muted-foreground">
                              {account.bank.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">
                          {formatCurrency(account.balance, account.currency)}
                        </p>
                        {account.currency === "USD" && (
                          <p className="text-xs text-muted-foreground">
                            ≈ {formatCurrency(account.balance * demoData.exchangeRate, "GTQ")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <Separator />
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950">
              <p className="font-bold text-red-800 dark:text-red-200">
                TOTAL DEBO
              </p>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(demoData.totalDebo)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Net Balance Summary */}
      <Card className="border-2">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-emerald-600">
                {formatCurrency(demoData.totalHay)}
              </span>
              <span className="text-muted-foreground">HAY</span>
            </div>
            <span className="text-2xl text-muted-foreground">-</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-red-600">
                {formatCurrency(demoData.totalDebo)}
              </span>
              <span className="text-muted-foreground">DEBO</span>
            </div>
            <span className="text-2xl text-muted-foreground">=</span>
            <div className="flex items-center gap-2">
              <span
                className={`text-3xl font-bold ${
                  demoData.saldoNeto >= 0 ? "text-blue-600" : "text-orange-600"
                }`}
              >
                {formatCurrency(demoData.saldoNeto)}
              </span>
              <span className="text-muted-foreground">NETO</span>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Equivalente en USD: ${(demoData.saldoNeto / demoData.exchangeRate).toFixed(2)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
