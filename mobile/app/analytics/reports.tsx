import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  FileText,
  Sparkles,
  Download,
  Calendar,
  ChevronRight,
  Check,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { analyticsService, ReportItem } from '../../src/services/analyticsService';
import { GlassCard } from '../../src/components/GlassCard';

const REPORT_TYPES = [
  { id: 'executive_summary', label: 'Executive Briefing' },
  { id: 'monthly_financial', label: 'Financial & Cashflow' },
  { id: 'sales_pipeline', label: 'Sales & Conversion' },
  { id: 'customer_health', label: 'Customer Cohort' },
];

const TIMEFRAMES = [
  { id: '7d', label: '7D' },
  { id: '30d', label: '30D' },
  { id: '90d', label: '90D' },
  { id: '1y', label: '1Y' },
];

export default function ReportsStudioScreen() {
  const router = useRouter();
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || 'default';

  const [reportType, setReportType] = useState('executive_summary');
  const [timeFrame, setTimeFrame] = useState('30d');
  const [reportsList, setReportsList] = useState<ReportItem[]>([]);
  const [activeReport, setActiveReport] = useState<ReportItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const list = await analyticsService.listReports(businessId);
      setReportsList(list);
      if (list.length > 0 && !activeReport) {
        // Load the most recent full report
        const full = await analyticsService.getReport(list[0].id, businessId);
        setActiveReport(full);
      }
    } catch (err) {
      console.warn('Error loading reports:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      const res = await analyticsService.generateReport({
        business_id: businessId,
        report_type: reportType,
        time_frame: timeFrame,
      });
      setActiveReport(res);
      setReportsList((prev) => [res, ...prev.filter((r) => r.id !== res.id)]);
      Alert.alert('Report Generated', 'Your executive business report has been compiled and saved.');
    } catch (err) {
      console.warn('Error generating report:', err);
      Alert.alert('Generation Failed', 'Could not compile report at this time.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectReport = async (repId: string) => {
    try {
      setLoading(true);
      const rep = await analyticsService.getReport(repId, businessId);
      setActiveReport(rep);
    } catch (err) {
      console.warn('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Report Studio</Text>
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={() => router.push(`/analytics/export?report_id=${activeReport?.id || ''}` as any)}
        >
          <Download size={16} color="#059669" />
          <Text style={styles.exportBtnText}>Export</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
        }
      >
        {/* Generator Controls */}
        <GlassCard style={styles.generatorCard} variant="elevated">
          <Text style={styles.sectionTitle}>Compile New Operational Brief</Text>
          <Text style={styles.sectionSubtitle}>
            AI supervisor compiles live metrics, summaries, and action plans.
          </Text>

          {/* Type Picker */}
          <Text style={styles.pickerLabel}>Report Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
            {REPORT_TYPES.map((t) => {
              const active = reportType === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.typePill, active && styles.typePillActive]}
                  onPress={() => setReportType(t.id)}
                >
                  <Text style={[styles.typePillText, active && styles.typePillTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Timeframe Picker */}
          <Text style={styles.pickerLabel}>Time Period</Text>
          <View style={styles.timeframeRow}>
            {TIMEFRAMES.map((tf) => {
              const active = timeFrame === tf.id;
              return (
                <TouchableOpacity
                  key={tf.id}
                  style={[styles.tfPill, active && styles.tfPillActive]}
                  onPress={() => setTimeFrame(tf.id)}
                >
                  <Text style={[styles.tfPillText, active && styles.tfPillTextActive]}>
                    {tf.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Generate Action Button */}
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateReport}
            disabled={generating}
            activeOpacity={0.8}
          >
            {generating ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Sparkles size={16} color="#FFFFFF" />
                <Text style={styles.generateButtonText}>Generate AI Report</Text>
              </>
            )}
          </TouchableOpacity>
        </GlassCard>

        {/* Active Report Viewer */}
        {activeReport ? (
          <View style={styles.reportContainer}>
            <GlassCard style={styles.reportHeaderCard} variant="elevated">
              <View style={styles.reportMetaHeader}>
                <View style={styles.badgeType}>
                  <Text style={styles.badgeTypeText}>
                    {activeReport.report_type.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.reportDate}>
                  {activeReport.time_frame.toUpperCase()} Period
                </Text>
              </View>

              <Text style={styles.reportTitle}>{activeReport.title}</Text>
              <Text style={styles.reportSummary}>{activeReport.summary}</Text>
            </GlassCard>

            {/* Sections */}
            {activeReport.sections && activeReport.sections.length > 0 && (
              <View style={styles.sectionsList}>
                {activeReport.sections.map((sec, idx) => (
                  <GlassCard key={idx} style={styles.sectionCard}>
                    <Text style={styles.secTitle}>{sec.title}</Text>
                    <Text style={styles.secSummary}>{sec.summary}</Text>

                    {sec.metrics && (
                      <View style={styles.metricsList}>
                        {Object.entries(sec.metrics).map(([k, v], mIdx) => (
                          <View key={mIdx} style={styles.metricRow}>
                            <Text style={styles.metricKey}>{k}</Text>
                            <Text style={styles.metricVal}>{String(v)}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </GlassCard>
                ))}
              </View>
            )}
          </View>
        ) : null}

        {/* Past Reports Archive */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Report Archive</Text>
        <Text style={styles.sectionSubtitle}>Previously generated reports</Text>

        <View style={styles.archiveList}>
          {reportsList.map((r) => {
            const isSelected = activeReport?.id === r.id;
            return (
              <TouchableOpacity
                key={r.id}
                style={[styles.archiveItem, isSelected && styles.archiveItemActive]}
                onPress={() => handleSelectReport(r.id)}
              >
                <View style={styles.archiveInfo}>
                  <Text style={styles.archiveTitle}>{r.title}</Text>
                  <Text style={styles.archiveMeta}>
                    {r.report_type.replace('_', ' ')} • {r.time_frame.toUpperCase()}
                  </Text>
                </View>
                <ChevronRight size={16} color={isSelected ? '#059669' : '#94A3B8'} />
              </TouchableOpacity>
            );
          })}
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  generatorCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 10,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginTop: 8,
    marginBottom: 6,
  },
  pickerScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  typePillActive: {
    backgroundColor: '#059669',
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  typePillTextActive: {
    color: '#FFFFFF',
  },
  timeframeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tfPill: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  tfPillActive: {
    backgroundColor: '#059669',
  },
  tfPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tfPillTextActive: {
    color: '#FFFFFF',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    marginTop: 4,
  },
  generateButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reportContainer: {
    gap: 12,
  },
  reportHeaderCard: {
    padding: 16,
    borderRadius: 16,
  },
  reportMetaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeType: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  reportDate: {
    fontSize: 11,
    color: '#64748B',
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  reportSummary: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  sectionsList: {
    gap: 10,
  },
  sectionCard: {
    padding: 14,
    borderRadius: 14,
  },
  secTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  secSummary: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10,
  },
  metricsList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 8,
    gap: 6,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricKey: {
    fontSize: 12,
    color: '#64748B',
  },
  metricVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  archiveList: {
    gap: 8,
    marginTop: 8,
  },
  archiveItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  archiveItemActive: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  archiveInfo: {
    flex: 1,
  },
  archiveTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  archiveMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});
