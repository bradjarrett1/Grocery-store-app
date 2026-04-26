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
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/useAuthStore';
import { GlassModal } from '../../components/GlassModal';
import { GlassCard } from '../../components/GlassCard';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface TemplateItem {
  tempId: string;
  item_name: string;
  category_id: string;
  quantity: string;
}

export default function CreateTemplateScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // New item modal
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');

  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('default_aisle_order');

    if (!error && data) {
      setCategories(data);
      if (data.length > 0) {
        setNewItemCategory(data[0].id);
      }
    }
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

    setLoading(true);

    // Create template
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .insert({
        user_id: user?.id,
        name: name.trim(),
        description: description.trim() || null,
      })
      .select()
      .single();

    if (templateError) {
      Alert.alert('Error', templateError.message);
      setLoading(false);
      return;
    }

    // Add template items
    const { error: itemsError } = await supabase
      .from('template_items')
      .insert(
        items.map((item) => ({
          template_id: template.id,
          item_name: item.item_name,
          category_id: item.category_id,
          quantity: item.quantity || null,
        }))
      );

    setLoading(false);

    if (itemsError) {
      Alert.alert('Error', itemsError.message);
    } else {
      Alert.alert('Success', 'Template created!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Template</Text>
        <TouchableOpacity onPress={saveTemplate} disabled={loading}>
          <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
            {loading ? 'Saving...' : 'Save'}
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
      </ScrollView>

      {/* Add Item Modal */}
      <GlassModal
        visible={showAddItem}
        onClose={() => {
          setShowAddItem(false);
          setNewItemName('');
          setNewItemQuantity('');
        }}
      >
        <Text style={styles.modalTitle}>Add Item</Text>

        <TextInput
          style={styles.input}
          placeholder="Item name"
          value={newItemName}
          onChangeText={setNewItemName}
          autoFocus
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal style={styles.categoryPicker} showsHorizontalScrollIndicator={false}>
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
          placeholderTextColor="#9ca3af"
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
          <TouchableOpacity style={styles.modalButtonAdd} onPress={addItem}>
            <Text style={styles.modalButtonAddText}>Add</Text>
          </TouchableOpacity>
        </View>
      </GlassModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    backgroundColor: 'rgba(249, 250, 251, 0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(229, 231, 235, 0.6)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1f2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  categoryPicker: {
    marginBottom: 16,
    maxHeight: 50,
  },
  categoryOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
    padding: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(229, 231, 235, 0.8)',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  modalButtonCancelText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '700',
  },
  modalButtonAdd: {
    flex: 1,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#10b981',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalButtonAddText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
  },
});
