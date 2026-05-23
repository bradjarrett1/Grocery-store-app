import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/useAuthStore';
import { scanReceipt } from '../../lib/receiptScanner';

interface ShoppingList {
  id: string;
  name: string | null;
  created_at: string;
  completed_at: string;
  total_items: number;
  checked_items: number;
  total_spent: number | null;
  store_name: string | null;
  receipt_date: string | null;
  subtotal: number | null;
  tax: number | null;
  receipt_image_uri: string | null;
}

interface ListItem {
  id: string;
  item_name: string;
  price: number | null;
  quantity: string | null;
  checked: boolean;
  added_from_receipt: boolean;
}

export default function HistoryScreen() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tripItems, setTripItems] = useState<Record<string, ListItem[]>>({});
  const [scanningId, setScanningId] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);

  useFocusEffect(
    useCallback(() => {
      if (user) loadHistory();
    }, [user])
  );

  async function loadHistory() {
    setLoading(true);
    const { data, error } = await supabase
      .from('shopping_lists')
      .select('*')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });

    if (!error) setLists(data ?? []);
    setLoading(false);
  }

  async function loadTripItems(listId: string) {
    if (tripItems[listId]) return;
    const { data } = await supabase
      .from('list_items')
      .select('id, item_name, price, quantity, checked, added_from_receipt')
      .eq('list_id', listId)
      .order('added_from_receipt')
      .order('item_name');
    if (data) setTripItems((prev) => ({ ...prev, [listId]: data }));
  }

  function toggleExpand(listId: string) {
    if (expandedId === listId) {
      setExpandedId(null);
    } else {
      setExpandedId(listId);
      loadTripItems(listId);
    }
  }

  async function scanForTrip(trip: ShoppingList) {
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
    setScanningId(trip.id);

    try {
      const existing = tripItems[trip.id] ?? [];
      let listItemsForMatching = existing;
      if (!existing.length) {
        const { data } = await supabase
          .from('list_items')
          .select('id, item_name')
          .eq('list_id', trip.id);
        listItemsForMatching = data ?? [];
      }

      const receiptData = await scanReceipt(base64!, listItemsForMatching);
      router.push({
        pathname: '/receipt-review',
        params: {
          listId: trip.id,
          imageUri: uri,
          receiptJson: JSON.stringify(receiptData),
          listItemsJson: JSON.stringify(
            listItemsForMatching.map((i) => ({ id: i.id, item_name: i.item_name }))
          ),
          completeTrip: 'false',
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Scan failed';
      Alert.alert('Scan failed', message);
    } finally {
      setScanningId(null);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }

  function renderItem({ item }: { item: ShoppingList }) {
    const isExpanded = expandedId === item.id;
    const items = tripItems[item.id];
    const isScanning = scanningId === item.id;
    const hasReceipt = !!item.receipt_image_uri || !!item.store_name || !!item.total_spent;

    return (
      <View style={styles.card}>
        {/* Main row */}
        <TouchableOpacity style={styles.cardHeader} onPress={() => toggleExpand(item.id)}>
          <View style={styles.cardLeft}>
            <Text style={styles.storeName}>
              {item.store_name ?? item.name ?? 'Shopping Trip'}
            </Text>
            <Text style={styles.cardDate}>{formatDate(item.completed_at)}</Text>
            <Text style={styles.cardMeta}>
              {item.total_items} items
              {item.total_spent != null
                ? `  ·  $${item.total_spent.toFixed(2)}`
                : ''}
            </Text>
          </View>
          <View style={styles.cardRight}>
            {item.receipt_image_uri ? (
              <Image
                source={{ uri: item.receipt_image_uri }}
                style={styles.receiptThumb}
                resizeMode="cover"
              />
            ) : null}
            <Text style={styles.expandChevron}>{isExpanded ? '▲' : '▼'}</Text>
          </View>
        </TouchableOpacity>

        {/* Totals strip if scanned */}
        {hasReceipt && (item.subtotal != null || item.tax != null) && (
          <View style={styles.totalsStrip}>
            {item.subtotal != null && (
              <Text style={styles.totalsPill}>Subtotal ${item.subtotal.toFixed(2)}</Text>
            )}
            {item.tax != null && (
              <Text style={styles.totalsPill}>Tax ${item.tax.toFixed(2)}</Text>
            )}
            {item.total_spent != null && (
              <Text style={[styles.totalsPill, styles.totalsPillBold]}>
                Total ${item.total_spent.toFixed(2)}
              </Text>
            )}
          </View>
        )}

        {/* Expanded item list */}
        {isExpanded && (
          <View style={styles.itemsList}>
            {!items ? (
              <ActivityIndicator style={{ padding: 16 }} color="#10b981" />
            ) : (
              items.map((li) => (
                <View key={li.id} style={styles.itemRow}>
                  {li.added_from_receipt && (
                    <View style={styles.fromReceiptDot} />
                  )}
                  <Text style={styles.itemName} numberOfLines={1}>
                    {li.item_name}
                    {li.quantity ? `  ·  ${li.quantity}` : ''}
                  </Text>
                  {li.price != null && (
                    <Text style={styles.itemPrice}>${li.price.toFixed(2)}</Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* Scan button */}
        <View style={styles.cardFooter}>
          {isScanning ? (
            <View style={styles.scanningRow}>
              <ActivityIndicator size="small" color="#10b981" />
              <Text style={styles.scanningText}>Analyzing receipt...</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.scanButton} onPress={() => scanForTrip(item)}>
              <Text style={styles.scanButtonText}>
                {hasReceipt ? '📷  Re-scan Receipt' : '📷  Scan Receipt'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
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
          <Text style={styles.title}>History</Text>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#10b981" />
          </View>
        ) : lists.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>No Shopping History</Text>
            <Text style={styles.emptySubtitle}>
              Completed shopping trips will appear here
            </Text>
          </View>
        ) : (
          <FlatList
            data={lists}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
          />
        )}
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1f2937' },
  list: { padding: 16, paddingBottom: 40 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#1f2937', marginBottom: 8 },
  emptySubtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
  },
  cardLeft: { flex: 1 },
  storeName: { fontSize: 17, fontWeight: '700', color: '#1f2937', marginBottom: 2 },
  cardDate: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  cardMeta: { fontSize: 13, color: '#10b981', fontWeight: '500' },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  receiptThumb: {
    width: 52,
    height: 68,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  expandChevron: { fontSize: 11, color: '#9ca3af' },
  totalsStrip: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexWrap: 'wrap',
  },
  totalsPill: {
    fontSize: 12,
    color: '#374151',
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  totalsPillBold: { fontWeight: '700', backgroundColor: '#d1fae5', color: '#065f46' },
  itemsList: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
    gap: 8,
  },
  fromReceiptDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
    flexShrink: 0,
  },
  itemName: { flex: 1, fontSize: 14, color: '#374151' },
  itemPrice: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    padding: 12,
  },
  scanButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  scanButtonText: { fontSize: 14, color: '#10b981', fontWeight: '600' },
  scanningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  scanningText: { fontSize: 14, color: '#6b7280' },
});
