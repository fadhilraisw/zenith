import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import Analysis from "@/models/Analysis";

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    await dbConnect();
    const params = await props.params; 
    
    const deleted = await Analysis.findOneAndDelete({ _id: params.id, userId });
    if (!deleted) return new NextResponse("Not Found", { status: 404 });
    return NextResponse.json({ message: "Deleted" });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const body = await req.json();
    await dbConnect();
    const params = await props.params; 

    const updated = await Analysis.findOneAndUpdate({ _id: params.id, userId }, { $set: body }, { new: true });
    return NextResponse.json(updated);
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}