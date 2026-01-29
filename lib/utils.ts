import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "GTQ"): string {
  const symbol = currency === "USD" ? "$" : "Q";
  return `${symbol}${amount.toLocaleString("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function getAccountTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    BANK: "Cuenta Bancaria",
    CREDIT_CARD: "Tarjeta de Crédito",
    CASH: "Efectivo",
    WALLET: "Wallet",
  };
  return labels[type] || type;
}

export function getAccountTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    BANK: "building-2",
    CREDIT_CARD: "credit-card",
    CASH: "banknote",
    WALLET: "wallet",
  };
  return icons[type] || "circle";
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    ADMIN: "Administrador",
    EDITOR: "Editor",
    VIEWER: "Solo Lectura",
  };
  return labels[role] || role;
}

export function getDaysUntilDate(day: number): number {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let targetDate = new Date(currentYear, currentMonth, day);

  if (day <= currentDay) {
    targetDate = new Date(currentYear, currentMonth + 1, day);
  }

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

export function convertCurrency(
  amount: number,
  fromCurrency: "GTQ" | "USD",
  toCurrency: "GTQ" | "USD",
  exchangeRate: number
): number {
  if (fromCurrency === toCurrency) return amount;

  if (fromCurrency === "USD" && toCurrency === "GTQ") {
    return amount * exchangeRate;
  }

  if (fromCurrency === "GTQ" && toCurrency === "USD") {
    return amount / exchangeRate;
  }

  return amount;
}
