import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Asset from "@/models/Asset";

// PERUBAHAN DI SINI: params diubah menjadi Promise
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    await dbConnect();
    
    // PERUBAHAN DI SINI: Kita wajib melakukan await pada params
    const params = await props.params;
    const id = params.id;

    // 1. Cari transaksi yang mau dihapus menggunakan id yang sudah di-await
    const tx = await Transaction.findOne({ _id: id, userId });
    if (!tx) return new NextResponse("Transaction Not Found", { status: 404 });

    // 2. Coba kembalikan saldo HANYA JIKA asetnya masih ada
    if (tx.assetId) {
      try {
        const asset = await Asset.findOne({ _id: tx.assetId, userId });
        if (asset) {
          const price = asset.currentPrice > 0 ? asset.currentPrice : 1;
          const quantityChange = tx.amount / price;
          
          if (tx.type === "EXPENSE") asset.quantity += quantityChange;
          if (tx.type === "INCOME") asset.quantity -= quantityChange;  
          
          await asset.save();
        }
      } catch (assetError) {
        console.warn("Aset sudah terhapus, skip proses refund.");
      }
    }

    // 3. Hapus transaksi secara permanen
    await Transaction.findByIdAndDelete(tx._id);
    
    return new NextResponse("Transaction Deleted", { status: 200 });

  } catch (error: any) { 
    console.error("Gagal menghapus transaksi:", error);
    return new NextResponse(error.message || "Internal Server Error", { status: 500 }); 
  }
}