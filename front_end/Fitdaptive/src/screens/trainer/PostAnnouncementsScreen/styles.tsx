import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9F9F9'},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  postHeader: {backgroundColor: '#fff', padding: 14, borderBottomWidth: 1, borderBottomColor: '#eee'},
  postTitle: {fontSize: 15, fontWeight: '700', color: '#1a1a1a'},
  postMeta: {fontSize: 12, color: '#888', marginTop: 2},
  list: {padding: 16, paddingBottom: 120},
  empty: {alignItems: 'center', paddingTop: 60},
  emptyText: {fontSize: 15, color: '#999', marginTop: 12},
  emptySubText: {fontSize: 13, color: '#bbb', marginTop: 6, textAlign: 'center', paddingHorizontal: 32},
  card: {backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.06, shadowRadius: 3},
  cardMessage: {fontSize: 15, color: '#1a1a1a', lineHeight: 22},
  cardTime: {fontSize: 11, color: '#aaa', marginTop: 6},
  inputBar: {position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#fff', padding: 12, borderTopWidth: 1, borderTopColor: '#eee', gap: 10},
  input: {flex: 1, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#333', backgroundColor: '#F9F9F9', maxHeight: 100},
  sendBtn: {width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF6B35', justifyContent: 'center', alignItems: 'center'},
  sendBtnDisabled: {backgroundColor: '#FFB399'},
});
