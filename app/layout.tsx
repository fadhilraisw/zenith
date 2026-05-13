import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zenith Wealth Manager",
  description: "Advanced asset and budget tracking system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider 
      appearance={{ 
        baseTheme: dark, // Wajib ada untuk mematikan mode terang bawaan
        variables: {
        colorBackground: '#161E19',
        colorPrimary: '#C8FF00', 
        colorDanger: '#E05A3A',
        
        // pakai nama variabel terbaru clerk:
        colorForeground: '#FFFFFF',        // teks utama putih (pengganti colorText)
        colorMutedForeground: '#FFFFFF',   // teks sub-judul/label putih (pengganti colorTextSecondary)
        colorInputForeground: '#FFFFFF',   // teks dalam input putih (pengganti colorInputText)
        colorPrimaryForeground: '#000000', // teks tombol primary hitam (pengganti colorTextOnPrimaryBackground)
          },
      elements: {


          // --- FIX: USER PROFILE MODAL (MANAGE ACCOUNT) ---
          profileSectionTitleText: { color: "#ffffff" },
          profileSectionTitle: { borderBottom: "1px solid #2a3530" },
          profileSectionPrimaryText: { color: "#ffffff" },
          navbarButton: { color: "#9ca3af" },
          navbarButton__active: { color: "#c8ff00" },
          breadcrumbsItem: { color: "#ffffff" },
          modalCloseButton: { color: "#ffffff" },
          accordionTriggerButton: { color: "#ffffff" },
         // teks panel kiri ("account", "manage your account info")
          profilePageTitleText: { color: "#ffffff" },
          profilePageSubtitleText: { color: "#8a9e7a" },

          // teks panel kanan ("password", "active devices", dll)
          profileSectionTitleText: { color: "#ffffff" },
          profileSectionPrimaryText: { color: "#ffffff" },

          // teks footer bawah ("secured by", "development mode")
          footerActionText: { color: "#8a9e7a" },
          badge: { color: "#ffffff", backgroundColor: "rgba(255, 255, 255, 0.1)", borderColor: "rgba(255, 255, 255, 0.1)" },

          headerTitle: { color: "#FFFFFF" },
          headerSubtitle: { color: "#9CA3AF" },
          
          socialButtonsBlockButtonText: { color: "#FFFFFF", fontWeight: "600" },
          socialButtonsBlockButton: { 
            backgroundColor: "rgba(42, 53, 48, 0.4)", 
            backdropFilter: "blur(12px)", 
            WebkitBackdropFilter: "blur(12px)", 
            borderColor: "rgba(255, 255, 255, 0.08)",
            color: "#FFFFFF", // Memaksa elemen teks ekstra di dalam tombol ini jadi putih
          },
          // FIX: Label "Last used" dari Clerk biasanya menggunakan elemen badge
          badge: {
            color: "#FFFFFF",
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            borderColor: "rgba(255, 255, 255, 0.1)"
          },
          
          formFieldLabel: { color: "#D1D5DB" },
          formFieldInput: { color: "#FFFFFF", borderColor: "#374151" },
          dividerText: { color: "#6B7280" },
          footerActionText: { color: "#9CA3AF" },
          footerActionLink: { color: "#C8FF00" },
          modalBackdrop: { backgroundColor: "#0A0A0B", alignItems: "center", justifyContent: "center" },
          
          userPreviewMainIdentifier: { color: "#FFFFFF", fontWeight: "bold" }, 
          userPreviewSecondaryIdentifier: { color: "#9CA3AF" }, 
          
          // --- FIX: USER PROFILE POPOVER ---
          // Memaksa warna putih langsung ke komponen Button utamanya
          userButtonPopoverActionButton: { 
            color: "#FFFFFF",
          }, 
          userButtonPopoverActionButtonText: { 
            color: "#FFFFFF", 
          }, 
          userButtonPopoverActionButtonIcon: { 
            color: "#FFFFFF", 
          }, 
          
          userButtonPopoverCard: { backgroundColor: "#1C2420", borderColor: "#2A3530" }, 
          userButtonPopoverFooter: { display: "none" } 
        }
      }}
    >
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="h-full flex flex-col bg-[#0A0A0B] text-[#E8EDE5]">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}