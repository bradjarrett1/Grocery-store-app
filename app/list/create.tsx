import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/useAuthStore';

interface Template {
  id: string;
  name: string;
  template_items: TemplateItem[];
}

interface TemplateItem {
  id: string;
  item_name: string;
  category_id: string;
  quantity: string | null;
}

interface SelectedItem {
  item_name: string;
  category_id: string;
  quantity: string | null;
  selected: boolean;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

export default function CreateListScreen() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Add custom item
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');

  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [templatesResult, categoriesResult] = await Promise.all([
      supabase
        .from('templates')
        .select('*, template_items(*)')
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('default_aisle_order'),
    ]);

    if (templatesResult.data) {
      setTemplates(templatesResult.data);
    }

    if (categoriesResult.data) {
      setCategories(categoriesResult.data);
      setNewItemCategory('');
    }

    setLoading(false);
  }

  function selectTemplate(template: Template) {
    setSelectedTemplate(template);
    setItems(
      template.template_items.map((item) => ({
        item_name: item.item_name,
        category_id: item.category_id,
        quantity: item.quantity,
        selected: true, // All selected by default
      }))
    );
  }

  function toggleItem(index: number) {
    setItems(
      items.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  }

  function addCustomItem() {
    if (!newItemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    setItems([
      ...items,
      {
        item_name: newItemName.trim(),
        category_id: newItemCategory,
        quantity: newItemQuantity.trim() || null,
        selected: true,
      },
    ]);

    setNewItemName('');
    setNewItemQuantity('');
    setShowAddItem(false);
  }

  async function createShoppingList() {
    const selectedItems = items.filter((item) => item.selected);

    if (selectedItems.length === 0) {
      Alert.alert('Error', 'Please select at least one item');
      return;
    }

    setCreating(true);

    // Create shopping list
    const { data: list, error: listError } = await supabase
      .from('shopping_lists')
      .insert({
        user_id: user?.id,
        name: selectedTemplate?.name || 'Shopping Trip',
        total_items: selectedItems.length,
        checked_items: 0,
      })
      .select()
      .single();

    if (listError) {
      Alert.alert('Error', listError.message);
      setCreating(false);
      return;
    }

    // Add list items
    const { error: itemsError } = await supabase
      .from('list_items')
      .insert(
        selectedItems.map((item) => ({
          list_id: list.id,
          item_name: item.item_name,
          category_id: item.category_id,
          quantity: item.quantity,
        }))
      );

    setCreating(false);

    if (itemsError) {
      Alert.alert('Error', itemsError.message);
    } else {
      Alert.alert('Success!', 'Shopping list created', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  function startBlankList() {
    setSelectedTemplate({
      id: 'blank',
      name: 'New List',
      template_items: [],
    });
    setItems([]);
  }

  // Step 1: Select template
  if (!selectedTemplate) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>New Shopping Trip</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Select a Template</Text>

          {/* Create New List Button */}
          <View style={styles.createNewListContainer}>
            <TouchableOpacity
              style={styles.createNewListButton}
              onPress={startBlankList}
            >
              <View style={styles.createNewListIcon}>
                <Text style={styles.createNewListIconText}>+</Text>
              </View>
              <View style={styles.createNewListTextContainer}>
                <Text style={styles.createNewListTitle}>Create New List</Text>
                <Text style={styles.createNewListSubtitle}>
                  Start from scratch
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {templates.length === 0 ? (
            <View style={styles.emptyTemplates}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>No templates yet</Text>
              <TouchableOpacity
                style={styles.createTemplateButton}
                onPress={() => router.push('/template/create')}
              >
                <Text style={styles.createTemplateButtonText}>
                  Create Template
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={templates}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.templateCard}
                  onPress={() => selectTemplate(item)}
                >
                  <Text style={styles.templateName}>{item.name}</Text>
                  <Text style={styles.templateItems}>
                    {item.template_items.length} items
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.templateList}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Step 2: Select items from template
  const selectedCount = items.filter((item) => item.selected).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSelectedTemplate(null)}>
          <Text style={styles.cancelButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Select Items</Text>
        <TouchableOpacity
          onPress={createShoppingList}
          disabled={creating || selectedCount === 0}
        >
          <Text
            style={[
              styles.createButton,
              (creating || selectedCount === 0) && styles.createButtonDisabled,
            ]}
          >
            {creating ? 'Creating...' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.selectedInfo}>
        <Text style={styles.selectedText}>
          {selectedCount} items selected
        </Text>
        <TouchableOpacity
          style={styles.addCustomButton}
          onPress={() => setShowAddItem(true)}
        >
          <Text style={styles.addCustomButtonText}>+ Custom Item</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item, index) => `${item.item_name}-${index}`}
        renderItem={({ item, index }) => {
          const category = categories.find((c) => c.id === item.category_id);

          return (
            <TouchableOpacity
              style={styles.itemRow}
              onPress={() => toggleItem(index)}
            >
              <View
                style={[
                  styles.checkbox,
                  item.selected && styles.checkboxSelected,
                ]}
              >
                {item.selected && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.item_name}</Text>
                <View style={styles.itemMeta}>
                  {category && (
                    <View
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: category.color },
                      ]}
                    >
                      <Text style={styles.categoryText}>{category.name}</Text>
                    </View>
                  )}
                  {item.quantity && (
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.itemsList}
      />

      {/* Add Custom Item Modal */}
      <Modal
        visible={showAddItem}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddItem(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowAddItem(false)}
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Item</Text>

            <TextInput
              style={styles.input}
              placeholder="Item name"
              value={newItemName}
              onChangeText={setNewItemName}
              autoFocus
            />

            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal style={styles.categoryPicker}>
              <TouchableOpacity
                style={[
                  styles.categoryOption,
                  { borderColor: '#9ca3af' },
                  newItemCategory === '' && { backgroundColor: '#9ca3af' },
                ]}
                onPress={() => setNewItemCategory('')}
              >
                <Text
                  style={[
                    styles.categoryOptionText,
                    newItemCategory === '' && styles.categoryOptionTextActive,
                  ]}
                >
                  N/A
                </Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryOption,
                    { borderColor: cat.color },
                    newItemCategory === cat.id && {
                      backgroundColor: cat.color,
                    },
                  ]}
                  onPress={() => setNewItemCategory(cat.id)}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      newItemCategory === cat.id &&
                        styles.categoryOptionTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2, 1 lb, 6 pack (optional)"
              value={newItemQuantity}
              onChangeText={setNewItemQuantity}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowAddItem(false);
                  setNewItemName('');
                  setNewItemQuantity('');
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonAdd}
                onPress={addCustomItem}
              >
                <Text style={styles.modalButtonAddText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  cancelButton: {
    fontSize: 16,
    color: '#6b7280',
  },
  createButton: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    padding: 20,
  },
  templateList: {
    padding: 16,
  },
  templateCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  templateItems: {
    fontSize: 14,
    color: '#10b981',
  },
  emptyTemplates: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  createTemplateButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createTemplateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  createNewListContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  createNewListButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  createNewListIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  createNewListIconText: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '600',
  },
  createNewListTextContainer: {
    flex: 1,
  },
  createNewListTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  createNewListSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  selectedInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  selectedText: {
    fontSize: 14,
    color: '#6b7280',
  },
  addCustomButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addCustomButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  itemsList: {
    paddingBottom: 20,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  quantityText: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  categoryPicker: {
    marginBottom: 16,
    maxHeight: 50,
  },
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    marginRight: 8,
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#1f2937',
  },
  categoryOptionTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButtonCancel: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  modalButtonAdd: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  modalButtonAddText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
});
