# 🌿 SplitMint — Expense Splitting, Simplified

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://split-mint-sandy.vercel.app/)

> **SplitMint** is a full-stack expense splitting web application. It lets groups of friends, roommates, or colleagues track shared expenses, compute who owes whom, and settle up — with an AI layer (MintSense) that understands natural language.

---

## 📸 Screenshots

| Dashboard | Balances | MintSense AI |
|-----------|----------|--------------|
| Group overview with summary cards | Settlement suggestions + charts | Natural language expense parsing |

---

## ✨ Features

### 🔐 Authentication
- Email/password registration and login via **Supabase Auth**
- JWT-based session management
- Protected API routes with server-side token verification

### 👥 Groups
- Create groups with a name and up to **3 additional participants** (4 total including primary user)
- Edit group name inline
- Delete group with **cascade handling** (all expenses and splits removed)
- Color-coded participant avatars for visual identification

### 🧑 Participants
- Add participants to a group (up to the 4-person limit)
- **Edit participant name and color** inline — hover any member pill to reveal edit/delete controls
- Remove participants (with linked expense awareness)
- Color picker for personalized avatar colors

### 💸 Expenses
- Add expenses with: amount, description, date, payer, category
- **Three split modes:**
  - **Equal** — amount divided evenly, rounding handled on first participant
  - **Custom Amount** — specify exact rupee amount per person
  - **Percentage** — allocate by percentage (must total 100%)
- Edit and delete expenses
- Category tagging: Food, Travel, Entertainment, Utilities, Shopping, General
- Automatic balance recalculation on every change

### ⚖️ Balance Engine
- Computes net balance per participant across all expenses
- Shows directional amounts (who owes whom and how much)
- **Minimal settlement algorithm** — greedy debt reduction to minimize number of transactions
- Color-coded net balance chart (green = owed money, red = owes money)

### 📊 Visualizations
- Summary cards: Total Spent, Settlements Needed, Total Expenses
- **Recharts bar chart** of net balances per participant
- Detailed breakdown table with per-person owed/owing amounts
- Settlement suggestion cards with directional arrows

### 🔍 Search & Filters
- **Text search** across expense descriptions
- **Filter by payer** (dropdown)
- **Date range filter** — labeled "From" and "To" fields with mutual min/max constraints
- **Amount range filter** — min and max rupee values
- Active filter chips with individual clear buttons
- "Clear all" to reset filters instantly
- Filter count badge on the Filters toggle button

### 🤖 MintSense AI (Powered by Claude)
- Type expenses in plain English: *"Alice paid ₹800 for dinner, split equally among all"*
- AI parses and returns structured expense data (description, amount, payer, category, split mode)
- Preview parsed result before saving
- Example phrases provided for quick onboarding
- **AI Group Summary** — generates a friendly natural-language summary of group spending and settlements

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT) |
| AI | Groq API |
| Charts | Recharts |
| Deployment | Vercel (frontend) + Railway (backend) |

---

## 🗂️ Project Structure

```
splitmint/
├── client/                    # React frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── GroupList.jsx       # Sidebar: group CRUD
│   │   │   ├── GroupDetail.jsx     # Main panel: tabs + participant editor
│   │   │   ├── ExpenseForm.jsx     # Add/edit expense modal
│   │   │   ├── ExpenseList.jsx     # Expense table with filters
│   │   │   ├── BalanceView.jsx     # Charts + settlements
│   │   │   └── MintSense.jsx       # AI expense parser
│   │   ├── lib/
│   │   │   ├── api.js              # Axios wrapper with auth headers
│   │   │   └── supabase.js         # Supabase client
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx        # Login / Register
│   │   │   └── Dashboard.jsx       # Main app shell
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                    # Express API
│   ├── index.js               # All routes + balance engine + AI
│   ├── .env
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- An [Groq API key](https://console.groq.com) (for MintSense)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/splitmint.git
cd splitmint
```

### 2. Set up Supabase
Go to your Supabase project → SQL Editor → run the following:

