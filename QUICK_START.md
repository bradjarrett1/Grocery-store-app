# Grocery App - Quick Start (5 Minutes)

## Prerequisites
- Node.js installed
- Smartphone with camera (to scan QR code)

## Setup

### 1. Supabase (2 minutes)
1. Go to [supabase.com](https://supabase.com) → Create new project
2. Wait for database to initialize
3. Go to **SQL Editor** → Run the entire `supabase/schema.sql` file
4. Go to **Settings** → **API** → Copy:
   - Project URL
   - anon public key

### 2. App Config (1 minute)
1. Open `.env` file
2. Paste your Supabase URL and key:
```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 3. Run (2 minutes)
```bash
npm install
npm start
```

- Install **Expo Go** on your phone (App Store / Play Store)
- Scan QR code from terminal
- Sign up in the app
- Create your first template!

## Done!

That's it. See `SETUP.md` for detailed instructions or `README.md` for full documentation.

---

## Quick Commands

```bash
# Start dev server
npm start

# Clear cache and restart
npm start --clear

# Run on iOS simulator (Mac only)
npm run ios

# Run on Android emulator
npm run android

# Build for production
npx eas build --platform ios
```

## Need Help?

**Common Issues:**
1. "Missing Supabase credentials" → Check `.env` file, restart server
2. Can't sign up → Make sure you ran `schema.sql` in Supabase
3. No categories → Re-run `schema.sql`
4. App won't load → Make sure phone and computer are on same WiFi

**Still stuck?** Check `SETUP.md` for troubleshooting.
