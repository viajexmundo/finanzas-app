"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Building2,
  CreditCard,
  Banknote,
  Wallet,
  Pencil,
  Trash2,
  DollarSign,
} from "lucide-react";
import { formatCurrency, getAccountTypeLabel } from "@/lib/utils";

interface Bank {
  id: string;
  name: string;
  shortName: string | null;
  color: string;
  logo: string | null;
}

interface Account {
  id: string;
  name: string;
  type: "BANK" | "CREDIT_CARD" | "CASH" | "WALLET";
  currency: "GTQ" | "USD";
  balance: number;
  notes: string | null;
  creditLimit: number | null;
  cutoffDay: number | null;
  paymentDay: number | null;
  lastFourDigits: string | null;
  bank: Bank | null;
}

const accountIcons = {
  BANK: Building2,
  CREDIT_CARD: CreditCard,
  CASH: Banknote,
  WALLET: Wallet,
};

export default function CuentasPage() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [newBalance, setNewBalance] = useState("");
  const [balanceNote, setBalanceNote] = useState("");

  const canEdit = session?.user?.role === "ADMIN" || session?.user?.role === "EDITOR";
  const canDelete = session?.user?.role === "ADMIN";

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "BANK" as Account["type"],
    currency: "GTQ" as Account["currency"],
    balance: "",
    notes: "",
    bankId: "",
    creditLimit: "",
    cutoffDay: "",
    paymentDay: "",
    lastFourDigits: "",
  });

  useEffect(() => {
    fetchAccounts();
    fetchBanks();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await fetch("/api/banks");
      if (res.ok) {
        const data = await res.json();
        setBanks(data);
      }
    } catch (error) {
      console.error("Error fetching banks:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      balance: parseFloat(formData.balance) || 0,
      creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : null,
      cutoffDay: formData.cutoffDay ? parseInt(formData.cutoffDay) : null,
      paymentDay: formData.paymentDay ? parseInt(formData.paymentDay) : null,
      bankId: formData.bankId || null,
      lastFourDigits: formData.lastFourDigits || null,
    };

    try {
      const url = editingAccount
        ? `/api/accounts/${editingAccount.id}`
        : "/api/accounts";
      const method = editingAccount ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setDialogOpen(false);
        resetForm();
        fetchAccounts();
      } else {
        const errorData = await res.json();
        console.error("Error response:", errorData);
        alert(`Error: ${errorData.error || "No se pudo guardar la cuenta"}`);
      }
    } catch (error) {
      console.error("Error saving account:", error);
      alert("Error de conexión al guardar la cuenta");
    }
  };

  const handleUpdateBalance = async () => {
    if (!selectedAccount) return;

    try {
      const res = await fetch(`/api/accounts/${selectedAccount.id}/balance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          balance: parseFloat(newBalance),
          notes: balanceNote,
        }),
      });

      if (res.ok) {
        setBalanceDialogOpen(false);
        setNewBalance("");
        setBalanceNote("");
        setSelectedAccount(null);
        fetchAccounts();
      }
    } catch (error) {
      console.error("Error updating balance:", error);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta cuenta?")) return;

    try {
      const res = await fetch(`/api/accounts/${accountId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchAccounts();
      }
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "BANK",
      currency: "GTQ",
      balance: "",
      notes: "",
      bankId: "",
      creditLimit: "",
      cutoffDay: "",
      paymentDay: "",
      lastFourDigits: "",
    });
    setEditingAccount(null);
  };

  const openEditDialog = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      currency: account.currency,
      balance: account.balance.toString(),
      notes: account.notes || "",
      bankId: account.bank?.id || "",
      creditLimit: account.creditLimit?.toString() || "",
      cutoffDay: account.cutoffDay?.toString() || "",
      paymentDay: account.paymentDay?.toString() || "",
      lastFourDigits: account.lastFourDigits || "",
    });
    setDialogOpen(true);
  };

  const openBalanceDialog = (account: Account) => {
    setSelectedAccount(account);
    setNewBalance(account.balance.toString());
    setBalanceDialogOpen(true);
  };

  const groupedAccounts = accounts.reduce((acc, account) => {
    if (!acc[account.type]) {
      acc[account.type] = [];
    }
    acc[account.type].push(account);
    return acc;
  }, {} as Record<string, Account[]>);

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
          <h1 className="text-2xl font-bold">Gestión de Cuentas</h1>
          <p className="text-muted-foreground">
            Administra tus cuentas bancarias, tarjetas y efectivo
          </p>
        </div>
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Cuenta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingAccount ? "Editar Cuenta" : "Nueva Cuenta"}
                </DialogTitle>
                <DialogDescription>
                  {editingAccount
                    ? "Modifica los datos de la cuenta"
                    : "Agrega una nueva cuenta al sistema"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ej: Cuenta de Ahorros BI"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: Account["type"]) =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BANK">Cuenta Bancaria</SelectItem>
                        <SelectItem value="CREDIT_CARD">Tarjeta de Crédito</SelectItem>
                        <SelectItem value="CASH">Efectivo</SelectItem>
                        <SelectItem value="WALLET">Wallet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Moneda</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value: Account["currency"]) =>
                        setFormData({ ...formData, currency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GTQ">Quetzales (Q)</SelectItem>
                        <SelectItem value="USD">Dólares ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(formData.type === "BANK" || formData.type === "CREDIT_CARD") && (
                  <div className="space-y-2">
                    <Label htmlFor="bank">Banco</Label>
                    <Select
                      value={formData.bankId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, bankId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar banco" />
                      </SelectTrigger>
                      <SelectContent>
                        {banks.map((bank) => (
                          <SelectItem key={bank.id} value={bank.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: bank.color }}
                              />
                              {bank.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(formData.type === "BANK" || formData.type === "CREDIT_CARD") && (
                  <div className="space-y-2">
                    <Label htmlFor="lastFourDigits">Últimos 4 dígitos</Label>
                    <Input
                      id="lastFourDigits"
                      value={formData.lastFourDigits}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setFormData({ ...formData, lastFourDigits: val });
                      }}
                      placeholder="Ej: 1414"
                      maxLength={4}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="balance">
                    {formData.type === "CREDIT_CARD" ? "Saldo Actual (Deuda)" : "Saldo"}
                  </Label>
                  <Input
                    id="balance"
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) =>
                      setFormData({ ...formData, balance: e.target.value })
                    }
                    placeholder="0.00"
                    required
                  />
                </div>

                {formData.type === "CREDIT_CARD" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="creditLimit">Límite de Crédito</Label>
                      <Input
                        id="creditLimit"
                        type="number"
                        step="0.01"
                        value={formData.creditLimit}
                        onChange={(e) =>
                          setFormData({ ...formData, creditLimit: e.target.value })
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cutoffDay">Día de Corte</Label>
                        <Input
                          id="cutoffDay"
                          type="number"
                          min="1"
                          max="31"
                          value={formData.cutoffDay}
                          onChange={(e) =>
                            setFormData({ ...formData, cutoffDay: e.target.value })
                          }
                          placeholder="15"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paymentDay">Día de Pago</Label>
                        <Input
                          id="paymentDay"
                          type="number"
                          min="1"
                          max="31"
                          value={formData.paymentDay}
                          onChange={(e) =>
                            setFormData({ ...formData, paymentDay: e.target.value })
                          }
                          placeholder="25"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Notas adicionales..."
                  />
                </div>

                <DialogFooter>
                  <Button type="submit">
                    {editingAccount ? "Guardar Cambios" : "Crear Cuenta"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Account Groups */}
      {Object.entries(groupedAccounts).map(([type, typeAccounts]) => {
        const Icon = accountIcons[type as keyof typeof accountIcons];
        const isDebt = type === "CREDIT_CARD";

        return (
          <div key={type} className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Icon className="h-5 w-5" />
              {getAccountTypeLabel(type)}
              <Badge variant="secondary">{typeAccounts.length}</Badge>
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {typeAccounts.map((account) => (
                <Card key={account.id} className="relative overflow-hidden">
                  {account.bank && (
                    <div
                      className="absolute top-0 left-0 w-full h-1"
                      style={{ backgroundColor: account.bank.color }}
                    />
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {account.bank?.logo ? (
                          <img
                            src={account.bank.logo}
                            alt={account.bank.name}
                            className="h-10 w-10 rounded-lg object-contain bg-muted p-1"
                          />
                        ) : account.bank ? (
                          <div
                            className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                            style={{ backgroundColor: account.bank.color }}
                          >
                            {account.bank.shortName || account.bank.name.slice(0, 2).toUpperCase()}
                          </div>
                        ) : null}
                        <div>
                          <CardTitle className="text-base">
                            {account.name}
                            {account.lastFourDigits && (
                              <span className="text-muted-foreground font-normal text-sm ml-2">
                                ••••{account.lastFourDigits}
                              </span>
                            )}
                          </CardTitle>
                          {account.bank && (
                            <p className="text-sm text-muted-foreground">
                              {account.bank.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant={account.currency === "USD" ? "secondary" : "outline"}>
                        {account.currency}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${
                        isDebt ? "text-negative" : "text-positive"
                      }`}
                    >
                      {formatCurrency(account.balance, account.currency)}
                    </div>

                    {account.type === "CREDIT_CARD" && account.creditLimit && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Uso del límite</span>
                          <span>
                            {((account.balance / account.creditLimit) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              (account.balance / account.creditLimit) * 100 > 80
                                ? "bg-negative"
                                : "bg-primary"
                            }`}
                            style={{
                              width: `${Math.min(
                                (account.balance / account.creditLimit) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Límite: {formatCurrency(account.creditLimit, account.currency)}
                        </p>
                        {account.paymentDay && (
                          <p className="text-xs text-muted-foreground">
                            Pago: día {account.paymentDay}
                          </p>
                        )}
                      </div>
                    )}

                    {account.notes && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {account.notes}
                      </p>
                    )}

                    {canEdit && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => openBalanceDialog(account)}
                        >
                          <DollarSign className="mr-1 h-3 w-3" />
                          Actualizar Saldo
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(account)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDelete(account.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {accounts.length === 0 && (
        <Card className="p-12 text-center">
          <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No hay cuentas</h3>
          <p className="text-muted-foreground">
            Comienza agregando tu primera cuenta
          </p>
          {canEdit && (
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Cuenta
            </Button>
          )}
        </Card>
      )}

      {/* Update Balance Dialog */}
      <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar Saldo</DialogTitle>
            <DialogDescription>
              {selectedAccount?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Saldo Actual</Label>
              <p className="text-2xl font-bold">
                {selectedAccount && formatCurrency(selectedAccount.balance, selectedAccount.currency)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newBalance">Nuevo Saldo</Label>
              <Input
                id="newBalance"
                type="number"
                step="0.01"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="balanceNote">Nota (opcional)</Label>
              <Input
                id="balanceNote"
                value={balanceNote}
                onChange={(e) => setBalanceNote(e.target.value)}
                placeholder="Razón del cambio..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateBalance}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
