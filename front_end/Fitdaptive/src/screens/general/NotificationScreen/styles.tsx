import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  loading: {flex: 1},
  emptyState: {flex: 1, alignItems: 'center', paddingTop: 80},
  emptyText: {color: '#999', marginTop: 12, fontSize: 15},
  item: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 1,
    alignItems: 'center',
  },
  unreadItem: {backgroundColor: '#FFF8F5'},
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  itemEnd: {
    minWidth: 18,
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
  },
  title: {fontSize: 16, fontWeight: '600', marginBottom: 4},
  message: {fontSize: 14, color: '#666', marginBottom: 4},
  time: {fontSize: 12, color: '#999'},
});
