import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  content: {padding: 16, paddingBottom: 40},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  errorText: {color: '#999', fontSize: 16},

  headerCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 14,
    elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.08, shadowRadius: 4,
  },
  headerTopRow: {flexDirection: 'row', gap: 8, marginBottom: 10},
  statusBadge: {alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10},
  activeBadge: {backgroundColor: '#E8F5E9'},
  endedBadge: {backgroundColor: '#F5F5F5'},
  statusText: {fontSize: 12, fontWeight: '700', color: '#555'},
  typeBadge: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10},
  autoBadge: {backgroundColor: '#E3F2FD'},
  manualBadge: {backgroundColor: '#EDE7F6'},
  typeText: {fontSize: 12, fontWeight: '600'},
  title: {fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 10},
  metaRow: {flexDirection: 'row', alignItems: 'center', marginTop: 4},
  metaText: {fontSize: 14, color: '#666'},

  section: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14,
    elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.08, shadowRadius: 4,
  },
  sectionTitle: {fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 10},
  description: {fontSize: 15, lineHeight: 22, color: '#444'},
  targetRow: {flexDirection: 'row', alignItems: 'center'},
  target: {fontSize: 18, fontWeight: '700', color: '#FF6B35'},
  autoNote: {fontSize: 12, color: '#888', marginTop: 8, fontStyle: 'italic'},

  progressBar: {height: 10, backgroundColor: '#E0E0E0', borderRadius: 5, overflow: 'hidden', marginBottom: 8},
  progressFill: {height: '100%', backgroundColor: '#FF9500', borderRadius: 5},
  progressFillComplete: {backgroundColor: '#34C759'},
  progressText: {fontSize: 13, color: '#666', marginBottom: 10},
  statusChip: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  activeChip: {backgroundColor: '#FFF3E0'},
  completedChip: {backgroundColor: '#E8F5E9'},
  readyChip: {backgroundColor: '#E3F2FD'},
  statusChipText: {fontSize: 13, fontWeight: '600'},
  syncReminder: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  syncReminderText: {flex: 1, fontSize: 12, color: '#1565C0', lineHeight: 18},
  joinButton: {
    backgroundColor: '#FF6B35', flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', padding: 16, borderRadius: 12, marginTop: 4,
  },
  claimButton: {
    backgroundColor: '#34C759', flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', padding: 16, borderRadius: 12, marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#007AFF', flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', padding: 16, borderRadius: 12, marginTop: 4,
  },
  joinButtonText: {color: '#fff', fontSize: 16, fontWeight: '700'},

  pendingBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF8E1', padding: 14, borderRadius: 12, marginTop: 4,
  },
  pendingText: {fontSize: 15, fontWeight: '600', color: '#FF9500'},

  joinedBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#E8F5E9', padding: 14, borderRadius: 12, marginTop: 4,
  },
  joinedBannerText: {fontSize: 15, fontWeight: '600', color: '#34C759'},

  // Submit modal
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'},
  modalBox: {backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 36},
  modalTitle: {fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 6},
  modalDesc: {fontSize: 13, color: '#888', marginBottom: 16, lineHeight: 18},
  modalLabel: {fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 10},
  modalInput: {borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, fontSize: 14, color: '#333', backgroundColor: '#F9F9F9'},
  modalImagePicker: {borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, overflow: 'hidden', marginBottom: 4},
  modalImagePreview: {width: '100%', height: 160},
  modalImagePlaceholder: {height: 120, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9F9F9'},
  modalButtons: {flexDirection: 'row', gap: 10, marginTop: 20},
  modalCancelBtn: {flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#F0F0F0'},
  modalConfirmBtn: {flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#007AFF'},
  modalCancelText: {color: '#666', fontSize: 15, fontWeight: '600'},
  modalConfirmText: {color: '#fff', fontSize: 15, fontWeight: '600'},
});
