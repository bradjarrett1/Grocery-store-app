# Grocery App - Future Features Guide

This guide explains how to add the Phase 2 and Phase 3 features mentioned in the original spec.

---

## Phase 2 Features

### 1. Notes Import (Onboarding Smart List)

**What:** On first launch (or from Settings), prompt the user to paste in a grocery list from Apple Notes or any notes app — one item per line. The app parses the text, maps items to categories, and creates a template. This seeds a "smart" starting list without requiring the user to build from scratch.

**Why:** Most users already have grocery lists somewhere. This removes the cold-start problem and immediately shows value.

**How to implement:**

- Add an "Import from Notes" button on the empty Templates screen and in Settings
- Show a multi-line text input modal: "Paste your list, one item per line"
- Parse each line → strip checkboxes/bullets (-, *, [ ], [x]) → match to existing categories via keyword lookup
- Create a new template with matched items

**Phase 2b — Onboarding prompt:**

- On first signup, show a screen: "Do you have an existing grocery list? Paste it here to get started fast"
- Skip option available
- Same parsing logic as above

---

### 2. Photo-Based Item Adding

**What:** Snap a picture of a product → auto-add to list

**How to implement:**


1. Install dependencies:
```bash
npx expo install expo-camera expo-image-picker
```

2. Add camera permission to `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera"
        }
      ]
    ]
  }
}
```

3. Create camera component (`components/shopping/CameraItemAdd.tsx`)

4. Use Expo ImagePicker or integrate with Vision API for OCR:
   - Google Vision API (text detection)
   - Or OpenAI Vision for product name extraction

5. Add "📷 Add by Photo" button in create list screen

**Estimated time:** 4-6 hours

---

### 2. Recipe Integration

**What:** Paste recipe URL → auto-generate shopping list

**How to implement:**

1. Install recipe parser:
```bash
npm install recipe-scraper
```

2. Create new screen: `app/recipe/import.tsx`

3. Parse recipe URL:
```typescript
import { scrapeRecipe } from 'recipe-scraper';

async function importRecipe(url: string) {
  const recipe = await scrapeRecipe(url);
  // recipe.ingredients = ["2 cups flour", "1 cup milk", ...]

  // Parse quantities and create list items
  const items = parseIngredients(recipe.ingredients);

  // Create shopping list
  createListFromRecipe(items);
}
```

4. Add "📝 Import Recipe" button on create list screen

**Estimated time:** 6-8 hours

---

### 3. Multiple Store Layouts

**What:** Switch between Target, Whole Foods, Trader Joe's layouts

**Database changes:**

```sql
-- Add store_layouts table
CREATE TABLE store_layouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false
);

-- Add layout_categories (custom aisle order per store)
CREATE TABLE layout_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  layout_id UUID REFERENCES store_layouts(id),
  category_id UUID REFERENCES categories(id),
  aisle_order INTEGER NOT NULL
);

-- Update user preferences
ALTER TABLE user_preferences
ADD COLUMN preferred_layout_id UUID REFERENCES store_layouts(id);
```

**UI changes:**
- Settings screen: Store selector dropdown
- Shopping screen: Show current store name
- Auto-reorder items based on selected store

**Estimated time:** 8-10 hours

---

### 4. Price Tracking

**What:** Remember what you paid last time

**Database changes:**

```sql
-- Add price history
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  item_name TEXT NOT NULL,
  price NUMERIC(10, 2),
  store_name TEXT,
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add price to list_items
ALTER TABLE list_items
ADD COLUMN price NUMERIC(10, 2),
ADD COLUMN store_name TEXT;
```

**UI changes:**
- When checking off item, prompt: "Price? (optional)"
- Show price next to item in history
- Show price trends over time

**Estimated time:** 4-6 hours

---

### 5. Budget Tracking

**What:** Estimate total cost before shopping

**Uses:** Price history data from feature #4

**Implementation:**
```typescript
function calculateEstimatedTotal(listItems) {
  let total = 0;
  for (const item of listItems) {
    const avgPrice = await getAveragePrice(item.item_name);
    total += avgPrice || 0;
  }
  return total;
}
```

**UI:**
- Show estimated total at top of shopping list
- Update as items are checked
- Compare estimated vs actual at end

**Estimated time:** 3-4 hours

---

## Phase 3 Features

### 1. Meal Planning Integration

**What:** Plan meals for the week → auto-generate shopping list

**Database changes:**

```sql
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE planned_meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_plan_id UUID REFERENCES meal_plans(id),
  day_of_week INTEGER, -- 0-6
  meal_type TEXT, -- breakfast, lunch, dinner
  recipe_name TEXT,
  ingredients JSONB
);
```

