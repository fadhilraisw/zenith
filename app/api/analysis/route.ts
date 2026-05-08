import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import Analysis from "@/models/Analysis";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("unauthorized", { status: 401 });
    
    await dbConnect();
    const analyses = await Analysis.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json(analyses);
  } catch (error: any) {
    return new NextResponse(error.message || "Gagal mengambil data", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("unauthorized", { status: 401 });
    
    const body = await req.json();
    await dbConnect();
    
    const newAnalysis = await Analysis.create({ ...body, userId });
    return NextResponse.json(newAnalysis);
  } catch (error: any) {
    // Memastikan pesan error selalu terkirim, tidak blank
    return new NextResponse(error.message || "Terjadi kesalahan saat menyimpan ke MongoDB", { status: 500 });
  }
}