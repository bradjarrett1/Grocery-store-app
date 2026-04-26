import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';

interface ListItem {
  id: string;
  item_name: string;
  quantity: string | null;
  checked: boolean;
  category_id: string;
  brand: string | null;
  notes: string | null;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface ShoppingList {
  id: string;
  name: string | null;
  created_at: string;
  completed_at: string;
  total_items: number;
  checked_items: number;
}

export default function HistoryDetailScreen() {
  const { id } = useLocalSearchParams();
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistoryDetail();
    loadCategories();
  }, [id]);

  async function loadCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('default_aisle_order');

    if (data) {
      setCategories(data);
    }
  }

  async function loadHistoryDetail() {
    setLoading(true);

    // Load shopping list details
    const { data: listData, error: listError } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('id', id)
      .single();

    if (listError) {
      console.error('Error loading shopping list:', listError);
      setLoading(false);
      return;
    }

    setShoppingList(listData);

    // Load all items from this shopping trip
    const { data: itemsData, error: itemsError } = await supabase
      .from('list_items')
      .select('*')
      .eq('list_id', id);

    if (itemsError) {
      console.error('Error loading items:', itemsError);
    } else {
      setItems(itemsData || []);
    }

    setLoading(false);
  }

  function getCategoryById(categoryId: string | null) {
    if (!categoryId) return null;
    return categories.find((cat) => cat.id === categoryId);
  }

  function organizeItemsByCategory() {
    const sections: {
      title: string;
      color: string;
      data: ListItem[];
    }[] = [];

    const sortedCategories = [...categories].sort(
      (a, b) => a.default_aisle_order - b.default_aisle_order
    );

    for (const category of sortedCategories) {
      const categoryItems = items.filter(
        (item) => item.category_id === category.id
      );

      if (categoryItems.length > 0) {
        sections.push({
          title: category.name,
          color: category.color,
          data: categoryItems,
        });
      }
    }

    // Uncategorized items
    const uncategorizedItems = items.filter((item) => !item.category_id);
    if (uncategorizedItems.length > 0) {
      sections.push({
        title: 'Other',
        color: '#6b7280',
        data: uncategorizedItems,
      });
    }

    return sections;
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!shoppingList) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Shopping trip not found</Text>
      </SafeAreaView>
    );
  }

  const sections = organizeItemsByCategory();
  const checkedCount = items.filter((item) => item.checked).length;
  const uncheckedCount = items.length - checkedCount;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Shopping Trip</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.listName}>
            {shoppingList.name || 'Shopping Trip'}
          </Text>
          <Text style={styles.dateText}>
            {formatDate(shoppingList.completed_at)}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{checkedCount}</Text>
              <Text style={styles.statLabel}>Purchased</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{uncheckedCount}</Text>
              <Text style={styles.statLabel}>Skipped</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{items.length}</Text>
              <Text style={styles.statLabel}>Total Items</Text>
            </View>
          </View>
        </View>

        {sections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <View style={[styles.sectionHeader, { backgroundColor: section.color }]}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>

            {section.data.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View
                  style={[
                    styles.checkbox,
                    item.checked && styles.checkboxChecked,
                  ]}
                >
                  {item.checked && <Text style={styles.checkmark}>✓</Text>}
                </View>

                <View style={styles.itemInfo}>
                  <Text
                    style={[
                      styles.itemName,
                      item.checked && styles.itemNameChecked,
                    ]}
                  >
                    {item.item_name}
                  </Text>
                  <View style={styles.itemDetails}>
                    {item.quantity && (
                      <Text style={styles.detailText}>Qty: {item.quantity}</Text>
                    )}
                    {item.brand && (
                      <Text style={styles.detailText}>• {item.brand}</Text>
                    )}
                  </View>
                  {item.notes && (
                    <Text style={styles.notesText}>{item.notes}</Text>
                  )}
                </View>

                <Text style={styles.statusBadge}>
                  {item.checked ? '✓' : '−'}
                </Text>
              </View>
            ))}
          </View>
        ))}

        {items.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items in this shopping trip</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 40,
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backButton: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    padding: 14,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingLeft: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: '#d1d5db',
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
    marginBottom: 4,
  },
  itemNameChecked: {
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  detailText: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 8,
  },
  notesText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  statusBadge: {
    fontSize: 18,
    color: '#10b981',
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});
