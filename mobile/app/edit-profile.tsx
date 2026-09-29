import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, Mail, Check, Save } from 'lucide-react-native';
import { Colors, Shadows } from '../src/constants/theme';
import { GlassCard } from '../src/components/GlassCard';
import { GlassButton } from '../src/components/GlassButton';
import { useAuthStore } from '../src/store/authStore';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useAuthStore();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }

    setSaving(true);
    setSavedSuccess(false);
    try {
      await updateProfile({
        full_name: fullName.trim(),
      });
      setSavedSuccess(true);
      setTimeout(() => {
        router.back();
      }, 700);
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <Image
              source={{ uri: profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' }}
              style={styles.avatarImg}
            />
            <Text style={styles.avatarHint}>Synced with Google / Gravatar</Text>
          </View>

          <GlassCard variant="elevated" style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <User size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Your Full Name"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address (Read-only)</Text>
              <View style={[styles.inputWrapper, { backgroundColor: Colors.borderLight }]}>
                <Mail size={18} color={Colors.textMuted} />
                <TextInput
                  style={[styles.textInput, { color: Colors.textMuted }]}
                  value={profile?.email || ''}
                  editable={false}
                />
              </View>
            </View>

            <GlassButton
              title={
                savedSuccess
                  ? 'Saved to Supabase!'
                  : saving
                  ? 'Saving Profile...'
                  : 'Save Changes'
              }
              variant={savedSuccess ? 'secondary' : 'primary'}
              size="lg"
              loading={saving}
              icon={
                savedSuccess ? (
                  <Check size={18} color={Colors.success} />
                ) : (
                  <Save size={18} color="#FFFFFF" />
                )
              }
              onPress={handleSave}
              style={{ marginTop: 8 }}
            />
          </GlassCard>
        </View>
      </KeyboardAvoidingView>
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
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  content: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Colors.primaryLight,
    marginBottom: 8,
  },
  avatarHint: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  formCard: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
});
