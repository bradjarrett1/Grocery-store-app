import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/useAuthStore';

interface Template {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  template_items: Array<{
    id: string;
    item_name: string;
  }>;
}

export default function TemplatesScreen() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadTemplates();
      }
    }, [user])
  );

  async function loadTemplates() {
    setLoading(true);
    const { data, error } = await supabase
      .from('templates')
      .select('*, template_items(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading templates:', error);
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  }

  async function deleteTemplate(templateId: string, templateName: string) {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${templateName}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('templates')
              .delete()
              .eq('id', templateId);

            if (error) {
              Alert.alert('Error', 'Failed to delete template');
              console.error('Error deleting template:', error);
            } else {
              loadTemplates();
            }
          },
        },
      ]
    );
  }

  function renderTemplate({ item }: { item: Template }) {
    const itemCount = item.template_items?.length || 0;

    return (
      <TouchableOpacity
        style={styles.templateCard}
        onPress={() => router.push(`/template/${item.id}`)}
        onLongPress={() => deleteTemplate(item.id, item.name)}
        delayLongPress={1000}
      >
        <View style={styles.templateHeader}>
          <Text style={styles.templateName}>{item.name}</Text>
          <Text style={styles.itemCount}>{itemCount} items</Text>
        </View>
        {item.description && (
          <Text style={styles.templateDescription}>{item.description}</Text>
        )}
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
          <Text style={styles.title}>Templates</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/template/create')}
          >
            <Text style={styles.addButtonText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Loading...</Text>
          </View>
        ) : templates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>No Templates Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create a template to save your frequently bought items
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/template/create')}
            >
              <Text style={styles.createButtonText}>Create Template</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={templates}
            renderItem={renderTemplate}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  templateCard: {
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
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  itemCount: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  templateDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
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
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  createButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
