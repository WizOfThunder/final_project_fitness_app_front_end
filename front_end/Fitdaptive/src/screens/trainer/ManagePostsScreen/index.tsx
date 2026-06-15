import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  Switch,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../../../services/api';
import {useAuth} from '../../../store/AuthContext';
import DatePickerInput from '../../../components/DatePickerInput';
import TimeRangePickerInput from '../../../components/TimeRangePickerInput';
import {styles as s} from './styles';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
const EMPTY_SCHEDULE = {day: 'Monday', start: '', end: ''};
const EMPTY_FORM = {
  title: '',
  description: '',
  focus_areas: '',
  services: '',
  price: '',
  is_active: true,
  session_type: 'online',
  location: '',
  visibility: 'public',
  max_slots: '',
  schedule: [] as {day: string; start: string; end: string}[],
  enrollment_deadline: null as Date | null,
  program_start_date: null as Date | null,
};

const toDateStr = (d: Date | null) =>
  d
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}`
    : null;

const parseDateOnly = (value?: string | Date | null) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const parsed = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
    );
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateOnly = (value?: string | Date | null) => {
  const parsed = parseDateOnly(value);
  if (!parsed) {
    return '—';
  }

  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const slotsOverlap = (
  a: {day: string; start: string; end: string},
  b: {day: string; start: string; end: string},
) => {
  if (a.day !== b.day) {
    return false;
  }
  const aStart = toMinutes(a.start),
    aEnd = toMinutes(a.end);
  const bStart = toMinutes(b.start),
    bEnd = toMinutes(b.end);
  return aStart < bEnd && bStart < aEnd;
};

const hasCurrentClients = (post: any) =>
  Number(post.current_client_count ?? post.current_slots ?? 0) > 0;

const postBlocksSchedule = (post: any) =>
  !!post?.is_active || hasCurrentClients(post);

const canEditOrDeletePost = (post: any) => !hasCurrentClients(post);

const canActivatePost = (post: any) =>
  !(!post.is_active && hasCurrentClients(post));

const getPostStatusKey = (post: any) => {
  if (hasCurrentClients(post)) {
    return 'in_progress';
  }

  return post.is_active ? 'active' : 'inactive';
};

const getPostStatusMeta = (post: any) => {
  switch (getPostStatusKey(post)) {
    case 'in_progress':
      return {
        label: 'In Progress',
        backgroundColor: '#E8F2FF',
        color: '#007AFF',
      };
    case 'active':
      return {
        label: 'Active',
        backgroundColor: '#E8F5E9',
        color: '#34C759',
      };
    default:
      return {
        label: 'Inactive',
        backgroundColor: '#F5F5F5',
        color: '#999',
      };
  }
};

const STATUS_FILTERS = [
  {key: 'all', label: 'All'},
  {key: 'active', label: 'Active'},
  {key: 'in_progress', label: 'In Progress'},
  {key: 'inactive', label: 'Inactive'},
];

export default function ManagePostsScreen() {
  const {user} = useAuth();
  const isApproved = user?.certification_status === 'approved';
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [detailPost, setDetailPost] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get('/trainers/my-posts');
      setPosts(res.data || []);
    } catch (e) {
      console.error('ManagePosts fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const closeDetail = () => {
    setShowDetailModal(false);
    setDetailPost(null);
    setDetailLoading(false);
  };

  const openDetail = async (post: any) => {
    setDetailPost(post);
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const res = await apiClient.get(`/trainers/${post.id}`);
      setDetailPost(res.data);
    } catch (e: any) {
      Alert.alert(
        'Error',
        e?.response?.data?.error || 'Failed to load post details.',
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const openEdit = (post: any) => {
    if (!canEditOrDeletePost(post)) {
      Alert.alert(
        'Unavailable',
        'You cannot edit a post while it still has current clients.',
      );
      return;
    }

    setEditing(post);
    setForm({
      title: post.title || '',
      description: post.description || '',
      focus_areas: post.focus_areas || '',
      services: post.services || '',
      price: String(post.price || ''),
      is_active: !!post.is_active,
      session_type: post.session_type || 'online',
      location: post.location || '',
      visibility: post.visibility || 'public',
      max_slots: post.max_slots ? String(post.max_slots) : '',
      schedule: Array.isArray(post.schedule) ? post.schedule : [],
      enrollment_deadline: parseDateOnly(post.enrollment_deadline),
      program_start_date: parseDateOnly(post.program_start_date),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      return Alert.alert('Error', 'Title is required');
    }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) {
      return Alert.alert('Error', 'Price must be a positive number');
    }
    if (form.session_type === 'offline' && !form.location.trim()) {
      return Alert.alert('Error', 'Location is required for offline sessions');
    }
    if (form.schedule.length === 0) {
      return Alert.alert('Error', 'At least one schedule slot is required');
    }
    if (form.schedule.some(s => !s.start.trim() || !s.end.trim())) {
      return Alert.alert(
        'Error',
        'All schedule slots must have start and end times',
      );
    }

    // Check self-overlap within this post's own slots
    for (let i = 0; i < form.schedule.length; i++) {
      for (let j = i + 1; j < form.schedule.length; j++) {
        if (slotsOverlap(form.schedule[i], form.schedule[j])) {
          return Alert.alert(
            'Schedule Conflict',
            `Slots ${i + 1} and ${j + 1} overlap on ${
              form.schedule[i].day
            }. Please fix the times.`,
          );
        }
      }
    }

    const postWillBlockSchedule =
      form.is_active || Number(editing?.current_client_count || 0) > 0;

    if (postWillBlockSchedule) {
      const otherPosts = posts.filter(
        p => p.id !== editing?.id && postBlocksSchedule(p),
      );
      for (const other of otherPosts) {
        const otherSchedule: {day: string; start: string; end: string}[] =
          Array.isArray(other.schedule) ? other.schedule : [];
        for (const newSlot of form.schedule) {
          for (const existingSlot of otherSchedule) {
            if (slotsOverlap(newSlot, existingSlot)) {
              return Alert.alert(
                'Schedule Conflict',
                `This slot (${newSlot.day} ${newSlot.start}–${
                  newSlot.end
                }) overlaps with your ${
                  hasCurrentClients(other) ? 'in progress' : 'active'
                } post "${other.title}" (${existingSlot.start}–${
                  existingSlot.end
                }). Please adjust the time.`,
              );
            }
          }
        }
      }
    }

    if (form.visibility === 'public') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (!form.enrollment_deadline) {
        return Alert.alert(
          'Error',
          'Enrollment deadline is required for public posts',
        );
      }
      if (!form.program_start_date) {
        return Alert.alert(
          'Error',
          'Program start date is required for public posts',
        );
      }
      if (form.enrollment_deadline < today) {
        return Alert.alert(
          'Error',
          'Enrollment deadline must be today or in the future',
        );
      }
      if (form.program_start_date < today) {
        return Alert.alert(
          'Error',
          'Program start date must be today or in the future',
        );
      }
      if (form.program_start_date <= form.enrollment_deadline) {
        return Alert.alert(
          'Error',
          'Program start date must be after the enrollment deadline',
        );
      }
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        focus_areas: form.focus_areas.trim() || null,
        services: form.services.trim() || null,
        price: Number(form.price),
        is_active: form.is_active,
        session_type: form.session_type,
        location: form.session_type === 'offline' ? form.location.trim() : null,
        visibility: form.visibility,
        max_slots:
          form.visibility === 'private'
            ? 1
            : form.max_slots
            ? Number(form.max_slots)
            : null,
        schedule: form.schedule,
        enrollment_deadline:
          form.visibility === 'public'
            ? toDateStr(form.enrollment_deadline)
            : null,
        program_start_date:
          form.visibility === 'public'
            ? toDateStr(form.program_start_date)
            : null,
      };
      if (editing) {
        await apiClient.put(`/trainers/${editing.id}`, payload);
        Alert.alert('Updated', 'Post updated successfully.');
      } else {
        await apiClient.post('/trainers', payload);
        Alert.alert('Created', 'Post created successfully.');
      }
      setShowModal(false);
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed to save post.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (post: any) => {
    if (!canEditOrDeletePost(post)) {
      Alert.alert(
        'Unavailable',
        'You cannot delete a post while it still has current clients.',
      );
      return;
    }

    Alert.alert(
      'Delete Post',
      `Delete "${post.title}"? This cannot be undone.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/trainers/${post.id}`);
              setPosts(prev => prev.filter(p => p.id !== post.id));
            } catch (e: any) {
              Alert.alert(
                'Error',
                e?.response?.data?.error || 'Failed to delete.',
              );
            }
          },
        },
      ],
    );
  };

  const handleToggleActive = async (post: any) => {
    if (!canActivatePost(post)) {
      Alert.alert(
        'Unavailable',
        'You cannot activate a post while it still has current clients.',
      );
      return;
    }

    if (!post.is_active) {
      if (post.visibility === 'public') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const enrollmentDeadline = parseDateOnly(post.enrollment_deadline);
        const programStartDate = parseDateOnly(post.program_start_date);

        if (
          !enrollmentDeadline ||
          !programStartDate ||
          enrollmentDeadline < today ||
          programStartDate < today ||
          programStartDate <= enrollmentDeadline
        ) {
          Alert.alert(
            'Update Dates First',
            'Edit this public post and set a new enrollment deadline and program start date before reactivating it.',
          );
          return;
        }
      }

      const currentSchedule: {day: string; start: string; end: string}[] =
        Array.isArray(post.schedule) ? post.schedule : [];
      const otherPosts = posts.filter(
        p => p.id !== post.id && postBlocksSchedule(p),
      );

      for (const other of otherPosts) {
        const otherSchedule: {day: string; start: string; end: string}[] =
          Array.isArray(other.schedule) ? other.schedule : [];
        for (const currentSlot of currentSchedule) {
          for (const existingSlot of otherSchedule) {
            if (slotsOverlap(currentSlot, existingSlot)) {
              Alert.alert(
                'Schedule Conflict',
                `Cannot activate "${
                  post.title
                }" because it overlaps with your ${
                  hasCurrentClients(other) ? 'in progress' : 'active'
                } post "${other.title}" on ${currentSlot.day}.`,
              );
              return;
            }
          }
        }
      }
    }

    try {
      await apiClient.put(`/trainers/${post.id}`, {is_active: !post.is_active});
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed to update.');
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  // Issue #8: gate the entire screen for unapproved trainers
  if (!isApproved) {
    return (
      <View style={[s.center, {padding: 32}]}>
        <Icon
          name={
            user?.certification_status === 'rejected' ? 'close-circle' : 'time'
          }
          size={48}
          color={
            user?.certification_status === 'rejected' ? '#FF3B30' : '#FF9500'
          }
        />
        <Text
          style={{
            fontSize: 16,
            fontWeight: '700',
            color: '#333',
            marginTop: 16,
            textAlign: 'center',
          }}>
          {user?.certification_status === 'rejected'
            ? 'Certification Rejected'
            : 'Certification Pending'}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: '#888',
            marginTop: 8,
            textAlign: 'center',
            lineHeight: 20,
          }}>
          {user?.certification_status === 'rejected'
            ? 'Your certification was rejected. Please contact an admin.'
            : 'You can create posts once an admin approves your certification.'}
        </Text>
      </View>
    );
  }

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredPosts = posts.filter(post => {
    const matchesStatus =
      statusFilter === 'all' || getPostStatusKey(post) === statusFilter;
    const matchesSearch =
      !normalizedSearch || post.title?.toLowerCase().includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });
  const emptyMessage =
    posts.length === 0 ? 'No posts yet' : 'No posts match the current filters';
  const emptySubMessage =
    posts.length === 0
      ? 'Create a post so members can find and hire you'
      : 'Try changing the status filter or search text';
  const detailStatusMeta = detailPost ? getPostStatusMeta(detailPost) : null;
  let detailVisibilityLabel = '';
  if (detailPost) {
    if (detailPost.visibility === 'private') {
      detailVisibilityLabel = 'Private (1-on-1)';
    } else if (detailPost.max_slots) {
      detailVisibilityLabel =
        'Public · ' +
        (detailPost.current_slots || 0) +
        '/' +
        detailPost.max_slots +
        ' slots';
    } else {
      detailVisibilityLabel = 'Public';
    }
  }

  return (
    <View style={s.container}>
      <View style={s.filterSection}>
        <View style={s.searchBar}>
          <Icon name="search-outline" size={18} color="#999" />
          <TextInput
            style={s.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name"
            placeholderTextColor="#999"
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterTabs}>
          {STATUS_FILTERS.map(filter => {
            const isActive = statusFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                style={[s.filterChip, isActive && s.filterChipActive]}
                onPress={() => setStatusFilter(filter.key)}>
                <Text
                  style={[
                    s.filterChipText,
                    isActive && s.filterChipTextActive,
                  ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      <FlatList
        data={filteredPosts}
        keyExtractor={item => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            colors={['#FF6B35']}
          />
        }
        contentContainerStyle={{padding: 16, paddingBottom: 100}}
        ListEmptyComponent={
          <View style={s.empty}>
            <Icon name="document-text-outline" size={56} color="#ccc" />
            <Text style={s.emptyText}>{emptyMessage}</Text>
            <Text style={s.emptySubText}>{emptySubMessage}</Text>
          </View>
        }
        renderItem={({item}) => {
          const statusMeta = getPostStatusMeta(item);

          return (
            <View style={s.card}>
              {item.deactivated_by === 'admin' && item.latest_admin_message ? (
                <View style={s.adminNoteBox}>
                  <Icon name="shield-outline" size={14} color="#B26A00" />
                  <Text style={s.adminNoteText}>
                    {item.latest_admin_message}
                  </Text>
                </View>
              ) : null}
              <View style={s.cardHeader}>
                <View style={s.cardTitleRow}>
                  <Text style={s.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View
                    style={[
                      s.activeBadge,
                      {backgroundColor: statusMeta.backgroundColor},
                    ]}>
                    <Text
                      style={[s.activeBadgeText, {color: statusMeta.color}]}>
                      {statusMeta.label}
                    </Text>
                  </View>
                </View>
                <Text style={s.cardPrice}>{formatPrice(item.price)}/mo</Text>
              </View>
              {!!item.description && (
                <Text style={s.cardDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
              {!!item.focus_areas && (
                <View style={s.metaRow}>
                  <Icon name="fitness-outline" size={13} color="#888" />
                  <Text style={s.metaText}> {item.focus_areas}</Text>
                </View>
              )}
              <View style={s.metaRow}>
                <Icon
                  name={
                    item.session_type === 'offline'
                      ? 'location-outline'
                      : 'videocam-outline'
                  }
                  size={13}
                  color="#888"
                />
                <Text style={s.metaText}>
                  {' '}
                  {item.session_type === 'offline'
                    ? `Offline${item.location ? ` · ${item.location}` : ''}`
                    : 'Online'}
                </Text>
              </View>
              <View style={s.metaRow}>
                <Icon
                  name={
                    item.visibility === 'private'
                      ? 'lock-closed-outline'
                      : 'people-outline'
                  }
                  size={13}
                  color="#888"
                />
                <Text style={s.metaText}>
                  {' '}
                  {item.visibility === 'private'
                    ? 'Private (1-on-1)'
                    : `Public${
                        item.max_slots
                          ? ` · ${item.current_slots || 0}/${
                              item.max_slots
                            } slots`
                          : ''
                      }`}
                </Text>
              </View>
              {item.visibility === 'public' &&
                (!!item.enrollment_deadline || !!item.program_start_date) && (
                  <View style={s.metaRow}>
                    <Icon name="calendar-outline" size={13} color="#888" />
                    <Text style={s.metaText}>
                      {item.enrollment_deadline
                        ? ` Enrollment closes ${item.enrollment_deadline.slice(
                            0,
                            10,
                          )}`
                        : ''}
                      {item.enrollment_deadline && item.program_start_date
                        ? '  ·'
                        : ''}
                      {item.program_start_date
                        ? ` Starts ${item.program_start_date.slice(0, 10)}`
                        : ''}
                    </Text>
                  </View>
                )}
              {Array.isArray(item.schedule) && item.schedule.length > 0 && (
                <View style={s.metaRow}>
                  <Icon name="calendar-outline" size={13} color="#888" />
                  <Text style={s.metaText} numberOfLines={1}>
                    {' '}
                    {item.schedule
                      .map((sc: any) => `${sc.day} ${sc.start}-${sc.end}`)
                      .join(', ')}
                  </Text>
                </View>
              )}
              {item.avg_rating > 0 && (
                <View style={s.metaRow}>
                  <Icon name="star" size={13} color="#FFD700" />
                  <Text style={s.metaText}>
                    {' '}
                    {parseFloat(item.avg_rating).toFixed(1)} (
                    {item.review_count} reviews)
                  </Text>
                </View>
              )}
              {hasCurrentClients(item) ? (
                <View style={s.clientLockRow}>
                  <Icon name="lock-closed-outline" size={13} color="#C47A00" />
                  <Text style={s.clientLockText}>
                    This post has current clients. Edit and delete are locked.
                    {!item.is_active
                      ? ' Activation is also blocked until all current clients are cleared.'
                      : ''}
                  </Text>
                </View>
              ) : null}
              <View style={s.cardActions}>
                <TouchableOpacity
                  style={s.viewBtn}
                  onPress={() => openDetail(item)}>
                  <Icon name="reader-outline" size={16} color="#333" />
                  <Text style={s.viewText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    s.toggleBtn,
                    !canActivatePost(item) && s.actionDisabled,
                  ]}
                  onPress={() => handleToggleActive(item)}
                  disabled={!canActivatePost(item)}>
                  <Icon
                    name={item.is_active ? 'eye-off-outline' : 'eye-outline'}
                    size={16}
                    color="#666"
                  />
                  <Text style={s.toggleText}>
                    {item.is_active ? 'Deactivate' : 'Activate'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    s.editBtn,
                    !canEditOrDeletePost(item) && s.actionDisabled,
                  ]}
                  onPress={() => openEdit(item)}
                  disabled={!canEditOrDeletePost(item)}>
                  <Icon name="create-outline" size={16} color="#007AFF" />
                  <Text style={s.editText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    s.deleteBtn,
                    !canEditOrDeletePost(item) && s.actionDisabled,
                  ]}
                  onPress={() => handleDelete(item)}
                  disabled={!canEditOrDeletePost(item)}>
                  <Icon name="trash-outline" size={16} color="#FF3B30" />
                  <Text style={s.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <TouchableOpacity style={s.fab} onPress={openCreate}>
        <Icon name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={showDetailModal}
        animationType="slide"
        onRequestClose={closeDetail}>
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Post Details</Text>
            <TouchableOpacity onPress={closeDetail}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView style={s.modalBody} keyboardShouldPersistTaps="handled">
            {!detailPost && detailLoading ? (
              <View style={s.detailLoadingWrap}>
                <ActivityIndicator size="large" color="#FF6B35" />
              </View>
            ) : detailPost ? (
              <>
                <View style={s.detailHero}>
                  <View style={s.detailTitleRow}>
                    <Text style={s.detailTitle}>{detailPost.title}</Text>
                    {detailStatusMeta ? (
                      <View
                        style={[
                          s.activeBadge,
                          {backgroundColor: detailStatusMeta.backgroundColor},
                        ]}>
                        <Text
                          style={[
                            s.activeBadgeText,
                            {color: detailStatusMeta.color},
                          ]}>
                          {detailStatusMeta.label}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={s.detailPrice}>
                    {formatPrice(detailPost.price)}/mo
                  </Text>
                  {Number(detailPost.avg_rating || 0) > 0 ? (
                    <View style={s.detailRatingRow}>
                      <Icon name="star" size={16} color="#FFD700" />
                      <Text style={s.detailRatingText}>
                        {parseFloat(detailPost.avg_rating).toFixed(1)}
                      </Text>
                      <Text style={s.detailRatingCount}>
                        ({detailPost.review_count || 0} reviews)
                      </Text>
                    </View>
                  ) : (
                    <Text style={s.detailSubtleText}>No reviews yet</Text>
                  )}
                </View>

                {!!detailPost.description && (
                  <View style={s.detailSection}>
                    <Text style={s.detailSectionTitle}>Description</Text>
                    <Text style={s.detailBodyText}>
                      {detailPost.description}
                    </Text>
                  </View>
                )}

                <View style={s.detailSection}>
                  <Text style={s.detailSectionTitle}>Post Information</Text>
                  {!!detailPost.focus_areas && (
                    <View style={s.detailInfoRow}>
                      <Text style={s.detailInfoLabel}>Focus Areas</Text>
                      <Text style={s.detailInfoValue}>
                        {detailPost.focus_areas}
                      </Text>
                    </View>
                  )}
                  {!!detailPost.services && (
                    <View style={s.detailInfoRow}>
                      <Text style={s.detailInfoLabel}>Services</Text>
                      <Text style={s.detailInfoValue}>
                        {detailPost.services}
                      </Text>
                    </View>
                  )}
                  <View style={s.detailInfoRow}>
                    <Text style={s.detailInfoLabel}>Session Type</Text>
                    <Text style={s.detailInfoValue}>
                      {detailPost.session_type === 'offline'
                        ? `Offline${
                            detailPost.location
                              ? ` · ${detailPost.location}`
                              : ''
                          }`
                        : 'Online'}
                    </Text>
                  </View>
                  <View style={s.detailInfoRow}>
                    <Text style={s.detailInfoLabel}>Visibility</Text>
                    <Text style={s.detailInfoValue}>
                      {detailVisibilityLabel}
                    </Text>
                  </View>
                  {detailPost.visibility === 'public' &&
                  detailPost.enrollment_deadline ? (
                    <View style={s.detailInfoRow}>
                      <Text style={s.detailInfoLabel}>Enrollment Deadline</Text>
                      <Text style={s.detailInfoValue}>
                        {formatDateOnly(detailPost.enrollment_deadline)}
                      </Text>
                    </View>
                  ) : null}
                  {detailPost.visibility === 'public' &&
                  detailPost.program_start_date ? (
                    <View style={s.detailInfoRow}>
                      <Text style={s.detailInfoLabel}>Program Start</Text>
                      <Text style={s.detailInfoValue}>
                        {formatDateOnly(detailPost.program_start_date)}
                      </Text>
                    </View>
                  ) : null}
                  {Array.isArray(detailPost.schedule) &&
                  detailPost.schedule.length > 0 ? (
                    <View style={s.detailScheduleBlock}>
                      <Text style={s.detailInfoLabel}>Schedule</Text>
                      {detailPost.schedule.map((slot: any, index: number) => (
                        <Text
                          key={`${slot.day}-${slot.start}-${slot.end}-${index}`}
                          style={s.detailScheduleText}>
                          {slot.day} · {slot.start}-{slot.end}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                </View>

                <View style={s.detailSection}>
                  <Text style={s.detailSectionTitle}>
                    Reviews ({detailPost.reviews?.length || 0})
                  </Text>
                  {detailLoading ? (
                    <ActivityIndicator color="#FF6B35" />
                  ) : detailPost.reviews?.length > 0 ? (
                    detailPost.reviews.map((review: any) => (
                      <View key={review.id} style={s.reviewCard}>
                        <View style={s.reviewHeader}>
                          <Text style={s.reviewAuthor}>
                            {review.member_name}
                          </Text>
                          <View style={s.reviewStars}>
                            {[1, 2, 3, 4, 5].map(star => (
                              <Icon
                                key={star}
                                name={
                                  star <= review.rating
                                    ? 'star'
                                    : 'star-outline'
                                }
                                size={13}
                                color="#FFD700"
                              />
                            ))}
                          </View>
                          <Text style={s.reviewDate}>
                            {formatDateOnly(review.created_at)}
                          </Text>
                        </View>
                        <Text style={s.reviewText}>
                          {review.review || 'No written review provided.'}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={s.emptyReviewsText}>
                      No reviews for this post yet.
                    </Text>
                  )}
                </View>
              </>
            ) : (
              <View style={s.detailLoadingWrap}>
                <Text style={s.emptyText}>Post not found.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showModal}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}>
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>
              {editing ? 'Edit Post' : 'Create Post'}
            </Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView style={s.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={s.fieldLabel}>Title *</Text>
            <TextInput
              style={s.input}
              value={form.title}
              onChangeText={v => setForm(f => ({...f, title: v}))}
              placeholder="e.g. Personal Training Package"
              placeholderTextColor="#aaa"
            />

            <Text style={s.fieldLabel}>Description</Text>
            <TextInput
              style={[s.input, s.textArea]}
              value={form.description}
              onChangeText={v => setForm(f => ({...f, description: v}))}
              placeholder="Describe your services..."
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={s.fieldLabel}>Focus Areas</Text>
            <TextInput
              style={s.input}
              value={form.focus_areas}
              onChangeText={v => setForm(f => ({...f, focus_areas: v}))}
              placeholder="e.g. Weight Loss, Muscle Gain"
              placeholderTextColor="#aaa"
            />

            <Text style={s.fieldLabel}>Services Included</Text>
            <TextInput
              style={[s.input, s.textArea]}
              value={form.services}
              onChangeText={v => setForm(f => ({...f, services: v}))}
              placeholder="e.g. Weekly check-ins, custom workout plan..."
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Text style={s.fieldLabel}>Price (IDR/month) *</Text>
            <TextInput
              style={s.input}
              value={form.price}
              onChangeText={v => setForm(f => ({...f, price: v}))}
              placeholder="e.g. 500000"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
            />

            {/* Session Type */}
            <Text style={s.fieldLabel}>Session Type *</Text>
            <View style={s.toggleRow}>
              {['online', 'offline'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[
                    s.toggleOption,
                    form.session_type === t && s.toggleOptionActive,
                  ]}
                  onPress={() =>
                    setForm(f => ({...f, session_type: t, location: ''}))
                  }>
                  <Icon
                    name={
                      t === 'online' ? 'videocam-outline' : 'location-outline'
                    }
                    size={16}
                    color={form.session_type === t ? '#fff' : '#666'}
                  />
                  <Text
                    style={[
                      s.toggleOptionText,
                      form.session_type === t && s.toggleOptionTextActive,
                    ]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {form.session_type === 'offline' && (
              <>
                <Text style={s.fieldLabel}>Location *</Text>
                <TextInput
                  style={s.input}
                  value={form.location}
                  onChangeText={v => setForm(f => ({...f, location: v}))}
                  placeholder="e.g. Gym XYZ, Jl. Sudirman No. 1"
                  placeholderTextColor="#aaa"
                />
              </>
            )}

            {/* Visibility */}
            <Text style={s.fieldLabel}>Visibility *</Text>
            <View style={s.toggleRow}>
              {['public', 'private'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[
                    s.toggleOption,
                    form.visibility === t && s.toggleOptionActive,
                  ]}
                  onPress={() =>
                    setForm(f => ({
                      ...f,
                      visibility: t,
                      max_slots: t === 'private' ? '1' : f.max_slots,
                    }))
                  }>
                  <Icon
                    name={
                      t === 'public' ? 'people-outline' : 'lock-closed-outline'
                    }
                    size={16}
                    color={form.visibility === t ? '#fff' : '#666'}
                  />
                  <Text
                    style={[
                      s.toggleOptionText,
                      form.visibility === t && s.toggleOptionTextActive,
                    ]}>
                    {t === 'public' ? 'Public' : 'Private (1-on-1)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {form.visibility === 'public' && (
              <>
                <Text style={s.fieldLabel}>
                  Max Slots (leave empty for unlimited)
                </Text>
                <TextInput
                  style={s.input}
                  value={form.max_slots}
                  onChangeText={v => setForm(f => ({...f, max_slots: v}))}
                  placeholder="e.g. 10"
                  placeholderTextColor="#aaa"
                  keyboardType="numeric"
                />

                <DatePickerInput
                  label="Enrollment Deadline *"
                  value={form.enrollment_deadline}
                  onChange={d => setForm(f => ({...f, enrollment_deadline: d}))}
                  minDate={new Date()}
                />

                <DatePickerInput
                  label="Program Start Date *"
                  value={form.program_start_date}
                  onChange={d => setForm(f => ({...f, program_start_date: d}))}
                  minDate={
                    form.enrollment_deadline
                      ? new Date(form.enrollment_deadline.getTime() + 86400000)
                      : new Date()
                  }
                />
                <Text style={s.hintText}>
                  Members can enroll until the deadline, then everyone starts
                  together on the program start date.
                </Text>
              </>
            )}

            {/* Schedule */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 4,
              }}>
              <Text style={s.fieldLabel}>Schedule *</Text>
              <TouchableOpacity
                onPress={() =>
                  setForm(f => ({
                    ...f,
                    schedule: [...f.schedule, {...EMPTY_SCHEDULE}],
                  }))
                }
                style={s.addSlotBtn}>
                <Icon name="add" size={16} color="#FF6B35" />
                <Text style={s.addSlotText}>Add Slot</Text>
              </TouchableOpacity>
            </View>
            {form.schedule.length === 0 && (
              <Text style={s.hintText}>Add at least one schedule slot</Text>
            )}
            {form.schedule.map((slot, idx) => (
              <View key={idx} style={s.scheduleRow}>
                <View style={s.dayPicker}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {DAYS.map(d => (
                      <TouchableOpacity
                        key={d}
                        style={[s.dayChip, slot.day === d && s.dayChipActive]}
                        onPress={() => {
                          const updated = [...form.schedule];
                          updated[idx] = {...updated[idx], day: d};
                          setForm(f => ({...f, schedule: updated}));
                        }}>
                        <Text
                          style={[
                            s.dayChipText,
                            slot.day === d && s.dayChipTextActive,
                          ]}>
                          {d.slice(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 6,
                  }}>
                  <View style={{flex: 1}}>
                    <TimeRangePickerInput
                      label="Time"
                      startTime={slot.start || null}
                      endTime={slot.end || null}
                      onChangeStart={v =>
                        setForm(f => {
                          const u = f.schedule.map((sc, i) =>
                            i === idx ? {...sc, start: v} : sc,
                          );
                          return {...f, schedule: u};
                        })
                      }
                      onChangeEnd={v =>
                        setForm(f => {
                          const u = f.schedule.map((sc, i) =>
                            i === idx ? {...sc, end: v} : sc,
                          );
                          return {...f, schedule: u};
                        })
                      }
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      setForm(f => ({
                        ...f,
                        schedule: f.schedule.filter((_, i) => i !== idx),
                      }))
                    }
                    style={{marginTop: 36}}>
                    <Icon name="close-circle" size={22} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={s.switchRow}>
              <Text style={s.fieldLabel}>Active (visible to members)</Text>
              <Switch
                value={form.is_active}
                onValueChange={v => setForm(f => ({...f, is_active: v}))}
                trackColor={{false: '#E0E0E0', true: '#FFB399'}}
                thumbColor={form.is_active ? '#FF6B35' : '#f4f3f4'}
              />
            </View>

            <TouchableOpacity
              style={[s.saveBtn, saving && {opacity: 0.6}]}
              onPress={handleSave}
              disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.saveBtnText}>
                  {editing ? 'Save Changes' : 'Create Post'}
                </Text>
              )}
            </TouchableOpacity>
            <View style={{height: 40}} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
