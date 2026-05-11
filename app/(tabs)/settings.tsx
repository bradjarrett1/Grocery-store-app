import { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ImageBackground,
  Modal,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/useAuthStore';

const VISION_PARAGRAPHS = [
  [
    { text: 'This is an AI-forward grocery app that makes your shopping life easier, faster, and smarter. AI learns your shopping habits, organizes your items perfectly, and makes grocery shopping better in every imaginable way.' },
  ],
  [
    { text: 'The goal:', bold: true },
    { text: ' make the perfect list in seconds, find everything fast in-store, save money through smart price comparison, and connect what you buy to what you eat with healthy meal ideas and automatic ingredient lists.' },
  ],
  [
    { text: 'The ultimate dream:', bold: true },
    { text: ' one tap sends your list straight to Instacart, Walmart, Target, or any major grocery delivery, curbside pickup, and one day soon, drone delivery. The choice is yours. Shop in store yourself, pick it up, or have it delivered.' },
  ],
  [
    { text: 'Your best shopping list starts here.' },
  ],
];

const PHASES = [
  {
    title: 'Phase 2 — Coming Soon',
    color: '#10b981',
    features: [
      {
        name: 'AI Voice Input',
        desc: 'Tap a mic and speak items naturally. AI parses the item name, quantity, and category and adds it to your list instantly — no typing required.',
      },
      {
        name: 'AI Photo Recognition',
        utilities: [
          {
            label: 'Receipt Scanner',
            desc: 'Photograph any receipt and AI will extract every line item, price, and total — automatically tracking what you paid per item and per store over time.',
          },
          {
            label: 'Snap to Add',
            desc: 'Take a picture of a product, ingredient, or pantry item and AI identifies it and adds it directly to your list.',
          },
        ],
      },
      {
        name: 'Price Tracking',
        desc: 'Log prices per item and see how costs change across trips and stores over time.',
      },
      {
        name: 'Budget Mode',
        desc: 'Set a trip budget and see a live running total as you check items off.',
      },
      {
        name: 'Recipe to Shopping List',
        desc: 'Search our catalog of millions of recipes or bring your own. Type something you want to cook and browse generic or highly specific ingredient lists from real recipes found online — then save them for future reference. Bringing your own recipe is just as easy: photograph a cookbook\'s ingredient page or paste in a URL and our AI navigates the page and extracts the full ingredient list for you.',
      },
    ],
  },
  {
    title: 'Phase 3 — The Full Vision',
    color: '#6366f1',
    features: [
      {
        name: 'AI Smart Templates',
        desc: 'AI suggests and builds templates based on what you usually buy and how often. It learns your habits over time — tracking which items you buy regularly, how frequently you need them, and in what quantities — then builds a draft list for your approval before anything is finalized. Getting there requires either a few weeks of shopping data or a quick onboarding questionnaire so AI can start understanding your routine right away.',
      },
      {
        name: 'AI Price Comparison',
        desc: 'Compare prices for items on your list across nearby stores. AI highlights where you\'ll save the most and can reorder your list by best value.',
      },
      {
        name: 'GPS Store Detection & Aisle Navigation',
        desc: 'Automatically detect which store you\'re in and reorient your list to match its layout — directional flow with suggested aisle and row position (front / middle / back) for every item.',
      },
      {
        name: 'In-Store Map Mode',
        desc: 'An overhead store map that follows your live position. As you move through the store, unchecked items surface automatically on the map showing what\'s coming up next in your path.',
      },
      {
        name: 'Meal Ideas from What You Bought',
        desc: 'After a trip, AI suggests meals and snacks you can make from what\'s in your cart — with a focus on healthy options. Browse by cuisine, prep time, or nutrition goals.',
      },
      {
        name: 'Search Meals → Auto-Fill Ingredients',
        desc: 'Search for any meal or snack and AI automatically adds the ingredients to your shopping list, categorized and ready to go.',
      },
      {
        name: 'Send to Delivery Apps',
        desc: 'One tap sends your complete list to Instacart, Walmart, Target, or your preferred grocery delivery service — skip the store entirely when you need to.',
      },
      {
        name: 'Shared Lists',
        desc: 'Collaborate on a list in real time with family or housemates. Everyone sees live updates as items get checked off.',
      },
      {
        name: 'Barcode Scanning',
        desc: 'Scan any product barcode to add it to your template with name, brand, and category pre-filled.',
      },
      {
        name: 'Coupons & Deals',
        desc: 'AI surfaces active deals and coupons for items already on your list so you never miss savings.',
      },
    ],
  },
];

export default function SettingsScreen() {
  const user = useAuthStore((state) => state.user);
  const [showFuture, setShowFuture] = useState(false);

  async function signOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <ImageBackground
      source={require('../../assets/grocery-background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Info</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's Coming</Text>
            <TouchableOpacity style={styles.navRow} onPress={() => setShowFuture(true)}>
              <Text style={styles.navRowLabel}>Future Features</Text>
              <Text style={styles.navRowArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={showFuture}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowFuture(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Future Features</Text>
              <TouchableOpacity onPress={() => setShowFuture(false)}>
                <Text style={styles.modalClose}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {/* Vision card */}
              <View style={styles.visionCard}>
                <View style={styles.visionBadge}>
                  <Text style={styles.visionBadgeText}>AI-Forward</Text>
                </View>
                {VISION_PARAGRAPHS.map((para, i) => (
                  <Text key={i} style={[styles.visionText, i > 0 && styles.visionParagraphSpacing]}>
                    {para.map((seg, j) => (
                      <Text key={j} style={seg.bold ? styles.visionBold : undefined}>
                        {seg.text}
                      </Text>
                    ))}
                  </Text>
                ))}
              </View>

              {PHASES.map((phase) => (
                <View key={phase.title} style={styles.phaseBlock}>
                  <View style={[styles.phaseHeader, { borderLeftColor: phase.color }]}>
                    <Text style={[styles.phaseTitle, { color: phase.color }]}>{phase.title}</Text>
                  </View>
                  {phase.features.map((feature) => (
                    <View key={feature.name} style={styles.featureRow}>
                      <View style={[styles.featureDot, { backgroundColor: phase.color }]} />
                      <View style={styles.featureText}>
                        <Text style={styles.featureName}>{feature.name}</Text>
                        {'desc' in feature && (
                          <Text style={styles.featureDesc}>{feature.desc}</Text>
                        )}
                        {'utilities' in feature && feature.utilities && (
                          <View style={styles.utilitiesBlock}>
                            {feature.utilities.map((u) => (
                              <View key={u.label} style={styles.utilityRow}>
                                <Text style={styles.utilityLabel}>{u.label}</Text>
                                <Text style={styles.featureDesc}>{u.desc}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#1f2937',
  },
  infoValue: {
    fontSize: 16,
    color: '#6b7280',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  navRowLabel: {
    fontSize: 16,
    color: '#1f2937',
  },
  navRowArrow: {
    fontSize: 22,
    color: '#9ca3af',
    lineHeight: 24,
  },
  signOutButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ef4444',
    marginTop: 20,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  modalClose: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  visionCard: {
    backgroundColor: '#1f2937',
    borderRadius: 14,
    padding: 20,
    marginBottom: 24,
  },
  visionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#10b981',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  visionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  visionText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 21,
  },
  visionParagraphSpacing: {
    marginTop: 12,
  },
  visionBold: {
    fontWeight: '700',
    color: '#ffffff',
  },
  utilitiesBlock: {
    marginTop: 8,
    gap: 10,
  },
  utilityRow: {
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#e5e7eb',
  },
  utilityLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 2,
  },
  phaseBlock: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  phaseHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderLeftWidth: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  phaseTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    flexShrink: 0,
  },
  featureText: {
    flex: 1,
  },
  featureName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 3,
  },
  featureDesc: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
});
