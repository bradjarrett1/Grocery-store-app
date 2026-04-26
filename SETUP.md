# Grocery App - Complete Setup Guide

This guide will walk you through setting up the Grocery App from scratch, step by step.

## Part 1: Supabase Setup (5 minutes)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" (create free account if needed)
3. Click "New Project"
4. Fill in:
   - **Name**: grocery-app (or whatever you like)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you
5. Click "Create new project"
6. Wait 2-3 minutes for database to initialize

### Step 2: Run Database Schema

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click "New query"
3. Open `supabase/schema.sql` from this project
4. Copy the ENTIRE contents and paste into SQL Editor
5. Click "Run" (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned"

**What this does:**
- Creates 6 tables (profiles, categories, templates, etc.)
- Sets up Row Level Security (users can only see their own data)
- Seeds 11 default categories (Produce, Dairy, Meat, etc.)
- Creates triggers for auto-creating user profiles

### Step 3: Verify Setup

1. Click **Table Editor** (left sidebar)
2. You should see these tables:
   - profiles
   - categories ← should have 11 rows
   - templates
   - template_items
   - shopping_lists
   - list_items
   - user_preferences
3. Click on `categories` table
4. Verify you see 11 categories: Produce, Dairy, Meat, Bakery, etc.

### Step 4: Get API Credentials

1. Click **Project Settings** (gear icon in left sidebar)
2. Click **API** (left side)
3. Copy these two values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

---

## Part 2: App Configuration (2 minutes)

### Step 1: Install Dependencies

```bash
cd grocery-app
npm install
```

### Step 2: Create .env File

1. Open `.env` file in the project root
2. Replace the placeholder values with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important:**
- Use your ACTUAL values from Step 4 above
- Don't use quotes around the values
- Don't commit `.env` to git (it's in .gitignore)

### Step 3: Start the App

```bash
npm start
```

This will open Expo Dev Tools in your browser.

---

## Part 3: Running on Your Device

### Option A: Run on Physical Phone (Recommended)

#### iOS (iPhone):
1. Install **Expo Go** from App Store
2. Open Expo Go app
3. Tap "Scan QR Code"
4. Scan the QR code from Expo Dev Tools

#### Android:
1. Install **Expo Go** from Google Play Store
2. Open Expo Go app
3. Tap "Scan QR Code"
4. Scan the QR code from Expo Dev Tools

### Option B: Run on Simulator (Mac only for iOS)

#### iOS Simulator:
1. Install Xcode from App Store (if not installed)
2. Press `i` in the terminal where Expo is running
3. iOS Simulator will open with the app

#### Android Emulator:
1. Install Android Studio
2. Set up Android emulator
3. Press `a` in the terminal where Expo is running

---

## Part 4: First-Time App Usage

### Create Your Account

1. App opens to login screen
2. Tap "Sign Up"
3. Enter:
   - Full Name
   - Email
   - Password (min 6 characters)
4. Tap "Sign Up"
5. You'll see "Account created successfully"
6. Tap "OK" and sign in

### Create Your First Template

1. Tap **Templates** tab (bottom navigation)
2. Tap "+ New" (top right)
3. Fill in:
   - **Name**: "Weekly Staples" (or whatever)
   - **Description**: "Items I buy every week" (optional)
4. Tap "+ Add Item"
5. Enter item name (e.g., "Milk")
6. Select category (e.g., "Dairy")
7. Enter quantity (e.g., "1 gallon") - optional
8. Tap "Add"
9. Repeat for 5-10 items
10. Tap "Save"

### Create Your First Shopping List

1. Tap **Shopping** tab (bottom navigation)
2. Tap "New Shopping Trip"
3. Select your template
4. All items are checked by default
5. Uncheck any items you don't need this week
6. Tap "+ Custom Item" to add one-off items (optional)
7. Tap "Create"
8. Your shopping list is ready!

### Go Shopping

1. Your active shopping list appears on Shopping tab
2. Items are organized by aisle (Produce → Dairy → Meat, etc.)
3. Tap items to check them off as you shop
4. Progress bar shows how many items left
5. When done, tap "Complete ✓" (top right)
6. List moves to History tab

---

## Troubleshooting

### "Missing Supabase credentials" warning

**Problem:** App can't connect to Supabase

**Fix:**
1. Check that `.env` file exists in project root
2. Verify URL and key are correct (no quotes, no spaces)
3. Restart Expo dev server: Ctrl+C, then `npm start`

### App crashes on signup/login

**Problem:** Database not set up correctly

**Fix:**
1. Go to Supabase → SQL Editor
2. Re-run the `schema.sql` file
3. Go to Authentication → Providers
4. Make sure "Email" is enabled

### "No categories" when adding items

**Problem:** Categories table is empty

**Fix:**
1. Go to Supabase → Table Editor → categories
2. Check if there are 11 rows
3. If empty, re-run the `schema.sql` file

### Changes not syncing

**Problem:** Row Level Security blocking queries

**Fix:**
1. Go to Supabase → Authentication → Users
2. Verify your user exists
3. Go to Table Editor → profiles
4. Verify a profile was created for your user
5. If not, try signing up again with a different email

### App won't load on phone

**Problem:** Phone and computer not on same network

**Fix:**
1. Make sure phone and computer are on same WiFi
2. Try scanning QR code again
3. If still failing, try `expo start --tunnel` (slower but works anywhere)

---

## Next Steps

### Customize Categories

Add your own categories:

1. Go to Supabase → Table Editor → categories
2. Click "Insert row"
3. Fill in:
   - **name**: "Pet Supplies"
   - **color**: "#8B5CF6" (hex color)
   - **default_aisle_order**: 12
   - **is_system**: true
4. Click "Save"

### Customize Aisle Order

The default order is:
1. Produce
2. Dairy
3. Meat & Seafood
4. Bakery
5. Pantry
6. Frozen
7. Beverages
8. Snacks
9. Health & Beauty
10. Household
11. Other

To change this, edit the `default_aisle_order` values in the categories table.

### Deploy to App Stores

See README.md → Deployment section for instructions on:
- Publishing to TestFlight (iOS)
- Publishing to Google Play (Android)

---

## Support

If you run into issues:

1. Check Supabase → Logs for errors
2. Check Expo dev server console for warnings
3. Try signing out and back in
4. Try creating a new Supabase project and starting fresh

**Still stuck?** The most common issue is:
- Forgot to run `schema.sql` completely
- Wrong Supabase credentials in `.env`
- Phone and computer on different WiFi networks

---

**You're all set!** Enjoy your grocery app 🛒
