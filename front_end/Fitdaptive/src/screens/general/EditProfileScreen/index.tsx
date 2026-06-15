import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import {useAuth} from '../../../store/AuthContext';
import {apiClient} from '../../../services/api';
import {syncWeatherLocation} from '../../../services/notificationService';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  getProfileMetricErrors,
  validateProfileMetrics,
} from '../../../utils/profileValidation';
import {
  getEditProfileFieldErrors,
  validateEditProfileFields,
} from '../../../utils/accountValidation';
import {styles} from './styles';

const parseDateOnly = (value?: string | Date | null) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (String(value).includes('T')) {
    const parsedIso = new Date(value);
    if (!Number.isNaN(parsedIso.getTime())) {
      return new Date(
        parsedIso.getFullYear(),
        parsedIso.getMonth(),
        parsedIso.getDate(),
      );
    }
  }

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const parsed = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
    );
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default function EditProfileScreen({navigation}: any) {
  const {user, updateUser} = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState('male');
  const [goal, setGoal] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date(2000, 0, 1));
  const [metricTouched, setMetricTouched] = useState({
    height: false,
    weight: false,
    dob: false,
  });
  const [fieldTouched, setFieldTouched] = useState({
    name: false,
    phone: false,
    profession: false,
    experienceYears: false,
  });

  // Trainer fields
  const [profession, setProfession] = useState('');
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState('');

  const [notifPrefs, setNotifPrefs] = useState({weather: true, workout_reminder: true, sync_reminder: true});
  const [savingPrefs, setSavingPrefs] = useState(false);

  const isTrainer = user?.role === 'trainer';

  useEffect(() => {
    apiClient.get(`/users/${user?.id}`)
      .then(res => {
        const p = res.data;
        setName(p.name || '');
        setPhone(p.phone_number || '');
        setHeight(p.height ? String(p.height) : '');
        setWeight(p.weight ? String(p.weight) : '');
        setGender(p.gender || 'male');
        setGoal(p.goal || '');
        setProfession(p.profession || '');
        setBio(p.bio || '');
        setExperienceYears(p.experience_years ? String(p.experience_years) : '');
        const parsed = parseDateOnly(p.dob);
        if (parsed) {
          setDob(parsed);
          setTempDate(parsed);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    apiClient.get('/users/notification-prefs')
      .then(res => setNotifPrefs(res.data))
      .catch(() => {});
  }, [user?.id]);

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'});

  const handleDateChange = (type: 'day' | 'month' | 'year', value: number) => {
    const d = new Date(tempDate);
    if (type === 'day') d.setDate(value);
    if (type === 'month') d.setMonth(value);
    if (type === 'year') d.setFullYear(value);
    setTempDate(d);
  };

  const handleTogglePref = async (key: string, value: boolean) => {
    const prev = notifPrefs;
    setNotifPrefs({...notifPrefs, [key]: value});
    setSavingPrefs(true);
    try {
      await apiClient.put('/users/notification-prefs', {[key]: value});
      if (key === 'weather' && value) {
        syncWeatherLocation({skipPreferenceCheck: true}).catch(() => {});
      }
    } catch {
      setNotifPrefs(prev);
      Alert.alert('Error', 'Failed to save preference');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleSave = async () => {
    setMetricTouched({height: true, weight: true, dob: true});
    setFieldTouched({
      name: true,
      phone: true,
      profession: true,
      experienceYears: true,
    });

    const fieldValidationError = validateEditProfileFields({
      name,
      phoneNumber: phone,
      profession,
      experienceYears,
      isTrainer,
    });
    if (fieldValidationError) {
      return Alert.alert('Error', fieldValidationError);
    }

    if (!height.trim()) return Alert.alert('Error', 'Height is required');
    if (!weight.trim()) return Alert.alert('Error', 'Weight is required');
    if (!dob) return Alert.alert('Error', 'Date of birth is required');

    const profileValidationError = validateProfileMetrics({height, weight, dob});
    if (profileValidationError) {
      return Alert.alert('Error', profileValidationError);
    }

    setSaving(true);
    try {
      const updates: any = {
        name: name.trim(),
        phone_number: phone.trim() || null,
        goal: goal.trim() || null,
        height: height.trim(),
        weight: weight.trim(),
        gender,
        dob: `${dob.getFullYear()}-${String(dob.getMonth() + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}`,
      };
      if (isTrainer) {
        updates.profession = profession.trim() || null;
        updates.bio = bio.trim() || null;
        updates.experience_years = experienceYears.trim()
          ? Number(experienceYears.trim())
          : null;
      }
      await apiClient.put(`/users/${user?.id}`, updates);
      await updateUser({
        name: updates.name,
        goal: updates.goal,
        height: Number(updates.height),
        weight: Number(updates.weight),
        gender,
        dob: updates.dob,
        phone_number: updates.phone_number,
        ...(isTrainer && {
          profession: updates.profession,
          bio: updates.bio,
          experience_years: updates.experience_years,
        }),
      });
      Alert.alert('Success', 'Profile updated', [{text: 'OK', onPress: () => navigation.goBack()}]);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const metricErrors = getProfileMetricErrors({height, weight, dob});
  const fieldErrors = getEditProfileFieldErrors({
    name,
    phoneNumber: phone,
    profession,
    experienceYears,
    isTrainer,
  });

  const handleNameChange = (value: string) => {
    setName(value);
    setFieldTouched(prev => ({...prev, name: true}));
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    setFieldTouched(prev => ({...prev, phone: true}));
  };

  const handleHeightChange = (value: string) => {
    setHeight(value);
    setMetricTouched(prev => ({...prev, height: true}));
  };

  const handleWeightChange = (value: string) => {
    setWeight(value);
    setMetricTouched(prev => ({...prev, weight: true}));
  };

  const handleProfessionChange = (value: string) => {
    setProfession(value);
    setFieldTouched(prev => ({...prev, profession: true}));
  };

  const handleExperienceYearsChange = (value: string) => {
    setExperienceYears(value);
    setFieldTouched(prev => ({...prev, experienceYears: true}));
  };

  if (loading) return <ActivityIndicator style={{flex: 1}} size="large" color="#FF6B35" />;

  return (
    <KeyboardAvoidingView style={{flex: 1}} behavior="padding">
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.sectionTitle}>Profile Information</Text>

      <Text style={styles.label}>Name *</Text>
      <TextInput
        style={[
          styles.input,
          fieldTouched.name && Boolean(fieldErrors.name) && styles.inputError,
        ]}
        value={name}
        onChangeText={handleNameChange}
        placeholder="Full name"
        autoCapitalize="words"
      />
      {fieldTouched.name && fieldErrors.name ? (
        <Text style={styles.fieldError}>{fieldErrors.name}</Text>
      ) : null}

      <Text style={styles.label}>Phone</Text>
      <TextInput
        style={[
          styles.input,
          fieldTouched.phone &&
            Boolean(fieldErrors.phoneNumber) &&
            styles.inputError,
        ]}
        value={phone}
        onChangeText={handlePhoneChange}
        keyboardType="phone-pad"
        placeholder="Phone number"
      />
      {fieldTouched.phone && fieldErrors.phoneNumber ? (
        <Text style={styles.fieldError}>{fieldErrors.phoneNumber}</Text>
      ) : null}

      <Text style={styles.label}>Fitness Goal</Text>
      <TextInput style={styles.input} value={goal} onChangeText={setGoal} placeholder="e.g. Lose weight, build muscle" />

      <Text style={styles.label}>Height (cm) *</Text>
      <TextInput
        style={[
          styles.input,
          metricTouched.height && Boolean(metricErrors.height) && styles.inputError,
        ]}
        value={height}
        onChangeText={handleHeightChange}
        keyboardType="decimal-pad"
        placeholder="e.g. 170"
      />
      {metricTouched.height && metricErrors.height ? (
        <Text style={styles.fieldError}>{metricErrors.height}</Text>
      ) : null}

      <Text style={styles.label}>Weight (kg) *</Text>
      <TextInput
        style={[
          styles.input,
          metricTouched.weight && Boolean(metricErrors.weight) && styles.inputError,
        ]}
        value={weight}
        onChangeText={handleWeightChange}
        keyboardType="decimal-pad"
        placeholder="e.g. 65"
      />
      {metricTouched.weight && metricErrors.weight ? (
        <Text style={styles.fieldError}>{metricErrors.weight}</Text>
      ) : null}

      <Text style={styles.label}>Gender *</Text>
      <View style={{flexDirection: 'row', gap: 8, marginBottom: 12}}>
        {['male', 'female'].map(g => (
          <TouchableOpacity
            key={g}
            onPress={() => setGender(g)}
            style={{
              flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 6, padding: 12, borderWidth: 2, borderRadius: 12,
              borderColor: '#FF6B35',
              backgroundColor: gender === g ? '#FF6B35' : '#fff',
            }}>
            <Icon name={g === 'male' ? 'man' : 'woman'} size={20} color={gender === g ? '#fff' : '#FF6B35'} />
            <Text style={{fontSize: 13, fontWeight: '600', color: gender === g ? '#fff' : '#FF6B35'}}>
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Date of Birth *</Text>
      <TouchableOpacity
        style={[
          styles.input,
          styles.dateInput,
          metricTouched.dob && Boolean(metricErrors.dob) && styles.inputError,
        ]}
        onPress={() => { setTempDate(dob || new Date(2000, 0, 1)); setShowDatePicker(true); }}>
        <Text style={{color: dob ? '#333' : '#999', fontSize: 15}}>
          {dob ? formatDate(dob) : 'Select date of birth'}
        </Text>
      </TouchableOpacity>
      {metricTouched.dob && metricErrors.dob ? (
        <Text style={styles.fieldError}>{metricErrors.dob}</Text>
      ) : null}

      {isTrainer && (
        <>
          <Text style={styles.label}>Profession</Text>
          <TextInput
            style={[
              styles.input,
              fieldTouched.profession &&
                Boolean(fieldErrors.profession) &&
                styles.inputError,
            ]}
            value={profession}
            onChangeText={handleProfessionChange}
            placeholder="e.g. Personal Trainer"
            autoCapitalize="words"
          />
          {fieldTouched.profession && fieldErrors.profession ? (
            <Text style={styles.fieldError}>{fieldErrors.profession}</Text>
          ) : null}

          <Text style={styles.label}>Experience (years)</Text>
          <TextInput
            style={[
              styles.input,
              fieldTouched.experienceYears &&
                Boolean(fieldErrors.experienceYears) &&
                styles.inputError,
            ]}
            value={experienceYears}
            onChangeText={handleExperienceYearsChange}
            keyboardType="numeric"
            placeholder="e.g. 5"
            maxLength={2}
          />
          {fieldTouched.experienceYears && fieldErrors.experienceYears ? (
            <Text style={styles.fieldError}>{fieldErrors.experienceYears}</Text>
          ) : null}

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, {height: 90, textAlignVertical: 'top'}]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell members about yourself..."
            multiline
          />
        </>
      )}

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Changes</Text>}
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Notification Preferences</Text>
      {savingPrefs && <Text style={{fontSize: 11, color: '#aaa', marginBottom: 4, marginLeft: 4}}>Saving...</Text>}
      {[
        {key: 'weather', label: 'Morning Weather Tips', desc: 'Daily weather + outdoor workout suggestion'},
        {key: 'workout_reminder', label: 'Workout Reminder', desc: 'Evening reminder for pending workouts'},
        {key: 'sync_reminder', label: 'Health Data Sync Reminder', desc: 'Nudge to sync Health Connect data'},
      ].map(item => (
        <View key={item.key} style={styles.switchRow}>
          <View style={styles.switchTextContainer}>
            <Text style={styles.switchLabel}>{item.label}</Text>
            <Text style={styles.switchDescription}>{item.desc}</Text>
          </View>
          <Switch
            value={!!notifPrefs[item.key as keyof typeof notifPrefs]}
            onValueChange={v => handleTogglePref(item.key, v)}
            trackColor={{false: '#E0E0E0', true: '#FFB399'}}
            thumbColor={notifPrefs[item.key as keyof typeof notifPrefs] ? '#FF6B35' : '#f4f3f4'}
          />
        </View>
      ))}

      <View style={{height: 40}} />

      {/* Date Picker Modal */}
      <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Date of Birth</Text>
            <View style={styles.modalColumns}>
              <View style={styles.modalCol}>
                <Text style={styles.modalColLabel}>Day</Text>
                <ScrollView style={styles.modalPicker} showsVerticalScrollIndicator={false}>
                  {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.modalItem, tempDate.getDate() === d && styles.modalItemActive]}
                      onPress={() => handleDateChange('day', d)}>
                      <Text style={[styles.modalItemText, tempDate.getDate() === d && styles.modalItemTextActive]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.modalCol}>
                <Text style={styles.modalColLabel}>Month</Text>
                <ScrollView style={styles.modalPicker} showsVerticalScrollIndicator={false}>
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.modalItem, tempDate.getMonth() === i && styles.modalItemActive]}
                      onPress={() => handleDateChange('month', i)}>
                      <Text style={[styles.modalItemText, tempDate.getMonth() === i && styles.modalItemTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.modalCol}>
                <Text style={styles.modalColLabel}>Year</Text>
                <ScrollView style={styles.modalPicker} showsVerticalScrollIndicator={false}>
                  {Array.from({length: 100}, (_, i) => new Date().getFullYear() - i).map(y => (
                    <TouchableOpacity
                      key={y}
                      style={[styles.modalItem, tempDate.getFullYear() === y && styles.modalItemActive]}
                      onPress={() => handleDateChange('year', y)}>
                      <Text style={[styles.modalItemText, tempDate.getFullYear() === y && styles.modalItemTextActive]}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowDatePicker(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={() => { setDob(tempDate); setMetricTouched(prev => ({...prev, dob: true})); setShowDatePicker(false); }}>
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
