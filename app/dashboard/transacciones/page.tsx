"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowRightLeft,
  Plus,
  Upload,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Search,
  Calendar,
  User,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Building2,
  Banknote,
  ArrowRight,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Account {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
  lastFourDigits: string | null;
  bank: { name: string; shortName: string | null; color: string; logo: string | null } | null;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  category: string | null;
  date: string;
  fromAccount: Account | null;
  toAccount: Account | null;
  user: { name: string };
  createdAt: string;
}

const TYPES = [
  {
    value: "INGRESO",
    label: "Ingreso",
    description: "Dinero que entra a una cuenta",
    icon: ArrowDownLeft,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    ring: "ring-emerald-500",
    gradient: "from-emerald-500 to-emerald-600",
  },
  {
    value: "EGRESO",
    label: "Egreso",
    description: "Dinero que sale de una cuenta",
    icon: ArrowUpRight,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    ring: "ring-red-500",
    gradient: "from-red-500 to-red-600",
  },
  {
    value: "TRANSFERENCIA",
    label: "Transferencia",
    description: "Mover dinero entre cuentas",
    icon: ArrowRightLeft,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    ring: "ring-blue-500",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    value: "PAGO_TARJETA",
    label: "Pago Tarjeta",
    description: "Pagar deuda de tarjeta de crédito",
    icon: CreditCard,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    ring: "ring-amber-500",
    gradient: "from-amber-500 to-amber-600",
  },
];

const CATEGORIES = [
  { value: "VENTAS", label: "Ventas", emoji: "💰" },
  { value: "NOMINA", label: "Nómina", emoji: "👥" },
  { value: "SERVICIOS", label: "Servicios", emoji: "⚡" },
  { value: "COMPRAS", label: "Compras", emoji: "🛒" },
  { value: "OTROS", label: "Otros", emoji: "📋" },
];

function accountLabel(a: Account) {
  return a.lastFourDigits ? `${a.name} ••••${a.lastFourDigits}` : a.name;
}

