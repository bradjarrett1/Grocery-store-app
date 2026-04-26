-- Dummy Data for Grocery App
-- This script creates test data for test@test.com account
-- Run this in Supabase SQL Editor AFTER you've created the test@test.com user

-- First, get the user ID for test@test.com
-- You need to create this user first through the app or Supabase Auth
-- Then run: SELECT id FROM auth.users WHERE email = 'test@test.com';
-- Replace 'USER_ID_HERE' below with the actual UUID

DO $$
DECLARE
  test_user_id UUID;

  -- Template IDs
  weekly_groceries_id UUID;
  breakfast_essentials_id UUID;
  party_supplies_id UUID;
  healthy_snacks_id UUID;

  -- Category IDs
  produce_id UUID;
  dairy_id UUID;
  meat_id UUID;
  bakery_id UUID;
  pantry_id UUID;
  beverages_id UUID;
  snacks_id UUID;
  frozen_id UUID;

  -- Shopping List IDs
  last_week_trip_id UUID;
  two_weeks_ago_id UUID;
  last_month_id UUID;

BEGIN
  -- Get the test user ID (assuming test@test.com exists)
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'test@test.com' LIMIT 1;

  IF test_user_id IS NULL THEN
    RAISE EXCEPTION 'User test@test.com not found. Please create this user first.';
  END IF;

  -- Get existing category IDs (assuming system categories already exist)
  SELECT id INTO produce_id FROM categories WHERE name = 'Produce' AND is_system = true LIMIT 1;
  SELECT id INTO dairy_id FROM categories WHERE name = 'Dairy' AND is_system = true LIMIT 1;
  SELECT id INTO meat_id FROM categories WHERE name = 'Meat & Seafood' AND is_system = true LIMIT 1;
  SELECT id INTO bakery_id FROM categories WHERE name = 'Bakery' AND is_system = true LIMIT 1;
  SELECT id INTO pantry_id FROM categories WHERE name = 'Pantry' AND is_system = true LIMIT 1;
  SELECT id INTO beverages_id FROM categories WHERE name = 'Beverages' AND is_system = true LIMIT 1;
  SELECT id INTO snacks_id FROM categories WHERE name = 'Snacks' AND is_system = true LIMIT 1;
  SELECT id INTO frozen_id FROM categories WHERE name = 'Frozen' AND is_system = true LIMIT 1;

  -- ============================================
  -- TEMPLATES
  -- ============================================

  -- Template 1: Weekly Groceries
  INSERT INTO templates (id, user_id, name, description, created_at, updated_at)
  VALUES (
    uuid_generate_v4(),
    test_user_id,
    'Weekly Groceries',
    'My standard weekly shopping list with all the essentials',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days'
  )
  RETURNING id INTO weekly_groceries_id;

  -- Items for Weekly Groceries template
  INSERT INTO template_items (template_id, item_name, category_id, quantity, brand, notes) VALUES
    (weekly_groceries_id, 'Bananas', produce_id, '1 bunch', NULL, NULL),
    (weekly_groceries_id, 'Apples', produce_id, '6', 'Gala or Honeycrisp', NULL),
    (weekly_groceries_id, 'Baby Spinach', produce_id, '1 bag', 'Organic', NULL),
    (weekly_groceries_id, 'Cherry Tomatoes', produce_id, '1 container', NULL, NULL),
    (weekly_groceries_id, 'Carrots', produce_id, '1 lb', NULL, NULL),
    (weekly_groceries_id, 'Milk', dairy_id, '1 gallon', '2% or Whole', NULL),
    (weekly_groceries_id, 'Greek Yogurt', dairy_id, '4 pack', 'Chobani', 'Vanilla flavor'),
    (weekly_groceries_id, 'Cheddar Cheese', dairy_id, '1 block', 'Sharp', NULL),
    (weekly_groceries_id, 'Eggs', dairy_id, '1 dozen', 'Large', NULL),
    (weekly_groceries_id, 'Chicken Breast', meat_id, '2 lbs', NULL, 'Boneless, skinless'),
    (weekly_groceries_id, 'Ground Beef', meat_id, '1 lb', '85/15', NULL),
    (weekly_groceries_id, 'Whole Wheat Bread', bakery_id, '1 loaf', 'Dave''s Killer Bread', NULL),
    (weekly_groceries_id, 'Pasta', pantry_id, '2 boxes', 'Penne or Spaghetti', NULL),
    (weekly_groceries_id, 'Rice', pantry_id, '1 bag', 'Jasmine', NULL),
    (weekly_groceries_id, 'Olive Oil', pantry_id, '1 bottle', 'Extra Virgin', NULL),
    (weekly_groceries_id, 'Orange Juice', beverages_id, '1 carton', 'Tropicana', 'No pulp');

  -- Template 2: Breakfast Essentials
  INSERT INTO templates (id, user_id, name, description, created_at, updated_at)
  VALUES (
    uuid_generate_v4(),
    test_user_id,
    'Breakfast Essentials',
    'Everything I need for a great breakfast',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '20 days'
  )
  RETURNING id INTO breakfast_essentials_id;

  INSERT INTO template_items (template_id, item_name, category_id, quantity, brand, notes) VALUES
    (breakfast_essentials_id, 'Oatmeal', pantry_id, '1 container', 'Quaker', 'Old-fashioned oats'),
    (breakfast_essentials_id, 'Pancake Mix', pantry_id, '1 box', 'Bisquick', NULL),
    (breakfast_essentials_id, 'Maple Syrup', pantry_id, '1 bottle', 'Real maple syrup', NULL),
    (breakfast_essentials_id, 'Blueberries', produce_id, '1 pint', NULL, 'Fresh'),
    (breakfast_essentials_id, 'Strawberries', produce_id, '1 lb', NULL, NULL),
    (breakfast_essentials_id, 'Bacon', meat_id, '1 package', 'Thick cut', NULL),
    (breakfast_essentials_id, 'Sausage Links', meat_id, '1 package', NULL, NULL),
    (breakfast_essentials_id, 'Butter', dairy_id, '1 lb', 'Unsalted', NULL),
    (breakfast_essentials_id, 'Cream Cheese', dairy_id, '1 package', 'Philadelphia', NULL),
    (breakfast_essentials_id, 'Bagels', bakery_id, '6 pack', 'Everything bagels', NULL),
    (breakfast_essentials_id, 'Coffee', beverages_id, '1 bag', 'Medium roast', NULL),
    (breakfast_essentials_id, 'Orange Juice', beverages_id, '1 carton', NULL, NULL);

  -- Template 3: Party Supplies
  INSERT INTO templates (id, user_id, name, description, created_at, updated_at)
  VALUES (
    uuid_generate_v4(),
    test_user_id,
    'Party Supplies',
    'Perfect for hosting friends and family',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days'
  )
  RETURNING id INTO party_supplies_id;

  INSERT INTO template_items (template_id, item_name, category_id, quantity, brand, notes) VALUES
    (party_supplies_id, 'Tortilla Chips', snacks_id, '2 large bags', 'Tostitos', NULL),
    (party_supplies_id, 'Salsa', pantry_id, '2 jars', 'Medium spice', NULL),
    (party_supplies_id, 'Guacamole', produce_id, '2 containers', NULL, 'Or make fresh'),
    (party_supplies_id, 'Chicken Wings', frozen_id, '3 lbs', NULL, NULL),
    (party_supplies_id, 'Mozzarella Sticks', frozen_id, '1 box', NULL, NULL),
    (party_supplies_id, 'Soda', beverages_id, '2 cases', 'Variety pack', NULL),
    (party_supplies_id, 'Beer', beverages_id, '12 pack', NULL, 'IPA'),
    (party_supplies_id, 'Ice Cream', frozen_id, '1 tub', 'Vanilla', 'For dessert'),
    (party_supplies_id, 'Hot Dog Buns', bakery_id, '2 packs', NULL, NULL),
    (party_supplies_id, 'Hot Dogs', meat_id, '2 packs', 'All beef', NULL),
    (party_supplies_id, 'Hamburger Buns', bakery_id, '2 packs', NULL, NULL),
    (party_supplies_id, 'Ground Beef', meat_id, '3 lbs', '80/20', 'For burgers');

  -- Template 4: Healthy Snacks
  INSERT INTO templates (id, user_id, name, description, created_at, updated_at)
  VALUES (
    uuid_generate_v4(),
    test_user_id,
    'Healthy Snacks',
    'Nutritious snacks for the week',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days'
  )
  RETURNING id INTO healthy_snacks_id;

  INSERT INTO template_items (template_id, item_name, category_id, quantity, brand, notes) VALUES
    (healthy_snacks_id, 'Almonds', snacks_id, '1 bag', 'Blue Diamond', 'Lightly salted'),
    (healthy_snacks_id, 'Cashews', snacks_id, '1 bag', NULL, NULL),
    (healthy_snacks_id, 'Hummus', dairy_id, '2 containers', 'Sabra', 'Classic'),
    (healthy_snacks_id, 'Baby Carrots', produce_id, '1 bag', NULL, NULL),
    (healthy_snacks_id, 'Celery', produce_id, '1 bunch', NULL, NULL),
    (healthy_snacks_id, 'Protein Bars', snacks_id, '1 box', 'RX Bar or KIND', NULL),
    (healthy_snacks_id, 'Greek Yogurt', dairy_id, '6 pack', 'Fage', '0% fat'),
    (healthy_snacks_id, 'String Cheese', dairy_id, '1 pack', NULL, NULL),
    (healthy_snacks_id, 'Apples', produce_id, '6', 'Granny Smith', NULL),
    (healthy_snacks_id, 'Peanut Butter', pantry_id, '1 jar', 'Natural', 'No added sugar');

  -- ============================================
  -- SHOPPING HISTORY (COMPLETED TRIPS)
  -- ============================================

  -- Shopping Trip 1: Last Week
  INSERT INTO shopping_lists (id, user_id, name, created_at, completed_at, total_items, checked_items)
  VALUES (
    uuid_generate_v4(),
    test_user_id,
    'Weekly Groceries',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days' + INTERVAL '2 hours',
    15,
    13
  )
  RETURNING id INTO last_week_trip_id;

  INSERT INTO list_items (list_id, item_name, category_id, quantity, checked, checked_at) VALUES
    (last_week_trip_id, 'Bananas', produce_id, '1 bunch', true, NOW() - INTERVAL '7 days'),
    (last_week_trip_id, 'Apples', produce_id, '6', true, NOW() - INTERVAL '7 days'),
    (last_week_trip_id, 'Baby Spinach', produce_id, '1 bag', true, NOW() - INTERVAL '7 days'),
    (last_week_trip_id, 'Cherry Tomatoes', produce_id, '1 container', false, NULL),
    (last_week_trip_id, 'Milk', dairy_id, '1 gallon', true, NOW() - INTERVAL '7 days'),
    (last_week_trip_id, 'Greek Yogurt', dairy_id, '4 pack', true, NOW() - INTERVAL '7 days'),
    (last_week_trip_id, 'Eggs', dairy_id, '1 dozen', true, NOW() - INTERVAL '7 days'),
    (last_week_trip_id, 'Chicken Breast', meat_id, '2 lbs', true, NOW() - INTERVAL '7 days'),
    (last_week_trip_id, 'Ground Beef', meat_id, '1 lb', true, NOW() - INTERVAL '7 days'),
    (last_week_trip_id, 'Whole Wheat Bread', bakery_id, '1 loaf', true, NOW() - INTERVAL '7 days'),
    (last_week_trip_id, 'Pasta', pantry_id, '2 boxes', true, NOW() - INTERVAL '7 days'),
    (last_week_trip_id, 'Rice', pantry_id, '1 bag', false, NULL),
    (last_week_trip_id, 'Olive Oil', pantry_id, '1 bottle', true, NOW() - INTERVAL '7 days'),
    (last_week_trip_id, 'Orange Juice', beverages_id, '1 carton', true, NOW() - INTERVAL '7 days'),
    (last_week_trip_id, 'Coffee', beverages_id, '1 bag', true, NOW() - INTERVAL '7 days');

  -- Shopping Trip 2: Two Weeks Ago
  INSERT INTO shopping_lists (id, user_id, name, created_at, completed_at, total_items, checked_items)
  VALUES (
    uuid_generate_v4(),
    test_user_id,
    'Party Shopping',
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '14 days' + INTERVAL '1 hour',
    10,
    10
  )
  RETURNING id INTO two_weeks_ago_id;

  INSERT INTO list_items (list_id, item_name, category_id, quantity, brand, checked, checked_at) VALUES
    (two_weeks_ago_id, 'Tortilla Chips', snacks_id, '2 bags', 'Tostitos', true, NOW() - INTERVAL '14 days'),
    (two_weeks_ago_id, 'Salsa', pantry_id, '2 jars', NULL, true, NOW() - INTERVAL '14 days'),
    (two_weeks_ago_id, 'Guacamole', produce_id, '2 containers', NULL, true, NOW() - INTERVAL '14 days'),
    (two_weeks_ago_id, 'Chicken Wings', frozen_id, '3 lbs', NULL, true, NOW() - INTERVAL '14 days'),
    (two_weeks_ago_id, 'Soda', beverages_id, '2 cases', 'Coke & Sprite', true, NOW() - INTERVAL '14 days'),
    (two_weeks_ago_id, 'Beer', beverages_id, '12 pack', 'Sierra Nevada', true, NOW() - INTERVAL '14 days'),
    (two_weeks_ago_id, 'Ice Cream', frozen_id, '1 tub', 'Vanilla', true, NOW() - INTERVAL '14 days'),
    (two_weeks_ago_id, 'Hot Dogs', meat_id, '2 packs', 'Hebrew National', true, NOW() - INTERVAL '14 days'),
    (two_weeks_ago_id, 'Hot Dog Buns', bakery_id, '2 packs', NULL, true, NOW() - INTERVAL '14 days'),
    (two_weeks_ago_id, 'Hamburger Buns', bakery_id, '2 packs', NULL, true, NOW() - INTERVAL '14 days');

  -- Shopping Trip 3: Last Month
  INSERT INTO shopping_lists (id, user_id, name, created_at, completed_at, total_items, checked_items)
  VALUES (
    uuid_generate_v4(),
    test_user_id,
    'Breakfast Run',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days' + INTERVAL '45 minutes',
    12,
    11
  )
  RETURNING id INTO last_month_id;

  INSERT INTO list_items (list_id, item_name, category_id, quantity, brand, checked, checked_at) VALUES
    (last_month_id, 'Oatmeal', pantry_id, '1 container', 'Quaker', true, NOW() - INTERVAL '30 days'),
    (last_month_id, 'Pancake Mix', pantry_id, '1 box', 'Bisquick', true, NOW() - INTERVAL '30 days'),
    (last_month_id, 'Maple Syrup', pantry_id, '1 bottle', NULL, true, NOW() - INTERVAL '30 days'),
    (last_month_id, 'Blueberries', produce_id, '1 pint', NULL, true, NOW() - INTERVAL '30 days'),
    (last_month_id, 'Strawberries', produce_id, '1 lb', NULL, false, NULL),
    (last_month_id, 'Bacon', meat_id, '1 package', 'Thick cut', true, NOW() - INTERVAL '30 days'),
    (last_month_id, 'Butter', dairy_id, '1 lb', 'Unsalted', true, NOW() - INTERVAL '30 days'),
    (last_month_id, 'Cream Cheese', dairy_id, '1 package', 'Philadelphia', true, NOW() - INTERVAL '30 days'),
    (last_month_id, 'Bagels', bakery_id, '6 pack', 'Everything', true, NOW() - INTERVAL '30 days'),
    (last_month_id, 'Coffee', beverages_id, '1 bag', 'Starbucks', true, NOW() - INTERVAL '30 days'),
    (last_month_id, 'Orange Juice', beverages_id, '1 carton', 'Tropicana', true, NOW() - INTERVAL '30 days'),
    (last_month_id, 'Eggs', dairy_id, '1 dozen', NULL, true, NOW() - INTERVAL '30 days');

  RAISE NOTICE 'Dummy data created successfully for test@test.com!';
  RAISE NOTICE 'Created 4 templates with items';
  RAISE NOTICE 'Created 3 completed shopping trips in history';

END $$;
