import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../../../services/api';
import {formatMuscleLabel} from '../../../utils/formatMuscleLabel';
import {styles} from './styles';

const CATEGORIES = ['All', 'cardio', 'strength', 'stretching', 'plyometrics', 'powerlifting', 'olympic_weightlifting', 'strongman'];
const DIFFICULTIES = ['All', 'beginner', 'intermediate', 'expert'];
const MUSCLES = [
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
const EQUIPMENTS = [
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

export default function SearchWorkoutScreen({navigation, route}: any) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(route?.params?.initialCategory || 'All');
  const [difficulty, setDifficulty] = useState('All');
  const [muscle, setMuscle] = useState('All');
  const [equipment, setEquipment] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: any = {};
    if (category !== 'All') params.type = category;
    if (difficulty !== 'All') params.difficulty = difficulty;
    if (muscle !== 'All') params.muscle = muscle;
    if (equipment !== 'All') params.equipment = equipment;
    apiClient.get('/exercises', {params})
      .then(res => setExercises(res.data || []))
      .catch(() => setExercises([]))
      .finally(() => setLoading(false));
  }, [category, difficulty, muscle, equipment]);

  const filtered = exercises.filter(e =>
    e.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const activeCriteriaCount = [category, difficulty, muscle, equipment].filter(
    value => value !== 'All',
  ).length;

  const clearFilters = () => {
    setCategory('All');
    setDifficulty('All');
    setMuscle('All');
    setEquipment('All');
  };

  const selectedEquipmentLabel =
    EQUIPMENTS.find(item => item.value === equipment)?.label || equipment;

  const diffColor = (d: string) =>
    d === 'beginner' ? '#34C759' : d === 'intermediate' ? '#FF9500' : '#FF3B30';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Icon
              name="search-outline"
              size={18}
              color="#999"
              style={styles.searchIcon}
            />
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
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
            accessibilityLabel="Open exercise filters">
            <Icon name="options-outline" size={20} color="#FF6B35" />
            {activeCriteriaCount > 0 ? (
              <View style={styles.filterCountBadge}>
                <Text style={styles.filterCountText}>{activeCriteriaCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        {activeCriteriaCount > 0 ? (
          <View style={styles.activeFilterBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activeFilterScroll}>
              {category !== 'All' ? (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterChipText}>
                    Type: {formatOptionLabel(category)}
                  </Text>
                </View>
              ) : null}
              {difficulty !== 'All' ? (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterChipText}>
                    Difficulty: {formatOptionLabel(difficulty)}
                  </Text>
                </View>
              ) : null}
              {muscle !== 'All' ? (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterChipText}>
                    Muscle: {formatMuscleLabel(muscle)}
                  </Text>
                </View>
              ) : null}
              {equipment !== 'All' ? (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterChipText}>
                    Equipment: {selectedEquipmentLabel}
                  </Text>
                </View>
              ) : null}
            </ScrollView>

            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Clear</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* Results - fills remaining space */}
      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator style={{flex: 1}} size="large" color="#FF6B35" />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => String(item.exercise_id || item.id)}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Icon name="barbell-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No exercises found</Text>
              </View>
            }
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('ExerciseDetail', {exercise: item})}>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardSub}>
                    {[formatMuscleLabel(item.muscle), item.equipment].filter(Boolean).join(' · ') || '—'}
                  </Text>
                </View>
                <View style={styles.cardRight}>
                  {item.difficulty ? (
                    <View style={[styles.diffBadge, {backgroundColor: diffColor(item.difficulty) + '22'}]}>
                      <Text style={[styles.diffText, {color: diffColor(item.difficulty)}]}>
                        {item.difficulty}
                      </Text>
                    </View>
                  ) : null}
                  <Icon name="chevron-forward" size={18} color="#ccc" style={{marginTop: 4}} />
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Exercises</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Icon name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalContent}>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Type</Text>
                <View style={styles.optionRow}>
                  {CATEGORIES.map(item => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.optionChip,
                        category === item && styles.optionChipActive,
                      ]}
                      onPress={() => setCategory(item)}>
                      <Text
                        style={[
                          styles.optionChipText,
                          category === item && styles.optionChipTextActive,
                        ]}>
                        {formatOptionLabel(item)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Difficulty</Text>
                <View style={styles.optionRow}>
                  {DIFFICULTIES.map(item => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.optionChip,
                        difficulty === item && styles.optionChipActive,
                      ]}
                      onPress={() => setDifficulty(item)}>
                      <Text
                        style={[
                          styles.optionChipText,
                          difficulty === item && styles.optionChipTextActive,
                        ]}>
                        {formatOptionLabel(item)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Muscle</Text>
                <View style={styles.optionRow}>
                  {MUSCLES.map(item => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.optionChip,
                        muscle === item && styles.optionChipActive,
                      ]}
                      onPress={() => setMuscle(item)}>
                      <Text
                        style={[
                          styles.optionChipText,
                          muscle === item && styles.optionChipTextActive,
                        ]}>
                        {formatOptionLabel(item)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Equipment</Text>
                <View style={styles.optionRow}>
                  {EQUIPMENTS.map(item => (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.optionChip,
                        equipment === item.value && styles.optionChipActive,
                      ]}
                      onPress={() => setEquipment(item.value)}>
                      <Text
                        style={[
                          styles.optionChipText,
                          equipment === item.value && styles.optionChipTextActive,
                        ]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.resetButton} onPress={clearFilters}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilters(false)}>
                <Text style={styles.applyButtonText}>Show Results</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
