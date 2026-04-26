# Grocery Shopping App

A smart, template-based grocery shopping app built with React Native, Expo, and Supabase. Solves the "what did I forget?" problem by letting you save templates of frequently-bought items and quickly create organized shopping lists.

## Features

### MVP (Complete)
- ✅ **Template Management** - Save frequently bought items as reusable templates
- ✅ **Quick List Building** - Create shopping lists from templates with one tap
- ✅ **Smart Organization** - Items auto-organized by grocery store aisle/category
- ✅ **Shopping Mode** - Clean UI with checkbox items, progress tracking
- ✅ **Shopping History** - View past shopping trips
- ✅ **Offline-Ready** - Works in stores with poor cell service (Supabase handles sync)

### Tech Stack
- **Frontend**: React Native + Expo (SDK 55)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **State**: Zustand
- **Navigation**: Expo Router (file-based routing)
- **Language**: TypeScript

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo account (free at expo.dev)
- Supabase account (free at supabase.com)

### 1. Install Dependencies

```bash
cd grocery-app
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to initialize (~2 minutes)
3. Go to **SQL Editor** in the Supabase dashboard
4. Copy the contents of `supabase/schema.sql` and run it
5. This will create all tables, policies, indexes, and seed default categories

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env .env.local
   ```

2. Get your Supabase credentials:
   - Go to Project Settings → API in Supabase dashboard
   - Copy the **Project URL** and **anon public** key

3. Update `.env` with your credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 4. Run the App

Start the development server:

```bash
npm start
```

This will open Expo Dev Tools. You can then:

- Press `i` to open iOS simulator (Mac only)
- Press `a` to open Android emulator
- Scan QR code with **Expo Go** app on your phone (iOS/Android)

## Project Structure

```
grocery-app/
├── app/                      # Expo Router screens
│   ├── (auth)/              # Auth screens (login, signup)
│   ├── (tabs)/              # Main app tabs
│   ├── template/            # Template create/edit screens
│   ├── list/                # Shopping list create screen
│   ├── _layout.tsx          # Root layout
│   └── index.tsx            # Entry point
├── lib/
│   ├── supabase.ts          # Supabase client
│   └── database.types.ts    # TypeScript types for DB
├── stores/
│   └── useAuthStore.ts      # Auth state (Zustand)
├── supabase/
│   └── schema.sql           # Database schema
├── .env                     # Environment variables (don't commit!)
└── package.json
```

## Database Schema

The app uses 6 main tables:

1. **profiles** - User profiles (auto-created on signup)
2. **categories** - Item categories (Produce, Dairy, Meat, etc.)
3. **templates** - Saved shopping templates
4. **template_items** - Items in each template
5. **shopping_lists** - Shopping trips
6. **list_items** - Items in each shopping list

All tables have Row Level Security (RLS) enabled so users can only see their own data.

## User Flow

### First Time Setup
1. Sign up with email/password
2. Create your first template (e.g., "Weekly Staples")
3. Add items to template (Milk, Eggs, Bread, etc.)
4. Save template

### Creating a Shopping List
1. Tap "New Shopping Trip" on Shopping tab
2. Select a template
3. Checkboxes appear for all items (all selected by default)
4. Uncheck items you don't need this week
5. Optionally add custom one-off items
6. Tap "Create" → Shopping list created!

### Shopping Mode
1. Items are organized by aisle/category
2. Tap items to check them off as you shop
3. Progress bar shows how many items left
4. When done, tap "Complete" to move list to history

## Deployment

### TestFlight (iOS)
1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Configure EAS:
   ```bash
   eas build:configure
   ```

3. Build for iOS:
   ```bash
   eas build --platform ios --profile production
   ```

4. Submit to TestFlight:
   ```bash
   eas submit --platform ios
   ```

### Google Play (Android)
```bash
eas build --platform android --profile production
eas submit --platform android
```

## Future Features (Not Yet Implemented)

### Phase 2
- Photo-based item adding (camera to scan products)
- Recipe integration (paste URL → auto-generate list)
- Multiple store layouts (Target, Whole Foods, etc.)
- Price tracking
- Budget tracking

### Phase 3
- Meal planning integration
- Shared lists (family members can collaborate)
- Voice input ("Add milk to my list")
- Barcode scanning
- Coupons/deals integration

## Troubleshooting

### "Missing Supabase credentials" warning
- Make sure you created `.env` file with your Supabase URL and key
- Restart Expo dev server after creating `.env`

### App crashes on login
- Check Supabase dashboard → Authentication to make sure auth is enabled
- Verify you ran the `schema.sql` file completely

### Items not appearing
- Check that categories were seeded (run schema.sql)
- Open Supabase → Table Editor and verify data exists

### "No templates yet"
- Create your first template using the "+" button
- Add at least one item to the template before saving

## Development

### Adding a new category
```sql
INSERT INTO categories (name, color, icon, default_aisle_order, is_system)
VALUES ('New Category', '#FF5733', 'icon-name', 12, true);
```

### Debugging Supabase queries
Check the Supabase dashboard → Logs → Postgres Logs for real-time query debugging.

## License

MIT

## Author

Built by Brad Jarrett as part of personal productivity app suite.

---

**Questions or Issues?**
Open an issue or contact me directly.
