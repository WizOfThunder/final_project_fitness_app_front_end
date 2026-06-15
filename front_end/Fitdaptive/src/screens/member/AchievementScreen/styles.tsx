import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F5F5F5'},

  // Summary banner
  summaryBanner: {flexDirection: 'row', backgroundColor: '#FF6B35', paddingVertical: 16, paddingHorizontal: 24, justifyContent: 'space-around', alignItems: 'center'},
  summaryLeft: {alignItems: 'center'},
  summaryCount: {fontSize: 26, fontWeight: 'bold', color: '#fff'},
  summaryLabel: {fontSize: 12, color: '#FFE5DC', marginTop: 2},
  summaryDivider: {width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.3)'},

  // Category filter
  categoryScroll: {backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', flexShrink: 0},
  categoryRow: {flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, gap: 8},
  categoryBtn: {flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#E0E0E0', flexShrink: 0},
  categoryBtnActive: {backgroundColor: '#FF6B35', borderColor: '#FF6B35'},
  categoryText: {fontSize: 13, color: '#888', fontWeight: '500'},
  categoryTextActive: {color: '#fff', fontWeight: '600'},

  // Grid
  grid: {padding: 12},
  item: {flex: 1, alignItems: 'center', margin: 6},
  box: {width: 84, height: 84, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 6, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3},
  medalOverlay: {position: 'absolute', bottom: 2, right: 4, fontSize: 14},
  earnedCheck: {position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: '#34C759', justifyContent: 'center', alignItems: 'center'},
  miniProgressBar: {width: 72, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, overflow: 'hidden', marginBottom: 4},
  miniProgressFill: {height: '100%', borderRadius: 2},
  badgeValue: {fontSize: 11, fontWeight: '600', color: '#888', marginBottom: 2},
  title: {fontSize: 11, textAlign: 'center', color: '#666', lineHeight: 15},

  // Empty
  empty: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10},
  emptyTitle: {fontSize: 18, fontWeight: '600', color: '#ccc'},

  // Modal
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'},
  modalContent: {backgroundColor: '#fff', padding: 28, borderRadius: 20, width: '82%', alignItems: 'center'},
  modalBox: {width: 100, height: 100, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12},
  modalMedal: {position: 'absolute', bottom: 2, right: 4, fontSize: 20},
  earnedBanner: {flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, marginBottom: 10},
  earnedBannerText: {fontSize: 14, fontWeight: '700', color: '#34C759'},
  modalTitle: {fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 6, textAlign: 'center'},
  modalDescription: {fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 10},
  modalProgress: {fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8},
  progressBar: {width: '100%', height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden', marginBottom: 8},
  progressFill: {height: '100%', borderRadius: 4},
  modalDate: {fontSize: 13, color: '#999', marginBottom: 16},
  closeButton: {backgroundColor: '#FF6B35', padding: 12, borderRadius: 10, width: '100%'},
  closeText: {color: '#fff', textAlign: 'center', fontSize: 15, fontWeight: '600'},
});
