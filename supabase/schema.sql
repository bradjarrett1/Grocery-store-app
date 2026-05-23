-- Grocery App Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT,
  default_aisle_order INTEGER NOT NULL,
  is_system BOOLEAN DEFAULT false,
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Categories policies (everyone can read system categories, users can CRUD their own)
CREATE POLICY "Anyone can view system categories"
  ON categories FOR SELECT
  USING (is_system = true OR auth.uid() = user_id);

CREATE POLICY "Users can create own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- Insert default system categories
-- Order follows a logical grocery store flow: perimeter first (produce → bakery/deli → meat → frozen → dairy),
-- then interior aisles (pantry → beverages → snacks), then front-of-store sections.
INSERT INTO categories (name, color, icon, default_aisle_order, is_system) VALUES
  ('Produce', '#4ade80', 'leaf', 1, true),
  ('Bakery', '#fbbf24', 'bread-slice', 2, true),
  ('Meat & Seafood', '#f87171', 'drumstick', 3, true),
  ('Frozen', '#38bdf8', 'snowflake', 4, true),
  ('Dairy', '#60a5fa', 'milk', 5, true),
  ('Pantry', '#a78bfa', 'jar', 6, true),
  ('Beverages', '#fb923c', 'glass-water', 7, true),
  ('Snacks', '#facc15', 'cookie', 8, true),
  ('Health & Beauty', '#ec4899', 'heart-pulse', 9, true),
  ('Household', '#94a3b8', 'house', 10, true),
  ('Other', '#6b7280', 'ellipsis', 11, true);

-- Templates table
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates"
  ON templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own templates"
  ON templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON templates FOR DELETE
  USING (auth.uid() = user_id);

-- Template items table
CREATE TABLE template_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  quantity TEXT,
  brand TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own template items"
  ON template_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM templates
      WHERE templates.id = template_items.template_id
      AND templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own template items"
  ON template_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM templates
      WHERE templates.id = template_items.template_id
      AND templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own template items"
  ON template_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM templates
      WHERE templates.id = template_items.template_id
      AND templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own template items"
  ON template_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM templates
      WHERE templates.id = template_items.template_id
      AND templates.user_id = auth.uid()
    )
  );

-- Shopping lists table
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_items INTEGER DEFAULT 0,
  checked_items INTEGER DEFAULT 0
);

ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shopping lists"
  ON shopping_lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own shopping lists"
  ON shopping_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shopping lists"
  ON shopping_lists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shopping lists"
  ON shopping_lists FOR DELETE
  USING (auth.uid() = user_id);

-- List items table
CREATE TABLE list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  quantity TEXT,
  brand TEXT,
  notes TEXT,
  checked BOOLEAN DEFAULT false,
  checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own list items"
  ON list_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = list_items.list_id
      AND shopping_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own list items"
  ON list_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = list_items.list_id
      AND shopping_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own list items"
  ON list_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = list_items.list_id
      AND shopping_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own list items"
  ON list_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = list_items.list_id
      AND shopping_lists.user_id = auth.uid()
    )
  );

-- User preferences table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) UNIQUE NOT NULL,
  aisle_order JSONB,
  default_template_id UUID REFERENCES templates(id),
  theme TEXT DEFAULT 'light',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_templates_user ON templates(user_id);
CREATE INDEX idx_template_items_template ON template_items(template_id);
CREATE INDEX idx_shopping_lists_user ON shopping_lists(user_id);
CREATE INDEX idx_shopping_lists_active ON shopping_lists(user_id, completed_at) WHERE completed_at IS NULL;
CREATE INDEX idx_list_items_list ON list_items(list_id);
CREATE INDEX idx_list_items_checked ON list_items(list_id, checked);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update shopping list counts
CREATE OR REPLACE FUNCTION update_shopping_list_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE shopping_lists
  SET
    total_items = (SELECT COUNT(*) FROM list_items WHERE list_id = NEW.list_id),
    checked_items = (SELECT COUNT(*) FROM list_items WHERE list_id = NEW.list_id AND checked = true)
  WHERE id = NEW.list_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update counts when items are checked/unchecked
CREATE TRIGGER update_list_counts_on_check
  AFTER INSERT OR UPDATE OR DELETE ON list_items
  FOR EACH ROW EXECUTE FUNCTION update_shopping_list_counts();

-- ============================================================
-- MIGRATION: Update category aisle order to logical store flow
-- Run this in the Supabase SQL editor if you already applied
-- the initial schema and categories are already seeded.
-- ============================================================
-- UPDATE categories SET default_aisle_order = CASE name
--   WHEN 'Produce'        THEN 1
--   WHEN 'Bakery'         THEN 2
--   WHEN 'Meat & Seafood' THEN 3
--   WHEN 'Frozen'         THEN 4
--   WHEN 'Dairy'          THEN 5
--   WHEN 'Pantry'         THEN 6
--   WHEN 'Beverages'      THEN 7
--   WHEN 'Snacks'         THEN 8
--   WHEN 'Health & Beauty' THEN 9
--   WHEN 'Household'      THEN 10
--   WHEN 'Other'          THEN 11
--   ELSE default_aisle_order
-- END
-- WHERE is_system = true;

-- ============================================================
-- MIGRATION: Receipt scanning feature
-- Run ALL of the following in your Supabase SQL editor.
-- ============================================================

-- 1. Add receipt fields to shopping_lists
ALTER TABLE shopping_lists
  ADD COLUMN IF NOT EXISTS total_spent NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS store_name TEXT,
  ADD COLUMN IF NOT EXISTS receipt_date DATE,
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS tax NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS receipt_image_uri TEXT;

-- 2. Add price and receipt-origin flag to list_items
ALTER TABLE list_items
  ADD COLUMN IF NOT EXISTS price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS added_from_receipt BOOLEAN DEFAULT false;
