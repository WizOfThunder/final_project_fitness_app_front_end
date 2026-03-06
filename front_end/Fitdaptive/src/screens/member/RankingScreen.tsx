import React, {useState} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native';

const RANKINGS = [
  {id: '1', rank: 1, name: 'John Doe', points: 1250, achievements: 8},
  {id: '2', rank: 2, name: 'Jane Smith', points: 1180, achievements: 8},
  {id: '3', rank: 3, name: 'Mike Johnson', points: 1050, achievements: 6},
  {id: '4', rank: 4, name: 'Sarah Williams', points: 980, achievements: 6},
  {id: '5', rank: 5, name: 'Tom Brown', points: 920, achievements: 5},
  {id: '6', rank: 6, name: 'Emily Davis', points: 850, achievements: 4},
  {id: '7', rank: 7, name: 'Chris Wilson', points: 780, achievements: 3},
];

const FILTERS = ['All', 'First Workout', '7 Day Streak', '100 Push-ups', '30 Day Challenge'];

export default function RankingScreen() {
  const [filter, setFilter] = useState('All');

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={item => item}
          showsHorizontalScrollIndicator={false}
          renderItem={({item}) => (
            <TouchableOpacity
              style={[styles.filterButton, filter === item && styles.filterButtonActive]}
              onPress={() => setFilter(item)}>
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={RANKINGS}
        keyExtractor={item => item.id}
        renderItem={({item, index}) => {
          const prevAchievements = index > 0 ? RANKINGS[index - 1].achievements : null;
          const showSeparator = prevAchievements !== null && prevAchievements !== item.achievements;

          return (
            <>
              {showSeparator && (
                <View style={styles.separator}>
                  <Text style={styles.separatorText}>{item.achievements} Achievements</Text>
                </View>
              )}
              {index === 0 && (
                <View style={styles.separator}>
                  <Text style={styles.separatorText}>{item.achievements} Achievements</Text>
                </View>
              )}
              <View style={[styles.item, item.rank <= 3 && styles.topThree]}>
                <Text style={styles.rank}>#{item.rank}</Text>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.achievements}>{item.achievements} achievements</Text>
                </View>
                <Text style={styles.points}>{item.points} pts</Text>
              </View>
            </>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  filterContainer: {padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee'},
  filterButton: {paddingHorizontal: 15, paddingVertical: 8, marginRight: 10, borderRadius: 20, borderWidth: 1, borderColor: '#ddd'},
  filterButtonActive: {backgroundColor: '#007AFF', borderColor: '#007AFF'},
  filterText: {fontSize: 14, color: '#666'},
  filterTextActive: {color: '#fff', fontWeight: '600'},
  separator: {backgroundColor: '#f5f5f5', padding: 10, borderBottomWidth: 1, borderBottomColor: '#ddd'},
  separatorText: {fontSize: 14, fontWeight: '600', color: '#333'},
  item: {flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center'},
  topThree: {backgroundColor: '#FFF9E6'},
  rank: {fontSize: 18, fontWeight: 'bold', width: 50, color: '#007AFF'},
  info: {flex: 1},
  name: {fontSize: 16, marginBottom: 2},
  achievements: {fontSize: 12, color: '#999'},
  points: {fontSize: 16, fontWeight: '600', color: '#666'},
});