**UI:**
- New tab: "Meal Plan"
- Calendar view of week
- Drag recipes to days
- "Generate List" button → creates shopping list from all meals

**Estimated time:** 12-16 hours

---

### 2. Shared Lists (Family Collaboration)

**What:** Multiple users can edit the same list

**Database changes:**

```sql
CREATE TABLE list_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID REFERENCES shopping_lists(id),
  user_id UUID REFERENCES profiles(id),
  role TEXT DEFAULT 'editor', -- owner, editor, viewer
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update RLS policies to allow collaborators
CREATE POLICY "Collaborators can view shared lists"
  ON shopping_lists FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT user_id FROM list_collaborators
      WHERE list_id = shopping_lists.id
    )
  );
```

**Features:**
- Share link: "Invite family member"
- Real-time updates (use Supabase Realtime)
- Show who checked off each item

**Estimated time:** 10-12 hours

---

### 3. Voice Input

**What:** "Add milk to my list"

**Implementation:**

1. Install Expo Speech:
```bash
npx expo install expo-speech
```

2. Create voice button component:
```typescript
import * as Speech from 'expo-speech';

function VoiceInput() {
  async function startListening() {
    const result = await Speech.recognize();
    parseVoiceCommand(result.transcript);
  }

  function parseVoiceCommand(text: string) {
    // "add milk" → add item
    // "remove eggs" → remove item
    // "check off bread" → mark as checked
  }
}
```

3. Add microphone button on shopping screen

**Estimated time:** 6-8 hours

---

### 4. Barcode Scanning

**What:** Scan product barcode → add to list

**Implementation:**

1. Install barcode scanner:
```bash
npx expo install expo-barcode-scanner
```

2. Use barcode lookup API:
- Open Food Facts API (free)
- UPC Database
- Barcode Lookup

3. Create scanner screen:
```typescript
import { BarCodeScanner } from 'expo-barcode-scanner';

function BarcodeScanner() {
  const handleBarCodeScanned = async ({ data }) => {
    // data = "012345678901"
    const product = await lookupBarcode(data);
    addItemToList(product.name);
  };
}
```

**Estimated time:** 4-6 hours

---

### 5. Coupons/Deals Integration

**What:** Show available coupons for items on your list

**APIs to integrate:**
- Kroger API (coupons)
- Target API (Cartwheel)
- Ibotta API (cashback)

**Database:**

```sql
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_name TEXT,
  discount_amount NUMERIC(10, 2),
  discount_percent INTEGER,
  expires_at TIMESTAMPTZ,
  source TEXT
);
```

**UI:**
- Badge on items with coupons
- "💰 Coupon available" label
- Link to redeem

**Estimated time:** 8-10 hours

---

## Priority Recommendations

If you want to add features, here's the recommended order:

### Quick Wins (1-2 days each)
1. **Price tracking** - High value, easy to implement
2. **Budget tracking** - Builds on price tracking
3. **Barcode scanning** - Cool factor, useful

### Medium Effort (3-5 days each)
4. **Recipe integration** - Very useful for meal planning
5. **Multiple store layouts** - Great UX improvement
6. **Voice input** - Convenience feature

### Big Projects (1-2 weeks each)
7. **Shared lists** - Requires real-time infrastructure
8. **Meal planning** - Complex feature, lots of UI
9. **Photo recognition** - Requires ML/AI integration
10. **Coupons** - Requires API partnerships

---

## Feature Toggle Pattern

To add features without breaking existing code:

```typescript
// lib/features.ts
export const FEATURES = {
  PRICE_TRACKING: true,
  MEAL_PLANNING: false, // coming soon
  SHARED_LISTS: false,
};

// In component
if (FEATURES.PRICE_TRACKING) {
  return <PriceInput />;
}
```

This lets you:
- Develop features incrementally
- Test in production before full release
- Easy rollback if needed

---

## Testing New Features

For each new feature:
1. Write unit tests (Jest)
2. Test on real device
3. Beta test with family/friends
4. Monitor Supabase logs for errors
5. Gradual rollout (10% → 50% → 100%)

---

## Resources

### APIs
- **Recipe scraping**: recipe-scraper npm package
- **Barcode lookup**: Open Food Facts API
- **OCR**: Google Vision API
- **Voice**: Expo Speech (built-in)

### Learning
- Expo docs: docs.expo.dev
- Supabase docs: supabase.com/docs
- React Native: reactnative.dev

---

**Start with price tracking!** It's the easiest Phase 2 feature and adds immediate value. Good luck! 🚀
