import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import Asset from "@/models/Asset";

// 1. FUNGSI UNTUK MENGHAPUS ASSET
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    
    await dbConnect();
    const params = await props.params; // Wajib di-await di Next 16
    
    const deletedAsset = await Asset.findOneAndDelete({ _id: params.id, userId });
    
    if (!deletedAsset) return new NextResponse("Aset tidak ditemukan", { status: 404 });
    return new NextResponse("Deleted", { status: 200 });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

// 2. FUNGSI UNTUK UPDATE / EDIT / TOP-UP ASSET
// di app/api/assets/[id]/route.ts
export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    const params = await props.params; // pastikan di-await untuk next.js 16

    await dbConnect();
    
    // gunakan findOneAndUpdate untuk memastikan dokumen ditemukan dan diupdate
    const updated = await Asset.findOneAndUpdate(
      { _id: params.id, userId }, 
      { $set: body }, 
      { new: true } 
    );

    if (!updated) return new NextResponse("aset tidak ditemukan", { status: 404 });
    return NextResponse.json(updated);
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}