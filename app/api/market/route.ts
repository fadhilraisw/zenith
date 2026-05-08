import { NextResponse } from "next/server";
// 1. HAPUS KURUNG KURAWAL (Import Default)
import YahooFinance from 'yahoo-finance2';

// 2. Inisialisasi Instance
const yahooFinance = new YahooFinance();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ticker = searchParams.get('ticker');

    if (!ticker) return new NextResponse("Ticker is required", { status: 400 });

    // Tarik data langsung dari server Yahoo Finance
    const quote = await yahooFinance.quote(ticker);
    
    if (!quote || !quote.regularMarketPrice) {
       return new NextResponse("Price not found", { status: 404 });
    }

    return NextResponse.json({ price: quote.regularMarketPrice });

  } catch (error) {
    console.error("Market API Error:", error);
    return new NextResponse("Ticker tidak valid atau tidak ditemukan", { status: 404 });
  }
}