import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  FileText,
  Clock,
  Flame,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { GlassCard } from '../../src/components/GlassCard';
import { Colors } from '../../src/constants/theme';
import { automationService, AutomationTemplate } from '../../src/services/automationService';

const CATEGORIES = ['All', 'Sales', 'Finance', 'Operations'];

export default function AutomationTemplatesScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
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

  const getTemplateIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'invoice_overdue':
        return <FileText size={18} color="#059669" />;
      case 'lead_inactive':
        return <Clock size={18} color="#D97706" />;
      case 'website_lead_received':
        return <Flame size={18} color="#2563EB" />;
      case 'daily_summary':
        return <BarChart3 size={18} color="#7C3AED" />;
      case 'calendar_event_upcoming':
        return <Calendar size={18} color="#D97706" />;
      case 'lead_qualified':
        return <CheckCircle2 size={18} color="#059669" />;
      default:
        return <Sparkles size={18} color="#059669" />;
    }
  };

  const getIconBg = (triggerType: string) => {
    switch (triggerType) {
      case 'invoice_overdue':
        return '#ECFDF5';
      case 'lead_inactive':
        return '#FEF3C7';
      case 'website_lead_received':
        return '#EFF6FF';
      case 'daily_summary':
        return '#F5F3FF';
      case 'calendar_event_upcoming':
        return '#FEF3C7';
      default:
        return '#ECFDF5';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Automation Templates</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Category Filter Pills matching Screen 9 */}
      <View style={styles.categoriesRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catPill, selectedCategory === cat && styles.catPillActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.catText, selectedCategory === cat && styles.catTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loaderCenter}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loaderText}>Loading templates...</Text>
          </View>
        ) : (
          templates.map((tpl) => (
            <TouchableOpacity
              key={tpl.id}
              activeOpacity={0.85}
              onPress={() => {
                router.push({
                  pathname: '/automations/create',
                  params: { prompt: `${tpl.name}: ${tpl.description}` },
                } as any);
              }}
            >
              <GlassCard style={styles.templateCard}>
                <View style={styles.cardRow}>
                  <View style={[styles.iconWrap, { backgroundColor: getIconBg(tpl.trigger_type) }]}>
                    {getTemplateIcon(tpl.trigger_type)}
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.templateTitle}>{tpl.name}</Text>
                    <Text style={styles.templateDesc} numberOfLines={2}>
                      {tpl.description}
                    </Text>
                  </View>
                  <ChevronRight size={16} color="#94A3B8" />
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  categoriesRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  catPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  catPillActive: {
    backgroundColor: '#059669',
  },
  catText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  catTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  templateCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  templateDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  loaderCenter: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 13,
    color: '#64748B',
  },
});
