import React, {useState, useCallback} from 'react';
import {View, Text, FlatList, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useFocusEffect} from '@react-navigation/native';
import {apiClient} from '../../../services/api';
import {styles} from './styles';

const RULE_TYPES = [
  {value: 'challenge_complete', label: 'Challenges Completed'},
  {value: 'weekly_streak',      label: 'Weekly Streak'},
  {value: 'steps_total',        label: 'Total Steps'},
  {value: 'calories_total',     label: 'Total Calories'},
  {value: 'distance_total',     label: 'Total Distance (km)'},
];

const TYPE_COLORS: Record<string, string> = {
  challenge_complete: '#FFD700',
  weekly_streak: '#FF9500',
  steps_total: '#34C759',
  calories_total: '#FF3B30',
  distance_total: '#007AFF',
};

const DEFAULT_ICONS: Record<string, string> = {
  challenge_complete: 'trophy',
  weekly_streak: 'flame',
  steps_total: 'walk',
  calories_total: 'fitness',
  distance_total: 'navigate',
};

const ICON_OPTIONS = [
  'trophy', 'medal', 'ribbon', 'star', 'flame', 'flash',
  'walk', 'run', 'bicycle', 'barbell', 'fitness', 'body',
  'navigate', 'location', 'map', 'compass',
  'heart', 'pulse', 'leaf', 'nutrition',
  'checkmark-circle', 'shield-checkmark', 'rocket', 'diamond',
  'thunderstorm', 'sunny', 'moon', 'snow',
  'footsteps', 'stopwatch', 'timer', 'calendar',
];

const empty = {title: '', description: '', rule_type: 'challenge_complete', rule_value: '', icon: ''};

