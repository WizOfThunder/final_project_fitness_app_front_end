import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../../../services/api';
import {styles} from './styles';

const TAGS = [
  {label: 'All', value: ''},
  {label: 'High Protein', value: 'high_protein'},
  {label: 'Low Carb', value: 'low_carb'},
  {label: 'Low Fat', value: 'low_fat'},
  {label: 'Weight Loss', value: 'weight_loss'},
  {label: 'Muscle Gain', value: 'muscle_gain'},
  {label: 'Quick Meal', value: 'quick_meal'},
  {label: 'Easy', value: 'easy'},
  {label: 'Vegetarian', value: 'vegetarian'},
  {label: 'Vegan', value: 'vegan'},
  {label: 'Gluten Free', value: 'gluten_free'},
];

export default function SearchRecipeScreen({navigation, route}: any) {
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState(route?.params?.initialTag || '');
  const [cuisine, setCuisine] = useState(route?.params?.initialCuisine || '');
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const params = tag ? {tag} : {};
      const res = await apiClient.get('/recipes', {params});
      setRecipes(res.data || []);
    } catch {
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, [tag]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const cuisineOptions = useMemo(
    () => [
      '',
      ...Array.from(
        new Set(
          recipes
            .map(recipe => recipe.cuisine)
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    ],
    [recipes],
  );

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = recipes.filter(recipe => {
    const matchesSearch =
      !normalizedSearch
      || (recipe.title || '').toLowerCase().includes(normalizedSearch);
    const matchesCuisine = !cuisine || recipe.cuisine === cuisine;
    return matchesSearch && matchesCuisine;
  });

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Icon name="search-outline" size={18} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes..."
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

      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterContent}>
          {TAGS.map(t => (
            <TouchableOpacity
              key={t.value}
              style={[styles.chip, tag === t.value && styles.chipActive]}
              onPress={() => setTag(t.value)}>
              <Text style={[styles.chipText, tag === t.value && styles.chipTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {cuisineOptions.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterRow}
            contentContainerStyle={styles.filterContent}>
            {cuisineOptions.map(option => (
              <TouchableOpacity
                key={option || 'all-cuisines'}
                style={[styles.chip, cuisine === option && styles.chipActive]}
                onPress={() => setCuisine(option)}>
                <Text
                  style={[
                    styles.chipText,
                    cuisine === option && styles.chipTextActive,
                  ]}>
                  {option || 'All Cuisines'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator style={{flex: 1}} size="large" color="#34C759" />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={[
              styles.list,
              filtered.length === 0 && styles.listEmpty,
            ]}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Icon name="restaurant-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No recipes found</Text>
              </View>
            }
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('RecipeDetail', {recipeId: item.id})}>
                {item.image ? (
                  <Image source={{uri: item.image}} style={styles.cardImage} />
                ) : (
                  <View style={styles.cardImagePlaceholder}>
                    <Icon name="restaurant" size={28} color="#ccc" />
                  </View>
                )}
                <View style={styles.cardBody}>
                  <Text style={styles.cardName} numberOfLines={2}>{item.title}</Text>
                  <View style={styles.cardMeta}>
                    <View style={styles.metaItem}>
                      <Icon name="flame-outline" size={13} color="#FF6B35" />
                      <Text style={styles.metaText}>{Math.round(item.calories || 0)} cal</Text>
                    </View>
                    {item.cuisine ? (
                      <View style={styles.metaItem}>
                        <Icon name="earth-outline" size={13} color="#FF6B35" />
                        <Text style={styles.metaText}>{item.cuisine}</Text>
                      </View>
                    ) : null}
                    <View style={styles.metaItem}>
                      <Icon name="time-outline" size={13} color="#888" />
                      <Text style={styles.metaText}>{item.ready_in_minutes} min</Text>
                    </View>
                    {item.protein > 0 && (
                      <View style={styles.metaItem}>
                        <Icon name="barbell-outline" size={13} color="#007AFF" />
                        <Text style={styles.metaText}>{Math.round(item.protein)}g protein</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Icon name="chevron-forward" size={18} color="#ccc" />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
}
