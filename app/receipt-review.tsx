import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';
import type { ReceiptData, ReceiptItem } from '../lib/receiptScanner';

interface ListItem {
  id: string;
  item_name: string;
}

interface ReviewItem {
  receiptName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  editedPrice: string;
  matchedListItemId: string | null;
  matchedListItemName: string | null;
  isOnOriginalList: boolean;
}

export default function ReceiptReviewScreen() {
  const params = useLocalSearchParams<{
    listId: string;
    imageUri: string;
    receiptJson: string;
    listItemsJson: string;
    completeTrip: string;
  }>();

  const receipt: ReceiptData = JSON.parse(params.receiptJson ?? '{}');
  const listItems: ListItem[] = JSON.parse(params.listItemsJson ?? '[]');

  const [storeName, setStoreName] = useState(receipt.store_name ?? '');
  const [receiptDate, setReceiptDate] = useState(receipt.date ?? '');
  const [subtotal, setSubtotal] = useState(receipt.subtotal?.toFixed(2) ?? '');
  const [tax, setTax] = useState(receipt.tax?.toFixed(2) ?? '');
  const [total, setTotal] = useState(receipt.total?.toFixed(2) ?? '');
  const [saving, setSaving] = useState(false);

  const [reviewItems, setReviewItems] = useState<ReviewItem[]>(() =>
    (receipt.items ?? []).map((item: ReceiptItem) => {
      const matched = listItems.find(
        (li) => li.item_name === item.matched_list_item
      );
      return {
        receiptName: item.name,
        quantity: item.quantity ?? 1,
        unitPrice: item.unit_price ?? 0,
        totalPrice: item.total_price ?? 0,
        editedPrice: (item.total_price ?? 0).toFixed(2),
        matchedListItemId: matched?.id ?? null,
        matchedListItemName: matched?.item_name ?? null,
        isOnOriginalList: !!matched,
      };
    })
  );

  function updatePrice(index: number, value: string) {
    setReviewItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, editedPrice: value } : item))
    );
  }

  async function saveReceipt() {
    if (!params.listId) return;
    setSaving(true);

    try {
      // Copy image to persistent app storage
      let persistedUri: string | null = null;
      if (params.imageUri) {
        const dest = FileSystem.documentDirectory + `receipt_${params.listId}.jpg`;
        await FileSystem.copyAsync({ from: params.imageUri, to: dest });
        persistedUri = dest;
      }

      // Build shopping_list update payload
      const listUpdate: Record<string, unknown> = {
        store_name: storeName || null,
        receipt_date: receiptDate || null,
        subtotal: subtotal ? parseFloat(subtotal) : null,
        tax: tax ? parseFloat(tax) : null,
        total_spent: total ? parseFloat(total) : null,
        receipt_image_uri: persistedUri,
      };

      if (params.completeTrip === 'true') {
        listUpdate.completed_at = new Date().toISOString();
      }

      const { error: listError } = await supabase
        .from('shopping_lists')
        .update(listUpdate)
        .eq('id', params.listId);

      if (listError) throw listError;

      // Update matched list items with prices
      const matchedItems = reviewItems.filter(
        (item) => item.isOnOriginalList && item.matchedListItemId
      );
      for (const item of matchedItems) {
        await supabase
          .from('list_items')
          .update({ price: parseFloat(item.editedPrice) || null })
          .eq('id', item.matchedListItemId!);
      }

      // Insert unmatched receipt items as new list items
      const unmatchedItems = reviewItems.filter((item) => !item.isOnOriginalList);
      if (unmatchedItems.length > 0) {
        const inserts = unmatchedItems.map((item) => ({
          list_id: params.listId,
          item_name: item.receiptName,
          price: parseFloat(item.editedPrice) || null,
          added_from_receipt: true,
          checked: true,
        }));
        await supabase.from('list_items').insert(inserts);
      }

      router.dismissAll();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save receipt';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  }

  const matched = reviewItems.filter((i) => i.isOnOriginalList);
  const unmatched = reviewItems.filter((i) => !i.isOnOriginalList);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} disabled={saving}>
          <Text style={styles.headerCancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Receipt</Text>
        <TouchableOpacity onPress={saveReceipt} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#10b981" />
          ) : (
            <Text style={styles.headerSave}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Receipt image */}
          {params.imageUri ? (
            <Image
              source={{ uri: params.imageUri }}
              style={styles.receiptImage}
              resizeMode="contain"
            />
          ) : null}

          {/* Store + date */}
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Store</Text>
            <TextInput
              style={styles.fieldInput}
              value={storeName}
              onChangeText={setStoreName}
              placeholder="Store name"
              placeholderTextColor="#9ca3af"
            />
            <View style={styles.divider} />
            <Text style={styles.fieldLabel}>Date</Text>
            <TextInput
              style={styles.fieldInput}
              value={receiptDate}
              onChangeText={setReceiptDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
            />
            {receipt.payment_method ? (
              <>
                <View style={styles.divider} />
                <Text style={styles.fieldLabel}>Payment</Text>
                <Text style={styles.fieldValue}>{receipt.payment_method}</Text>
              </>
            ) : null}
          </View>

          {/* Matched items */}
          {matched.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>On Your List</Text>
              <View style={styles.card}>
                {matched.map((item, idx) => (
                  <View key={idx} style={[styles.itemRow, idx > 0 && styles.itemRowBorder]}>
                    <View style={styles.itemDot} />
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.matchedListItemName}</Text>
                      {item.quantity > 1 && (
                        <Text style={styles.itemSub}>
                          {item.quantity} × ${item.unitPrice.toFixed(2)}
                        </Text>
                      )}
                    </View>
                    <View style={styles.priceInputWrapper}>
                      <Text style={styles.dollarSign}>$</Text>
                      <TextInput
                        style={styles.priceInput}
                        value={item.editedPrice}
                        onChangeText={(v) => updatePrice(reviewItems.indexOf(item), v)}
                        keyboardType="decimal-pad"
                        selectTextOnFocus
                      />
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Unmatched items */}
          {unmatched.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Not On Your List</Text>
              <View style={styles.card}>
                {unmatched.map((item, idx) => (
                  <View key={idx} style={[styles.itemRow, idx > 0 && styles.itemRowBorder]}>
                    <View style={[styles.itemDot, styles.itemDotUnmatched]} />
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.receiptName}</Text>
                      <View style={styles.notOnListBadge}>
                        <Text style={styles.notOnListText}>added from receipt</Text>
                      </View>
                    </View>
                    <View style={styles.priceInputWrapper}>
                      <Text style={styles.dollarSign}>$</Text>
                      <TextInput
                        style={styles.priceInput}
                        value={item.editedPrice}
                        onChangeText={(v) => updatePrice(reviewItems.indexOf(item), v)}
                        keyboardType="decimal-pad"
                        selectTextOnFocus
                      />
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Totals */}
          <Text style={styles.sectionLabel}>Totals</Text>
          <View style={styles.card}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <View style={styles.priceInputWrapper}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  style={styles.priceInput}
                  value={subtotal}
                  onChangeText={setSubtotal}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
              </View>
            </View>
            <View style={[styles.totalRow, styles.itemRowBorder]}>
              <Text style={styles.totalLabel}>Tax</Text>
              <View style={styles.priceInputWrapper}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  style={styles.priceInput}
                  value={tax}
                  onChangeText={setTax}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
              </View>
            </View>
            <View style={[styles.totalRow, styles.itemRowBorder]}>
              <Text style={[styles.totalLabel, styles.totalBold]}>Total</Text>
              <View style={styles.priceInputWrapper}>
                <Text style={[styles.dollarSign, styles.totalBold]}>$</Text>
                <TextInput
                  style={[styles.priceInput, styles.totalBold]}
                  value={total}
                  onChangeText={setTotal}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={saveReceipt}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>
                {params.completeTrip === 'true' ? 'Save & Complete Trip' : 'Save Receipt'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerCancel: { fontSize: 16, color: '#6b7280' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1f2937' },
  headerSave: { fontSize: 16, fontWeight: '700', color: '#10b981' },
  scroll: { padding: 16, paddingBottom: 48 },
  receiptImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#e5e7eb',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  fieldInput: {
    fontSize: 16,
    color: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  fieldValue: {
    fontSize: 16,
    color: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 14,
  },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  itemRowBorder: { borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  itemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    flexShrink: 0,
  },
  itemDotUnmatched: { backgroundColor: '#f59e0b' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, color: '#1f2937', fontWeight: '500' },
  itemSub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  notOnListBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fef3c7',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 3,
  },
  notOnListText: { fontSize: 10, color: '#92400e', fontWeight: '600' },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 80,
  },
  dollarSign: { fontSize: 14, color: '#6b7280', marginRight: 2 },
  priceInput: { fontSize: 15, color: '#1f2937', minWidth: 52, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  totalLabel: { fontSize: 15, color: '#1f2937' },
  totalBold: { fontWeight: '700', fontSize: 16 },
  saveButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: { backgroundColor: '#d1d5db' },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
