# Admin Authentication Setup

This guide explains how to set up admin authentication for the Great Circle Calculator so that only authenticated admins can delete saved routes.

## How It Works

- **Guests** can view saved routes, share links, and open routes
- **Admins** (when logged in) can also delete routes
- Delete button only appears when logged in as admin
- Authentication uses Supabase Auth

## Step 1: Enable Email Authentication in Supabase

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: **hwtkuhqvusahutheitvp**
3. Click **Authentication** in the left sidebar
4. Click **Providers** tab
5. Make sure **Email** is enabled
6. Under Email settings:
   - Disable "Confirm email" (or set up SMTP if you want email confirmation)
   - Save changes

## Step 2: Create an Admin User

### Option A: Using Supabase Dashboard (Recommended)

1. In Supabase Dashboard, go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter:
   - Email: `admin@yourdomain.com` (or any email you want)
   - Password: Choose a strong password
   - Auto Confirm User: **YES** (check this box)
4. Click **Create user**

### Option B: Using SQL

1. Go to **SQL Editor** in Supabase
2. Run this query:

```sql
-- Create admin user with auto-confirmed email
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  raw_app_meta_data,
  raw_user_meta_data
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@example.com',  -- Change this to your email
  crypt('your-password-here', gen_salt('bf')),  -- Change this to your password
  NOW(),
  NOW(),
  NOW(),
  '',
  '{"provider":"email","providers":["email"]}',
  '{}'
);
```

**Important:** Replace `admin@example.com` and `your-password-here` with your actual credentials.

## Step 3: Test the Login

1. Deploy your app (or run locally)
2. Click **🔐 Admin Login** button in the header
3. Enter your admin credentials
4. You should see **🔓 Logout Admin** button appear
5. Go to **📁 Saved Routes**
6. The **🗑️** (delete) button should now be visible for each route

## Security Features

- Delete operations require valid authentication token
- Tokens are verified server-side with Supabase
- Expired tokens are automatically rejected
- Session stored in localStorage (cleared on logout)
- Guests cannot delete routes even if they try to bypass the UI

## Troubleshooting

### "Invalid login credentials" error

- Check that the email and password are correct
- Verify the user exists in Authentication → Users
- Make sure "Auto Confirm User" was enabled when creating the user
- If using Option B (SQL), ensure the password was hashed correctly

### Delete button not appearing after login

- Check browser console for errors
- Verify admin_session token exists in localStorage (F12 → Application → Local Storage)
- Try logging out and logging in again

### "Authentication required" when trying to delete

- Your session may have expired
- Log out and log back in
- Check that the token is being sent in the Authorization header

### Can't create user via SQL

Make sure you have the `pgcrypto` extension enabled:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

## Multiple Admin Users

You can create multiple admin users by repeating Step 2 with different email addresses. All authenticated users can delete routes.

## Changing Admin Password

1. Go to **Authentication** → **Users** in Supabase Dashboard
2. Find the user and click the three dots (•••)
3. Click **Reset Password**
4. Enter new password
5. Save changes
