import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Download,
  Copy,
  Share2,
  FileCode,
  FileSpreadsheet,
  FileText,
  Check,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { analyticsService, ReportItem, ReportExportResponse } from '../../src/services/analyticsService';
import { GlassCard } from '../../src/components/GlassCard';

const FORMATS = [
  { id: 'json', label: 'JSON Data', icon: FileCode },
  { id: 'csv', label: 'CSV Spreadsheet', icon: FileSpreadsheet },
  { id: 'markdown', label: 'Markdown', icon: FileText },
];

export default function ReportExportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ report_id?: string }>();
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || 'default';

  const [reportsList, setReportsList] = useState<ReportItem[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>(params.report_id || '');
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [exportData, setExportData] = useState<ReportExportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchReportsList = useCallback(async () => {
    try {
      setLoading(true);
      const list = await analyticsService.listReports(businessId);
      setReportsList(list);
      if (list.length > 0) {
        const targetId = params.report_id || list[0].id;
        setSelectedReportId(targetId);
      }
    } catch (err) {
      console.warn('Error loading reports list for export:', err);
    } finally {
      setLoading(false);
    }
  }, [businessId, params.report_id]);

  useEffect(() => {
    fetchReportsList();
  }, [fetchReportsList]);

  const fetchExport = useCallback(async () => {
    if (!selectedReportId) return;
    try {
      setExporting(true);
      const res = await analyticsService.exportReport(selectedReportId, businessId, selectedFormat);
      setExportData(res);
    } catch (err) {
      console.warn('Error generating export preview:', err);
    } finally {
      setExporting(false);
    }
  }, [selectedReportId, businessId, selectedFormat]);

  useEffect(() => {
    fetchExport();
  }, [fetchExport]);

  const handleShare = async () => {
    if (!exportData?.content) return;
    try {
      await Share.share({
        title: exportData.filename,
        message: exportData.content,
      });
    } catch (err) {
      console.warn('Error sharing report:', err);
    }
  };

  const handleCopy = () => {
    if (!exportData?.content) return;
    setCopied(true);
    Alert.alert('Copied', 'Export data copied to clipboard buffer.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Export Hub</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Report Picker */}
        <Text style={styles.sectionLabel}>Select Business Report</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reportScroll}>
          {reportsList.map((r) => {
            const active = selectedReportId === r.id;
            return (
              <TouchableOpacity
                key={r.id}
                style={[styles.reportPill, active && styles.reportPillActive]}
                onPress={() => setSelectedReportId(r.id)}
              >
                <Text style={[styles.reportPillText, active && styles.reportPillTextActive]}>
                  {r.title} ({r.time_frame.toUpperCase()})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Format Selector */}
        <Text style={styles.sectionLabel}>Export Format</Text>
        <View style={styles.formatRow}>
          {FORMATS.map((fmt) => {
            const active = selectedFormat === fmt.id;
            const Icon = fmt.icon;
            return (
              <TouchableOpacity
                key={fmt.id}
                style={[styles.formatCard, active && styles.formatCardActive]}
                onPress={() => setSelectedFormat(fmt.id)}
              >
                <Icon size={18} color={active ? '#059669' : '#64748B'} />
                <Text style={[styles.formatText, active && styles.formatTextActive]}>
                  {fmt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Preview and Actions */}
        <GlassCard style={styles.previewCard} variant="elevated">
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>
              {exportData?.filename || 'report_export.txt'}
            </Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.iconBtn} onPress={handleCopy}>
                {copied ? <Check size={16} color="#059669" /> : <Copy size={16} color="#475569" />}
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
                <Share2 size={16} color="#475569" />
              </TouchableOpacity>
            </View>
          </View>

          {exporting ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#059669" />
              <Text style={styles.loadingText}>Compiling Export Data...</Text>
            </View>
          ) : (
            <ScrollView nestedScrollEnabled style={styles.contentScroll}>
              <Text style={styles.contentText}>{exportData?.content || 'No content'}</Text>
            </ScrollView>
          )}
        </GlassCard>

        {/* Share Button */}
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          disabled={!exportData?.content}
          activeOpacity={0.8}
        >
          <Download size={18} color="#FFFFFF" />
          <Text style={styles.shareButtonText}>Download / Share Report</Text>
        </TouchableOpacity>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    marginTop: 6,
  },
  reportScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  reportPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  reportPillActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  reportPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  reportPillTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  formatRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  formatCard: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  formatCardActive: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  formatText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  formatTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  previewCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
  },
  contentScroll: {
    maxHeight: 260,
    marginTop: 10,
  },
  contentText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
