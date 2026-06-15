import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../../../services/api';
import {styles} from './styles';

export default function RecipeDetailScreen({route}: any) {
  const recipeId = route?.params?.recipeId ?? route?.params?.recipe?.id;
  const [recipe, setRecipe] = useState<any>(route?.params?.recipe || null);
  const [loading, setLoading] = useState(!!recipeId);

  useEffect(() => {
    if (!recipeId) return;
    apiClient.get(`/recipes/${recipeId}`)
      .then(res => setRecipe(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [recipeId]);

  if (loading) return <ActivityIndicator style={{flex: 1}} size="large" color="#34C759" />;
  if (!recipe) return null;

  const macros = [
    {label: 'Calories', value: `${Math.round(recipe.calories || 0)}`, unit: 'kcal', color: '#FF6B35', icon: 'flame'},
    {label: 'Protein', value: `${Math.round(recipe.protein || 0)}`, unit: 'g', color: '#007AFF', icon: 'barbell'},
    {label: 'Carbs', value: `${Math.round(recipe.carbs || 0)}`, unit: 'g', color: '#FF9500', icon: 'leaf'},
    {label: 'Fat', value: `${Math.round(recipe.fat || 0)}`, unit: 'g', color: '#FF3B30', icon: 'water'},
  ];

  const dietBadges = [
    recipe.vegetarian && {label: 'Vegetarian', color: '#34C759'},
    recipe.vegan && {label: 'Vegan', color: '#30D158'},
    recipe.gluten_free && {label: 'Gluten Free', color: '#FF9500'},
  ].filter(Boolean) as {label: string; color: string}[];

  return (
    <ScrollView style={styles.container}>
      {recipe.image ? (
        <Image source={{uri: recipe.image}} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Icon name="restaurant" size={48} color="#ccc" />
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{recipe.title}</Text>

        <View style={styles.metaRow}>
          {recipe.ready_in_minutes > 0 && (
            <View style={styles.metaItem}>
              <Icon name="time-outline" size={16} color="#888" />
              <Text style={styles.metaText}>{recipe.ready_in_minutes} min</Text>
            </View>
          )}
          {recipe.cuisine ? (
            <View style={styles.cuisineBadge}>
              <Icon name="earth-outline" size={14} color="#FF6B35" />
              <Text style={styles.cuisineText}>{recipe.cuisine}</Text>
            </View>
          ) : null}
          {dietBadges.map(b => (
            <View key={b.label} style={[styles.badge, {backgroundColor: b.color + '22', borderColor: b.color}]}>
              <Text style={[styles.badgeText, {color: b.color}]}>{b.label}</Text>
            </View>
          ))}
        </View>

        {/* Macros */}
        <View style={styles.macroGrid}>
          {macros.map(m => (
            <View key={m.label} style={styles.macroBox}>
              <Icon name={m.icon as any} size={20} color={m.color} />
              <Text style={[styles.macroValue, {color: m.color}]}>{m.value}</Text>
              <Text style={styles.macroUnit}>{m.unit}</Text>
              <Text style={styles.macroLabel}>{m.label}</Text>
            </View>
          ))}
        </View>

        {/* Ingredients */}
        {recipe.ingredients?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe.ingredients.map((ing: any, i: number) => {
              const name = typeof ing === 'string' ? ing : ing.name;
              const hasAmount = typeof ing === 'object' && ing.metric_value != null;
              const amount = hasAmount
                ? (Number(ing.metric_value) % 1 === 0
                    ? String(Number(ing.metric_value))
                    : parseFloat(Number(ing.metric_value).toFixed(1)).toString())
                : null;
              const unit = ing.metric_unit || '';

              return (
                <View key={i} style={styles.ingredientRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.ingredientText}>{name}</Text>
                  {hasAmount && (
                    <Text style={styles.ingredientAmount}>
                      {amount}{unit ? ` ${unit}` : ''}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Instructions */}
        {(() => {
          if (!recipe.instructions) return (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Instructions</Text>
              <Text style={styles.noInstructions}>No instructions available for this recipe.</Text>
            </View>
          );
          try {
            const steps: string[] = JSON.parse(recipe.instructions);
            if (!steps.length) return (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Instructions</Text>
                <Text style={styles.noInstructions}>No instructions available for this recipe.</Text>
              </View>
            );
            return (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Instructions</Text>
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

        {/* Tags */}
        {recipe.tags?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsRow}>
              {recipe.tags.map((t: string) => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>{t.replace(/_/g, ' ')}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={{height: 30}} />
    </ScrollView>
  );
}
