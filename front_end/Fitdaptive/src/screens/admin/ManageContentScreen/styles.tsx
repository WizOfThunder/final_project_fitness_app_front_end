import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F5F5F5'},

  // Tabs
  tabBar: {flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee'},
  tab: {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent'},
  tabActive: {borderBottomColor: '#FF6B35'},
  tabText: {fontSize: 14, fontWeight: '600', color: '#888'},
  tabTextActive: {color: '#FF6B35'},

  // Toolbar
  toolbar: {flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee'},
  searchBox: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8},
  searchInput: {flex: 1, fontSize: 14, color: '#333', padding: 0},
  syncBtn: {backgroundColor: '#FF6B35', width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center'},
  syncBtnFull: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, marginTop: 16},
  exerciseHeader: {backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee'},
  exerciseToolbar: {flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12},
  filterBtn: {width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF1EB', justifyContent: 'center', alignItems: 'center', position: 'relative'},
  filterCountBadge: {position: 'absolute', top: 4, right: 3, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: '#FF6B35', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4},
  filterCountText: {fontSize: 10, fontWeight: '700', color: '#fff'},
  activeFilterBar: {flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingBottom: 12},
  activeFilterScroll: {gap: 8, paddingRight: 8},
  activeFilterChip: {backgroundColor: '#FFF1EB', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6},
  activeFilterChipText: {fontSize: 12, fontWeight: '600', color: '#FF6B35'},
  clearFiltersText: {fontSize: 13, fontWeight: '700', color: '#FF6B35'},

  // List
  recipeList: {flex: 1},
  listContent: {padding: 12, gap: 10, flexGrow: 1},
  listContentEmpty: {justifyContent: 'center'},
  empty: {alignItems: 'center', gap: 10, paddingVertical: 40},
  emptyText: {fontSize: 15, color: '#ccc'},

  // Card
  card: {backgroundColor: '#fff', borderRadius: 12, padding: 14, elevation: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.06, shadowRadius: 3},
  cardHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8},
  cardTitle: {fontSize: 15, fontWeight: '700', color: '#1a1a1a', flex: 1, marginRight: 8},
  cardMeta: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10},
  cardFooter: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6},
  metaChip: {flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8},
  metaChipText: {fontSize: 12, color: '#666'},

  // Difficulty badge
  diffBadge: {paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8},
  diffText: {fontSize: 11, fontWeight: '700'},

  // YouTube
  ytBadge: {flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8},
  ytBadgeHas: {backgroundColor: '#FFF0F0'},
  ytBadgeNone: {backgroundColor: '#F5F5F5'},
  ytBadgeText: {fontSize: 12, fontWeight: '600'},
  ytBtn: {flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF3B30', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8},
  ytBtnText: {color: '#fff', fontSize: 12, fontWeight: '600'},
  ytLinkRow: {flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0F0', padding: 10, borderRadius: 8},
  ytLinkText: {flex: 1, fontSize: 13, color: '#FF3B30'},
  noVideoText: {fontSize: 13, color: '#aaa', fontStyle: 'italic'},
  ytSearchSubtitle: {fontSize: 13, color: '#666', marginBottom: 12},
  ytLoading: {alignItems: 'center', paddingVertical: 40, gap: 12},
  ytLoadingText: {fontSize: 14, color: '#666'},
  ytResultCard: {flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', borderRadius: 12, padding: 12, marginBottom: 10, gap: 12},
  ytResultLeft: {width: 48, alignItems: 'center', justifyContent: 'center', gap: 4},
  ytPreviewText: {fontSize: 10, color: '#FF3B30', fontWeight: '700'},
  ytResultInfo: {flex: 1},
  ytResultTitle: {fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 2},
  ytResultChannel: {fontSize: 12, color: '#888', marginBottom: 2},
  ytResultUrl: {fontSize: 11, color: '#FF3B30', marginBottom: 4},
  ytSelectHint: {flexDirection: 'row', alignItems: 'center'},
  ytSelectHintText: {fontSize: 11, color: '#34C759', fontWeight: '600'},

  // Nutrition
  nutritionRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8},
  nutritionChip: {flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8},
  nutritionChipText: {fontSize: 12, color: '#555'},
  nutritionGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16},
  nutritionCard: {flex: 1, minWidth: '47%', backgroundColor: '#F9F9F9', borderRadius: 12, padding: 12, alignItems: 'center', gap: 4},
  nutritionCardValue: {fontSize: 18, fontWeight: 'bold', color: '#333'},
  nutritionCardLabel: {fontSize: 12, color: '#888'},

  // Tags
  tagScroll: {backgroundColor: '#fff', height: 56, flexGrow: 0, flexShrink: 0, borderBottomWidth: 1, borderBottomColor: '#eee'},
  subFilterScroll: {backgroundColor: '#fff', height: 56, flexGrow: 0, flexShrink: 0, borderBottomWidth: 1, borderBottomColor: '#eee'},
  tagRow: {flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, paddingRight: 16, alignItems: 'center', gap: 8},
  tagChip: {minHeight: 36, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#E0E0E0', justifyContent: 'center', alignSelf: 'center'},
  tagChipActive: {backgroundColor: '#FF6B35', borderColor: '#FF6B35'},
  tagChipText: {fontSize: 13, lineHeight: 18, color: '#666', fontWeight: '500'},
  tagChipTextActive: {color: '#fff', fontWeight: '600'},
  recipeTag: {backgroundColor: '#FFF0EB', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8},
  recipeTagText: {fontSize: 11, color: '#FF6B35', fontWeight: '600'},
  recipeCardFooter: {gap: 8},
  recipeCardMetaRow: {flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6},
  recipeDetailMetaRow: {flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8},
  recipeTagRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 6},

  // Modal
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'},
  modalBox: {backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%'},
  modalHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16},
  modalTitle: {fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 12},
  filterModalContent: {paddingBottom: 12},
  exerciseFilterSection: {marginBottom: 18},
  exerciseFilterLabel: {fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 10},
  exerciseOptionRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  exerciseOptionChip: {paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: '#F3F4F6'},
  exerciseOptionChipActive: {backgroundColor: '#FF6B35'},
  exerciseOptionChipText: {fontSize: 13, fontWeight: '600', color: '#555'},
  exerciseOptionChipTextActive: {color: '#fff'},
  filterModalActions: {flexDirection: 'row', gap: 12, marginTop: 8},
  filterResetButton: {flex: 1, borderRadius: 12, borderWidth: 1, borderColor: '#D1D5DB', paddingVertical: 14, alignItems: 'center'},
  filterResetButtonText: {fontSize: 14, fontWeight: '700', color: '#555'},
  filterApplyButton: {flex: 1.2, borderRadius: 12, backgroundColor: '#FF6B35', paddingVertical: 14, alignItems: 'center'},
  filterApplyButtonText: {fontSize: 14, fontWeight: '700', color: '#fff'},

  // Detail
  detailGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16},
  detailChip: {flex: 1, minWidth: '47%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', borderRadius: 10, padding: 10},
  detailChipLabel: {fontSize: 11, color: '#888'},
  detailChipValue: {fontSize: 13, fontWeight: '600', color: '#333'},
  detailSection: {marginBottom: 16},
  detailSectionTitle: {fontSize: 13, fontWeight: '700', color: '#FF6B35', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8},
  detailSectionText: {fontSize: 14, color: '#555', lineHeight: 20},
  ingredientItem: {fontSize: 14, color: '#555', marginBottom: 4},
  stepRow: {flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'flex-start'},
  stepNumber: {fontSize: 14, fontWeight: '700', color: '#FF6B35', minWidth: 22},
  stepText: {flex: 1, fontSize: 14, color: '#555', lineHeight: 20},

  recipeDetailImage: {width: '100%', height: 180, borderRadius: 12, marginBottom: 16},
  recipeDetailImagePlaceholder: {width: '100%', height: 120, borderRadius: 12, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginBottom: 16},

  // Sync modal
  syncLabel: {fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 10},
  syncInput: {borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, fontSize: 14, color: '#333', backgroundColor: '#F9F9F9'},
  syncHint: {fontSize: 12, color: '#aaa', fontStyle: 'italic', marginTop: 8},
  dropdownField: {minHeight: 48, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#F9F9F9', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  dropdownFieldValue: {fontSize: 14, color: '#333', fontWeight: '500', flex: 1, marginRight: 10},
  dropdownFieldPlaceholder: {fontSize: 14, color: '#aaa', flex: 1, marginRight: 10},
  dropdownOptionsBox: {marginTop: 8, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, backgroundColor: '#fff', overflow: 'hidden'},
  dropdownOptionRow: {paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F1F1'},
  dropdownOptionRowActive: {backgroundColor: '#FFF3EC'},
  dropdownOptionRowText: {fontSize: 14, color: '#444'},
  dropdownOptionRowTextActive: {color: '#FF6B35', fontWeight: '700'},

  // Filter options (sync modal difficulty selector)
  filterOption: {flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F0F0F0', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0'},
  filterOptionActive: {backgroundColor: '#FF6B35', borderColor: '#FF6B35'},
  filterOptionText: {fontSize: 12, fontWeight: '600', color: '#666'},
  filterOptionTextActive: {color: '#fff'},

  // Form
  formLabel: {fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 10},
  formInput: {borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, fontSize: 14, color: '#333', backgroundColor: '#F9F9F9', marginBottom: 4},
  diffOption: {flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F0F0F0', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0'},
  diffOptionActive: {backgroundColor: '#FF6B35', borderColor: '#FF6B35'},
  diffOptionText: {fontSize: 13, fontWeight: '600', color: '#666'},
  diffOptionTextActive: {color: '#fff'},
  checkRow: {flexDirection: 'row', alignItems: 'center'},
  checkLabel: {fontSize: 13, color: '#555', fontWeight: '500'},
  saveBtn: {backgroundColor: '#34C759', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, marginTop: 20},
  saveBtnText: {color: '#fff', fontSize: 15, fontWeight: '700'},

  // Action buttons
  actionBtn: {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10},
  actionBtnText: {color: '#fff', fontSize: 14, fontWeight: '600'},
});
