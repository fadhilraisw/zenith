This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.



# 🚀 ZENITH: Wealth & Budget Manager (AI Quant Engine)

Zenith is an elite, AI-powered financial dashboard designed to act as a personal Quant Engine and Behavioral Finance Expert. It tracks assets, transactions, budgets, and milestones, and uses state-of-the-art LLMs (Google Gemini & Groq) to generate highly analytical, actionable, and data-driven financial reports.

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** MongoDB (Mongoose)
- **Authentication:** Clerk
- **AI Integration:** Google Gemini API & Groq API
- **Styling:** Tailwind CSS / Custom CSS

## 📋 Requirements

Before running this project, make sure you have the following installed:
- Node.js (v18 or higher)
- npm or pnpm
- MongoDB Atlas account (or local MongoDB server)
- Clerk account for authentication
- API Keys for Google AI Studio (Gemini) and Groq

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory and add the following keys. **Do not commit this file to GitHub.**

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/zenith

# AI Providers
GEMINI_API_KEY=AIzaSy...
GROQ_API_KEY=gsk_...


🚀 Getting Started
Clone the repository:


git clone [https://github.com/YOUR_USERNAME/zenith.git](https://github.com/YOUR_USERNAME/zenith.git)
cd zenith/zenith-app

npm install

npm run dev

Open http://localhost:3000 with your browser to see the result.

zenith/zenith-app
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── app
|  ├── api
|  |  ├── ai
|  |  ├── analysis
|  |  ├── assets
|  |  ├── budgets
|  |  ├── market
|  |  ├── milestones
|  |  └── transactions
|  ├── dashboard
|  |  └── page.tsx
|  ├── favicon.ico
|  ├── globals.css
|  ├── layout.tsx
|  └── page.tsx
├── lib
|  ├── mongodb.ts
|  └── mongoose.ts
├── middleware.js
├── models
|  ├── Analysis.ts
|  ├── Asset.ts
|  ├── Budget.ts
|  ├── Milestone.ts
|  └── Transaction.ts
├── package.json
└── tsconfig.json

🧠 AI Engine Features
Zenith includes a dual-engine AI module using both Google Gemini and Groq architectures. It explicitly analyzes:

Cashflow & Liquidity Forecast: Burn rate, runway, and liquidity buffering.

Asset & Quant Strategy: Portfolio weighting, implied VaR (Value at Risk), and rebalancing alerts.

Behavioral Insights & Anomalies: Spending patterns, psychological triggers, and fee leakages.

Quest & Milestone Execution: Progress tracking towards financial goals.

System Debugging: Built-in real-time API model fetching for both Gemini and Groq environments.