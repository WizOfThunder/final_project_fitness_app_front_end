import React, {useState, useCallback} from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, Modal,
  ScrollView, Alert, ActivityIndicator, RefreshControl, Linking, Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useFocusEffect} from '@react-navigation/native';
import {apiClient} from '../../../services/api';
import {formatMuscleLabel} from '../../../utils/formatMuscleLabel';
import {styles} from './styles';

// ─── EXERCISES TAB ───────────────────────────────────────────────────────────

const EXERCISE_TYPES = [
  'All',
  'cardio',
  'strength',
  'stretching',
  'plyometrics',
  'powerlifting',
  'olympic_weightlifting',
  'strongman',
];

const EXERCISE_DIFFICULTIES = ['All', 'beginner', 'intermediate', 'expert'];

const EXERCISE_MUSCLES = [
  'All',
  'abdominals',
  'abductors',
  'adductors',
  'biceps',
  'calves',
  'chest',
  'forearms',
  'glutes',
  'hamstrings',
  'lats',
  'lower_back',
  'middle_back',
  'neck',
  'quadriceps',
  'traps',
  'triceps',
];

const EXERCISE_EQUIPMENTS = [
  {label: 'All', value: 'All'},
  {label: 'None', value: 'none'},
  {label: 'Barbell', value: 'barbell'},
  {label: 'Dumbbell', value: 'dumbbell'},
  {label: 'Cable', value: 'cable'},
  {label: 'Machine', value: 'machine'},
  {label: 'Bands', value: 'band'},
  {label: 'Pull-up Bar', value: 'pull-up bar'},
  {label: 'Bench', value: 'bench'},
  {label: 'Medicine Ball', value: 'medicine ball'},
  {label: 'Exercise Ball', value: 'exercise ball'},
  {label: 'Foam Roll', value: 'foam roll'},
  {label: 'EZ Curl Bar', value: 'ez curl'},
  {label: 'Other', value: 'other'},
];

