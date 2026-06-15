import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F5F5F5'},
  loader: {flex: 1},

  // Tabs
  tabs: {flexDirection: 'row', backgroundColor: '#fff', padding: 12, gap: 10},
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  tabActive: {backgroundColor: '#FF6B35'},
  tabText: {fontSize: 14, fontWeight: '600', color: '#888'},
  tabTextActive: {color: '#fff'},

  // Period
  periodScroll: {backgroundColor: '#fff'},
  periodRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  periodBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F0F0F0',
    flexShrink: 0,
  },
  periodBtnActive: {backgroundColor: '#FF6B3522'},
  periodText: {fontSize: 13, color: '#888', fontWeight: '500'},
  periodTextActive: {color: '#FF6B35', fontWeight: '700'},

  // Podium
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingHorizontal: 12,
    paddingBottom: 0,
    marginBottom: 10,
    gap: 6,
  },
  podiumItem: {alignItems: 'center', flex: 1},
  podiumFirst: {},
  podiumSecond: {},
  podiumThird: {},
  podiumMedal: {fontSize: 16, marginBottom: 2},
  podiumName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
    marginBottom: 1,
    textAlign: 'center',
  },
  podiumScore: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 4,
  },
  podiumBar: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumRankText: {
    fontSize: 14,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },

  // Avatar
  avatar: {resizeMode: 'cover'},
  avatarPlaceholder: {
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {color: '#fff', fontWeight: '700'},

  // Rest list
  list: {paddingBottom: 20},
  restTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    paddingHorizontal: 16,
    paddingVertical: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  rowMe: {borderWidth: 2, borderColor: '#FF6B35'},
  rowRank: {fontSize: 15, fontWeight: '700', color: '#999', width: 32},
  rowInfo: {flex: 1},
  rowName: {fontSize: 15, fontWeight: '600', color: '#333'},
  rowScore: {fontSize: 12, color: '#888', marginTop: 2},

  // My rank banner
  myRankBanner: {
    margin: 12,
    backgroundColor: '#FFF0EB',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  myRankText: {fontSize: 14, fontWeight: '700', color: '#FF6B35', flex: 1},
  myRankSub: {fontSize: 12, color: '#FF9500'},

  // Empty
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 10,
  },
  emptyText: {fontSize: 18, fontWeight: '600', color: '#ccc'},
  emptySubText: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
