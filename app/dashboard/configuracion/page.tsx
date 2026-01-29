"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Settings,
  DollarSign,
  Bell,
  Save,
  RefreshCw,
  Download,
  Upload,
  Database,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Trash2,
} from "lucide-react";

export default function ConfiguracionPage() {
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    imported?: any;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloadingLogs, setDownloadingLogs] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);
  const [settings, setSettings] = useState({
    exchangeRate: "7.85",
    displayCurrency: "GTQ",
    alertDaysBefore: "3",
    excessDebtThreshold: "80",
    highUsageThreshold: "80",
    lowBalanceThreshold: "1000",
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          exchangeRate: parseFloat(settings.exchangeRate),
          alertDaysBefore: parseInt(settings.alertDaysBefore),
          excessDebtThreshold: parseFloat(settings.excessDebtThreshold),
          highUsageThreshold: parseFloat(settings.highUsageThreshold),
          lowBalanceThreshold: parseFloat(settings.lowBalanceThreshold),
        }),
      });

      if (res.ok) {
        alert("Configuración guardada exitosamente");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleFetchExchangeRate = async () => {
    // In a real app, this would fetch from an API
    alert("En una implementación completa, esto obtendría el tipo de cambio actual del Banguat");
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/backup/export");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `finanzas-backup-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const data = await res.json();
        alert(data.error || "Error al exportar");
      }
    } catch (error) {
      console.error("Error exporting:", error);
      alert("Error al exportar backup");
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadLogs = async () => {
    setDownloadingLogs(true);
    try {
      const res = await fetch("/api/logs?download=true&lines=1000");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `finanzas-logs-${new Date().toISOString().split("T")[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert("Error al descargar logs");
      }
    } catch (error) {
      console.error("Error downloading logs:", error);
      alert("Error al descargar logs");
    } finally {
      setDownloadingLogs(false);
    }
  };

  const handleClearLogs = async () => {
    setClearingLogs(true);
    try {
      const res = await fetch("/api/logs", { method: "DELETE" });
      if (res.ok) {
        alert("Logs limpiados correctamente");
      } else {
        alert("Error al limpiar logs");
      }
    } catch (error) {
      console.error("Error clearing logs:", error);
    } finally {
      setClearingLogs(false);
    }
  };

  const handleImport = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const res = await fetch("/api/backup/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (res.ok) {
        setImportResult({
          success: true,
          message: "Backup importado correctamente",
          imported: result.imported,
        });
      } else {
        setImportResult({
          success: false,
          message: result.error || "Error al importar",
        });
      }
    } catch (error) {
      console.error("Error importing:", error);
      setImportResult({
        success: false,
        message: "Error al leer el archivo. Asegúrate de que sea un JSON válido.",
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">
          Ajusta las preferencias del sistema
        </p>
      </div>

      {/* Currency Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Configuración de Moneda
          </CardTitle>
          <CardDescription>
            Ajusta el tipo de cambio y moneda de visualización
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="exchangeRate">Tipo de Cambio (USD a GTQ)</Label>
              <div className="flex gap-2">
                <Input
                  id="exchangeRate"
                  type="number"
                  step="0.01"
                  value={settings.exchangeRate}
                  onChange={(e) =>
                    setSettings({ ...settings, exchangeRate: e.target.value })
                  }
                  className="flex-1"
                />
                <Button variant="outline" onClick={handleFetchExchangeRate}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Actualizar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                1 USD = Q{settings.exchangeRate}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayCurrency">Moneda de Visualización</Label>
              <Select
                value={settings.displayCurrency}
                onValueChange={(value) =>
                  setSettings({ ...settings, displayCurrency: value })
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
              <p className="text-xs text-muted-foreground">
                Moneda principal para mostrar totales
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Configuración de Alertas
          </CardTitle>
          <CardDescription>
            Personaliza cuándo se generan las alertas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="alertDaysBefore">Días antes del pago para alertar</Label>
            <Select
              value={settings.alertDaysBefore}
              onValueChange={(value) =>
                setSettings({ ...settings, alertDaysBefore: value })
              }
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 día antes</SelectItem>
                <SelectItem value="2">2 días antes</SelectItem>
                <SelectItem value="3">3 días antes</SelectItem>
                <SelectItem value="5">5 días antes</SelectItem>
                <SelectItem value="7">7 días antes</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Alerta de pago próximo de tarjetas
            </p>
          </div>

          <Separator />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="excessDebtThreshold">
                Umbral de exceso de deuda (%)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="excessDebtThreshold"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.excessDebtThreshold}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      excessDebtThreshold: e.target.value,
                    })
                  }
                  className="w-24"
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Alerta cuando la deuda supera este % del disponible
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="highUsageThreshold">
                Umbral de uso alto de tarjeta (%)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="highUsageThreshold"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.highUsageThreshold}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      highUsageThreshold: e.target.value,
                    })
                  }
                  className="w-24"
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Alerta cuando una tarjeta supera este % del límite
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="lowBalanceThreshold">
              Umbral de saldo bajo (Q)
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Q</span>
              <Input
                id="lowBalanceThreshold"
                type="number"
                min="0"
                value={settings.lowBalanceThreshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    lowBalanceThreshold: e.target.value,
                  })
                }
                className="w-32"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Alerta cuando una cuenta baja de este monto
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Backup & Restore */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup y Restauración
          </CardTitle>
          <CardDescription>
            Exporta o importa todos los datos del sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">Exportar Backup</p>
              <p className="text-sm text-muted-foreground">
                Descarga un archivo JSON con todos los datos (cuentas, transacciones, historial, etc.)
              </p>
            </div>
            <Button onClick={handleExport} disabled={exporting} className="gap-2">
              {exporting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {exporting ? "Exportando..." : "Exportar"}
            </Button>
          </div>

          <Separator />

          {/* Import */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Importar Backup</p>
                <p className="text-sm text-muted-foreground">
                  Restaura datos desde un archivo de backup previamente exportado
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  className="hidden"
                  onChange={() => {
                    if (fileInputRef.current?.files?.[0]) {
                      setImportResult(null);
                    }
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Seleccionar Archivo
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={importing || !fileInputRef.current?.files?.[0]}
                      className="gap-2"
                    >
                      {importing ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      Importar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Confirmar Importación
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción importará datos del archivo seleccionado. Los registros existentes
                        con el mismo ID serán actualizados. Esta acción no se puede deshacer fácilmente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleImport}>
                        Sí, Importar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {fileInputRef.current?.files?.[0] && (
              <p className="text-sm text-muted-foreground">
                Archivo seleccionado: <span className="font-medium">{fileInputRef.current.files[0].name}</span>
              </p>
            )}

            {importResult && (
              <div
                className={`flex items-start gap-3 p-4 rounded-lg ${
                  importResult.success
                    ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                    : "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300"
                }`}
              >
                {importResult.success ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-medium">{importResult.message}</p>
                  {importResult.imported && (
                    <div className="mt-2 text-sm space-y-1">
                      <p>Bancos: {importResult.imported.banks}</p>
                      <p>Cuentas: {importResult.imported.accounts}</p>
                      <p>Transacciones: {importResult.imported.transactions}</p>
                      <p>Historial: {importResult.imported.balanceHistory}</p>
                      {importResult.imported.skipped > 0 && (
                        <p className="text-muted-foreground">
                          Omitidos (duplicados): {importResult.imported.skipped}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Logs del Sistema
          </CardTitle>
          <CardDescription>
            Descarga los logs para diagnóstico de errores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">Logs de Aplicación</p>
              <p className="text-sm text-muted-foreground">
                Descarga los últimos 1000 registros del log para análisis
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleDownloadLogs}
                disabled={downloadingLogs}
                className="gap-2"
              >
                {downloadingLogs ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Descargar Logs
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon" disabled={clearingLogs}>
                    {clearingLogs ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Limpiar Logs</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción eliminará todos los registros del log. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearLogs}>
                      Sí, Limpiar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Información del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div>
              <p className="text-muted-foreground">Versión</p>
              <p className="font-medium">1.0.0</p>
            </div>
            <div>
              <p className="text-muted-foreground">Base de Datos</p>
              <p className="font-medium">SQLite</p>
            </div>
            <div>
              <p className="text-muted-foreground">Última Actualización</p>
              <p className="font-medium">
                {new Date().toLocaleDateString("es-GT")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar Configuración
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
