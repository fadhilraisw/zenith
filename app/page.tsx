import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  // 1. cek status sesi dari sisi server sebelum halaman dimuat
  const { userId } = await auth();

  // 2. jika sistem mendeteksi sudah login, langsung paksa pindah ke dashboard
  if (userId) {
    redirect("/dashboard");
  }

  // 3. jika belum login, barulah halaman landing ini ditampilkan
  return (
    <main className="flex h-[100dvh] w-full flex-col items-center justify-center p-6">
      <div className="text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-[#C8FF00] rounded-2xl flex items-center justify-center mb-6">
          <span className="text-2xl font-black text-black font-mono">Z</span>
        </div>
        
        <h1 className="text-4xl font-black tracking-tighter mb-2 text-[#E8EDE5]">
          ZENITH
        </h1>
        <p className="text-[#5A6E60] tracking-[0.2em] uppercase text-[10px] font-bold mb-10">
          Wealth & Budget Manager
        </p>

        {/* 4. disatukan murni dalam satu baris agar tidak ada celah spasi/enter yang dibaca sebagai child kedua */}
        <SignInButton mode="modal" forceRedirectUrl="/dashboard" signUpForceRedirectUrl="/dashboard"><button className="bg-[#C8FF00] text-black border-none rounded-xl px-8 py-3 font-extrabold cursor-pointer text-[11px] tracking-widest uppercase transition-transform hover:scale-105 active:scale-95">SIGN IN / REGISTER</button></SignInButton>
      </div>
    </main>
  );
}