import React, {useState, useCallback, useEffect} from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  Alert, RefreshControl, TextInput, Modal, ScrollView, Image,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../../../services/api';
import {useAuth} from '../../../store/AuthContext';
import {styles} from './styles';

function toLocalDate(value: string | Date | null | undefined) {
  if (!value) return null;

  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const datePart = value.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function formatLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDateValue(value: Date | null) {
  if (!value) return 'Select';

  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function hasTimePassed(date: Date, timeStr: string | null | undefined) {
  if (!timeStr) return true;

  const [hours, minutes] = timeStr.split(':').map(Number);
  const target = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    0,
  );

  return new Date() >= target;
}

export default function ManageChallengeScreen({navigation, route}: any) {
  const {user} = useAuth();
  const isAdmin = user?.role === 'admin';

  const [tab, setTab] = useState<'challenges' | 'pending' | 'reviews'>('challenges');
  const [challenges, setChallenges] = useState<any[]>([]);
  const [pendingChallenges, setPendingChallenges] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);
  const [pickerDate, setPickerDate] = useState(new Date());

  // Completion request detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailRequest, setDetailRequest] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewChallengeFilter, setReviewChallengeFilter] = useState<number | 'all'>('all');
  const [bulkApproving, setBulkApproving] = useState(false);

  const openDetail = (item: any) => {
    setDetailRequest(item);
    setShowDetailModal(true);
  };
  const [reviewTarget, setReviewTarget] = useState<any>(null);
  const [reviewAction, setReviewAction] = useState<'active' | 'rejected'>('active');
  const [reviewNote, setReviewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [cRes, rRes] = await Promise.all([
        apiClient.get('/challenges/created'),
        apiClient.get('/challenges/requests/pending'),
      ]);
      const all = cRes.data as any[];
      setChallenges(all);
      setPendingChallenges(all.filter((c: any) => c.status === 'pending'));
      setRequests(rRes.data);
    } catch (e) {
      console.error('ManageChallenge fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    const initialTab = route?.params?.initialTab;
    if (
      initialTab === 'challenges'
      || (isAdmin && (initialTab === 'pending' || initialTab === 'reviews'))
    ) {
      setTab(initialTab);
    }
  }, [isAdmin, route?.params?.initialTab]);

  const openReviewModal = (challenge: any, action: 'active' | 'rejected') => {
    setReviewTarget(challenge);
    setReviewAction(action);
    setReviewNote('');
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (reviewAction === 'rejected' && !reviewNote.trim()) {
      Alert.alert('Required', 'Please provide a reason for rejection.');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.patch(`/challenges/${reviewTarget.id}/review`, {
        action: reviewAction,
        note: reviewNote.trim() || null,
      });
      setPendingChallenges(prev => prev.filter(c => c.id !== reviewTarget.id));
      setChallenges(prev => prev.map(c =>
        c.id === reviewTarget.id ? {...c, status: reviewAction, validation_note: reviewNote} : c
      ));
      setShowReviewModal(false);
      Alert.alert(
        reviewAction === 'active' ? '✅ Approved' : '❌ Rejected',
        reviewAction === 'active'
          ? 'Challenge is now live for members.'
          : 'Trainer has been notified with your feedback.',
      );
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (requestId: number, status: 'approved' | 'rejected') => {
    setReviewing(requestId);
    try {
      await apiClient.patch(`/challenges/requests/${requestId}/review`, {status});
      Alert.alert(
        status === 'approved' ? 'Approved ✅' : 'Rejected ❌',
        status === 'approved' ? 'The member has been awarded their reward.' : 'The request has been rejected.',
      );
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed to review request.');
    } finally {
      setReviewing(null);
    }
  };

  const confirmReview = (requestId: number, memberName: string, status: 'approved' | 'rejected') => {
    Alert.alert(
      status === 'approved' ? 'Approve Completion?' : 'Reject Completion?',
      `${status === 'approved' ? 'Award the reward to' : 'Reject the request from'} ${memberName}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: status === 'approved' ? 'Approve' : 'Reject', style: status === 'approved' ? 'default' : 'destructive', onPress: () => handleReview(requestId, status)},
      ],
    );
  };

  const handleBulkApprove = (challengeId: number, challengeTitle: string, count: number) => {
    Alert.alert(
      'Bulk Approve',
      `Approve all ${count} pending submission${count !== 1 ? 's' : ''} for "${challengeTitle}"?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Approve All', onPress: async () => {
          setBulkApproving(true);
          try {
            const res = await apiClient.post('/challenges/requests/bulk-approve', {challenge_id: challengeId});
            Alert.alert('Done', res.data.message);
            load();
          } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.error || 'Bulk approve failed.');
          } finally {
            setBulkApproving(false);
          }
        }},
      ],
    );
  };

  const getProofImageUrl = (proofUrl: string | null) => {
    if (!proofUrl) return null;
    if (proofUrl.startsWith('http')) return proofUrl;
    const base = apiClient.defaults.baseURL?.replace('/api/v1', '') || '';
    return `${base}${proofUrl}`;
  };

  const statusColor = (s: string) =>
    s === 'active'
      ? '#34C759'
      : s === 'pending'
        ? '#FF9500'
        : s === 'ended'
          ? '#8E8E93'
          : '#FF3B30';

  const today = toLocalDate(new Date());

  const getChallengeStatus = (challenge: any) => {
    const endDate = toLocalDate(challenge.end_date);
    if (today && endDate && endDate < today) return 'ended';
    if (
      today &&
      endDate &&
      today.getTime() === endDate.getTime() &&
      challenge.challenge_type !== 'auto' &&
      challenge.event_end_time &&
      hasTimePassed(endDate, challenge.event_end_time)
    ) {
      return 'ended';
    }

    return challenge.status;
  };

  const typeSet = new Set(
    challenges.flatMap(c => [c.type, c.challenge_type]).filter(Boolean)
  );
  const preferredTypeOrder = ['auto', 'manual', 'steps', 'calories', 'distance'];
  const challengeTypes = [
    'all',
    ...preferredTypeOrder.filter(type => typeSet.has(type)),
    ...Array.from(typeSet).filter(type => !preferredTypeOrder.includes(type)),
  ];
  const statusSet = new Set(challenges.map(c => getChallengeStatus(c)).filter(Boolean));
  const preferredStatusOrder = ['active', 'rejected', 'ended'];
  const challengeStatuses = [
    'all',
    ...preferredStatusOrder,
    ...Array.from(statusSet).filter(status => status !== 'pending' && !preferredStatusOrder.includes(status)),
  ];

  const rawStartDate = toLocalDate(selectedStartDate);
  const rawEndDate = toLocalDate(selectedEndDate);
  const rangeStartDate = rawStartDate && rawEndDate && rawStartDate > rawEndDate ? rawEndDate : rawStartDate;
  const rangeEndDate = rawStartDate && rawEndDate && rawStartDate > rawEndDate ? rawStartDate : rawEndDate;
  const usesStatusFilter = tab === 'challenges';
  const hasActiveFilters = !!selectedStartDate || !!selectedEndDate || selectedType !== 'all' || (usesStatusFilter && selectedStatus !== 'all');

  const matchesChallengeFilters = (challenge: any, includeStatus = true) => {
    const typeMatches = selectedType === 'all'
      || challenge.type === selectedType
      || challenge.challenge_type === selectedType;
    if (!typeMatches) return false;

    if (includeStatus) {
      const statusMatches = selectedStatus === 'all' || getChallengeStatus(challenge) === selectedStatus;
      if (!statusMatches) return false;
    }

    if (!rangeStartDate && !rangeEndDate) return true;

    const challengeStartDate = toLocalDate(challenge.start_date);
    const challengeEndDate = toLocalDate(challenge.end_date);
    if (!challengeStartDate || !challengeEndDate) return false;

    if (rangeStartDate && challengeEndDate < rangeStartDate) return false;
    if (rangeEndDate && challengeStartDate > rangeEndDate) return false;

    return true;
  };

  const filteredChallenges = challenges.filter(challenge => matchesChallengeFilters(challenge, true));
  const filteredPendingChallenges = pendingChallenges.filter(challenge => matchesChallengeFilters(challenge, false));

  const resetFilters = () => {
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setSelectedType('all');
    setSelectedStatus('all');
  };

  const openDatePicker = (target: 'start' | 'end') => {
    setPickerTarget(target);
    setPickerDate(
      target === 'start'
        ? selectedStartDate || selectedEndDate || new Date()
        : selectedEndDate || selectedStartDate || new Date()
    );
  };

  const changePickerDatePart = (part: 'day' | 'month' | 'year', value: number) => {
    setPickerDate(prev => {
      const next = new Date(prev);
      if (part === 'day') next.setDate(value);
      if (part === 'month') next.setMonth(value);
      if (part === 'year') next.setFullYear(value);
      return next;
    });
  };

  const confirmDatePicker = () => {
    const nextDate = new Date(pickerDate.getFullYear(), pickerDate.getMonth(), pickerDate.getDate());
    if (pickerTarget === 'start') setSelectedStartDate(nextDate);
    if (pickerTarget === 'end') setSelectedEndDate(nextDate);
    setPickerTarget(null);
  };

  const currentYear = new Date().getFullYear();
  const pickerYears = Array.from({length: 15}, (_, index) => currentYear - 5 + index);
  const pickerMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#FF6B35" /></View>;
  }

  const tabs = isAdmin
    ? [
        {key: 'challenges', label: 'All Challenges'},
        {key: 'pending', label: `Pending${pendingChallenges.length > 0 ? ` (${pendingChallenges.length})` : ''}`},
        {key: 'reviews', label: `Reviews${requests.length > 0 ? ` (${requests.length})` : ''}`},
      ]
    : [
        {key: 'challenges', label: 'My Challenges'},
        {key: 'reviews', label: `Reviews${requests.length > 0 ? ` (${requests.length})` : ''}`},
      ];

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key as any)}>
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateChallenge')}>
          <Icon name="add-circle-outline" size={18} color="#fff" />
          <Text style={styles.createButtonText}>Add Challenge</Text>
        </TouchableOpacity>
      </View>

      {tab !== 'reviews' && (
        <View style={styles.filterSection}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filters</Text>
            {hasActiveFilters && (
              <TouchableOpacity style={styles.clearFilterButton} onPress={resetFilters}>
                <Icon name="refresh-outline" size={14} color="#FF6B35" />
                <Text style={styles.clearFilterText}> Reset</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.dateRangeRow}>
            <TouchableOpacity style={styles.dateRangeField} onPress={() => openDatePicker('start')}>
              <Text style={selectedStartDate ? styles.dateRangeFieldValue : styles.dateRangeFieldPlaceholder}>
                {selectedStartDate ? formatDateValue(selectedStartDate) : 'Start date'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.dateRangeSeparator}>to</Text>

            <TouchableOpacity style={styles.dateRangeField} onPress={() => openDatePicker('end')}>
              <Text style={selectedEndDate ? styles.dateRangeFieldValue : styles.dateRangeFieldPlaceholder}>
                {selectedEndDate ? formatDateValue(selectedEndDate) : 'End date'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.filterLabel}>Type / Mode</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterRow}
            contentContainerStyle={styles.filterContent}>
            {challengeTypes.map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.filterChip, selectedType === type && styles.filterChipActive]}
                onPress={() => setSelectedType(type)}>
                <Text style={[styles.filterChipText, selectedType === type && styles.filterChipTextActive]}>
                  {type === 'all' ? 'All' : formatLabel(type)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {usesStatusFilter && (
            <>
              <Text style={styles.filterLabel}>Status</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterRow}
                contentContainerStyle={styles.filterContent}>
                {challengeStatuses.map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[styles.filterChip, selectedStatus === status && styles.filterChipActive]}
                    onPress={() => setSelectedStatus(status)}>
                    <Text style={[styles.filterChipText, selectedStatus === status && styles.filterChipTextActive]}>
                      {status === 'all' ? 'All' : formatLabel(status)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      )}

      {tab === 'challenges' && (
        <FlatList
          data={filteredChallenges}
          keyExtractor={item => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#FF6B35']} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="trophy-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>{hasActiveFilters ? 'No challenges match the selected filters' : 'No challenges yet'}</Text>
            </View>
          }
          renderItem={({item}) => {
            const displayStatus = getChallengeStatus(item);

            return (
              <TouchableOpacity
                style={styles.item}
                onPress={() => navigation.navigate('ChallengeDetail', {challengeId: item.id, viewOnly: true})}>
                <View style={styles.info}>
                  <View style={styles.titleRow}>
                    <Text style={styles.challengeTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={[styles.dateBadge, {backgroundColor: statusColor(displayStatus) + '22'}]}>
                      <Text style={[styles.dateBadgeText, {color: statusColor(displayStatus)}]}>
                        {formatLabel(displayStatus)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.metaRow}>
                    <Icon name="calendar-outline" size={13} color="#888" />
                    <Text style={styles.metaText}> {item.start_date?.split('T')[0]} – {item.end_date?.split('T')[0]}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Icon name="trophy-outline" size={13} color="#FF9500" />
                    <Text style={styles.metaText}> {item.points} pts • {item.type} • {item.challenge_type}</Text>
                  </View>
                  {item.creator_name && (
                    <View style={styles.metaRow}>
                      <Icon name="person-outline" size={13} color="#888" />
                      <Text style={styles.metaText}> {item.creator_role === 'admin' ? 'Administrator' : item.creator_name}</Text>
                    </View>
                  )}
                  {item.validation_note && item.status === 'rejected' && (
                    <View style={styles.noteBox}>
                      <Icon name="chatbox-outline" size={13} color="#FF3B30" />
                      <Text style={styles.noteText}> {item.validation_note}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {tab === 'pending' && isAdmin && (
        <FlatList
          data={filteredPendingChallenges}
          keyExtractor={item => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#FF6B35']} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="checkmark-circle-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>{hasActiveFilters ? 'No pending challenges match the selected filters' : 'No pending challenges'}</Text>
            </View>
          }
          renderItem={({item}) => (
            <View style={styles.item}>
              <View style={styles.info}>
                <Text style={styles.challengeTitle}>{item.title}</Text>
                <View style={styles.metaRow}>
                  <Icon name="person-outline" size={13} color="#888" />
                  <Text style={styles.metaText}> By {item.creator_name}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Icon name="calendar-outline" size={13} color="#888" />
                  <Text style={styles.metaText}> {item.start_date?.split('T')[0]} – {item.end_date?.split('T')[0]}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Icon name="trophy-outline" size={13} color="#FF9500" />
                  <Text style={styles.metaText}> {item.points} pts • {item.type} • {item.challenge_type}</Text>
                </View>
                {item.description ? (
                  <Text style={styles.descText} numberOfLines={2}>{item.description}</Text>
                ) : null}
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.approveButton} onPress={() => openReviewModal(item, 'active')}>
                  <Icon name="checkmark" size={16} color="#fff" />
                  <Text style={styles.buttonText}> Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectButton} onPress={() => openReviewModal(item, 'rejected')}>
                  <Icon name="close" size={16} color="#fff" />
                  <Text style={styles.buttonText}> Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {tab === 'reviews' && (
        <View style={{flex: 1}}>
          {/* Challenge filter + bulk approve */}
          {requests.length > 0 && (() => {
            const challengeGroups = requests.reduce((acc: any, r: any) => {
              if (!acc[r.challenge_id]) acc[r.challenge_id] = {id: r.challenge_id, title: r.challenge_title, count: 0};
              acc[r.challenge_id].count++;
              return acc;
            }, {});
            const groups = Object.values(challengeGroups) as any[];
            return (
              <View style={{backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee'}}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{padding: 10, gap: 8, flexDirection: 'row'}}>
                  <TouchableOpacity
                    style={[styles.filterChip, reviewChallengeFilter === 'all' && styles.filterChipActive]}
                    onPress={() => setReviewChallengeFilter('all')}>
                    <Text style={[styles.filterChipText, reviewChallengeFilter === 'all' && styles.filterChipTextActive]}>All ({requests.length})</Text>
                  </TouchableOpacity>
                  {groups.map((g: any) => (
                    <TouchableOpacity
                      key={g.id}
                      style={[styles.filterChip, reviewChallengeFilter === g.id && styles.filterChipActive]}
                      onPress={() => setReviewChallengeFilter(g.id)}>
                      <Text style={[styles.filterChipText, reviewChallengeFilter === g.id && styles.filterChipTextActive]} numberOfLines={1}>{g.title} ({g.count})</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {reviewChallengeFilter !== 'all' && (
                  <TouchableOpacity
                    style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, margin: 8, marginTop: 0, padding: 10, backgroundColor: '#34C759', borderRadius: 10}}
                    onPress={() => {
                      const g = (Object.values(requests.reduce((acc: any, r: any) => { if (!acc[r.challenge_id]) acc[r.challenge_id] = {id: r.challenge_id, title: r.challenge_title, count: 0}; acc[r.challenge_id].count++; return acc; }, {})) as any[]).find((x: any) => x.id === reviewChallengeFilter);
                      if (g) handleBulkApprove(g.id, g.title, g.count);
                    }}
                    disabled={bulkApproving}>
                    {bulkApproving ? <ActivityIndicator color="#fff" size="small" /> : <><Icon name="checkmark-done" size={16} color="#fff" /><Text style={{color: '#fff', fontWeight: '700', fontSize: 14}}>Bulk Approve All</Text></>}
                  </TouchableOpacity>
                )}
              </View>
            );
          })()}
          <FlatList
            data={reviewChallengeFilter === 'all' ? requests : requests.filter((r: any) => r.challenge_id === reviewChallengeFilter)}
            keyExtractor={item => String(item.id)}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#FF6B35']} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="checkmark-circle-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No pending completion requests</Text>
              </View>
            }
            renderItem={({item}) => (
              <TouchableOpacity style={styles.item} onPress={() => openDetail(item)}>
                <View style={styles.info}>
                  <Text style={styles.challengeTitle}>{item.challenge_title}</Text>
                  <View style={styles.metaRow}>
                    <Icon name="person-outline" size={13} color="#888" />
                    <Text style={styles.metaText}> {item.member_name}</Text>
                  </View>
                  <Text style={styles.dateText}>Submitted: {new Date(item.created_at).toLocaleDateString()}</Text>
                  {!!item.note && <Text style={styles.descText} numberOfLines={1}>{item.note}</Text>}
                </View>
                <View style={styles.actions} onStartShouldSetResponder={() => true}>
                  <TouchableOpacity
                    style={[styles.approveButton, {paddingHorizontal: 10, paddingVertical: 6}]}
                    onPress={() => confirmReview(item.id, item.member_name, 'approved')}
                    disabled={reviewing === item.id}>
                    {reviewing === item.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Icon name="checkmark" size={16} color="#fff" />
                        <Text style={styles.buttonText}> Approve</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rejectButton, {paddingHorizontal: 10, paddingVertical: 6}]}
                    onPress={() => confirmReview(item.id, item.member_name, 'rejected')}
                    disabled={reviewing === item.id}>
                    <Icon name="close" size={16} color="#fff" />
                    <Text style={styles.buttonText}> Reject</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Completion Request Detail Modal */}
      <Modal visible={showDetailModal} transparent animationType="slide" onRequestClose={() => setShowDetailModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {maxHeight: '85%'}]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review Completion</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            {detailRequest && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Challenge info */}
                <Text style={styles.detailSection}>Challenge</Text>
                <Text style={styles.detailTitle}>{detailRequest.challenge_title}</Text>
                <View style={styles.metaRow}>
                  <Icon name={detailRequest.challenge_type === 'online' ? 'globe-outline' : 'location-outline'} size={14} color="#888" />
                  <Text style={styles.metaText}> {detailRequest.challenge_type === 'online' ? 'Online event' : 'Offline event'}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Icon name="calendar-outline" size={14} color="#888" />
                  <Text style={styles.metaText}> {detailRequest.start_date?.split('T')[0]} – {detailRequest.end_date?.split('T')[0]}</Text>
                </View>
                {(detailRequest.event_start_time || detailRequest.event_end_time) && (
                  <View style={styles.metaRow}>
                    <Icon name="time-outline" size={14} color="#888" />
                    <Text style={styles.metaText}> {detailRequest.event_start_time} – {detailRequest.event_end_time}</Text>
                  </View>
                )}
                {!!detailRequest.challenge_url && (
                  <View style={styles.metaRow}>
                    <Icon name="link-outline" size={14} color="#007AFF" />
                    <Text style={[styles.metaText, {color: '#007AFF'}]} numberOfLines={1}> {detailRequest.challenge_url}</Text>
                  </View>
                )}

                {/* Member info */}
                <Text style={[styles.detailSection, {marginTop: 16}]}>Member</Text>
                <View style={styles.metaRow}>
                  <Icon name="person-outline" size={14} color="#888" />
                  <Text style={styles.metaText}> {detailRequest.member_name}</Text>
                </View>
                <Text style={styles.dateText}>Submitted: {new Date(detailRequest.created_at).toLocaleString()}</Text>

                {/* Member's note */}
                {!!detailRequest.note && (
                  <>
                    <Text style={[styles.detailSection, {marginTop: 16}]}>Member's Note</Text>
                    <View style={styles.noteBox}>
                      <Text style={styles.noteText}>{detailRequest.note}</Text>
                    </View>
                  </>
                )}

                {/* Proof */}
                <Text style={[styles.detailSection, {marginTop: 16}]}>Proof</Text>
                {detailRequest.proof_url ? (() => {
                  const imgUrl = getProofImageUrl(detailRequest.proof_url);
                  return imgUrl ? (
                    <Image
                      source={{uri: imgUrl}}
                      style={{width: '100%', height: 200, borderRadius: 10, marginTop: 6}}
                      resizeMode="contain"
                    />
                  ) : <Text style={styles.metaText}>No proof submitted</Text>;
                })() : (
                  <Text style={styles.metaText}>No proof submitted</Text>
                )}

                {/* Actions */}
                <View style={[styles.actions, {marginTop: 20}]}>
                  {reviewing === detailRequest.id ? (
                    <ActivityIndicator color="#FF6B35" />
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.approveButton}
                        onPress={() => { setShowDetailModal(false); confirmReview(detailRequest.id, detailRequest.member_name, 'approved'); }}>
                        <Icon name="checkmark" size={16} color="#fff" />
                        <Text style={styles.buttonText}> Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => { setShowDetailModal(false); confirmReview(detailRequest.id, detailRequest.member_name, 'rejected'); }}>
                        <Icon name="close" size={16} color="#fff" />
                        <Text style={styles.buttonText}> Reject</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Review Modal */}
      <Modal visible={showReviewModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {reviewAction === 'active' ? 'Approve Challenge' : 'Reject Challenge'}
              </Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>
              {reviewAction === 'rejected' ? 'Reason for rejection (required):' : 'Optional note for trainer:'}
            </Text>
            <TextInput
              style={styles.textArea}
              placeholder={reviewAction === 'rejected' ? 'Explain why this challenge was rejected...' : 'Add a note (optional)...'}
              placeholderTextColor="#999"
              value={reviewNote}
              onChangeText={setReviewNote}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowReviewModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[reviewAction === 'active' ? styles.approveButton : styles.rejectButton, submitting && {opacity: 0.6}]}
                onPress={submitReview}
                disabled={submitting}>
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.buttonText}>{reviewAction === 'active' ? 'Approve' : 'Reject'}</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!pickerTarget} transparent animationType="fade" onRequestClose={() => setPickerTarget(null)}>
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerModal}>
            <Text style={styles.datePickerTitle}>
              {pickerTarget === 'start' ? 'Select start date' : 'Select end date'}
            </Text>

            <View style={styles.datePickerColumns}>
              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerColumnLabel}>Day</Text>
                <ScrollView style={styles.datePickerList} showsVerticalScrollIndicator={false}>
                  {Array.from({length: 31}, (_, index) => index + 1).map(day => (
                    <TouchableOpacity
                      key={day}
                      style={[styles.datePickerItem, pickerDate.getDate() === day && styles.datePickerItemActive]}
                      onPress={() => changePickerDatePart('day', day)}>
                      <Text style={[styles.datePickerItemText, pickerDate.getDate() === day && styles.datePickerItemTextActive]}>{day}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerColumnLabel}>Month</Text>
                <ScrollView style={styles.datePickerList} showsVerticalScrollIndicator={false}>
                  {pickerMonths.map((month, index) => (
                    <TouchableOpacity
                      key={month}
                      style={[styles.datePickerItem, pickerDate.getMonth() === index && styles.datePickerItemActive]}
                      onPress={() => changePickerDatePart('month', index)}>
                      <Text style={[styles.datePickerItemText, pickerDate.getMonth() === index && styles.datePickerItemTextActive]}>{month}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerColumnLabel}>Year</Text>
                <ScrollView style={styles.datePickerList} showsVerticalScrollIndicator={false}>
                  {pickerYears.map(year => (
                    <TouchableOpacity
                      key={year}
                      style={[styles.datePickerItem, pickerDate.getFullYear() === year && styles.datePickerItemActive]}
                      onPress={() => changePickerDatePart('year', year)}>
                      <Text style={[styles.datePickerItemText, pickerDate.getFullYear() === year && styles.datePickerItemTextActive]}>{year}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.datePickerActions}>
              <TouchableOpacity style={styles.datePickerCancelButton} onPress={() => setPickerTarget(null)}>
                <Text style={styles.datePickerCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.datePickerConfirmButton} onPress={confirmDatePicker}>
                <Text style={styles.datePickerConfirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
