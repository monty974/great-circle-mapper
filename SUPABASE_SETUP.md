# Supabase Saved Routes Setup

## Step-by-Step Instructions

### 1. Open Supabase SQL Editor

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Log in to your account
3. Select your project: **hwtkuhqvusahutheitvp**
4. Click **SQL Editor** in the left sidebar
5. Click **New Query** button

### 2. Run the Migration SQL

1. Open the file `supabase-migration.sql` in this repository
2. Copy ALL the contents
3. Paste into the SQL Editor
4. Click **Run** (or press Ctrl+Enter)

### 3. Verify Success

You should see messages at the bottom:
- "Table created successfully!"
- "current_row_count: 0"

### 4. Test the Setup

1. Deploy your app to Vercel (or run locally)
2. Create a route (e.g., MEL → LHR)
3. Click "Calculate All Routes"
4. Click "📋 Share Link"
5. Click "📁 Saved Routes" button in header
6. You should see your saved route!

## Troubleshooting

### "Table already exists" error
This is fine! The script uses `CREATE TABLE IF NOT EXISTS`, so it won't cause issues.

### Routes not saving
1. Check browser console (F12) for errors
2. Verify the API endpoint is deployed to Vercel
3. Make sure Supabase environment variables are set in Vercel:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

### Permission denied errors
The script sets up Row Level Security (RLS) with public access policies. If you still get permission errors, you can temporarily disable RLS:

```sql
ALTER TABLE saved_routes DISABLE ROW LEVEL SECURITY;
```

## What This Creates

The migration creates:
- **saved_routes** table with columns:
  - `id` - Auto-incrementing primary key
  - `name` - Display name (e.g., "MEL → LHR, SYD → BKK")
  - `url` - Full shareable URL
  - `route_count` - Number of routes in the calculation
  - `created_at` - Timestamp when route was saved
- **Index** on `created_at` for fast sorting
- **RLS Policies** for public read/write access