export default function ManageAchievementRulesScreen() {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [iconPickerVisible, setIconPickerVisible] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/achievements');
      setAchievements(res.data || []);
    } catch (_) {}
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setModalVisible(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({title: item.title, description: item.description || '', rule_type: item.rule_type, rule_value: String(item.rule_value), icon: item.icon || ''});
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.rule_value) return Alert.alert('Error', 'Title and rule value are required');
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        rule_type: form.rule_type,
        rule_value: Number(form.rule_value),
        icon: form.icon || null,
      };
      if (editing) {
        await apiClient.put(`/achievements/${editing.id}`, payload);
      } else {
        await apiClient.post('/achievements', payload);
      }
      setModalVisible(false);
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed to save');
    }
    setSaving(false);
  };

  const handleToggle = async (item: any) => {
    try {
      if (item.is_active) await apiClient.delete(`/achievements/${item.id}`);
      else await apiClient.patch(`/achievements/${item.id}/restore`);
      load();
    } catch (_) {}
  };

  const effectiveIcon = (item: any) => item.icon || DEFAULT_ICONS[item.rule_type] || 'medal';
  const previewIcon = form.icon || DEFAULT_ICONS[form.rule_type] || 'medal';

  const filtered = achievements.filter(a => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType && a.rule_type !== filterType) return false;
    if (filterStatus === 'active' && !a.is_active) return false;
    if (filterStatus === 'inactive' && a.is_active) return false;
    return true;
  });

  const STATUS_FILTERS: {value: 'all' | 'active' | 'inactive'; label: string}[] = [
    {value: 'all', label: 'All'},
    {value: 'active', label: 'Active'},
    {value: 'inactive', label: 'Inactive'},
  ];

  return (
    <View style={styles.container}>
      {/* Fixed header */}
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Icon name="search-outline" size={18} color="#aaa" />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search achievements..."
              placeholderTextColor="#aaa"
              returnKeyType="search"
            />
            {!!search && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Icon name="close-circle" size={18} color="#aaa" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.addIconBtn} onPress={openCreate}>
            <Icon name="add" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
          <TouchableOpacity
            style={[styles.filterChip, filterType === null && styles.filterChipActive]}
            onPress={() => setFilterType(null)}>
            <Text style={[styles.filterChipText, filterType === null && styles.filterChipTextActive]}>All Types</Text>
          </TouchableOpacity>
          {RULE_TYPES.map(rt => (
            <TouchableOpacity
              key={rt.value}
              style={[styles.filterChip, filterType === rt.value && {backgroundColor: TYPE_COLORS[rt.value], borderColor: TYPE_COLORS[rt.value]}]}
              onPress={() => setFilterType(filterType === rt.value ? null : rt.value)}>
              <Text style={[styles.filterChipText, filterType === rt.value && styles.filterChipTextActive]}>{rt.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.statusRow}>
          {STATUS_FILTERS.map(sf => (
            <TouchableOpacity
              key={sf.value}
              style={[styles.statusChip, filterStatus === sf.value && styles.statusChipActive]}
              onPress={() => setFilterStatus(sf.value)}>
              <Text style={[styles.statusChipText, filterStatus === sf.value && styles.statusChipTextActive]}>{sf.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{flex: 1}} size="large" color="#FF6B35" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{padding: 12, gap: 10}}
          renderItem={({item}) => (
            <View style={[styles.item, !item.is_active && styles.itemInactive]}>
              <View style={[styles.iconBox, {backgroundColor: TYPE_COLORS[item.rule_type] + (item.is_active ? 'ff' : '44')}]}>
                <Icon name={effectiveIcon(item)} size={22} color="#fff" />
              </View>
              <View style={styles.info}>
                <Text style={[styles.achievement, !item.is_active && {color: '#aaa'}]}>{item.title}</Text>
                <Text style={styles.condition}>{RULE_TYPES.find(r => r.value === item.rule_type)?.label} ≥ {item.rule_value}</Text>
                {!item.is_active && <Text style={styles.inactiveLabel}>Inactive</Text>}
              </View>
              <TouchableOpacity style={styles.editButton} onPress={() => openEdit(item)}>
                <Icon name="create-outline" size={18} color="#FF6B35" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.editButton, {marginLeft: 4}]} onPress={() => handleToggle(item)}>
                <Icon name={item.is_active ? 'eye-off-outline' : 'eye-outline'} size={18} color={item.is_active ? '#FF3B30' : '#34C759'} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editing ? 'Edit Achievement' : 'New Achievement'}</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              <Text style={styles.label}>Title *</Text>
              <TextInput style={styles.input} value={form.title} onChangeText={v => setForm(f => ({...f, title: v}))} placeholder="e.g. Step Starter" placeholderTextColor="#aaa" />

              <Text style={styles.label}>Description</Text>
              <TextInput style={styles.input} value={form.description} onChangeText={v => setForm(f => ({...f, description: v}))} placeholder="Optional description" placeholderTextColor="#aaa" />

              <Text style={styles.label}>Type *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 12}} keyboardShouldPersistTaps="handled">
                <View style={{flexDirection: 'row', gap: 8}}>
                  {RULE_TYPES.map(rt => (
                    <TouchableOpacity
                      key={rt.value}
                      style={[styles.typeBtn, form.rule_type === rt.value && styles.typeBtnActive]}
                      onPress={() => setForm(f => ({...f, rule_type: rt.value, icon: f.icon}))}>
                      <Text style={[styles.typeText, form.rule_type === rt.value && styles.typeTextActive]}>{rt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.label}>Target Value *</Text>
              <TextInput style={styles.input} value={form.rule_value} onChangeText={v => setForm(f => ({...f, rule_value: v}))} placeholder="e.g. 10000" placeholderTextColor="#aaa" keyboardType="numeric" />

              <Text style={styles.label}>Icon</Text>
              <TouchableOpacity
                style={{flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, backgroundColor: '#F9F9F9', marginBottom: 16}}
                onPress={() => setIconPickerVisible(true)}>
                <View style={{width: 40, height: 40, borderRadius: 10, backgroundColor: TYPE_COLORS[form.rule_type] || '#FF6B35', justifyContent: 'center', alignItems: 'center'}}>
                  <Icon name={previewIcon} size={22} color="#fff" />
                </View>
                <Text style={{flex: 1, fontSize: 14, color: '#333'}}>{form.icon || `Default (${previewIcon})`}</Text>
                <Icon name="chevron-forward" size={18} color="#ccc" />
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Icon Picker Modal */}
      <Modal visible={iconPickerVisible} transparent animationType="fade" onRequestClose={() => setIconPickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, {maxHeight: '75%'}]}>
            <Text style={styles.modalTitle}>Choose Icon</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', paddingVertical: 8}}>
                {ICON_OPTIONS.map(iconName => {
                  const isSelected = (form.icon || DEFAULT_ICONS[form.rule_type]) === iconName;
                  return (
                    <TouchableOpacity
                      key={iconName}
                      style={{
                        width: 56, height: 56, borderRadius: 12,
                        backgroundColor: isSelected ? TYPE_COLORS[form.rule_type] || '#FF6B35' : '#F0F0F0',
                        justifyContent: 'center', alignItems: 'center',
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? TYPE_COLORS[form.rule_type] || '#FF6B35' : '#E0E0E0',
                      }}
                      onPress={() => { setForm(f => ({...f, icon: iconName})); setIconPickerVisible(false); }}>
                      <Icon name={iconName} size={26} color={isSelected ? '#fff' : '#555'} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <TouchableOpacity style={[styles.cancelBtn, {marginTop: 12}]} onPress={() => setIconPickerVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
