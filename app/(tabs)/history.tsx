import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/useAuthStore';

interface ShoppingList {
  id: string;
  name: string | null;
  created_at: string;
  completed_at: string;
  total_items: number;
  checked_items: number;
}

export default function HistoryScreen() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  async function loadHistory() {
    setLoading(true);
    const { data, error } = await supabase
      .from('shopping_lists')
      .select('*')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error loading history:', error);
    } else {
      setLists(data || []);
    }
    setLoading(false);
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  }

  function renderList({ item }: { item: ShoppingList }) {
    return (
      <TouchableOpacity
        style={styles.listCard}
        onPress={() => router.push(`/history/${item.id}`)}
      >
        <View style={styles.listHeader}>
          <Text style={styles.listName}>
            {item.name || 'Shopping Trip'}
          </Text>
          <Text style={styles.listDate}>{formatDate(item.completed_at)}</Text>
        </View>
        <Text style={styles.listItems}>
          {item.total_items} items
          {item.checked_items < item.total_items &&
            ` • ${item.total_items - item.checked_items} unchecked`}
        </Text>
      </TouchableOpacity>
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
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Loading...</Text>
          </View>
        ) : lists.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>No Shopping History</Text>
            <Text style={styles.emptySubtitle}>
              Completed shopping trips will appear here
            </Text>
          </View>
        ) : (
          <FlatList
            data={lists}
            renderItem={renderList}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
          />
        )}
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
  list: {
    padding: 16,
  },
  listCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  listDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  listItems: {
    fontSize: 14,
    color: '#10b981',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
});
