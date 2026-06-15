import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {launchImageLibrary} from 'react-native-image-picker';
import {useAuth} from '../../../store/AuthContext';
import {apiClient} from '../../../services/api';
import {syncWeatherLocation} from '../../../services/notificationService';
import {styles} from './styles';

const formatDateOnly = (value?: string | Date | null) => {
  if (!value) {
    return '—';
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return '—';
    }

    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(value.getDate()).padStart(2, '0')}`;
  }

  if (String(value).includes('T')) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(
        2,
        '0',
      )}-${String(parsed.getDate()).padStart(2, '0')}`;
    }
  }

  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : String(value);
};

export default function ProfileViewScreen({navigation}: any) {
  const {user, logout} = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await apiClient.get(`/users/${user?.id}`);
      setProfile(res.data);
    } catch {}
  }, [user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Refresh when coming back from EditProfile
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchProfile);
    return unsubscribe;
  }, [navigation, fetchProfile]);

  const handlePickAvatar = () => {
    launchImageLibrary({mediaType: 'photo', quality: 0.8}, async response => {
      if (response.didCancel || !response.assets?.[0]) return;
      const asset = response.assets[0];
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('avatar', {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || 'avatar.jpg',
        } as any);
        await apiClient.put(`/users/${user?.id}/avatar`, formData);
        await fetchProfile();
      } catch {
        Alert.alert('Error', 'Failed to upload photo');
      } finally {
        setUploading(false);
      }
    });
  };

  const handleTogglePref = async (key: string, value: boolean) => {
    const updated = {...notifPrefs, [key]: value};
    setNotifPrefs(updated);
    setSavingPrefs(true);
    try {
      await apiClient.put('/users/notification-prefs', {[key]: value});
      if (key === 'weather' && value) {
        syncWeatherLocation({skipPreferenceCheck: true}).catch(() => {});
      }
    } catch {
      setNotifPrefs(notifPrefs); // revert on error
      Alert.alert('Error', 'Failed to save preference');
    } finally {
      setSavingPrefs(false);
    }
  };

  const role = profile?.role || user?.role;
  const isTrainer = role === 'trainer';
  const isAdmin = role === 'admin';
  const avatarUrl = profile?.avatar_url
    ? `${apiClient.defaults.baseURL?.replace('/api/v1', '')}${profile.avatar_url}`
    : null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickAvatar} disabled={uploading}>
          {avatarUrl ? (
            <Image source={{uri: avatarUrl}} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatar, isTrainer && styles.trainerAvatar]}>
              <Text style={styles.avatarText}>
                {profile?.name?.[0]?.toUpperCase() || user?.name?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <View style={styles.editAvatarBtn}>
            {uploading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Icon name="camera" size={14} color="#fff" />}
          </View>
        </TouchableOpacity>

        <Text style={styles.name}>{profile?.name || user?.name || 'User'}</Text>
        <View style={[styles.roleBadge, isTrainer && styles.trainerBadge]}>
          <Icon name={isTrainer ? 'barbell' : 'person'} size={14} color="#fff" />
          <Text style={styles.roleText}>{profile?.role || user?.role || 'Member'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.infoRow}>
          <Icon name="mail" size={20} color="#FF6B35" />
          <View style={styles.infoContent}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{profile?.email || '—'}</Text>
          </View>
        </View>

        {profile?.phone_number ? (
          <View style={styles.infoRow}>
            <Icon name="call" size={20} color="#FF6B35" />
            <View style={styles.infoContent}>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>{profile.phone_number}</Text>
            </View>
          </View>
        ) : null}

        {profile?.dob ? (
          <View style={styles.infoRow}>
            <Icon name="calendar" size={20} color="#FF6B35" />
            <View style={styles.infoContent}>
              <Text style={styles.label}>Date of Birth</Text>
              <Text style={styles.value}>{formatDateOnly(profile.dob)}</Text>
            </View>
          </View>
        ) : null}

        {profile?.gender ? (
          <View style={styles.infoRow}>
            <Icon name={profile.gender === 'male' ? 'man' : 'woman'} size={20} color="#FF6B35" />
            <View style={styles.infoContent}>
              <Text style={styles.label}>Gender</Text>
              <Text style={styles.value}>{profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}</Text>
            </View>
          </View>
        ) : null}

        {profile?.height || profile?.weight ? (
          <View style={styles.infoRow}>
            <Icon name="body" size={20} color="#FF6B35" />
            <View style={styles.infoContent}>
              <Text style={styles.label}>Body</Text>
              <Text style={styles.value}>
                {[profile.height && `${profile.height} cm`, profile.weight && `${profile.weight} kg`]
                  .filter(Boolean).join(' · ')}
              </Text>
            </View>
          </View>
        ) : null}

        {profile?.goal ? (
          <View style={styles.infoRow}>
            <Icon name="fitness" size={20} color="#FF6B35" />
            <View style={styles.infoContent}>
              <Text style={styles.label}>Goal</Text>
              <Text style={styles.value}>{profile.goal}</Text>
            </View>
          </View>
        ) : null}

        {isTrainer && profile?.profession ? (
          <View style={styles.infoRow}>
            <Icon name="briefcase" size={20} color="#FF6B35" />
            <View style={styles.infoContent}>
              <Text style={styles.label}>Profession</Text>
              <Text style={styles.value}>{profile.profession}</Text>
            </View>
          </View>
        ) : null}

        {isTrainer && profile?.experience_years != null ? (
          <View style={styles.infoRow}>
            <Icon name="time" size={20} color="#FF6B35" />
            <View style={styles.infoContent}>
              <Text style={styles.label}>Experience</Text>
              <Text style={styles.value}>{profile.experience_years} years</Text>
            </View>
          </View>
        ) : null}

        {isTrainer && profile?.bio ? (
          <View style={styles.infoRow}>
            <Icon name="document-text" size={20} color="#FF6B35" />
            <View style={styles.infoContent}>
              <Text style={styles.label}>Bio</Text>
              <Text style={styles.value}>{profile.bio}</Text>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        {!isAdmin && (
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('EditProfile')}>
            <Icon name="create-outline" size={24} color="#FF6B35" />
            <Text style={styles.menuText}>Edit Profile</Text>
            <Icon name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ChangePassword')}>
          <Icon name="lock-closed-outline" size={24} color="#FF6B35" />
          <Text style={styles.menuText}>Change Password</Text>
          <Icon name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={logout}>
          <Icon name="log-out-outline" size={24} color="#FF3B30" />
          <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={{height: 30}} />
    </ScrollView>
  );
}
