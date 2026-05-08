import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import Budget from "@/models/Budget";

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    
    await dbConnect();
    const params = await props.params; // WAJIB DI-AWAIT
    
    const deleted = await Budget.findOneAndDelete({ _id: params.id, userId });
    if (!deleted) return new NextResponse("Budget tidak ditemukan", { status: 404 });
    
    return new NextResponse("Deleted", { status: 200 });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

// TAMBAHKAN FUNGSI PUT UNTUK EDIT/UPDATE
export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    
    const body = await req.json();
    await dbConnect();
    const params = await props.params;
    
    const updated = await Budget.findOneAndUpdate(
      { _id: params.id, userId },
      { $set: body },
      { new: true }
    );
    
    return NextResponse.json(updated);
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}