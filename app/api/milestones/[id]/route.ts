import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import Milestone from "@/models/Milestone"; // Sesuaikan dengan nama model database-mu

// FUNGSI UNTUK MENGHAPUS QUEST PERMANEN
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    
    await dbConnect();
    const params = await props.params; 
    
    const deletedMilestone = await Milestone.findOneAndDelete({ _id: params.id, userId });
    
    if (!deletedMilestone) return new NextResponse("Quest tidak ditemukan", { status: 404 });
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

// FUNGSI UNTUK EDIT & CLAIM QUEST
export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    
    const body = await req.json();
    await dbConnect();
    const params = await props.params; 
    
    const updated = await Milestone.findOneAndUpdate(
      { _id: params.id, userId },
      { $set: body },
      { new: true }
    );
    
    if (!updated) return new NextResponse("Quest tidak ditemukan", { status: 404 });
    return NextResponse.json(updated);
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}