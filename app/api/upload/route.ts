import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó archivo" },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no válido. Use PNG, JPG o WebP." },
        { status: 400 }
      );
    }

    // Validate file size (max 500KB for logos)
    if (file.size > 500 * 1024) {
      return NextResponse.json(
        { error: "El archivo es muy grande. Máximo 500KB para logos." },
        { status: 400 }
      );
    }

    // Convert to Base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({ path: dataUrl }, { status: 201 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
