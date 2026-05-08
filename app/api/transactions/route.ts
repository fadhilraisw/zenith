import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Asset from "@/models/Asset";

// TAMBAHKAN BARIS INI:
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    await dbConnect();
    const data = await Transaction.find({ userId }).sort({ date: -1 });
    return NextResponse.json(data);
  } catch (error) { return new NextResponse("Error", { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const body = await req.json();
    await dbConnect();

    // 1. Cari aset yang dipilih user
    const asset = await Asset.findOne({ _id: body.assetId, userId });
    if (!asset) return new NextResponse("Asset tidak ditemukan", { status: 404 });

    // 2. Hitung jumlah unit yang akan dipotong/ditambah 
    // (Nominal Transaksi dibagi Harga Aset saat ini. Jika CASH, anggap harga = 1)
    const price = asset.currentPrice > 0 ? asset.currentPrice : 1;
    const quantityChange = body.amount / price;

    // 3. Update Kuantitas Aset!
    if (body.type === "EXPENSE") asset.quantity -= quantityChange;
    if (body.type === "INCOME") asset.quantity += quantityChange;
    await asset.save();

    // 4. Simpan Transaksi
    const newData = await Transaction.create({ ...body, userId });
    return NextResponse.json(newData);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}