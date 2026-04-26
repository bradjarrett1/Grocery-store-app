# Grocery App - Deployment Checklist

## Pre-Deployment

### 1. App Configuration
- [ ] Update app name in `app.json` (if desired)
- [ ] Set proper bundle identifier in `app.json`
- [ ] Add app icon (512x512 PNG)
- [ ] Add splash screen image
- [ ] Set version number (1.0.0)
- [ ] Choose app category (Shopping/Productivity)

### 2. Supabase Production
- [ ] Create production Supabase project
- [ ] Run `schema.sql` on production database
- [ ] Update `.env` with production credentials
- [ ] Test production database connection
- [ ] Set up proper email templates in Supabase Auth

### 3. Testing
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test template creation
- [ ] Test shopping list creation
- [ ] Test shopping mode (check-off items)
- [ ] Test offline mode (airplane mode)
- [ ] Test on multiple devices (iOS and Android)
- [ ] Test with real grocery shopping trip

### 4. Content
- [ ] Write App Store description
- [ ] Write Play Store description
- [ ] Take screenshots (iPhone, iPad, Android)
- [ ] Create promotional imagery
- [ ] Prepare keywords for SEO

---

## iOS Deployment (TestFlight → App Store)

### Step 1: Apple Developer Setup
- [ ] Enroll in Apple Developer Program ($99/year)
- [ ] Create App ID in developer.apple.com
- [ ] Generate provisioning profiles

### Step 2: EAS Setup
```bash
npm install -g eas-cli
eas login
eas build:configure
```

- [ ] Run `eas build:configure`
- [ ] Update `eas.json` with your configuration
- [ ] Add Apple Developer credentials to EAS

### Step 3: Build for iOS
```bash
eas build --platform ios --profile production
```

- [ ] Wait for build to complete (~10-20 minutes)
- [ ] Download IPA file (or submit directly)

### Step 4: TestFlight
```bash
eas submit --platform ios
```

- [ ] Submit to TestFlight
- [ ] Wait for Apple review (~24 hours)
- [ ] Invite beta testers
- [ ] Test on TestFlight

### Step 5: App Store Submission
- [ ] Create app in App Store Connect
- [ ] Upload screenshots
- [ ] Write app description
- [ ] Set pricing (free)
- [ ] Set age rating
- [ ] Submit for review
- [ ] Wait for approval (~24-48 hours)
- [ ] Release to App Store!

---

## Android Deployment (Google Play)

### Step 1: Google Play Console
- [ ] Create Google Play Developer account ($25 one-time)
- [ ] Create new app in Play Console
- [ ] Fill in app details

### Step 2: Build for Android
```bash
eas build --platform android --profile production
```

- [ ] Wait for build to complete
- [ ] Download AAB file

### Step 3: Play Store Submission
```bash
eas submit --platform android
```

- [ ] Upload to internal testing track
- [ ] Test on real device
- [ ] Promote to production
- [ ] Submit for review
- [ ] Wait for approval (~few hours)
- [ ] Release to Play Store!

---

## Post-Launch

### Monitor
- [ ] Set up Sentry or error tracking
- [ ] Monitor Supabase dashboard for usage
- [ ] Check App Store/Play Store reviews
- [ ] Monitor crash reports

### Marketing
- [ ] Share on social media
- [ ] Post on Reddit (r/apps)
- [ ] Share with friends/family
- [ ] Get initial reviews

### Iterate
- [ ] Collect user feedback
- [ ] Fix bugs
- [ ] Add Phase 2 features:
  - [ ] Photo recognition
  - [ ] Recipe parsing
  - [ ] Multiple store layouts
  - [ ] Price tracking
  - [ ] Shared lists

---

## Important Files for Submission

### App Store
- App icon (1024x1024)
- iPhone screenshots (6.7", 6.5", 5.5")
- iPad screenshots (12.9", 11")
- App description (up to 4000 chars)
- Keywords
- Support URL
- Privacy policy URL

### Play Store
- App icon (512x512)
- Feature graphic (1024x500)
- Phone screenshots (min 2)
- Tablet screenshots (optional)
- App description (up to 4000 chars)
- Short description (up to 80 chars)
- Privacy policy URL

---

## Sample App Store Description

```
Grocery Shopping Made Simple

Never forget items at the grocery store again! Create reusable shopping templates, build lists in seconds, and shop with an organized, aisle-by-aisle view.

FEATURES:
• Save Templates - Create templates of frequently bought items
• Quick Lists - Build shopping lists from templates in one tap
• Smart Organization - Items automatically organized by store aisle
• Track Progress - See how many items you've checked off
• Shopping History - Review past shopping trips
• Offline Mode - Works without internet connection

Perfect for:
• Weekly grocery shopping
• Meal prep planning
• Bulk shopping runs
• Recurring household items

PRIVACY FIRST:
• Your data is yours
• Secure authentication
• No ads, no tracking

Download now and transform your grocery shopping experience!
```

---

## Sample Privacy Policy

You'll need a privacy policy. Here's a simple template:

```
Privacy Policy for Grocery App

We collect:
- Email address (for account login)
- Shopping lists and templates (stored securely)

We do NOT:
- Sell your data
- Share your data with third parties
- Track your location
- Use cookies or analytics

Your data is stored securely on Supabase servers and is only accessible to you.

You can delete your account and all data at any time by contacting support.

Last updated: [Date]
```

Host this on GitHub Pages or your own site.

---

## Cost Breakdown

### One-Time
- Apple Developer: $99/year
- Google Play Developer: $25 (one-time)

### Monthly (Free Tier)
- Supabase: Free up to 50,000 users
- Expo: Free for builds (500 min/month)

### Total Year 1
- iOS only: $99
- Android only: $25
- Both platforms: $124

---

## Launch Timeline

| Task | Time |
|------|------|
| App icon & screenshots | 2 hours |
| TestFlight build | 30 min + 10 min build |
| TestFlight beta testing | 1-2 weeks |
| App Store submission | 1 hour |
| App Store review | 24-48 hours |
| Play Store submission | 1 hour |
| Play Store review | 2-8 hours |

**Total: 2-3 weeks from code freeze to public release**

---

## Support Plan

After launch:
- Monitor reviews daily
- Fix critical bugs within 24 hours
- Release updates monthly
- Respond to user feedback

---

**Ready to launch?** Follow this checklist step by step and you'll have a published app in 2-3 weeks!
