import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  SectionList,
  ScrollView,
  Alert,
  ImageBackground,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/useAuthStore';
import { scanReceipt } from '../../lib/receiptScanner';
import { requestMicPermission, startRecording, stopAndProcess } from '../../lib/voiceProcessor';
import { getCategoryForItem } from '../../lib/itemCategoryLookup';

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
  const [scanning, setScanning] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddCategoryId, setQuickAddCategoryId] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ListItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<string>('');

  // Voice recording state
  const [showVoiceOverlay, setShowVoiceOverlay] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Auto-category debounce refs
  const quickAddDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quickAddCategoryIdRef = useRef('');
  const editDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editCategoryIdRef = useRef('');

  const user = useAuthStore((state) => state.user);

  useEffect(() => { quickAddCategoryIdRef.current = quickAddCategoryId; }, [quickAddCategoryId]);
  useEffect(() => { editCategoryIdRef.current = editCategoryId; }, [editCategoryId]);

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

    // Orphaned list: items insert failed during creation, leaving a shell
    if (itemsData && itemsData.length === 0 && list.total_items > 0) {
      await supabase.from('shopping_lists').delete().eq('id', list.id);
      setActiveList(null);
      setItems([]);
      setLoading(false);
      return;
    }

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

  function deleteActiveList() {
    if (!activeList) return;
    Alert.alert(
      'Delete List',
      'Are you sure you want to delete this list? Changes cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('list_items').delete().eq('list_id', activeList.id);
            await supabase.from('shopping_lists').delete().eq('id', activeList.id);
            setActiveList(null);
            setItems([]);
          },
        },
      ]
    );
  }

  function openEditModal(item: ListItem) {
    setEditingItem(item);
    setEditName(item.item_name);
    setEditQuantity(item.quantity ?? '');
    setEditCategoryId(item.category_id ?? '');
    setShowEditModal(true);
  }

  async function saveEditItem() {
    if (!editingItem || !editName.trim()) return;

    const { error } = await supabase
      .from('list_items')
      .update({
        item_name: editName.trim(),
        quantity: editQuantity.trim() || null,
        category_id: editCategoryId || null,
      })
      .eq('id', editingItem.id);

    if (error) {
      Alert.alert('Error', 'Failed to update item');
      return;
    }

    setShowEditModal(false);
    setEditingItem(null);
    loadActiveList();
  }

  async function deleteItem(itemId: string) {
    Alert.alert('Delete Item', 'Remove this item from the list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('list_items')
            .delete()
            .eq('id', itemId);

          if (error) {
            Alert.alert('Error', 'Failed to delete item');
            return;
          }

          setShowEditModal(false);
          setEditingItem(null);
          loadActiveList();
        },
      },
    ]);
  }

  async function addQuickItem() {
    if (!activeList || !quickAddName.trim()) return;

    const { error } = await supabase.from('list_items').insert({
      list_id: activeList.id,
      item_name: quickAddName.trim(),
      category_id: quickAddCategoryId || null,
      checked: false,
    });

    if (error) {
      Alert.alert('Error', 'Failed to add item');
      return;
    }

    setQuickAddName('');
    setQuickAddCategoryId('');
    setShowQuickAdd(false);
    loadActiveList();
  }

  async function scanAndComplete() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Camera access is required to scan receipts.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.5,
      base64: true,
      allowsEditing: false,
      exif: false,
    });

    if (result.canceled || !result.assets[0].base64) return;

    const { uri, base64 } = result.assets[0];
    setShowCompleteModal(false);
    setScanning(true);

    try {
      const receiptData = await scanReceipt(base64!, items);
      router.push({
        pathname: '/receipt-review',
        params: {
          listId: activeList!.id,
          imageUri: uri,
          receiptJson: JSON.stringify(receiptData),
          listItemsJson: JSON.stringify(items.map((i) => ({ id: i.id, item_name: i.item_name }))),
          completeTrip: 'true',
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Receipt scan failed';
      Alert.alert('Scan failed', message);
    } finally {
      setScanning(false);
    }
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

  // --- Voice input ---

  async function handleMicPress() {
    const granted = await requestMicPermission();
    if (!granted) {
      Alert.alert('Permission needed', 'Microphone access is required for voice input.');
      return;
    }
    try {
      recordingRef.current = await startRecording();
      setShowVoiceOverlay(true);
    } catch {
      Alert.alert('Error', 'Could not start recording.');
    }
  }

  async function handleVoiceDone() {
    if (!recordingRef.current || !activeList) return;
    setIsProcessingVoice(true);
    try {
      const categoryNames = categories.map((c) => c.name);
      const voiceItems = await stopAndProcess(recordingRef.current, categoryNames);
      recordingRef.current = null;

      const existingNames = items.map((i) => i.item_name.toLowerCase());
      const newItems = voiceItems.filter(
        (vi) => vi.name.trim() && !existingNames.includes(vi.name.toLowerCase())
      );

      if (newItems.length > 0) {
        await supabase.from('list_items').insert(
          newItems.map((vi) => ({
            list_id: activeList.id,
            item_name: vi.name,
            category_id:
              categories.find((c) => c.name.toLowerCase() === (vi.category ?? '').toLowerCase())
                ?.id ?? null,
            checked: false,
          }))
        );
      }
      loadActiveList();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Voice processing failed';
      Alert.alert('Error', message);
    } finally {
      setIsProcessingVoice(false);
      setShowVoiceOverlay(false);
    }
  }

  // --- Auto-category ---

  function handleQuickAddNameChange(text: string) {
    setQuickAddName(text);
    if (quickAddCategoryIdRef.current) return;
    if (quickAddDebounceRef.current) clearTimeout(quickAddDebounceRef.current);
    if (text.trim().length < 2) return;
    quickAddDebounceRef.current = setTimeout(() => resolveQuickAddCategory(text), 4000);
  }

  function handleQuickAddNameBlur() {
    if (quickAddDebounceRef.current) clearTimeout(quickAddDebounceRef.current);
    if (quickAddCategoryIdRef.current || quickAddName.trim().length < 2) return;
    resolveQuickAddCategory(quickAddName);
  }

  async function resolveQuickAddCategory(name: string) {
    if (quickAddCategoryIdRef.current) return;
    const id = await getCategoryForItem(name, categories);
    if (id && !quickAddCategoryIdRef.current) setQuickAddCategoryId(id);
  }

  function handleEditNameChange(text: string) {
    setEditName(text);
    if (editCategoryIdRef.current) return;
    if (editDebounceRef.current) clearTimeout(editDebounceRef.current);
    if (text.trim().length < 2) return;
    editDebounceRef.current = setTimeout(() => resolveEditCategory(text), 4000);
  }

  function handleEditNameBlur() {
    if (editDebounceRef.current) clearTimeout(editDebounceRef.current);
    if (editCategoryIdRef.current || editName.trim().length < 2) return;
    resolveEditCategory(editName);
  }

  async function resolveEditCategory(name: string) {
    if (editCategoryIdRef.current) return;
    const id = await getCategoryForItem(name, categories);
    if (id && !editCategoryIdRef.current) setEditCategoryId(id);
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
  const progress =
    activeList && activeList.total_items > 0
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
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={deleteActiveList}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 8 }}
                style={styles.deleteListButton}
              >
                <Text style={styles.deleteListText}>✕</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={completeList}>
                <Text style={styles.completeText}>Complete ✓</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.progressContainer}>
            {activeList.total_items > 0 ? (
              <>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {activeList.checked_items} of {activeList.total_items} items
                </Text>
              </>
            ) : (
              <Text style={styles.progressText}>No items yet</Text>
            )}
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

                <TouchableOpacity style={styles.scanReceiptButton} onPress={scanAndComplete}>
                  <Text style={styles.scanReceiptIcon}>📷</Text>
                  <View>
                    <Text style={styles.scanReceiptTitle}>Scan Receipt</Text>
                    <Text style={styles.scanReceiptSub}>AI extracts items, prices & totals</Text>
                  </View>
                </TouchableOpacity>

                <Text style={styles.modalDividerText}>or enter total manually</Text>

                <View style={styles.amountRow}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    value={totalSpent}
                    onChangeText={setTotalSpent}
                    keyboardType="decimal-pad"
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

        <View style={styles.listContainer}>
          {sections.length === 0 ? (
            <View style={styles.emptyListContainer}>
              <Text style={styles.emptyListText}>Your list is empty.</Text>
              <Text style={styles.emptyListSubtext}>Tap + to add your first item.</Text>
            </View>
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.itemRow}
                  onPress={() => toggleItem(item.id, item.checked)}
                  onLongPress={() => openEditModal(item)}
                  delayLongPress={400}
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
                  <Text style={styles.holdHint}>hold to edit</Text>
                </TouchableOpacity>
              )}
              renderSectionHeader={({ section: { title, color } }) => (
                <View style={[styles.sectionHeader, { backgroundColor: color }]}>
                  <Text style={styles.sectionTitle}>{title}</Text>
                </View>
              )}
              contentContainerStyle={styles.list}
            />
          )}

          <TouchableOpacity
            style={styles.micFab}
            onPress={handleMicPress}
          >
            <Text style={styles.micFabText}>🎤</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.fab}
            onPress={() => setShowQuickAdd(true)}
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Add Modal */}
        <Modal
          visible={showQuickAdd}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowQuickAdd(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setShowQuickAdd(false)}
            />
            <ScrollView
              style={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalTitle}>Add Item</Text>
              <TextInput
                style={styles.quickAddInput}
                placeholder="Item name..."
                value={quickAddName}
                onChangeText={handleQuickAddNameChange}
                onBlur={handleQuickAddNameBlur}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={addQuickItem}
              />
              <Text style={styles.categoryLabel}>Category</Text>
              <View style={styles.categoryWrap}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      { borderColor: cat.color },
                      quickAddCategoryId === cat.id && { backgroundColor: cat.color },
                    ]}
                    onPress={() => setQuickAddCategoryId(cat.id)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        quickAddCategoryId === cat.id && styles.categoryChipTextSelected,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonCancel}
                  onPress={() => {
                    setQuickAddName('');
                    setShowQuickAdd(false);
                  }}
                >
                  <Text style={styles.modalButtonCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButtonComplete,
                    !quickAddName.trim() && styles.modalButtonDisabled,
                  ]}
                  onPress={addQuickItem}
                  disabled={!quickAddName.trim()}
                >
                  <Text style={styles.modalButtonCompleteText}>Add Item</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
        {/* Voice recording overlay */}
        <Modal
          visible={showVoiceOverlay}
          animationType="fade"
          transparent={true}
          onRequestClose={() => {}}
        >
          <BlurView intensity={60} tint="dark" style={styles.voiceOverlay}>
            {isProcessingVoice ? (
              <View style={styles.voiceProcessingContent}>
                <ActivityIndicator size="large" color="#ffffff" />
                <Text style={styles.voiceProcessingText}>Building your list…</Text>
              </View>
            ) : (
              <View style={styles.voiceRecordingContent}>
                <Text style={styles.voicePulse}>🎤</Text>
                <Text style={styles.voicePromptText}>
                  Say the items you want to add to your list.
                </Text>
                <TouchableOpacity style={styles.voiceDoneButton} onPress={handleVoiceDone}>
                  <Text style={styles.voiceDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </BlurView>
        </Modal>

        {/* Scanning overlay */}
        {scanning && (
          <View style={styles.scanningOverlay}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.scanningText}>Analyzing receipt...</Text>
          </View>
        )}

        {/* Edit Item Modal */}
        <Modal
          visible={showEditModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowEditModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setShowEditModal(false)}
            />
            <ScrollView
              style={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalTitle}>Edit Item</Text>

              <Text style={styles.categoryLabel}>Name</Text>
              <TextInput
                style={styles.quickAddInput}
                value={editName}
                onChangeText={handleEditNameChange}
                onBlur={handleEditNameBlur}
                autoFocus
                returnKeyType="done"
              />

              <Text style={styles.categoryLabel}>Quantity</Text>
              <TextInput
                style={[styles.quickAddInput, { marginBottom: 16 }]}
                placeholder="e.g. 2 lbs, 1 dozen"
                value={editQuantity}
                onChangeText={setEditQuantity}
                returnKeyType="done"
              />

              <Text style={styles.categoryLabel}>Category</Text>
              <View style={styles.categoryWrap}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      { borderColor: cat.color },
                      editCategoryId === cat.id && { backgroundColor: cat.color },
                    ]}
                    onPress={() => setEditCategoryId(cat.id)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        editCategoryId === cat.id && styles.categoryChipTextSelected,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => editingItem && deleteItem(editingItem.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButtonComplete,
                    !editName.trim() && styles.modalButtonDisabled,
                  ]}
                  onPress={saveEditItem}
                  disabled={!editName.trim()}
                >
                  <Text style={styles.modalButtonCompleteText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  deleteListButton: {
    padding: 6,
  },
  deleteListText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '700',
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
  listContainer: {
    flex: 1,
  },
  list: {
    paddingBottom: 100,
  },
  sectionHeader: {
    padding: 14,
    paddingHorizontal: 20,
    marginTop: 20,
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
  fab: {
    position: 'absolute',
    bottom: 99,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '300',
    marginTop: -2,
  },
  quickAddInput: {
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  categoryChipTextSelected: {
    color: '#ffffff',
  },
  modalButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  scanReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  scanReceiptIcon: { fontSize: 28 },
  scanReceiptTitle: { fontSize: 15, fontWeight: '700', color: '#065f46' },
  scanReceiptSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  modalDividerText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 14,
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    zIndex: 99,
  },
  scanningText: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  holdHint: {
    position: 'absolute',
    bottom: 4,
    right: 10,
    fontSize: 11,
    color: '#9ca3af',
  },
  deleteButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
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
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#faf9f5',
    padding: 40,
  },
  emptyListText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptyListSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  micFab: {
    position: 'absolute',
    bottom: 165,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  micFabText: {
    fontSize: 22,
  },
  voiceOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceRecordingContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  voicePulse: {
    fontSize: 64,
    marginBottom: 24,
  },
  voicePromptText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 26,
  },
  voiceDoneButton: {
    backgroundColor: '#ef4444',
    borderRadius: 36,
    paddingHorizontal: 48,
    paddingVertical: 18,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  voiceDoneText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  voiceProcessingContent: {
    alignItems: 'center',
    gap: 20,
  },
  voiceProcessingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
