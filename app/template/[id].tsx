import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface TemplateItem {
  id?: string;
  tempId: string;
  item_name: string;
  category_id: string;
  quantity: string;
}

export default function EditTemplateScreen() {
  const { id } = useLocalSearchParams();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');

  useEffect(() => {
    loadCategories();
    loadTemplate();
  }, [id]);

  async function loadCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('default_aisle_order');

    if (data) {
      setCategories(data);
      if (data.length > 0) {
        setNewItemCategory(data[0].id);
      }
    }
  }

  async function loadTemplate() {
    const { data, error } = await supabase
      .from('templates')
      .select('*, template_items(*)')
      .eq('id', id)
      .single();

    if (error) {
      Alert.alert('Error', 'Template not found');
      router.back();
      return;
    }

    setName(data.name);
    setDescription(data.description || '');
    setItems(
      data.template_items.map((item: any) => ({
        id: item.id,
        tempId: item.id,
        item_name: item.item_name,
        category_id: item.category_id,
        quantity: item.quantity || '',
      }))
    );
    setLoading(false);
  }

  function addItem() {
    if (!newItemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    setItems([
      ...items,
      {
        tempId: Date.now().toString(),
        item_name: newItemName.trim(),
        category_id: newItemCategory,
        quantity: newItemQuantity.trim(),
      },
    ]);

    setNewItemName('');
    setNewItemQuantity('');
    setShowAddItem(false);
  }

  function removeItem(tempId: string) {
    setItems(items.filter((item) => item.tempId !== tempId));
  }

  async function saveTemplate() {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a template name');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }

    setSaving(true);

    // Update template
    const { error: templateError } = await supabase
      .from('templates')
      .update({
        name: name.trim(),
        description: description.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (templateError) {
      Alert.alert('Error', templateError.message);
      setSaving(false);
      return;
    }

    // Delete existing items
    await supabase.from('template_items').delete().eq('template_id', id);

    // Insert new items
    const { error: itemsError } = await supabase
      .from('template_items')
      .insert(
        items.map((item) => ({
          template_id: id as string,
          item_name: item.item_name,
          category_id: item.category_id,
          quantity: item.quantity || null,
        }))
      );

    setSaving(false);

    if (itemsError) {
      Alert.alert('Error', itemsError.message);
    } else {
      Alert.alert('Success', 'Template updated!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }

  async function deleteTemplate() {
    Alert.alert(
      'Delete Template',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('templates')
              .delete()
              .eq('id', id);

            if (error) {
              Alert.alert('Error', error.message);
            } else {
              router.back();
            }
          },
        },
      ]
    );
  }

  function renderItem({ item }: { item: TemplateItem }) {
    const category = categories.find((c) => c.id === item.category_id);

    return (
      <View style={styles.itemRow}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.item_name}</Text>
          <View style={styles.itemMeta}>
            {category && (
              <View
                style={[styles.categoryBadge, { backgroundColor: category.color }]}
              >
                <Text style={styles.categoryText}>{category.name}</Text>
              </View>
            )}
            {item.quantity && (
              <Text style={styles.quantityText}>{item.quantity}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => removeItem(item.tempId)}
          style={styles.removeButton}
        >
          <Text style={styles.removeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Template</Text>
        <TouchableOpacity onPress={saveTemplate} disabled={saving}>
          <Text style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Template Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Weekly Staples"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Items I buy every week"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Items ({items.length})</Text>
            <TouchableOpacity
              style={styles.addItemButton}
              onPress={() => setShowAddItem(true)}
            >
              <Text style={styles.addItemButtonText}>+ Add Item</Text>
            </TouchableOpacity>
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyItems}>
              <Text style={styles.emptyItemsText}>No items yet</Text>
            </View>
          ) : (
            <FlatList
              data={items}
              renderItem={renderItem}
              keyExtractor={(item) => item.tempId}
              scrollEnabled={false}
            />
          )}
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={deleteTemplate}
        >
          <Text style={styles.deleteButtonText}>Delete Template</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Item Modal */}
      <Modal
        visible={showAddItem}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddItem(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Item</Text>

            <TextInput
              style={styles.input}
              placeholder="Item name"
              value={newItemName}
              onChangeText={setNewItemName}
              autoFocus
            />

            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal style={styles.categoryPicker}>
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
                      newItemCategory === cat.id && styles.categoryOptionTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.input}
              placeholder="Quantity (optional)"
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
                onPress={addItem}
              >
                <Text style={styles.modalButtonAddText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  saveButton: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  },
  addItemButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addItemButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyItems: {
    padding: 32,
    alignItems: 'center',
  },
  emptyItemsText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
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
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    fontSize: 20,
    color: '#ef4444',
  },
  deleteButton: {
    margin: 20,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ef4444',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
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
    minHeight: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 20,
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
