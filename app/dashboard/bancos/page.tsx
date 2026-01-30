"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Pencil,
  Trash2,
  Upload,
  X,
  ImageIcon,
} from "lucide-react";

interface Bank {
  id: string;
  name: string;
  shortName: string | null;
  color: string;
  logo: string | null;
  isActive: boolean;
  _count?: {
    accounts: number;
  };
}

export default function BancosPage() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    shortName: "",
    color: "#3B82F6",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const res = await fetch("/api/banks");
      if (res.ok) {
        const data = await res.json();
        setBanks(data);
      }
    } catch (error) {
      console.error("Error fetching banks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let logoPath = editingBank?.logo || null;

      // Upload logo if new file selected
      if (logoFile) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", logoFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formDataUpload,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          logoPath = uploadData.path;
        }
      }

      const payload = {
        name: formData.name,
        shortName: formData.shortName || null,
        color: formData.color,
        logo: logoPath,
      };

      const url = editingBank ? `/api/banks/${editingBank.id}` : "/api/banks";
      const method = editingBank ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setDialogOpen(false);
        resetForm();
        fetchBanks();
      }
    } catch (error) {
      console.error("Error saving bank:", error);
    }
  };

  const handleDelete = async (bankId: string) => {
    const bank = banks.find((b) => b.id === bankId);
    if (bank?._count?.accounts && bank._count.accounts > 0) {
      alert("No puedes eliminar un banco que tiene cuentas asociadas");
      return;
    }

    if (!confirm("¿Estás seguro de eliminar este banco?")) return;

    try {
      const res = await fetch(`/api/banks/${bankId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchBanks();
      }
    } catch (error) {
      console.error("Error deleting bank:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      shortName: "",
      color: "#3B82F6",
    });
    setLogoFile(null);
    setLogoPreview(null);
    setEditingBank(null);
  };

  const openEditDialog = (bank: Bank) => {
    setEditingBank(bank);
    setFormData({
      name: bank.name,
      shortName: bank.shortName || "",
      color: bank.color,
    });
    setLogoPreview(bank.logo);
    setDialogOpen(true);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
          <h1 className="text-2xl font-bold">Catálogo de Bancos</h1>
          <p className="text-muted-foreground">
            Administra los bancos disponibles para tus cuentas
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Banco
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingBank ? "Editar Banco" : "Nuevo Banco"}
              </DialogTitle>
              <DialogDescription>
                {editingBank
                  ? "Modifica los datos del banco"
                  : "Agrega un nuevo banco al catálogo"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Banco</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ej: Banco Industrial"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortName">Nombre Corto (Opcional)</Label>
                <Input
                  id="shortName"
                  value={formData.shortName}
                  onChange={(e) =>
                    setFormData({ ...formData, shortName: e.target.value })
                  }
                  placeholder="Ej: BI"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color del Banco</Label>
                <div className="flex gap-3">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Logo del Banco (Opcional)</Label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  {logoPreview ? (
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="h-24 w-24 mx-auto object-contain rounded"
                      />
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center gap-2 cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="rounded-full bg-muted p-3">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Clic para subir imagen
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, WebP (max 500KB)
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Preview Card */}
              <div className="space-y-2">
                <Label>Vista Previa</Label>
                <div
                  className="rounded-lg border p-4"
                  style={{ borderColor: formData.color }}
                >
                  <div
                    className="h-1 w-full rounded-t -mt-4 -mx-4 mb-4"
                    style={{ backgroundColor: formData.color, width: "calc(100% + 2rem)" }}
                  />
                  <div className="flex items-center gap-3">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="h-10 w-10 object-contain rounded"
                      />
                    ) : (
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${formData.color}20` }}
                      >
                        <Building2
                          className="h-5 w-5"
                          style={{ color: formData.color }}
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">
                        {formData.name || "Nombre del Banco"}
                      </p>
                      {formData.shortName && (
                        <p className="text-xs text-muted-foreground">
                          {formData.shortName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit">
                  {editingBank ? "Guardar Cambios" : "Crear Banco"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Banks Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {banks.map((bank) => (
          <Card key={bank.id} className="relative overflow-hidden">
            <div
              className="absolute top-0 left-0 w-full h-1"
              style={{ backgroundColor: bank.color }}
            />
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {bank.logo ? (
                    <img
                      src={bank.logo}
                      alt={bank.name}
                      className="h-12 w-12 object-contain rounded"
                    />
                  ) : (
                    <div
                      className="h-12 w-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${bank.color}20` }}
                    >
                      <Building2
                        className="h-6 w-6"
                        style={{ color: bank.color }}
                      />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-base">{bank.name}</CardTitle>
                    {bank.shortName && (
                      <p className="text-sm text-muted-foreground">
                        {bank.shortName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded-full border"
                    style={{ backgroundColor: bank.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {bank.color}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {bank._count?.accounts || 0} cuentas
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEditDialog(bank)}
                >
                  <Pencil className="mr-1 h-3 w-3" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => handleDelete(bank.id)}
                  disabled={Boolean(bank._count?.accounts && bank._count.accounts > 0)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {banks.length === 0 && (
        <Card className="p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No hay bancos</h3>
          <p className="text-muted-foreground">
            Comienza agregando tu primer banco
          </p>
          <Button className="mt-4" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Banco
          </Button>
        </Card>
      )}
    </div>
  );
}