```sql
CREATE TABLE groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  avatar TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  paid_by UUID REFERENCES participants(id) ON DELETE CASCADE,
  split_mode TEXT CHECK (split_mode IN ('equal', 'custom', 'percentage')) DEFAULT 'equal',
  date DATE DEFAULT CURRENT_DATE,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expense_splits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  percentage NUMERIC(5,2)
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own groups" ON groups FOR ALL USING (auth.uid() = created_by);
CREATE POLICY "Group members see participants" ON participants FOR ALL USING (group_id IN (SELECT id FROM groups WHERE created_by = auth.uid()));
CREATE POLICY "Group members see expenses" ON expenses FOR ALL USING (group_id IN (SELECT id FROM groups WHERE created_by = auth.uid()));
CREATE POLICY "Group members see splits" ON expense_splits FOR ALL USING (expense_id IN (SELECT id FROM expenses WHERE group_id IN (SELECT id FROM groups WHERE created_by = auth.uid())));
```

### 3. Configure the server
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-...
PORT=4000
```

Install and run:
```bash
npm install
npm run dev
# API running on http://localhost:4000
```

### 4. Configure the client
```bash
cd client
cp .env.example .env
```

Edit `client/.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:4000
```

Install and run:
```bash
npm install
npm run dev
# App running on http://localhost:5173
```

---

## ☁️ Deployment

### Frontend → Vercel

1. Push code to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Set **Root Directory** to `client`
4. Add environment variables:
   ```
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   VITE_API_URL=https://your-railway-api.railway.app
   ```
5. Deploy

### Backend → Railway

1. Create a new project on [railway.app](https://railway.app)
2. Connect your GitHub repo
3. Set **Root Directory** to `server`
4. Add environment variables from `server/.env`
5. Railway auto-detects Node.js and deploys

---

## 🧮 Balance Engine — How It Works

The balance engine builds a net balance matrix across all participants:

1. **Per expense:** for each split, the participant owes the payer their share amount
2. **Net balance:** `total owed to you` minus `total you owe others`
3. **Settlement algorithm:** Greedy two-pointer approach
   - Separate participants into debtors (negative balance) and creditors (positive balance)
   - Match debtors to creditors, settling the minimum of the two amounts
   - This produces the **fewest possible transactions** to settle all debts

### Rounding
For equal splits, the remainder from floating-point division is added to the first participant's share, ensuring the total always equals the expense amount exactly.

---

## 🤖 MintSense AI — How It Works

MintSense sends a structured prompt to Groq with:
- The user's natural language statement
- The list of participant names in the group

Groq returns a JSON object with: `description`, `amount`, `paid_by_name`, `split_mode`, `participants`, `category`, and `date`.

The frontend maps participant names back to their database IDs, shows a preview, and lets the user confirm before saving.

---

## 📋 Evaluation Checklist

| Requirement | Status |
|-------------|--------|
| User registration and login | ✅ |
| Create groups (max 3 participants + user) | ✅ |
| Edit group name | ✅ |
| Delete group with cascade | ✅ |
| Store participant color/avatar | ✅ |
| Add participants to group | ✅ |
| Edit participant names and color | ✅ |
| Remove participants | ✅ |
| Add expense with payer, amount, date | ✅ |
| Equal split mode | ✅ |
| Custom amount split mode | ✅ |
| Percentage split mode | ✅ |
| Edit expense | ✅ |
| Delete expense | ✅ |
| Automatic balance recalculation | ✅ |
| Consistent rounding on uneven splits | ✅ |
| Compute who owes whom | ✅ |
| Net balance per participant | ✅ |
| Minimal settlement suggestions | ✅ |
| Summary cards (total spent, settlements, count) | ✅ |
| Balance chart | ✅ |
| Search expenses by text | ✅ |
| Filter by participant | ✅ |
| Filter by date range | ✅ |
| Filter by amount range | ✅ |
| MintSense: natural language → expense | ✅ |
| MintSense: auto-categorize expense | ✅ |
| MintSense: AI group summary | ✅ |

---

## 🔒 Security

- All API routes are protected by JWT verification via Supabase
- Row Level Security (RLS) policies on all Supabase tables — users can only access their own data
- Service Role Key is **never** exposed to the frontend
- Environment variables separated between client (Vite) and server (Node)

