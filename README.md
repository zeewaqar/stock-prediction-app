# 📈 Stock Prediction App

An AI-powered stock forecasting app built with Next.js, shadcn/ui, Prisma, and the Groq API (Mistral model). Predicts the next 7 days of stock prices and tracks historical accuracy with real-time dashboards and charts.

---

## ✨ Features

* 🔮 Predicts next 7 closing prices using Groq + Mistral
* 📊 Real-time dashboard with MAE, MSE, and accuracy metrics
* 📉 Charts with Recharts (actual vs. predicted)
* ✅ Manual + cron-based actual price updates
* ♻️ Live data auto-refresh and symbol filtering
* 🔍 Combobox symbol search with autocomplete
* 📤 CSV export support (optional extension)

---

## 🧱 Tech Stack

| Layer    | Tech                    |
| -------- | ----------------------- |
| Frontend | Next.js 14 App Router   |
| UI       | TailwindCSS + shadcn/ui |
| Charts   | Recharts                |
| Backend  | API Routes              |
| ORM      | Prisma                  |
| DB       | PostgreSQL or SQLite    |
| AI Model | Groq API (Mistral)      |

---

## ⚙️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/stock-prediction-app.git
cd stock-prediction-app
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment

Create a `.env` file in the root:

```env
DATABASE_URL=postgresql://localhost:5432/stock_db
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=mistral-saba-24b
```

### 4. Initialize Prisma

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Start the App

```bash
pnpm dev
```

---

## 🔌 API Endpoints

| Endpoint              | Method | Description                           |
| --------------------- | ------ | ------------------------------------- |
| `/api/stocks`         | POST   | Fetch historical stock data           |
| `/api/predict`        | POST   | Submit historical data for prediction |
| `/api/predictions`    | GET    | Get past predictions with filtering   |
| `/api/update-actuals` | GET    | Update actual prices for predictions  |
| `/api/symbols`        | GET    | Returns unique stock symbols          |

---

## 🧠 Groq Prompt Example

```text
You are a financial analyst. Given historical closing prices, predict the next 7 calendar days closing prices. Respond **only** with a JSON array like:

[{"date":"YYYY-MM-DD","predicted_price":123.45}, ...]
```

---

## 🛆 Optional Enhancements

* ⛔ Authentication with Clerk/Auth.js
* 🧪 Backtesting with pasted data
* 📂 User watchlists & favorites
* 💬 Explainable AI output
* ✉️ Email notifications for updates

---

## 📜 License

MIT — Free for commercial and personal use.

---

## 🤝 Contributing

PRs welcome! Please open an issue first for major suggestions.
