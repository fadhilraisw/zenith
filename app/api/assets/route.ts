import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import Asset from "@/models/Asset";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    await dbConnect();
    const data = await Asset.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json(data);
  } catch (error: any) { 
    return new NextResponse(error.message || "Error saat mengambil data", { status: 500 }); 
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    
    const body = await req.json();
    await dbConnect();
    
    // Coba simpan ke database
    const newAsset = await Asset.create({ ...body, userId });
    
    return NextResponse.json(newAsset);
  } catch (error: any) {
    // Tulis error secara detail di terminal
    console.error("🔥 POST Asset Error:", error);
    
    // Kirim pesan error aslinya kembali ke layar UI
    return new NextResponse(error.message || "Terjadi kesalahan server misterius", { status: 500 });
  }
}