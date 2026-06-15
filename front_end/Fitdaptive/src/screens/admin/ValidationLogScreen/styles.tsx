import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  item: {padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee'},
  header: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5},
  user: {fontSize: 16, fontWeight: '600'},
  action: {fontSize: 14, fontWeight: '600'},
  approved: {color: '#34C759'},
  denied: {color: '#FF3B30'},
  type: {fontSize: 14, color: '#666', marginBottom: 4},
  date: {fontSize: 12, color: '#999'},
});
