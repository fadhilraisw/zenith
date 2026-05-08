// File: app/api/milestones/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import Milestone from "@/models/Milestone";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    await dbConnect();
    const data = await Milestone.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json(data);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const body = await req.json();
    await dbConnect();
    const newData = await Milestone.create({ ...body, userId });
    return NextResponse.json(newData);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}