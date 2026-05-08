// File: app/api/budgets/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import Budget from "@/models/Budget";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    await dbConnect();
    const data = await Budget.find({ userId });
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
    const newData = await Budget.create({ ...body, userId });
    return NextResponse.json(newData);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}