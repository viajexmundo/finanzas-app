"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  currency?: "GTQ" | "USD";
  icon: LucideIcon;
  variant?: "positive" | "negative" | "neutral" | "warning";
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({
  title,
  value,
  currency = "GTQ",
  icon: Icon,
  variant = "neutral",
  subtitle,
  trend,
}: StatCardProps) {
  const variantStyles = {
    positive: {
      bg: "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900",
      border: "border-emerald-200 dark:border-emerald-800",
      icon: "text-emerald-600 dark:text-emerald-400",
      value: "text-emerald-700 dark:text-emerald-300",
    },
    negative: {
      bg: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900",
      border: "border-red-200 dark:border-red-800",
      icon: "text-red-600 dark:text-red-400",
      value: "text-red-700 dark:text-red-300",
    },
    neutral: {
      bg: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900",
      border: "border-blue-200 dark:border-blue-800",
      icon: "text-blue-600 dark:text-blue-400",
      value: "text-blue-700 dark:text-blue-300",
    },
    warning: {
      bg: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900",
      border: "border-amber-200 dark:border-amber-800",
      icon: "text-amber-600 dark:text-amber-400",
      value: "text-amber-700 dark:text-amber-300",
    },
  };

  const styles = variantStyles[variant];

  return (
    <Card className={cn("overflow-hidden border-2", styles.bg, styles.border)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={cn("text-3xl font-bold tracking-tight", styles.value)}>
              {formatCurrency(value, currency)}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div
                className={cn(
                  "flex items-center text-xs font-medium",
                  trend.isPositive ? "text-emerald-600" : "text-red-600"
                )}
              >
                <span>{trend.isPositive ? "↑" : "↓"}</span>
                <span className="ml-1">{trend.value}% vs mes anterior</span>
              </div>
            )}
          </div>
          <div
            className={cn(
              "rounded-full p-3",
              variant === "positive" && "bg-emerald-200/50 dark:bg-emerald-800/50",
              variant === "negative" && "bg-red-200/50 dark:bg-red-800/50",
              variant === "neutral" && "bg-blue-200/50 dark:bg-blue-800/50",
              variant === "warning" && "bg-amber-200/50 dark:bg-amber-800/50"
            )}
          >
            <Icon className={cn("h-6 w-6", styles.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
