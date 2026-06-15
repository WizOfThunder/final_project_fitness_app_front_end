import React, {useState, useCallback} from 'react';
import {View, Text, FlatList, Image, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput, Modal, Alert, ScrollView, Linking} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../../../services/api';
import {styles} from './styles';

const BASE_URL = apiClient.defaults.baseURL?.replace('/api/v1', '') || '';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', {style: 'currency', currency: 'IDR', minimumFractionDigits: 0}).format(price);

const formatDate = (d: string) => d ? String(d).slice(0, 10) : '—';

const getImageUrl = (path?: string | null) => {
  if (!path) {
    return null;
  }

  return path.startsWith('http') ? path : `${BASE_URL}${path}`;
};

export default function AdminTrainerPostsScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Detail modal
  const [detailPost, setDetailPost] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Toggle confirm modal
  const [toggleTarget, setToggleTarget] = useState<any>(null);
  const [toggleNote, setToggleNote] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get('/trainers/admin/all');
      setPosts(res.data || []);
    } catch (e) {
      console.error('AdminTrainerPosts fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openDetail = async (item: any) => {
    setDetailPost(item);
    setReviews([]);
    if (item.review_count > 0) {
      setReviewsLoading(true);
      try {
        const res = await apiClient.get(`/trainers/${item.id}/reviews`);
        setReviews(res.data || []);
      } catch (_) {}
      setReviewsLoading(false);
    }
  };

  const handleToggle = (item: any) => {
    setToggleTarget(item);
    setToggleNote('');
  };

  const confirmToggle = async () => {
    if (!toggleTarget) return;
    setTogglingId(toggleTarget.id);
    setToggleTarget(null);
    if (detailPost?.id === toggleTarget.id) {
      setDetailPost((p: any) => p ? {...p, is_active: !p.is_active} : p);
    }
    try {
      const res = await apiClient.put(`/trainers/admin/${toggleTarget.id}/toggle-active`, {note: toggleNote.trim() || null});
      setPosts(prev => prev.map(p => p.id === toggleTarget.id ? {...p, is_active: res.data.is_active} : p));
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed.');
    } finally {
      setTogglingId(null);
      setToggleNote('');
    }
  };

  const filtered = posts.filter(p => {
    if (filterStatus === 'active' && !p.is_active) return false;
    if (filterStatus === 'inactive' && p.is_active) return false;
    return !search.trim() ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.trainer_name?.toLowerCase().includes(search.toLowerCase());
  });

  const activeCount = posts.filter(p => p.is_active).length;

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#FF6B35" /></View>;
  }

  const renderCard = ({item}: any) => (
    <TouchableOpacity style={[styles.card, !item.is_active && styles.cardInactive]} onPress={() => openDetail(item)} activeOpacity={0.85}>
      <View style={styles.trainerRow}>
        {getImageUrl(item.avatar_url)
          ? <Image source={{uri: getImageUrl(item.avatar_url)!}} style={styles.avatar} />
          : <View style={styles.avatarPlaceholder}><Text style={styles.avatarInitial}>{item.trainer_name?.charAt(0)}</Text></View>
        }
        <View style={styles.trainerInfo}>
          <Text style={styles.trainerName}>{item.trainer_name}</Text>
          <Text style={styles.postTitle} numberOfLines={1}>{item.title}</Text>
        </View>
        <View style={item.is_active ? styles.statusBadgeActive : styles.statusBadgeInactive}>
          <Text style={item.is_active ? styles.statusTextActive : styles.statusTextInactive}>
            {item.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Icon name={item.visibility === 'private' ? 'lock-closed-outline' : 'people-outline'} size={13} color="#888" />
        <Text style={styles.metaText}>
          {item.visibility === 'private'
            ? ' Private (1-on-1)'
            : ` Public${item.max_slots ? ` · ${item.current_slots || 0}/${item.max_slots} slots` : ' · Unlimited'}`}
        </Text>
        <Text style={styles.metaSep}>·</Text>
        <Icon name={item.session_type === 'offline' ? 'location-outline' : 'videocam-outline'} size={13} color="#888" />
        <Text style={styles.metaText}> {item.session_type === 'offline' ? 'Offline' : 'Online'}</Text>
        <Text style={styles.metaSep}>·</Text>
        <Icon name="people" size={13} color="#888" />
        <Text style={styles.metaText}> {item.total_hires ?? 0} hires</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.price}>{formatPrice(item.price)}/mo</Text>
        <View style={styles.ratingRow}>
          <Icon name="star" size={13} color="#FFD700" />
          <Text style={styles.ratingText}> {item.avg_rating ?? '—'} ({item.review_count} reviews)</Text>
        </View>
        <Icon name="chevron-forward" size={16} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <TouchableOpacity style={[styles.summaryItem, filterStatus === 'all' && styles.summaryItemActive]} onPress={() => setFilterStatus('all')}>
          <Text style={styles.summaryValue}>{posts.length}</Text>
          <Text style={styles.summaryLabel}>Total Posts</Text>
          {filterStatus === 'all' && <View style={styles.summaryUnderline} />}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.summaryItem, filterStatus === 'active' && styles.summaryItemActive]} onPress={() => setFilterStatus('active')}>
          <Text style={styles.summaryValueGreen}>{activeCount}</Text>
          <Text style={styles.summaryLabel}>Active</Text>
          {filterStatus === 'active' && <View style={[styles.summaryUnderline, {backgroundColor: '#34C759'}]} />}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.summaryItem, filterStatus === 'inactive' && styles.summaryItemActive]} onPress={() => setFilterStatus('inactive')}>
          <Text style={styles.summaryValueGrey}>{posts.length - activeCount}</Text>
          <Text style={styles.summaryLabel}>Inactive</Text>
          {filterStatus === 'inactive' && <View style={[styles.summaryUnderline, {backgroundColor: '#999'}]} />}
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <Icon name="search-outline" size={16} color="#aaa" />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by trainer or title..."
          placeholderTextColor="#aaa"
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="close-circle" size={16} color="#aaa" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#FF6B35']} />}
        ListEmptyComponent={<Text style={styles.empty}>No posts found.</Text>}
        renderItem={renderCard}
      />

      {/* ── Detail Modal ── */}
      <Modal visible={!!detailPost} transparent animationType="slide" onRequestClose={() => setDetailPost(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.detailBox}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={2}>{detailPost?.title}</Text>
              <TouchableOpacity onPress={() => setDetailPost(null)}>
                <Icon name="close" size={22} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 20}}>
              {/* Trainer row */}
              <View style={styles.detailTrainerRow}>
                {getImageUrl(detailPost?.avatar_url)
                  ? <Image source={{uri: getImageUrl(detailPost?.avatar_url)!}} style={styles.detailAvatar} />
                  : <View style={styles.detailAvatarPlaceholder}><Text style={styles.avatarInitial}>{detailPost?.trainer_name?.charAt(0)}</Text></View>
                }
                <View style={{flex: 1}}>
                  <Text style={styles.detailTrainerName}>{detailPost?.trainer_name}</Text>
                  <View style={styles.ratingRow}>
                    <Icon name="star" size={13} color="#FFD700" />
                    <Text style={styles.ratingText}> {detailPost?.avg_rating ?? '—'} · {detailPost?.review_count} reviews · {detailPost?.total_hires ?? 0} hires</Text>
                  </View>
                </View>
                <View style={detailPost?.is_active ? styles.statusBadgeActive : styles.statusBadgeInactive}>
                  <Text style={detailPost?.is_active ? styles.statusTextActive : styles.statusTextInactive}>
                    {detailPost?.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>

              {/* Key info chips */}
              <View style={styles.chipsRow}>
                <View style={styles.chip}>
                  <Icon name={detailPost?.session_type === 'offline' ? 'location-outline' : 'videocam-outline'} size={13} color="#FF6B35" />
                  <Text style={styles.chipText}> {detailPost?.session_type === 'offline' ? 'Offline' : 'Online'}</Text>
                </View>
                <View style={styles.chip}>
                  <Icon name={detailPost?.visibility === 'private' ? 'lock-closed-outline' : 'people-outline'} size={13} color="#FF6B35" />
                  <Text style={styles.chipText}> {detailPost?.visibility === 'private' ? 'Private' : 'Public'}</Text>
                </View>
                {detailPost?.max_slots && (
                  <View style={styles.chip}>
                    <Icon name="person-add-outline" size={13} color="#FF6B35" />
                    <Text style={styles.chipText}> {detailPost?.current_slots ?? 0}/{detailPost?.max_slots} slots</Text>
                  </View>
                )}
                <View style={styles.chip}>
                  <Icon name="cash-outline" size={13} color="#FF6B35" />
                  <Text style={styles.chipText}> {formatPrice(detailPost?.price ?? 0)}/mo</Text>
                </View>
              </View>

              {/* Location (offline) */}
              {detailPost?.session_type === 'offline' && !!detailPost?.location && (
                <TouchableOpacity
                  style={styles.detailRow}
                  onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(detailPost.location)}`)}>
                  <Icon name="location-outline" size={16} color="#FF3B30" />
                  <Text style={[styles.detailRowText, {color: '#FF3B30', textDecorationLine: 'underline'}]}> {detailPost.location}</Text>
                </TouchableOpacity>
              )}

              {/* Enrollment / Program dates */}
              {detailPost?.visibility === 'public' && (detailPost?.enrollment_deadline || detailPost?.program_start_date) && (
                <View style={styles.detailRow}>
                  <Icon name="calendar-outline" size={16} color="#888" />
                  <Text style={styles.detailRowText}>
                    {detailPost?.enrollment_deadline ? ` Enrollment closes ${formatDate(detailPost.enrollment_deadline)}` : ''}
                    {detailPost?.enrollment_deadline && detailPost?.program_start_date ? '  ·' : ''}
                    {detailPost?.program_start_date ? ` Starts ${formatDate(detailPost.program_start_date)}` : ''}
                  </Text>
                </View>
              )}

              {/* Description */}
              {!!detailPost?.description && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Description</Text>
                  <Text style={styles.detailBody}>{detailPost.description}</Text>
                </View>
              )}

              {/* Focus Areas */}
              {!!detailPost?.focus_areas && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Focus Areas</Text>
                  <Text style={styles.detailBody}>{detailPost.focus_areas}</Text>
                </View>
              )}

              {/* Services */}
              {!!detailPost?.services && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Services</Text>
                  <Text style={styles.detailBody}>{detailPost.services}</Text>
                </View>
              )}

              {/* Schedule */}
              {Array.isArray(detailPost?.schedule) && detailPost.schedule.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Schedule</Text>
                  {detailPost.schedule.map((s: any, i: number) => (
                    <View key={i} style={styles.scheduleRow}>
                      <Icon name="time-outline" size={14} color="#FF6B35" />
                      <Text style={styles.scheduleText}> {s.day}  {s.start} – {s.end}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Reviews */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Reviews ({detailPost?.review_count ?? 0})</Text>
                {reviewsLoading
                  ? <ActivityIndicator color="#FF6B35" style={{marginTop: 10}} />
                  : reviews.length === 0
                    ? <Text style={styles.modalEmpty}>No reviews yet.</Text>
                    : reviews.map((r: any) => (
                        <View key={r.id} style={styles.reviewItem}>
                          <View style={styles.reviewHeader}>
                            <Text style={styles.reviewMember}>{r.member_name}</Text>
                            <View style={{flexDirection: 'row'}}>
                              {[1,2,3,4,5].map(s => (
                                <Icon key={s} name={s <= r.rating ? 'star' : 'star-outline'} size={12} color="#FFD700" />
                              ))}
                            </View>
                            <Text style={styles.reviewDate}>{new Date(r.created_at).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})}</Text>
                          </View>
                          {!!r.review && <Text style={styles.reviewText}>{r.review}</Text>}
                          <Text style={styles.reviewSessions}>{r.sessions_attended}/{r.sessions_total} sessions attended</Text>
                        </View>
                      ))
                }
              </View>

              {/* Toggle action */}
              <TouchableOpacity
                style={[styles.toggleBtn, {backgroundColor: detailPost?.is_active ? '#FFEBEE' : '#E8F5E9'}]}
                onPress={() => { handleToggle(detailPost); }}
                disabled={togglingId === detailPost?.id}>
                {togglingId === detailPost?.id
                  ? <ActivityIndicator size="small" color={detailPost?.is_active ? '#FF3B30' : '#34C759'} />
                  : <>
                      <Icon name={detailPost?.is_active ? 'eye-off-outline' : 'eye-outline'} size={16} color={detailPost?.is_active ? '#FF3B30' : '#34C759'} />
                      <Text style={[styles.toggleBtnText, {color: detailPost?.is_active ? '#FF3B30' : '#34C759'}]}>
                        {' '}{detailPost?.is_active ? 'Deactivate Post' : 'Reactivate Post'}
                      </Text>
                    </>
                }
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Toggle Confirm Modal ── */}
      <Modal visible={!!toggleTarget} transparent animationType="fade" onRequestClose={() => setToggleTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {toggleTarget?.is_active ? 'Deactivate Post' : 'Reactivate Post'}
              </Text>
              <TouchableOpacity onPress={() => setToggleTarget(null)}>
                <Icon name="close" size={22} color="#333" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              {toggleTarget?.is_active
                ? `"${toggleTarget?.title}" will be hidden from members.`
                : `"${toggleTarget?.title}" will be visible to members again.`}
            </Text>
            <TextInput
              style={styles.noteInput}
              value={toggleNote}
              onChangeText={setToggleNote}
              placeholder="Add a note for the trainer (optional)..."
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setToggleTarget(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, {backgroundColor: toggleTarget?.is_active ? '#FF3B30' : '#34C759'}]}
                onPress={confirmToggle}>
                <Text style={styles.modalConfirmText}>
                  {toggleTarget?.is_active ? 'Deactivate' : 'Reactivate'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
