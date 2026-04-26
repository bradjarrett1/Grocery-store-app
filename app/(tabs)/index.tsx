import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  SectionList,
  Alert,
  ImageBackground,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/useAuthStore';

interface ListItem {
  id: string;
  item_name: string;
  quantity: string | null;
  checked: boolean;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  default_aisle_order: number;
}

interface ShoppingList {
  id: string;
  name: string | null;
  total_items: number;
  checked_items: number;
  created_at: string;
  total_spent: number | null;
}

export default function ShoppingScreen() {
  const [activeList, setActiveList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [totalSpent, setTotalSpent] = useState('');
  const user = useAuthStore((state) => state.user);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadActiveList();
        loadCategories();
      }
    }, [user])
  );

  async function loadCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('default_aisle_order');

    if (data) {
      setCategories(data);
    }
  }

  async function loadActiveList() {
    setLoading(true);

    // Find active (not completed) shopping list
    const { data: lists, error } = await supabase
      .from('shopping_lists')
      .select('*')
      .is('completed_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error loading active list:', error);
      setLoading(false);
      return;
    }

    if (!lists || lists.length === 0) {
      setActiveList(null);
      setItems([]);
      setLoading(false);
      return;
    }

    const list = lists[0];
    setActiveList(list);

    // Load items for this list
    const { data: itemsData } = await supabase
      .from('list_items')
      .select('*')
      .eq('list_id', list.id);

    if (itemsData) {
      setItems(itemsData);
    }

    setLoading(false);
  }

  async function toggleItem(itemId: string, currentChecked: boolean) {
    // Optimistic update
    setItems(
      items.map((item) =>
        item.id === itemId ? { ...item, checked: !currentChecked } : item
      )
    );

    // Update in database
    const { error } = await supabase
      .from('list_items')
      .update({
        checked: !currentChecked,
        checked_at: !currentChecked ? new Date().toISOString() : null,
      })
      .eq('id', itemId);

    if (error) {
      // Revert on error
      setItems(
        items.map((item) =>
          item.id === itemId ? { ...item, checked: currentChecked } : item
        )
      );
      Alert.alert('Error', 'Failed to update item');
    } else {
      // Reload to get updated counts
      loadActiveList();
    }
  }

  function completeList() {
    if (!activeList) return;
    setTotalSpent('');
    setShowCompleteModal(true);
  }

  async function confirmComplete() {
    if (!activeList) return;

    const spent = parseFloat(totalSpent);
    await supabase
      .from('shopping_lists')
      .update({
        completed_at: new Date().toISOString(),
        total_spent: isNaN(spent) ? null : spent,
      })
      .eq('id', activeList.id);

    setShowCompleteModal(false);
    setActiveList(null);
    setItems([]);
  }

  function organizeItemsByCategory() {
    const sections: {
      title: string;
      color: string;
      data: ListItem[];
    }[] = [];

    // Group items by category
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

  const sections = organizeItemsByCategory();
  const progress = activeList
    ? Math.round((activeList.checked_items / activeList.total_items) * 100)
    : 0;

  if (loading) {
    return (
      <ImageBackground
        source={require('../../assets/grocery-background.png')}
        style={styles.container}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.container}>
          <Text style={styles.loadingText}>Loading...</Text>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (!activeList) {
    return (
      <ImageBackground
        source={require('../../assets/grocery-background.png')}
        style={styles.container}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.title}>Shopping</Text>
            </View>
          </View>

          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyTitle}>No Active Shopping List</Text>
            <Text style={styles.emptySubtitle}>
              Create a new shopping list to get started
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/list/create')}
            >
              <Text style={styles.createButtonText}>New Shopping Trip</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/grocery-background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Shopping</Text>
            <TouchableOpacity onPress={completeList}>
              <Text style={styles.completeText}>Complete ✓</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {activeList.checked_items} of {activeList.total_items} items
            </Text>
          </View>
        </View>

        {/* Complete Trip Modal */}
        <Modal
          visible={showCompleteModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCompleteModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setShowCompleteModal(false)}
            />
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Complete Shopping Trip?</Text>
                <Text style={styles.modalSubtitle}>
                  How much did you spend? (optional)
                </Text>
                <View style={styles.amountRow}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    value={totalSpent}
                    onChangeText={setTotalSpent}
                    keyboardType="decimal-pad"
                    autoFocus
                  />
                </View>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalButtonCancel}
                    onPress={() => setShowCompleteModal(false)}
                  >
                    <Text style={styles.modalButtonCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalButtonComplete}
                    onPress={confirmComplete}
                  >
                    <Text style={styles.modalButtonCompleteText}>Complete ✓</Text>
                  </TouchableOpacity>
                </View>
              </View>
          </KeyboardAvoidingView>
        </Modal>

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.itemRow}
              onPress={() => toggleItem(item.id, item.checked)}
            >
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
                {item.quantity && (
                  <Text style={styles.itemQuantity}>{item.quantity}</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
          renderSectionHeader={({ section: { title, color } }) => (
            <View style={[styles.sectionHeader, { backgroundColor: color }]}>
              <Text style={styles.sectionTitle}>{title}</Text>
            </View>
          )}
          contentContainerStyle={styles.list}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 40,
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
    paddingBottom: 16,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: -0.5,
  },
  completeText: {
    fontSize: 15,
    color: '#10b981',
    fontWeight: '600',
  },
  progressContainer: {
    paddingHorizontal: 20,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 8,
  },
  progressText: {
    fontSize: 13,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#10b981',
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  list: {
    paddingBottom: 100,
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
    paddingLeft: 32,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  checkboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
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
  },
  itemNameChecked: {
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  itemQuantity: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 24,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalButtonComplete: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonCompleteText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});
