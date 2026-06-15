import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  
  // Week Navigation
  weekHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee'},
  navButton: {padding: 8},
  weekInfo: {flex: 1, alignItems: 'center'},
  weekRange: {fontSize: 16, fontWeight: '600', color: '#111', marginBottom: 4},
  todayButton: {paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#007AFF', borderRadius: 12},
  todayButtonText: {fontSize: 12, fontWeight: '600', color: '#fff'},
  syncIconBtn: {flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: '#007AFF', borderRadius: 12},
  syncBtnText: {fontSize: 12, fontWeight: '600', color: '#fff', lineHeight: 16},
  
  // Days Strip
  daysStrip: {backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', maxHeight: 80},
  dayCard: {alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, minWidth: 52, borderBottomWidth: 2, borderBottomColor: 'transparent'},
  dayCardSelected: {borderBottomColor: '#007AFF', backgroundColor: '#F0F8FF'},
  dayCardToday: {backgroundColor: '#FFF9E6'},
  dayName: {fontSize: 12, color: '#666', marginBottom: 4, fontWeight: '500'},
  dayNameSelected: {color: '#007AFF', fontWeight: '700'},
  dayNumber: {fontSize: 20, fontWeight: '600', color: '#111', marginBottom: 4},
  dayNumberSelected: {color: '#007AFF'},
  eventDots: {flexDirection: 'row', gap: 3},
  eventDot: {width: 5, height: 5, borderRadius: 2.5},
  
  // Events List
  eventsContainer: {flex: 1, padding: 16},
  eventsHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16},
  eventsTitle: {fontSize: 18, fontWeight: '700', color: '#111'},
  eventsCount: {fontSize: 14, color: '#666'},
  
  emptyState: {alignItems: 'center', justifyContent: 'center', paddingVertical: 60},
  emptyText: {fontSize: 16, color: '#999', marginTop: 12},
  
  // Event Card
  eventCard: {backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, elevation: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 2},
  eventLeft: {flexDirection: 'row', alignItems: 'center', gap: 10},
  checkbox: {width: 24, height: 24, justifyContent: 'center', alignItems: 'center'},
  checkboxInner: {width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center'},
  checkboxChecked: {backgroundColor: '#FF6B35', borderColor: '#FF6B35'},
  eventIcon: {width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center'},
  eventContent: {flex: 1, marginLeft: 10},
  eventTitle: {fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 2},
  eventTitleCompleted: {textDecorationLine: 'line-through', color: '#999'},
  eventDetails: {fontSize: 13, color: '#666', marginBottom: 4},
  eventTime: {flexDirection: 'row', alignItems: 'center', gap: 4},
  eventTimeText: {fontSize: 12, color: '#999'},
  eventTypeBadge: {width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 8},
  eventTypeText: {fontSize: 11, fontWeight: '700', color: '#fff'},
  
  // Legend
  legend: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#eee', gap: 20},
  legendItem: {flexDirection: 'row', alignItems: 'center', gap: 6},
  legendDot: {width: 12, height: 12, borderRadius: 6},
  legendText: {fontSize: 13, color: '#666'},
  // Sync modal
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'},
  modalBox: {backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '82%', alignItems: 'center'},
  modalTitle: {fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8},
  modalDesc: {fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 20},
  modalButtons: {flexDirection: 'row', gap: 10, width: '100%'},
  modalCancelBtn: {flex: 1, padding: 13, borderRadius: 12, alignItems: 'center', backgroundColor: '#F0F0F0'},
  modalConfirmBtn: {flex: 1, padding: 13, borderRadius: 12, alignItems: 'center', backgroundColor: '#007AFF'},
  modalCancelText: {color: '#666', fontSize: 15, fontWeight: '600'},
  modalConfirmText: {color: '#fff', fontSize: 15, fontWeight: '600'},
});
