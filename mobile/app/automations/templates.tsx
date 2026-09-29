import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Search,
  Clock,
  AlertCircle,
  Mail,
  Zap,
  Bot,
  Layers,
  ChevronRight,
} from 'lucide-react-native';
import { GlassCard } from '../../src/components/GlassCard';
import { Colors, Shadows } from '../../src/constants/theme';
import { automationService, AutomationTemplate } from '../../src/services/automationService';

const CATEGORIES = ['All', 'Sales', 'Finance', 'Operations', 'Proposals', 'Customer'];

export default function AutomationTemplatesScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, [selectedCategory]);

  const loadTemplates = async () => {
    try {
      const data = await automationService.getTemplates(
        selectedCategory === 'All' ? undefined : selectedCategory
      );
      setTemplates(data);
    } catch (e) {
      console.warn('Error fetching templates:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
  });

  const getTemplateIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'sales':
        return <Clock size={18} color="#4F46E5" />;
      case 'finance':
        return <AlertCircle size={18} color="#D97706" />;
      case 'operations':
        return <Zap size={18} color="#2563EB" />;
      case 'customer':
        return <Mail size={18} color="#059669" />;
      default:
        return <Bot size={18} color="#4F46E5" />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Automation Templates</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <Search size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search automation templates..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Pills */}
      <View style={styles.pillsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.pill, selectedCategory === cat && styles.pillActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.pillText, selectedCategory === cat && styles.pillTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {filteredTemplates.map((tpl) => (
            <GlassCard key={tpl.id} style={styles.tplCard}>
              <View style={styles.tplHeader}>
                <View style={styles.tplLeft}>
                  <View style={styles.iconBox}>{getTemplateIcon(tpl.category)}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tplName}>{tpl.name}</Text>
                    <View style={styles.badgeRow}>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{tpl.category.toUpperCase()}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              <Text style={styles.tplDesc}>{tpl.description}</Text>

              <TouchableOpacity
                style={styles.useBtn}
                activeOpacity={0.88}
                onPress={() =>
                  router.push(`/automations/create?templateId=${tpl.id}` as any)
                }
              >
                <Text style={styles.useBtnText}>Use Template</Text>
                <ChevronRight size={14} color="#10B981" />
              </TouchableOpacity>
            </GlassCard>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    ...Shadows.card,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  pillsWrap: {
    marginBottom: 12,
  },
  pillsScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tplCard: {
    padding: 16,
    ...Shadows.card,
  },
  tplHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tplLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tplName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 3,
  },
  categoryBadge: {
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  tplDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginTop: 10,
    marginBottom: 12,
  },
  useBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
  },
  useBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
});
