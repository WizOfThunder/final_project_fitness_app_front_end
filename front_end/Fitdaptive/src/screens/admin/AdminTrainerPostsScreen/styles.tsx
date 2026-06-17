import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9F9F9'},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  empty: {textAlign: 'center', color: '#999', marginTop: 40},

  // Summary bar
  summary: {flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee'},
  summaryItem: {flex: 1, alignItems: 'center', paddingVertical: 4, position: 'relative'},
  summaryItemActive: {opacity: 1},
  summaryUnderline: {position: 'absolute', bottom: -12, left: '20%', right: '20%', height: 3, borderRadius: 2, backgroundColor: '#FF6B35'},
  summaryValue: {fontSize: 22, fontWeight: '700', color: '#FF6B35'},
  summaryValueGreen: {fontSize: 22, fontWeight: '700', color: '#34C759'},
  summaryValueGrey: {fontSize: 22, fontWeight: '700', color: '#999'},
  summaryLabel: {fontSize: 12, color: '#888', marginTop: 2},

  // Search
  searchRow: {flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#eee', gap: 8},
  searchInput: {flex: 1, fontSize: 14, color: '#333', padding: 0},

  // List
  listContent: {padding: 16, paddingBottom: 40},
  card: {backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.07, shadowRadius: 4},
  cardInactive: {opacity: 0.55},
  trainerRow: {flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8},
  trainerInfo: {flex: 1},
  avatar: {width: 38, height: 38, borderRadius: 19},
  avatarPlaceholder: {width: 38, height: 38, borderRadius: 19, backgroundColor: '#FF6B35', justifyContent: 'center', alignItems: 'center'},
  avatarInitial: {color: '#fff', fontWeight: '700', fontSize: 16},
  trainerName: {fontSize: 12, color: '#888'},
  postTitle: {fontSize: 15, fontWeight: '700', color: '#1a1a1a'},
  statusBadgeActive: {paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: '#E8F5E9'},
  statusBadgeInactive: {paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: '#F5F5F5'},
  statusTextActive: {fontSize: 11, fontWeight: '700', color: '#34C759'},
  statusTextInactive: {fontSize: 11, fontWeight: '700', color: '#999'},
  metaRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 4},
  metaText: {fontSize: 12, color: '#666'},
  metaSep: {fontSize: 12, color: '#ccc', marginHorizontal: 6},
  footer: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0'},
  price: {fontSize: 14, fontWeight: '700', color: '#FF6B35'},
  ratingRow: {flexDirection: 'row', alignItems: 'center'},
  ratingText: {fontSize: 12, color: '#666'},

  // Detail modal
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'},
  detailBox: {backgroundColor: '#F2F2F7', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, paddingBottom: 36, maxHeight: '92%'},
  modalBox: {backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40, maxHeight: '80%'},
  modalHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12},
  modalTitle: {fontSize: 16, fontWeight: '700', color: '#1a1a1a', flex: 1, marginRight: 8},
  modalSub: {fontSize: 12, color: '#888', marginBottom: 14},
  modalEmpty: {textAlign: 'center', color: '#ccc', marginTop: 12, fontSize: 14},

  detailTrainerRow: {flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, padding: 14, backgroundColor: '#fff', borderRadius: 14},
  detailAvatar: {width: 48, height: 48, borderRadius: 24},
  detailAvatarPlaceholder: {width: 48, height: 48, borderRadius: 24, backgroundColor: '#FF6B35', justifyContent: 'center', alignItems: 'center'},
  detailTrainerName: {fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 2},

  detailCard: {backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10},
  detailCardTitle: {fontSize: 14, fontWeight: '700', color: '#1a1a1a', marginBottom: 10},
  detailCardHeader: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10},

  detailInfoGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  detailInfoItem: {width: '47%', alignItems: 'center', paddingVertical: 10, backgroundColor: '#F9F9F9', borderRadius: 12},
  detailInfoIcon: {width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 6},
  detailInfoLabel: {fontSize: 11, color: '#888', marginBottom: 2},
  detailInfoValue: {fontSize: 13, fontWeight: '700', color: '#1a1a1a'},

  detailTimelineRow: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, marginBottom: 6},
  detailTimelineDot: {width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF6B35'},
  detailTimelineLine: {flex: 1, height: 2, backgroundColor: '#FFD5C2', marginHorizontal: 4},
  detailTimelineLabels: {flexDirection: 'row', justifyContent: 'space-between'},
  detailTimelineDate: {fontSize: 13, fontWeight: '700', color: '#1a1a1a'},
  detailTimelineDesc: {fontSize: 11, color: '#888', marginTop: 2},

  detailBody: {fontSize: 14, color: '#555', lineHeight: 20},

  detailTagsWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 6},
  detailTag: {paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: '#FFF3EE', borderWidth: 1, borderColor: '#FFD5C2'},
  detailTagText: {fontSize: 12, color: '#FF6B35', fontWeight: '600'},

  detailScheduleRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8},
  detailScheduleRowAlt: {backgroundColor: '#F9F9F9'},
  detailScheduleDay: {fontSize: 13, fontWeight: '600', color: '#333'},
  detailScheduleTime: {flexDirection: 'row', alignItems: 'center', gap: 4},
  detailScheduleTimeText: {fontSize: 13, color: '#555'},

  toggleBtn: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, marginTop: 10},
  toggleBtnText: {fontSize: 15, fontWeight: '700'},

  // Reviews
  reviewItem: {paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0'},
  reviewHeader: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4},
  reviewAvatarPlaceholder: {width: 28, height: 28, borderRadius: 14, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center'},
  reviewAvatarInitial: {fontSize: 12, fontWeight: '700', color: '#666'},
  reviewMember: {fontWeight: '600', color: '#333', fontSize: 13},
  reviewDate: {fontSize: 11, color: '#bbb'},
  reviewText: {fontSize: 13, color: '#555', marginBottom: 4},
  reviewSessionsBadge: {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2},
  reviewSessions: {fontSize: 11, color: '#888'},

  // Toggle confirm modal
  noteInput: {borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, fontSize: 14, color: '#333', marginTop: 8, marginBottom: 14, minHeight: 80},
  modalBtns: {flexDirection: 'row', gap: 8},
  modalCancelBtn: {flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#F0F0F0'},
  modalCancelText: {color: '#666', fontWeight: '600'},
  modalConfirmBtn: {flex: 1, padding: 14, borderRadius: 12, alignItems: 'center'},
  modalConfirmText: {color: '#fff', fontWeight: '700'},
});