const formatOptionLabel = (value: string) => {
  if (!value) {
    return '';
  }

  return value
    .replace(/_/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

function ExercisesTab() {
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [muscleFilter, setMuscleFilter] = useState('All');
  const [equipmentFilter, setEquipmentFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const [syncFilters, setSyncFilters] = useState({name: '', type: '', muscle: '', difficulty: '', equipment: ''});

  // Exercise detail modal
  const [selected, setSelected] = useState<any>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  // YouTube search modal
  const [ytVisible, setYtVisible] = useState(false);
  const [ytTarget, setYtTarget] = useState<any>(null);
  const [ytResults, setYtResults] = useState<any[]>([]);
  const [ytSearching, setYtSearching] = useState(false);
  const [ytSaving, setYtSaving] = useState(false);

  // Add/Edit modal
  const [formVisible, setFormVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const params: any = {};
      if (typeFilter !== 'All') params.type = typeFilter;
      if (difficultyFilter !== 'All') params.difficulty = difficultyFilter;
      if (muscleFilter !== 'All') params.muscle = muscleFilter;
      if (equipmentFilter !== 'All') params.equipment = equipmentFilter;

      const res = await apiClient.get('/exercises', {params});
      setExercises(res.data || []);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  }, [typeFilter, difficultyFilter, muscleFilter, equipmentFilter]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleSync = async () => {
    setSyncing(true);
    setSyncModalVisible(false);
    try {
      const payload = Object.fromEntries(Object.entries(syncFilters).filter(([, v]) => v));
      const res = await apiClient.post('/exercises/sync', payload);
      Alert.alert('Synced', `Added ${res.data.added} exercises, skipped ${res.data.skipped}.`);
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Sync failed');
    }
    setSyncing(false);
  };

  const openDetail = (item: any) => { setSelected(item); setDetailVisible(true); };

  const openAddForm = () => {
    setEditMode(false);
    setFormData({name: '', type: '', muscle: '', equipment: '', difficulty: 'beginner', instructions: '', safety_info: '', youtube_url: ''});
    setFormVisible(true);
  };

  const openEditForm = (item: any) => {
    setEditMode(true);
    setFormData(item);
    setFormVisible(true);
    setDetailVisible(false);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.muscle || !formData.difficulty) {
      Alert.alert('Error', 'Name, muscle, and difficulty are required');
      return;
    }
    setSaving(true);
    try {
      if (editMode) {
        await apiClient.put(`/exercises/${formData.id}`, formData);
        Alert.alert('Success', 'Exercise updated');
      } else {
        await apiClient.post('/exercises', formData);
        Alert.alert('Success', 'Exercise created');
      }
      setFormVisible(false);
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed to save');
    }
    setSaving(false);
  };

  const handleDelete = (item: any) => {
    Alert.alert('Delete Exercise', `Delete "${item.name}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await apiClient.delete(`/exercises/${item.id}`);
          Alert.alert('Deleted', 'Exercise removed');
          setDetailVisible(false);
          load();
        } catch (e: any) {
          Alert.alert('Error', e?.response?.data?.error || 'Failed to delete');
        }
      }}
    ]);
  };

  const openYouTube = async (item: any) => {
    setYtTarget(item);
    setYtResults([]);
    setYtVisible(true);
    setYtSearching(true);
    try {
      const res = await apiClient.post('/exercises/sync-youtube', {name: item.name});
      setYtResults(res.data.results || []);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'YouTube search failed');
      setYtVisible(false);
    }
    setYtSearching(false);
  };

  const selectYtUrl = async (url: string) => {
    if (!ytTarget) return;
    setYtSaving(true);
    try {
      console.log('[YT_URL_SAVE] Request start', {
        exerciseId: ytTarget.id,
        url,
      });
      const res = await apiClient.put(`/exercises/${ytTarget.id}/youtube-url`, {youtube_url: url});
      console.log('[YT_URL_SAVE] API success', {
        exerciseId: ytTarget.id,
        status: res?.status,
        data: res?.data,
      });
      setExercises(prev => prev.map(e => e.id === ytTarget.id ? {...e, youtube_url: url} : e));
      if (selected?.id === ytTarget.id) setSelected((prev: any) => ({...prev, youtube_url: url}));
      console.log('[YT_URL_SAVE] Local state updated', {
        exerciseId: ytTarget.id,
      });
      setYtVisible(false);
      console.log('[YT_URL_SAVE] Modal closed, showing success alert', {
        exerciseId: ytTarget.id,
      });
      Alert.alert('Saved', 'YouTube URL updated successfully.');
    } catch (e: any) {
      console.error('[YT_URL_SAVE] exerciseId:', ytTarget?.id);
console.error('[YT_URL_SAVE] url:', url);
console.error('[YT_URL_SAVE] message:', e?.message);
console.error('[YT_URL_SAVE] code:', e?.code);
console.error('[YT_URL_SAVE] status:', e?.response?.status);
console.error(
  '[YT_URL_SAVE] data:',
  JSON.stringify(e?.response?.data, null, 2)
);

  console.error('[YT_URL_SAVE] name:', e?.name);
  console.error('[YT_URL_SAVE] hasRequest:', !!e?.request);
  console.error('[YT_URL_SAVE] hasResponse:', !!e?.response);
  console.error('[YT_URL_SAVE] requestUrl:', e?.config?.url);
  console.error('[YT_URL_SAVE] requestMethod:', e?.config?.method);
  console.error('[YT_URL_SAVE] timeout:', e?.config?.timeout);
  console.error('[YT_URL_SAVE] stack:', e?.stack);

      Alert.alert('Error', e?.response?.data?.error || 'Failed to save URL');
    }
    setYtSaving(false);
  };

  const filtered = exercises.filter(e =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.muscle?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCriteriaCount = [
    typeFilter,
    difficultyFilter,
    muscleFilter,
    equipmentFilter,
  ].filter(value => value !== 'All').length;

  const clearExerciseFilters = () => {
    setTypeFilter('All');
    setDifficultyFilter('All');
    setMuscleFilter('All');
    setEquipmentFilter('All');
  };

  const selectedEquipmentLabel =
    EXERCISE_EQUIPMENTS.find(item => item.value === equipmentFilter)?.label ||
    equipmentFilter;

  const diffColor = (d: string) =>
    d === 'beginner' ? '#34C759' : d === 'intermediate' ? '#FF9500' : '#FF3B30';

  if (loading) return <ActivityIndicator style={{flex: 1, marginTop: 40}} size="large" color="#FF6B35" />;

  return (
    <View style={{flex: 1}}>
      {/* Toolbar */}
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseToolbar}>
          <View style={styles.searchBox}>
            <Icon name="search" size={18} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Icon name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowFilters(true)}
            accessibilityLabel="Open exercise filters">
            <Icon name="options-outline" size={18} color="#FF6B35" />
            {activeCriteriaCount > 0 ? (
              <View style={styles.filterCountBadge}>
                <Text style={styles.filterCountText}>{activeCriteriaCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
          <TouchableOpacity style={styles.syncBtn} onPress={openAddForm}>
            <Icon name="add" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.syncBtn}
            onPress={() => setSyncModalVisible(true)}
            disabled={syncing}>
            {syncing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="sync" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {activeCriteriaCount > 0 ? (
          <View style={styles.activeFilterBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activeFilterScroll}>
              {typeFilter !== 'All' ? (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterChipText}>
                    Type: {formatOptionLabel(typeFilter)}
                  </Text>
                </View>
              ) : null}
              {difficultyFilter !== 'All' ? (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterChipText}>
                    Difficulty: {formatOptionLabel(difficultyFilter)}
                  </Text>
                </View>
              ) : null}
              {muscleFilter !== 'All' ? (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterChipText}>
                    Muscle: {formatMuscleLabel(muscleFilter)}
                  </Text>
                </View>
              ) : null}
              {equipmentFilter !== 'All' ? (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterChipText}>
                    Equipment: {selectedEquipmentLabel}
                  </Text>
                </View>
              ) : null}
            </ScrollView>

            <TouchableOpacity onPress={clearExerciseFilters}>
              <Text style={styles.clearFiltersText}>Clear</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#FF6B35']} />}
        ListEmptyComponent={<View style={styles.empty}><Icon name="barbell-outline" size={48} color="#ddd" /><Text style={styles.emptyText}>No exercises found</Text></View>}
        renderItem={({item}) => (
          <TouchableOpacity style={styles.card} onPress={() => openDetail(item)}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
              <View style={[styles.diffBadge, {backgroundColor: diffColor(item.difficulty) + '22'}]}>
                <Text style={[styles.diffText, {color: diffColor(item.difficulty)}]}>{item.difficulty}</Text>
              </View>
            </View>
            <View style={styles.cardMeta}>
              <View style={styles.metaChip}><Icon name="body-outline" size={13} color="#888" /><Text style={styles.metaChipText}> {formatMuscleLabel(item.muscle)}</Text></View>
              <View style={styles.metaChip}><Icon name="barbell-outline" size={13} color="#888" /><Text style={styles.metaChipText}> {item.equipment || 'body only'}</Text></View>
            </View>
            <View style={styles.cardFooter}>
              <View style={[styles.ytBadge, item.youtube_url ? styles.ytBadgeHas : styles.ytBadgeNone]}>
                <Icon name="logo-youtube" size={13} color={item.youtube_url ? '#FF3B30' : '#ccc'} />
                <Text style={[styles.ytBadgeText, {color: item.youtube_url ? '#FF3B30' : '#ccc'}]}>
                  {item.youtube_url ? 'Has video' : 'No video'}
                </Text>
              </View>
              <TouchableOpacity style={styles.ytBtn} onPress={() => openYouTube(item)}>
                <Icon name="logo-youtube" size={14} color="#fff" />
                <Text style={styles.ytBtnText}> Set Video</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Exercise Detail Modal */}
      <Modal visible={detailVisible} transparent animationType="slide" onRequestClose={() => setDetailVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selected?.name}</Text>
              <TouchableOpacity onPress={() => setDetailVisible(false)}><Icon name="close" size={24} color="#333" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.detailGrid}>
                {[
                  {label: 'Type', value: selected?.type, icon: 'fitness'},
                  {label: 'Muscle', value: formatMuscleLabel(selected?.muscle), icon: 'body'},
                  {label: 'Equipment', value: selected?.equipment || 'body only', icon: 'barbell'},
                  {label: 'Difficulty', value: selected?.difficulty, icon: 'speedometer'},
                ].map(r => (
                  <View key={r.label} style={styles.detailChip}>
                    <Icon name={r.icon} size={16} color="#FF6B35" />
                    <View style={{marginLeft: 6}}>
                      <Text style={styles.detailChipLabel}>{r.label}</Text>
                      <Text style={styles.detailChipValue}>{r.value}</Text>
                    </View>
                  </View>
                ))}
              </View>
              {!!selected?.instructions && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Instructions</Text>
                  <Text style={styles.detailSectionText}>{selected.instructions}</Text>
                </View>
              )}
              {!!selected?.safety_info && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Safety Info</Text>
                  <Text style={styles.detailSectionText}>{selected.safety_info}</Text>
                </View>
              )}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>YouTube Video</Text>
                {selected?.youtube_url ? (
                  <TouchableOpacity style={styles.ytLinkRow} onPress={() => Linking.openURL(selected.youtube_url)}>
                    <Icon name="logo-youtube" size={18} color="#FF3B30" />
                    <Text style={styles.ytLinkText} numberOfLines={1}> {selected.youtube_url}</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.noVideoText}>No video assigned yet</Text>
                )}
                <TouchableOpacity style={[styles.ytBtn, {marginTop: 10, alignSelf: 'flex-start'}]} onPress={() => { setDetailVisible(false); openYouTube(selected); }}>
                  <Icon name="logo-youtube" size={14} color="#fff" />
                  <Text style={styles.ytBtnText}> {selected?.youtube_url ? 'Change Video' : 'Set Video'}</Text>
                </TouchableOpacity>
              </View>
              <View style={{flexDirection: 'row', gap: 10, marginTop: 20}}>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#007AFF'}]} onPress={() => openEditForm(selected)}>
                  <Icon name="create-outline" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}> Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#FF3B30'}]} onPress={() => handleDelete(selected)}>
                  <Icon name="trash-outline" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}> Delete</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Exercises</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.filterModalContent}>
              <View style={styles.exerciseFilterSection}>
                <Text style={styles.exerciseFilterLabel}>Type</Text>
                <View style={styles.exerciseOptionRow}>
                  {EXERCISE_TYPES.map(item => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.exerciseOptionChip,
                        typeFilter === item && styles.exerciseOptionChipActive,
                      ]}
                      onPress={() => setTypeFilter(item)}>
                      <Text
                        style={[
                          styles.exerciseOptionChipText,
                          typeFilter === item && styles.exerciseOptionChipTextActive,
                        ]}>
                        {formatOptionLabel(item)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.exerciseFilterSection}>
                <Text style={styles.exerciseFilterLabel}>Difficulty</Text>
                <View style={styles.exerciseOptionRow}>
                  {EXERCISE_DIFFICULTIES.map(item => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.exerciseOptionChip,
                        difficultyFilter === item && styles.exerciseOptionChipActive,
                      ]}
                      onPress={() => setDifficultyFilter(item)}>
                      <Text
                        style={[
                          styles.exerciseOptionChipText,
                          difficultyFilter === item && styles.exerciseOptionChipTextActive,
                        ]}>
                        {formatOptionLabel(item)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.exerciseFilterSection}>
                <Text style={styles.exerciseFilterLabel}>Muscle</Text>
                <View style={styles.exerciseOptionRow}>
                  {EXERCISE_MUSCLES.map(item => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.exerciseOptionChip,
                        muscleFilter === item && styles.exerciseOptionChipActive,
                      ]}
                      onPress={() => setMuscleFilter(item)}>
                      <Text
                        style={[
                          styles.exerciseOptionChipText,
                          muscleFilter === item && styles.exerciseOptionChipTextActive,
                        ]}>
                        {formatOptionLabel(item)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.exerciseFilterSection}>
                <Text style={styles.exerciseFilterLabel}>Equipment</Text>
                <View style={styles.exerciseOptionRow}>
                  {EXERCISE_EQUIPMENTS.map(item => (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.exerciseOptionChip,
                        equipmentFilter === item.value &&
                          styles.exerciseOptionChipActive,
                      ]}
                      onPress={() => setEquipmentFilter(item.value)}>
                      <Text
                        style={[
                          styles.exerciseOptionChipText,
                          equipmentFilter === item.value &&
                            styles.exerciseOptionChipTextActive,
                        ]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.filterModalActions}>
              <TouchableOpacity
                style={styles.filterResetButton}
                onPress={clearExerciseFilters}>
                <Text style={styles.filterResetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filterApplyButton}
                onPress={() => setShowFilters(false)}>
                <Text style={styles.filterApplyButtonText}>Show Results</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sync Modal */}
      <Modal visible={syncModalVisible} transparent animationType="fade" onRequestClose={() => setSyncModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, {maxHeight: '75%'}]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sync Exercises</Text>
              <TouchableOpacity onPress={() => setSyncModalVisible(false)}><Icon name="close" size={24} color="#333" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.syncLabel}>Name</Text>
              <TextInput style={styles.syncInput} value={syncFilters.name} onChangeText={v => setSyncFilters({...syncFilters, name: v})} placeholder="e.g. push up" placeholderTextColor="#aaa" />
              <Text style={styles.syncLabel}>Type</Text>
              <TextInput style={styles.syncInput} value={syncFilters.type} onChangeText={v => setSyncFilters({...syncFilters, type: v})} placeholder="e.g. strength, cardio" placeholderTextColor="#aaa" />
              <Text style={styles.syncLabel}>Muscle</Text>
              <TextInput style={styles.syncInput} value={syncFilters.muscle} onChangeText={v => setSyncFilters({...syncFilters, muscle: v})} placeholder="e.g. chest, biceps" placeholderTextColor="#aaa" />
              <Text style={styles.syncLabel}>Difficulty</Text>
              <View style={{flexDirection: 'row', gap: 8, marginBottom: 12}}>
                {['', 'beginner', 'intermediate', 'expert'].map(d => (
                  <TouchableOpacity key={d} style={[styles.filterOption, syncFilters.difficulty === d && styles.filterOptionActive]} onPress={() => setSyncFilters({...syncFilters, difficulty: d})}>
                    <Text style={[styles.filterOptionText, syncFilters.difficulty === d && styles.filterOptionTextActive]}>{d || 'all'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.syncLabel}>Equipment</Text>
              <TextInput style={styles.syncInput} value={syncFilters.equipment} onChangeText={v => setSyncFilters({...syncFilters, equipment: v})} placeholder="e.g. barbell, dumbbell" placeholderTextColor="#aaa" />
              <Text style={styles.syncHint}>Leave fields empty to sync all exercises</Text>
              <TouchableOpacity style={[styles.syncBtnFull, {backgroundColor: '#FF6B35'}]} onPress={handleSync}>
                <Icon name="sync" size={18} color="#fff" />
                <Text style={{color: '#fff', fontWeight: '700', fontSize: 15}}>Sync Now</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add/Edit Form Modal */}
      <Modal visible={formVisible} transparent animationType="slide" onRequestClose={() => setFormVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editMode ? 'Edit Exercise' : 'Add Exercise'}</Text>
              <TouchableOpacity onPress={() => setFormVisible(false)}><Icon name="close" size={24} color="#333" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Name *</Text>
              <TextInput style={styles.formInput} value={formData.name} onChangeText={v => setFormData({...formData, name: v})} placeholder="Exercise name" placeholderTextColor="#aaa" />
              <Text style={styles.formLabel}>Muscle *</Text>
              <TextInput style={styles.formInput} value={formData.muscle} onChangeText={v => setFormData({...formData, muscle: v})} placeholder="e.g. chest, biceps" placeholderTextColor="#aaa" />
              <Text style={styles.formLabel}>Difficulty *</Text>
              <View style={{flexDirection: 'row', gap: 8, marginBottom: 12}}>
                {['beginner', 'intermediate', 'expert'].map(d => (
                  <TouchableOpacity key={d} style={[styles.diffOption, formData.difficulty === d && styles.diffOptionActive]} onPress={() => setFormData({...formData, difficulty: d})}>
                    <Text style={[styles.diffOptionText, formData.difficulty === d && styles.diffOptionTextActive]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.formLabel}>Type</Text>
              <TextInput style={styles.formInput} value={formData.type} onChangeText={v => setFormData({...formData, type: v})} placeholder="e.g. strength, cardio" placeholderTextColor="#aaa" />
              <Text style={styles.formLabel}>Equipment</Text>
              <TextInput style={styles.formInput} value={formData.equipment} onChangeText={v => setFormData({...formData, equipment: v})} placeholder="e.g. barbell, dumbbell" placeholderTextColor="#aaa" />
              <Text style={styles.formLabel}>Instructions</Text>
              <TextInput style={[styles.formInput, {height: 80}]} value={formData.instructions} onChangeText={v => setFormData({...formData, instructions: v})} placeholder="Step-by-step instructions" placeholderTextColor="#aaa" multiline />
              <Text style={styles.formLabel}>Safety Info</Text>
              <TextInput style={[styles.formInput, {height: 60}]} value={formData.safety_info} onChangeText={v => setFormData({...formData, safety_info: v})} placeholder="Safety tips" placeholderTextColor="#aaa" multiline />
              <Text style={styles.formLabel}>YouTube URL</Text>
              <TextInput style={styles.formInput} value={formData.youtube_url} onChangeText={v => setFormData({...formData, youtube_url: v})} placeholder="https://youtube.com/..." placeholderTextColor="#aaa" />
              <TouchableOpacity style={[styles.saveBtn, saving && {opacity: 0.6}]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <><Icon name="checkmark-circle" size={18} color="#fff" /><Text style={styles.saveBtnText}> {editMode ? 'Update' : 'Create'}</Text></>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* YouTube Search Modal */}
      <Modal visible={ytVisible} transparent animationType="slide" onRequestClose={() => setYtVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Video</Text>
              <TouchableOpacity onPress={() => setYtVisible(false)}><Icon name="close" size={24} color="#333" /></TouchableOpacity>
            </View>
            <Text style={styles.ytSearchSubtitle}>Results for: <Text style={{fontWeight: '700'}}>{ytTarget?.name}</Text></Text>
            {ytSearching ? (
              <View style={styles.ytLoading}><ActivityIndicator size="large" color="#FF3B30" /><Text style={styles.ytLoadingText}>Searching YouTube...</Text></View>
            ) : (
              <ScrollView>
                {ytResults.map((r, i) => (
                  <View key={i} style={styles.ytResultCard}>
                    <TouchableOpacity style={styles.ytResultLeft} onPress={() => Linking.openURL(r.url)}>
                      <Icon name="logo-youtube" size={28} color="#FF3B30" />
                      <Text style={styles.ytPreviewText}>Watch</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.ytResultInfo} onPress={() => selectYtUrl(r.url)} disabled={ytSaving}>
                      <Text style={styles.ytResultTitle} numberOfLines={2}>{r.title}</Text>
                      <Text style={styles.ytResultChannel}>{r.channel}</Text>
                      <Text style={styles.ytResultUrl} numberOfLines={1}>{r.url}</Text>
                      <View style={styles.ytSelectHint}>
                        <Icon name="checkmark-circle-outline" size={13} color="#34C759" />
                        <Text style={styles.ytSelectHintText}> Tap to select</Text>
                      </View>
                    </TouchableOpacity>
                    {ytSaving ? <ActivityIndicator size="small" color="#FF6B35" /> : <Icon name="chevron-forward" size={20} color="#ccc" />}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── RECIPES TAB ─────────────────────────────────────────────────────────────

const RECIPE_CUISINES = [
  'African',
  'Asian',
  'American',
  'British',
  'Cajun',
  'Caribbean',
  'Chinese',
  'Eastern European',
  'European',
  'French',
  'German',
  'Greek',
  'Indian',
  'Irish',
  'Italian',
  'Japanese',
  'Jewish',
  'Korean',
  'Latin American',
  'Mediterranean',
  'Mexican',
  'Middle Eastern',
  'Nordic',
  'Southern',
  'Spanish',
  'Thai',
  'Vietnamese',
];

function RecipesTab() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('all');
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const [syncing, setSyncing] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const [syncQuery, setSyncQuery] = useState('');
  const [syncNumber, setSyncNumber] = useState('20');
  const [syncOffset, setSyncOffset] = useState('0');
  const [syncFilters, setSyncFilters] = useState({diet: '', maxCalories: '', minProtein: '', maxReadyTime: '', cuisine: '', type: ''});
  const [showCuisineOptions, setShowCuisineOptions] = useState(false);
  const [showFormCuisineOptions, setShowFormCuisineOptions] = useState(false);

  // Add/Edit modal
  const [formVisible, setFormVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const TAGS = ['all', 'high_protein', 'low_carb', 'weight_loss', 'quick_meal', 'vegetarian', 'vegan'];

  const closeSyncModal = () => {
    setShowCuisineOptions(false);
    setSyncModalVisible(false);
  };

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get('/recipes');
      setRecipes(res.data || []);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleSync = async () => {
    if (!syncFilters.cuisine) {
      Alert.alert('Required', 'Please select a cuisine before syncing recipes.');
      return;
    }

    setSyncing(true);
    closeSyncModal();
    try {
      const payload = {
        query: syncQuery.trim() || '',
        number: Math.max(Number(syncNumber) || 20, 1),
        offset: Math.max(Number(syncOffset) || 0, 0),
        ...Object.fromEntries(Object.entries(syncFilters).filter(([, v]) => v))
      };
      const res = await apiClient.post('/recipes/sync', payload);
      Alert.alert(
        'Synced',
        `Added ${res.data.synced} recipes, updated cuisine on ${res.data.updatedCuisine || 0} existing recipes, skipped ${res.data.skipped}.`,
      );
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Sync failed');
    }
    setSyncing(false);
  };

  const openAddForm = () => {
    setEditMode(false);
    setShowFormCuisineOptions(false);
    setFormData({title: '', image: '', cuisine: '', calories: '', protein: '', fat: '', carbs: '', vegetarian: false, vegan: false, gluten_free: false, ready_in_minutes: ''});
    setFormVisible(true);
  };

  const openEditForm = (item: any) => {
    setEditMode(true);
    setShowFormCuisineOptions(false);
    setFormData({...item, cuisine: item.cuisine || ''});
    setFormVisible(true);
    setDetailVisible(false);
  };

  const handleSave = async () => {
    if (!formData.title) {
      Alert.alert('Error', 'Title is required');
      return;
    }
    if (!formData.cuisine) {
      Alert.alert('Error', 'Cuisine is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {...formData, calories: Number(formData.calories) || 0, protein: Number(formData.protein) || 0, fat: Number(formData.fat) || 0, carbs: Number(formData.carbs) || 0, ready_in_minutes: Number(formData.ready_in_minutes) || 0};
      if (editMode) {
        await apiClient.put(`/recipes/${formData.id}`, payload);
        Alert.alert('Success', 'Recipe updated');
      } else {
        await apiClient.post('/recipes', payload);
        Alert.alert('Success', 'Recipe created');
      }
      setShowFormCuisineOptions(false);
      setFormVisible(false);
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed to save');
    }
    setSaving(false);
  };

  const handleDelete = (item: any) => {
    Alert.alert('Delete Recipe', `Delete "${item.title}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await apiClient.delete(`/recipes/${item.id}`);
          Alert.alert('Deleted', 'Recipe removed');
          setDetailVisible(false);
          load();
        } catch (e: any) {
          Alert.alert('Error', e?.response?.data?.error || 'Failed to delete');
        }
      }}
    ]);
  };

  const filtered = recipes.filter(r => {
    const matchSearch = r.title?.toLowerCase().includes(search.toLowerCase());
    const matchTag = tagFilter === 'all' || (r.tags || []).includes(tagFilter);
    const matchCuisine = cuisineFilter === 'all' || r.cuisine === cuisineFilter;
    return matchSearch && matchTag && matchCuisine;
  });

  const cuisineOptions = [
    'all',
    ...Array.from(
      new Set(
        recipes
          .map(recipe => recipe.cuisine)
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort((left, right) => left.localeCompare(right)),
  ];

  if (loading) return <ActivityIndicator style={{flex: 1, marginTop: 40}} size="large" color="#FF6B35" />;

  return (
    <View style={{flex: 1}}>
      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Icon name="search" size={18} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Icon name="close-circle" size={18} color="#999" /></TouchableOpacity>}
        </View>
        <TouchableOpacity style={[styles.syncBtn, {backgroundColor: '#34C759', marginRight: 8}]} onPress={openAddForm}>
          <Icon name="add" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.syncBtn, {backgroundColor: '#34C759'}]} onPress={() => { setShowCuisineOptions(false); setSyncModalVisible(true); }} disabled={syncing}>
          {syncing ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="sync" size={18} color="#fff" />}
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll} contentContainerStyle={styles.tagRow}>
        {TAGS.map(t => (
          <TouchableOpacity key={t} style={[styles.tagChip, tagFilter === t && styles.tagChipActive]} onPress={() => setTagFilter(t)}>
            <Text style={[styles.tagChipText, tagFilter === t && styles.tagChipTextActive]}>{t.replace(/_/g, ' ')}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {cuisineOptions.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subFilterScroll} contentContainerStyle={styles.tagRow}>
          {cuisineOptions.map(option => (
            <TouchableOpacity
              key={option}
              style={[styles.tagChip, cuisineFilter === option && styles.tagChipActive]}
              onPress={() => setCuisineFilter(option)}>
              <Text style={[styles.tagChipText, cuisineFilter === option && styles.tagChipTextActive]}>
                {option === 'all' ? 'All cuisines' : option}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <FlatList
        style={styles.recipeList}
        data={filtered}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && styles.listContentEmpty,
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#FF6B35']} />}
        ListEmptyComponent={<View style={styles.empty}><Icon name="restaurant-outline" size={48} color="#ddd" /><Text style={styles.emptyText}>No recipes found</Text></View>}
        renderItem={({item}) => (
          <TouchableOpacity style={styles.card} onPress={async () => {
            setDetailVisible(true);
            setDetailLoading(true);
            try {
              const res = await apiClient.get(`/recipes/${item.id}`);
              setSelected(res.data);
            } catch (_) { setSelected(item); }
            setDetailLoading(false);
          }}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <View style={styles.nutritionRow}>
              {[
                {icon: 'flame', color: '#FF6B35', value: `${Math.round(item.calories)} cal`},
                {icon: 'fitness', color: '#007AFF', value: `${Math.round(item.protein)}g protein`},
                {icon: 'leaf', color: '#34C759', value: `${Math.round(item.carbs)}g carbs`},
                {icon: 'water', color: '#FFD700', value: `${Math.round(item.fat)}g fat`},
              ].map(n => (
                <View key={n.icon} style={styles.nutritionChip}>
                  <Icon name={n.icon} size={13} color={n.color} />
                  <Text style={styles.nutritionChipText}> {n.value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.recipeCardFooter}>
              <View style={styles.recipeCardMetaRow}>
                <View style={styles.metaChip}><Icon name="time-outline" size={13} color="#888" /><Text style={styles.metaChipText}> {item.ready_in_minutes} min</Text></View>
                {item.cuisine ? (
                  <View style={styles.metaChip}><Icon name="earth-outline" size={13} color="#FF6B35" /><Text style={styles.metaChipText}> {item.cuisine}</Text></View>
                ) : null}
              </View>
              {(item.tags || []).length > 0 && (
                <View style={styles.recipeTagRow}>
                  {(item.tags || []).slice(0, 3).map((t: string) => (
                    <View key={t} style={styles.recipeTag}><Text style={styles.recipeTagText}>{t.replace(/_/g, ' ')}</Text></View>
                  ))}
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Recipe Detail Modal */}
      <Modal visible={detailVisible} transparent animationType="slide" onRequestClose={() => setDetailVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={2}>{selected?.title}</Text>
              <TouchableOpacity onPress={() => setDetailVisible(false)}><Icon name="close" size={24} color="#333" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {detailLoading ? (
                <ActivityIndicator size="large" color="#FF6B35" style={{marginVertical: 40}} />
              ) : (
                <>
              {selected?.image
                ? <Image source={{uri: selected.image}} style={styles.recipeDetailImage} resizeMode="cover" />
                : <View style={styles.recipeDetailImagePlaceholder}><Icon name="restaurant" size={40} color="#ccc" /></View>}
              <View style={styles.nutritionGrid}>
                {[
                  {icon: 'flame', color: '#FF6B35', value: Math.round(selected?.calories || 0), label: 'Calories'},
                  {icon: 'fitness', color: '#007AFF', value: `${Math.round(selected?.protein || 0)}g`, label: 'Protein'},
                  {icon: 'leaf', color: '#34C759', value: `${Math.round(selected?.carbs || 0)}g`, label: 'Carbs'},
                  {icon: 'water', color: '#FFD700', value: `${Math.round(selected?.fat || 0)}g`, label: 'Fat'},
                ].map(n => (
                  <View key={n.label} style={styles.nutritionCard}>
                    <Icon name={n.icon} size={22} color={n.color} />
                    <Text style={styles.nutritionCardValue}>{n.value}</Text>
                    <Text style={styles.nutritionCardLabel}>{n.label}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Details</Text>
                <View style={styles.recipeDetailMetaRow}>
                  <View style={styles.metaChip}><Icon name="time-outline" size={14} color="#888" /><Text style={styles.metaChipText}> {selected?.ready_in_minutes} min prep</Text></View>
                  {selected?.cuisine ? (
                    <View style={styles.metaChip}><Icon name="earth-outline" size={14} color="#FF6B35" /><Text style={styles.metaChipText}> {selected.cuisine}</Text></View>
                  ) : null}
                </View>
                <View style={styles.recipeTagRow}>
                  {(selected?.tags || []).map((t: string) => (
                    <View key={t} style={styles.recipeTag}><Text style={styles.recipeTagText}>{t.replace(/_/g, ' ')}</Text></View>
                  ))}
                </View>
              </View>
              {(selected?.ingredients || []).length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Ingredients</Text>
                  {selected.ingredients.map((ing: any, i: number) => (
                    <Text key={i} style={styles.ingredientItem}>• {ing.name}{ing.metric_value ? ` — ${ing.metric_value} ${ing.metric_unit}` : ''}</Text>
                  ))}
                </View>
              )}
              {!!selected?.instructions && (() => {
                try {
                  const steps: string[] = JSON.parse(selected.instructions);
                  return (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Instructions</Text>
                      {steps.map((step, i) => (
                        <View key={i} style={styles.stepRow}>
                          <Text style={styles.stepNumber}>{i + 1}.</Text>
                          <Text style={styles.stepText}>{step}</Text>
                        </View>
                      ))}
                    </View>
                  );
                } catch { return null; }
              })()}
              <View style={{flexDirection: 'row', gap: 10, marginTop: 20}}>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#007AFF'}]} onPress={() => openEditForm(selected)}>
                  <Icon name="create-outline" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}> Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#FF3B30'}]} onPress={() => handleDelete(selected)}>
                  <Icon name="trash-outline" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}> Delete</Text>
                </TouchableOpacity>
              </View>
              </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add/Edit Form Modal */}
      <Modal visible={formVisible} transparent animationType="slide" onRequestClose={() => { setShowFormCuisineOptions(false); setFormVisible(false); }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editMode ? 'Edit Recipe' : 'Add Recipe'}</Text>
              <TouchableOpacity onPress={() => { setShowFormCuisineOptions(false); setFormVisible(false); }}><Icon name="close" size={24} color="#333" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Title *</Text>
              <TextInput style={styles.formInput} value={formData.title} onChangeText={v => setFormData({...formData, title: v})} placeholder="Recipe name" placeholderTextColor="#aaa" />
              <Text style={styles.formLabel}>Image URL</Text>
              <TextInput style={styles.formInput} value={formData.image} onChangeText={v => setFormData({...formData, image: v})} placeholder="https://..." placeholderTextColor="#aaa" />
              <Text style={styles.formLabel}>Cuisine *</Text>
              <TouchableOpacity
                style={styles.dropdownField}
                onPress={() => setShowFormCuisineOptions(prev => !prev)}>
                <Text
                  style={
                    formData.cuisine
                      ? styles.dropdownFieldValue
                      : styles.dropdownFieldPlaceholder
                  }>
                  {formData.cuisine || 'Select cuisine'}
                </Text>
                <Icon
                  name={showFormCuisineOptions ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#888"
                />
              </TouchableOpacity>
              {showFormCuisineOptions && (
                <View style={styles.dropdownOptionsBox}>
                  <ScrollView nestedScrollEnabled style={{maxHeight: 220}}>
                    {RECIPE_CUISINES.map(option => {
                      const isActive = formData.cuisine === option;

                      return (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.dropdownOptionRow,
                            isActive && styles.dropdownOptionRowActive,
                          ]}
                          onPress={() => {
                            setFormData({...formData, cuisine: option});
                            setShowFormCuisineOptions(false);
                          }}>
                          <Text
                            style={[
                              styles.dropdownOptionRowText,
                              isActive && styles.dropdownOptionRowTextActive,
                            ]}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
              <View style={{flexDirection: 'row', gap: 10}}>
                <View style={{flex: 1}}>
                  <Text style={styles.formLabel}>Calories</Text>
                  <TextInput style={styles.formInput} value={String(formData.calories)} onChangeText={v => setFormData({...formData, calories: v})} placeholder="0" placeholderTextColor="#aaa" keyboardType="numeric" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.formLabel}>Protein (g)</Text>
                  <TextInput style={styles.formInput} value={String(formData.protein)} onChangeText={v => setFormData({...formData, protein: v})} placeholder="0" placeholderTextColor="#aaa" keyboardType="numeric" />
                </View>
              </View>
              <View style={{flexDirection: 'row', gap: 10}}>
                <View style={{flex: 1}}>
                  <Text style={styles.formLabel}>Fat (g)</Text>
                  <TextInput style={styles.formInput} value={String(formData.fat)} onChangeText={v => setFormData({...formData, fat: v})} placeholder="0" placeholderTextColor="#aaa" keyboardType="numeric" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.formLabel}>Carbs (g)</Text>
                  <TextInput style={styles.formInput} value={String(formData.carbs)} onChangeText={v => setFormData({...formData, carbs: v})} placeholder="0" placeholderTextColor="#aaa" keyboardType="numeric" />
                </View>
              </View>
              <Text style={styles.formLabel}>Ready in (minutes)</Text>
              <TextInput style={styles.formInput} value={String(formData.ready_in_minutes)} onChangeText={v => setFormData({...formData, ready_in_minutes: v})} placeholder="0" placeholderTextColor="#aaa" keyboardType="numeric" />
              <Text style={styles.formLabel}>Instructions</Text>
              <TextInput style={[styles.formInput, {height: 120}]} value={formData.instructions ? (() => { try { return JSON.parse(formData.instructions).join('\n'); } catch { return formData.instructions; } })() : ''} onChangeText={v => setFormData({...formData, instructions: JSON.stringify(v.split('\n').map(s => s.trim()).filter(Boolean))})} placeholder={`Step 1\nStep 2\nStep 3`} placeholderTextColor="#aaa" multiline />
              <Text style={styles.syncHint}>One step per line</Text>
              <View style={{flexDirection: 'row', gap: 12, marginVertical: 12}}>
                <TouchableOpacity style={styles.checkRow} onPress={() => setFormData({...formData, vegetarian: !formData.vegetarian})}>
                  <Icon name={formData.vegetarian ? 'checkbox' : 'square-outline'} size={20} color="#FF6B35" />
                  <Text style={styles.checkLabel}> Vegetarian</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.checkRow} onPress={() => setFormData({...formData, vegan: !formData.vegan})}>
                  <Icon name={formData.vegan ? 'checkbox' : 'square-outline'} size={20} color="#FF6B35" />
                  <Text style={styles.checkLabel}> Vegan</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.checkRow} onPress={() => setFormData({...formData, gluten_free: !formData.gluten_free})}>
                  <Icon name={formData.gluten_free ? 'checkbox' : 'square-outline'} size={20} color="#FF6B35" />
                  <Text style={styles.checkLabel}> Gluten Free</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={[styles.saveBtn, saving && {opacity: 0.6}]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <><Icon name="checkmark-circle" size={18} color="#fff" /><Text style={styles.saveBtnText}> {editMode ? 'Update' : 'Create'}</Text></>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Sync Options Modal */}
      <Modal visible={syncModalVisible} transparent animationType="fade" onRequestClose={closeSyncModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, {maxHeight: '80%'}]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sync Recipes</Text>
              <TouchableOpacity onPress={closeSyncModal}><Icon name="close" size={24} color="#333" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.syncLabel}>Search query (optional)</Text>
              <TextInput style={styles.syncInput} value={syncQuery} onChangeText={setSyncQuery} placeholder="e.g. chicken, salad..." placeholderTextColor="#aaa" />
              <Text style={styles.syncLabel}>Number of recipes</Text>
              <TextInput style={styles.syncInput} value={syncNumber} onChangeText={setSyncNumber} keyboardType="numeric" placeholder="20" placeholderTextColor="#aaa" />
              <Text style={styles.syncLabel}>Offset</Text>
              <TextInput style={styles.syncInput} value={syncOffset} onChangeText={setSyncOffset} keyboardType="numeric" placeholder="0" placeholderTextColor="#aaa" />
              <Text style={styles.syncLabel}>Diet</Text>
              <TextInput style={styles.syncInput} value={syncFilters.diet} onChangeText={v => setSyncFilters({...syncFilters, diet: v})} placeholder="e.g. vegetarian, vegan, paleo" placeholderTextColor="#aaa" />
              <Text style={styles.syncLabel}>Max Calories</Text>
              <TextInput style={styles.syncInput} value={syncFilters.maxCalories} onChangeText={v => setSyncFilters({...syncFilters, maxCalories: v})} placeholder="e.g. 500" placeholderTextColor="#aaa" keyboardType="numeric" />
              <Text style={styles.syncLabel}>Min Protein (g)</Text>
              <TextInput style={styles.syncInput} value={syncFilters.minProtein} onChangeText={v => setSyncFilters({...syncFilters, minProtein: v})} placeholder="e.g. 20" placeholderTextColor="#aaa" keyboardType="numeric" />
              <Text style={styles.syncLabel}>Max Ready Time (min)</Text>
              <TextInput style={styles.syncInput} value={syncFilters.maxReadyTime} onChangeText={v => setSyncFilters({...syncFilters, maxReadyTime: v})} placeholder="e.g. 30" placeholderTextColor="#aaa" keyboardType="numeric" />
              <Text style={styles.syncLabel}>Cuisine *</Text>
              <TouchableOpacity
                style={styles.dropdownField}
                onPress={() => setShowCuisineOptions(prev => !prev)}>
                <Text
                  style={
                    syncFilters.cuisine
                      ? styles.dropdownFieldValue
                      : styles.dropdownFieldPlaceholder
                  }>
                  {syncFilters.cuisine || 'Select cuisine'}
                </Text>
                <Icon
                  name={showCuisineOptions ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#888"
                />
              </TouchableOpacity>
              {showCuisineOptions && (
                <View style={styles.dropdownOptionsBox}>
                  <ScrollView nestedScrollEnabled style={{maxHeight: 220}}>
                    {RECIPE_CUISINES.map(option => {
                      const isActive = syncFilters.cuisine === option;

                      return (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.dropdownOptionRow,
                            isActive && styles.dropdownOptionRowActive,
                          ]}
                          onPress={() => {
                            setSyncFilters({...syncFilters, cuisine: option});
                            setShowCuisineOptions(false);
                          }}>
                          <Text
                            style={[
                              styles.dropdownOptionRowText,
                              isActive && styles.dropdownOptionRowTextActive,
                            ]}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
              <Text style={styles.syncLabel}>Type</Text>
              <TextInput style={styles.syncInput} value={syncFilters.type} onChangeText={v => setSyncFilters({...syncFilters, type: v})} placeholder="e.g. main course, dessert" placeholderTextColor="#aaa" />
              <Text style={styles.syncHint}>Cuisine is required. Other filters can stay empty for broader results.</Text>
              <TouchableOpacity style={[styles.syncBtnFull, {backgroundColor: '#34C759'}]} onPress={handleSync}>
                <Icon name="sync" size={18} color="#fff" />
                <Text style={{color: '#fff', fontWeight: '700', fontSize: 15}}>Sync Now</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function ManageContentScreen() {
  const [tab, setTab] = useState<'exercises' | 'recipes'>('exercises');

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, tab === 'exercises' && styles.tabActive]} onPress={() => setTab('exercises')}>
          <Icon name="barbell" size={16} color={tab === 'exercises' ? '#FF6B35' : '#888'} />
          <Text style={[styles.tabText, tab === 'exercises' && styles.tabTextActive]}>Exercises</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'recipes' && styles.tabActive]} onPress={() => setTab('recipes')}>
          <Icon name="restaurant" size={16} color={tab === 'recipes' ? '#FF6B35' : '#888'} />
          <Text style={[styles.tabText, tab === 'recipes' && styles.tabTextActive]}>Recipes</Text>
        </TouchableOpacity>
      </View>
      {tab === 'exercises' ? <ExercisesTab /> : <RecipesTab />}
    </View>
  );
}
