import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {styles} from '../screens/member/MemberDashboard/styles';

type Props = {navigation: any};

export default function BrowseSections({navigation}: Props) {
  return (
    <>
      {/* Browse Exercises */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Browse Exercises</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SearchWorkout')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.browseCard}
          onPress={() => navigation.navigate('SearchWorkout')}>
          <View style={styles.browseCardContent}>
            <Icon name="barbell" size={32} color="#FF6B35" />
            <View style={styles.browseCardText}>
              <Text style={styles.browseCardTitle}>Find Exercises</Text>
              <Text style={styles.browseCardSub}>Search by name, category or difficulty</Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
        <View style={styles.browseChips}>
          {['strength', 'cardio', 'stretching', 'plyometrics'].map(cat => (
            <TouchableOpacity
              key={cat}
              style={styles.browseChip}
              onPress={() => navigation.navigate('SearchWorkout', {initialCategory: cat})}>
              <Text style={styles.browseChipText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Browse Recipes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Browse Recipes</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SearchRecipe')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.browseCard}
          onPress={() => navigation.navigate('SearchRecipe')}>
          <View style={styles.browseCardContent}>
            <Icon name="restaurant" size={32} color="#34C759" />
            <View style={styles.browseCardText}>
              <Text style={styles.browseCardTitle}>Find Recipes</Text>
              <Text style={styles.browseCardSub}>Filter by nutrition goals and diet type</Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
        <View style={styles.browseChips}>
          {['high_protein', 'low_carb', 'weight_loss', 'quick_meal'].map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.browseChip, styles.browseChipGreen]}
              onPress={() => navigation.navigate('SearchRecipe', {initialTag: t})}>
              <Text style={styles.browseChipTextGreen}>{t.replace(/_/g, ' ')}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );
}