function BankIcon({ account, size = "sm" }: { account: Account; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-9 w-9" : "h-10 w-10";
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  if (account.bank?.logo) {
    return (
      <img src={account.bank.logo} alt={account.bank.name}
        className={`${dim} rounded-lg object-contain bg-muted p-1`} />
    );
  }
  if (account.bank) {
    return (
      <div className={`${dim} rounded-lg flex items-center justify-center text-white font-bold ${textSize}`}
        style={{ backgroundColor: account.bank.color }}>
        {account.bank.shortName || account.bank.name.slice(0, 2).toUpperCase()}
      </div>
    );
  }
  const FallbackIcon = getAccountIcon(account.type);
  return (
    <div className={`${dim} rounded-lg flex items-center justify-center`}
      style={{ backgroundColor: "#f3f4f6" }}>
      <FallbackIcon className="h-4 w-4" style={{ color: "#6b7280" }} />
    </div>
  );
}

function getAccountIcon(type: string) {
  switch (type) {
    case "BANK": return Building2;
    case "CREDIT_CARD": return CreditCard;
    case "CASH": return Banknote;
    case "WALLET": return Wallet;
    default: return Wallet;
  }
}

export default function TransaccionesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    type: "",
    amount: "",
    description: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
    fromAccountId: "",
    toAccountId: "",
  });

  // CSV
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<{
    total: number;
    success: number;
    errors: string[];
  } | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchTransactions();
    fetchAccounts();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/transactions");
      if (res.ok) setTransactions(await res.json());
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/accounts");
      if (res.ok) setAccounts(await res.json());
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMessage("");
    try {
      const payload = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description || undefined,
        category: formData.category || undefined,
        date: formData.date,
        fromAccountId: formData.fromAccountId || undefined,
        toAccountId: formData.toAccountId || undefined,
      };

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const typeInfo = TYPES.find((t) => t.value === formData.type);
        setSuccessMessage(`${typeInfo?.label || "Transacción"} registrada correctamente`);
        setTimeout(() => setSuccessMessage(""), 3000);
        resetForm();
        fetchTransactions();
        fetchAccounts();
      } else {
        const data = await res.json().catch(() => null);
        setErrorMessage(data?.error || "Error al registrar la transacción");
      }
    } catch (error) {
      console.error("Error creating transaction:", error);
      setErrorMessage("Error de conexión al registrar la transacción");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImport = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/transactions/import", { method: "POST", body: fd });
      if (res.ok) {
        setImportResult(await res.json());
        fetchTransactions();
        fetchAccounts();
      }
    } catch (error) {
      console.error("Error importing CSV:", error);
    } finally {
      setImporting(false);
    }
  };

  const resetForm = () => {
    setFormData({ type: "", amount: "", description: "", category: "", date: new Date().toISOString().split("T")[0], fromAccountId: "", toAccountId: "" });
    setStep(1);
    setShowForm(false);
  };

  const getTypeInfo = (type: string) => TYPES.find((t) => t.value === type) || TYPES[0];

  const needsFromAccount = ["EGRESO", "TRANSFERENCIA", "PAGO_TARJETA"].includes(formData.type);
  const needsToAccount = ["INGRESO", "TRANSFERENCIA", "PAGO_TARJETA"].includes(formData.type);

  const canProceedStep2 = formData.type !== "";
  const canProceedStep3 = (() => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) return false;
    if (needsFromAccount && !formData.fromAccountId) return false;
    if (needsToAccount && !formData.toAccountId) return false;
    return true;
  })();

  const selectedFromAccount = accounts.find((a) => a.id === formData.fromAccountId);
  const selectedToAccount = accounts.find((a) => a.id === formData.toAccountId);
  const selectedType = TYPES.find((t) => t.value === formData.type);

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.fromAccount?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.toAccount?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const fromAccountOptions = accounts.filter((a) => {
    if (formData.type === "PAGO_TARJETA") return a.type !== "CREDIT_CARD";
    return true;
  });

  const toAccountOptions = accounts.filter((a) => {
    if (formData.type === "PAGO_TARJETA") return a.type === "CREDIT_CARD";
    if (formData.type === "TRANSFERENCIA") return a.id !== formData.fromAccountId;
    return true;
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
      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl shadow-lg">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transacciones</h1>
          <p className="text-muted-foreground">Registra movimientos, transferencias y pagos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importar CSV
          </Button>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Transacción
          </Button>
        </div>
      </div>

      {/* ============ TRANSACTION FORM DIALOG ============ */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); else setShowForm(true); }}>
        <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 px-6 py-5 flex items-center justify-between border-b">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Nueva Transacción</h2>
                <p className="text-sm text-muted-foreground">Paso {step} de 3</p>
              </div>
            </div>
            {/* Step indicators */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    s === step ? "w-8 bg-primary" : s < step ? "w-2 bg-primary/60" : "w-2 bg-muted-foreground/20"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* ---- STEP 1: Select Type ---- */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground">
                  ¿Qué tipo de movimiento deseas registrar?
                </p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {TYPES.map((t) => {
                    const Icon = t.icon;
                    const isSelected = formData.type === t.value;
                    return (
                      <button
                        key={t.value}
                        onClick={() => {
                          setFormData({ ...formData, type: t.value, fromAccountId: "", toAccountId: "" });
                        }}
                        className={`relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] ${
                          isSelected
                            ? `${t.border} ${t.bg} ring-2 ${t.ring} shadow-md`
                            : "border-muted hover:border-muted-foreground/30 hover:bg-muted/50"
                        }`}
                      >
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                          isSelected ? `bg-gradient-to-br ${t.gradient} text-white shadow-md` : "bg-muted"
                        }`}>
                          <Icon className={`h-6 w-6 ${isSelected ? "text-white" : "text-muted-foreground"}`} />
                        </div>
                        <div className="text-center">
                          <p className={`font-semibold text-sm ${isSelected ? t.color : ""}`}>{t.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                        </div>
                        {isSelected && (
                          <div className={`absolute top-2 right-2 h-5 w-5 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center`}>
                            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-end pt-2">
                  <Button onClick={() => setStep(2)} disabled={!canProceedStep2} className="gap-2">
                    Siguiente
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ---- STEP 2: Amount + Accounts ---- */}
            {step === 2 && selectedType && (
              <div className="space-y-6">
                {/* Amount input - big and prominent */}
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Monto de la transacción</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl font-bold text-muted-foreground">Q</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      className="text-4xl font-bold text-center bg-transparent border-none outline-none w-48 placeholder:text-muted-foreground/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Account selection - visual cards */}
                <div className="space-y-4">
                  {needsFromAccount && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <div className={`h-5 w-5 rounded-full bg-gradient-to-br ${selectedType.gradient} flex items-center justify-center`}>
                          <ArrowUpRight className="h-3 w-3 text-white" />
                        </div>
                        {formData.type === "PAGO_TARJETA" ? "Pagar desde" : "Cuenta Origen"}
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {fromAccountOptions.map((a) => {
                          const isSelected = formData.fromAccountId === a.id;
                          return (
                            <button
                              key={a.id}
                              onClick={() => setFormData({ ...formData, fromAccountId: a.id })}
                              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                                isSelected
                                  ? `${selectedType.border} ${selectedType.bg} shadow-sm`
                                  : "border-muted hover:border-muted-foreground/30"
                              }`}
                            >
                              <div className="shrink-0">
                                <BankIcon account={a} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{a.name}{a.lastFourDigits && <span className="text-muted-foreground font-normal"> ••••{a.lastFourDigits}</span>}</p>
                                <p className="text-xs text-muted-foreground">
                                  {a.bank ? a.bank.name + " · " : ""}{formatCurrency(a.balance, a.currency)}
                                </p>
                              </div>
                              {isSelected && (
                                <CheckCircle2 className={`h-4 w-4 shrink-0 ml-auto ${selectedType.color}`} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Arrow between accounts for transfer/pago */}
                  {needsFromAccount && needsToAccount && (
                    <div className="flex justify-center">
                      <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${selectedType.gradient} flex items-center justify-center shadow-md`}>
                        <ArrowRight className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  )}

                  {needsToAccount && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <div className={`h-5 w-5 rounded-full bg-gradient-to-br ${selectedType.gradient} flex items-center justify-center`}>
                          <ArrowDownLeft className="h-3 w-3 text-white" />
                        </div>
                        {formData.type === "PAGO_TARJETA" ? "Tarjeta a pagar" : formData.type === "INGRESO" ? "Depositar en" : "Cuenta Destino"}
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {toAccountOptions.map((a) => {
                          const isSelected = formData.toAccountId === a.id;
                          return (
                            <button
                              key={a.id}
                              onClick={() => setFormData({ ...formData, toAccountId: a.id })}
                              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                                isSelected
                                  ? `${selectedType.border} ${selectedType.bg} shadow-sm`
                                  : "border-muted hover:border-muted-foreground/30"
                              }`}
                            >
                              <div className="shrink-0">
                                <BankIcon account={a} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{a.name}{a.lastFourDigits && <span className="text-muted-foreground font-normal"> ••••{a.lastFourDigits}</span>}</p>
                                <p className="text-xs text-muted-foreground">
                                  {a.bank ? a.bank.name + " · " : ""}{a.type === "CREDIT_CARD" ? "Deuda: " : ""}{formatCurrency(a.balance, a.currency)}
                                </p>
                              </div>
                              {isSelected && (
                                <CheckCircle2 className={`h-4 w-4 shrink-0 ml-auto ${selectedType.color}`} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={() => setStep(1)} className="gap-2">
                    Atrás
                  </Button>
                  <Button onClick={() => setStep(3)} disabled={!canProceedStep3} className="gap-2">
                    Siguiente
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ---- STEP 3: Details + Confirm ---- */}
            {step === 3 && selectedType && (
              <div className="space-y-6">
                {/* Transaction Preview Card */}
                <div className={`rounded-xl border-2 ${selectedType.border} ${selectedType.bg} p-5`}>
                  <div className="flex items-center justify-between mb-4">
                    <Badge className={`bg-gradient-to-r ${selectedType.gradient} text-white border-0 px-3 py-1`}>
                      {selectedType.label}
                    </Badge>
                    <p className={`text-2xl font-bold ${selectedType.color}`}>
                      {formatCurrency(parseFloat(formData.amount) || 0)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm flex-wrap">
                    {selectedFromAccount && (
                      <div className="flex items-center gap-2 bg-background/80 rounded-lg px-3 py-2">
                        <BankIcon account={selectedFromAccount} />
                        <div>
                          <span className="font-medium">{accountLabel(selectedFromAccount)}</span>
                          {selectedFromAccount.bank && (
                            <p className="text-xs text-muted-foreground">{selectedFromAccount.bank.name}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {selectedFromAccount && selectedToAccount && (
                      <ArrowRight className={`h-4 w-4 ${selectedType.color}`} />
                    )}
                    {selectedToAccount && (
                      <div className="flex items-center gap-2 bg-background/80 rounded-lg px-3 py-2">
                        <BankIcon account={selectedToAccount} />
                        <div>
                          <span className="font-medium">{accountLabel(selectedToAccount)}</span>
                          {selectedToAccount.bank && (
                            <p className="text-xs text-muted-foreground">{selectedToAccount.bank.name}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Fecha</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Categoría</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Opcional" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            <span className="flex items-center gap-2">
                              <span>{c.emoji}</span> {c.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Descripción</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ej: Venta de paquete turístico, Pago de servicios..."
                  />
                </div>

                {errorMessage && (
                  <div className="flex items-center gap-2 text-red-700 bg-red-50 rounded-lg p-3">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium">{errorMessage}</span>
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={() => setStep(2)}>
                    Atrás
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={`gap-2 bg-gradient-to-r ${selectedType.gradient} hover:opacity-90 text-white shadow-md px-6`}
                  >
                    {submitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {submitting ? "Registrando..." : "Confirmar Transacción"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ============ SUMMARY CARDS ============ */}
      <div className="grid gap-4 md:grid-cols-4">
        {TYPES.map((t) => {
          const count = transactions.filter((tr) => tr.type === t.value).length;
          const total = transactions.filter((tr) => tr.type === t.value).reduce((sum, tr) => sum + tr.amount, 0);
          const Icon = t.icon;
          return (
            <Card
              key={t.value}
              className={`cursor-pointer transition-all hover:shadow-md ${
                typeFilter === t.value ? `border-2 ${t.border} ${t.bg}` : "hover:border-muted-foreground/20"
              }`}
              onClick={() => setTypeFilter(typeFilter === t.value ? "all" : t.value)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${t.gradient} shadow-sm`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.label}</p>
                    <p className="text-xl font-bold">{formatCurrency(total)}</p>
                    <p className="text-xs text-muted-foreground">{count} registros</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ============ FILTERS ============ */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cuenta, descripción o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {typeFilter !== "all" && (
          <Button variant="ghost" size="sm" onClick={() => setTypeFilter("all")} className="gap-1 text-muted-foreground">
            <X className="h-3 w-3" />
            Limpiar filtro
          </Button>
        )}
      </div>

      {/* ============ TRANSACTIONS LIST ============ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transacciones ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <ArrowRightLeft className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Sin transacciones</h3>
              <p className="text-muted-foreground mt-1">
                Registra tu primera transacción o importa desde CSV
              </p>
              <Button onClick={() => setShowForm(true)} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Nueva Transacción
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((t) => {
                const typeInfo = getTypeInfo(t.type);
                const Icon = typeInfo.icon;

                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${typeInfo.gradient} shadow-sm`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">
                            {t.type === "INGRESO" && t.toAccount && accountLabel(t.toAccount)}
                            {t.type === "EGRESO" && t.fromAccount && accountLabel(t.fromAccount)}
                            {t.type === "TRANSFERENCIA" && `${t.fromAccount ? accountLabel(t.fromAccount) : ""} → ${t.toAccount ? accountLabel(t.toAccount) : ""}`}
                            {t.type === "PAGO_TARJETA" && `${t.fromAccount ? accountLabel(t.fromAccount) : ""} → ${t.toAccount ? accountLabel(t.toAccount) : ""}`}
                          </p>
                          {(() => {
                            const bankNames = [t.fromAccount?.bank?.name, t.toAccount?.bank?.name].filter(Boolean);
                            const unique = [...new Set(bankNames)];
                            return unique.length > 0 ? (
                              <span className="text-xs text-muted-foreground">{unique.join(" · ")}</span>
                            ) : null;
                          })()}
                          {t.category && (
                            <Badge variant="secondary" className="text-xs">
                              {CATEGORIES.find((c) => c.value === t.category)?.emoji} {t.category}
                            </Badge>
                          )}
                        </div>
                        {t.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">{t.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(t.date).toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {t.user.name}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${typeInfo.color}`}>
                        {t.type === "EGRESO" ? "- " : t.type === "INGRESO" ? "+ " : ""}
                        {formatCurrency(t.amount)}
                      </p>
                      <Badge variant="outline" className={`text-xs ${typeInfo.color} border-current/20`}>
                        {typeInfo.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============ CSV IMPORT DIALOG ============ */}
      <Dialog open={importDialogOpen} onOpenChange={(open) => {
        setImportDialogOpen(open);
        if (!open) {
          setImportResult(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Importar desde CSV
            </DialogTitle>
            <DialogDescription>
              Sube un archivo CSV para registrar transacciones masivamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
              <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium mb-1">Arrastra o selecciona un archivo</p>
              <p className="text-xs text-muted-foreground mb-3">Solo archivos .csv</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
            </div>

            <details className="group">
              <summary className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                <ChevronDown className="h-4 w-4 group-open:hidden" />
                <ChevronUp className="h-4 w-4 hidden group-open:block" />
                Ver formato esperado
              </summary>
              <div className="mt-2 bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto space-y-1">
                <p className="text-muted-foreground">fecha,tipo,monto,cuenta_origen,cuenta_destino,descripcion,categoria</p>
                <p className="text-foreground">2026-01-15,INGRESO,5000,,Cuenta BI,Venta paquete,VENTAS</p>
                <p className="text-foreground">2026-01-16,PAGO_TARJETA,3000,1234,1414,Pago parcial,OTROS</p>
                <p className="text-muted-foreground mt-1 font-sans">Cuentas: usar nombre o últimos 4 dígitos</p>
              </div>
            </details>

            {importResult && (
              <div className="space-y-2 animate-fade-in">
                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 rounded-lg p-3">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">
                    {importResult.success} de {importResult.total} importadas exitosamente
                  </span>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-3 space-y-1 max-h-32 overflow-y-auto">
                    {importResult.errors.map((err, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-red-700">
                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        {err}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setImportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={importing} className="gap-2">
              {importing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {importing ? "Importando..." : "Importar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
