import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../../../services/api';
import {styles} from './styles';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);

const resolveAvatarUrl = (avatarUrl?: string | null) => {
  if (!avatarUrl) {
    return null;
  }
  if (/^https?:\/\//i.test(avatarUrl)) {
    return avatarUrl;
  }
  const baseUrl = apiClient.defaults.baseURL?.replace('/api/v1', '') || '';
  return `${baseUrl}${avatarUrl}`;
};

const getAge = (dob?: string | null) => {
  if (!dob) {
    return null;
  }

  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

const formatGender = (gender?: string | null) => {
  if (!gender) {
    return null;
  }

  return gender.charAt(0).toUpperCase() + gender.slice(1);
};

const formatTimeLeft = (secondsLeft?: number | null) => {
  if (secondsLeft == null) {
    return null;
  }
  if (secondsLeft <= 0) {
    return '0m left';
  }
  if (secondsLeft < 3600) {
    return `${Math.max(1, Math.ceil(secondsLeft / 60))}m left`;
  }
  return `${Math.max(1, Math.floor(secondsLeft / 3600))}h left`;
};

const parseDateOnly = (value?: string | null) => {
  if (!value) {
    return new Date(NaN);
  }

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  return new Date(value);
};

const formatDateOnly = (value?: string | null, options?: Intl.DateTimeFormatOptions) =>
  parseDateOnly(value).toLocaleDateString('en-GB', options || {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const isFutureDateOnly = (value?: string | null) => {
  const date = parseDateOnly(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date > today;
};

export default function TrainerDetailScreen({route, navigation}: any) {
  const {postId} = route.params;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hiring, setHiring] = useState(false);
  const [existingHire, setExistingHire] = useState<any>(null);
  const [blockingHire, setBlockingHire] = useState<any>(null);
  const [countdownNow, setCountdownNow] = useState(Date.now());
  const [hiresLoadedAt, setHiresLoadedAt] = useState(Date.now());
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCountdownNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [postId, post?.avatar_url]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [postRes, hiresRes] = await Promise.all([
        apiClient.get(`/trainers/${postId}`),
        apiClient.get('/trainers/hires/mine'),
      ]);
      setPost(postRes.data);
      const hires: any[] = hiresRes.data || [];
      const blockingStatuses = [
        'pending_payment',
        'pending_approval',
        'enrolled',
        'active',
      ];
      const found = hires.find(
        h =>
          Number(h.post_id) === Number(postId) &&
          blockingStatuses.includes(h.status),
      );
      setExistingHire(found || null);
      setBlockingHire(
        found || hires.find(h => blockingStatuses.includes(h.status)) || null,
      );
      const loadedAt = Date.now();
      setHiresLoadedAt(loadedAt);
      setCountdownNow(loadedAt);
    } catch (e) {
      console.error('TrainerDetail fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useFocusEffect(load);

  const isFull = post?.max_slots && post?.current_slots >= post?.max_slots;
  const isDifferentBlockingHire =
    !!blockingHire && Number(blockingHire.post_id) !== Number(postId);
  const displayedHire =
    existingHire || (isDifferentBlockingHire ? blockingHire : null);
  const getApprovalSecondsLeft = (hire: any) => {
    if (!hire || typeof hire.trainer_response_seconds_left !== 'number') {
      return null;
    }
    const elapsed = Math.max(
      0,
      Math.floor((countdownNow - hiresLoadedAt) / 1000),
    );
    return Math.max(0, hire.trainer_response_seconds_left - elapsed);
  };
  const approvalTimeLeft = formatTimeLeft(
    getApprovalSecondsLeft(displayedHire),
  );
  const awaitingTrainerApproval =
    !!displayedHire &&
    (displayedHire.status === 'pending_approval' ||
      (displayedHire.status === 'pending_payment' &&
        displayedHire.trainer_response_deadline));

  const getHireStatusLabel = () => {
    if (!displayedHire) {
      return null;
    }
    const isDifferentPost = isDifferentBlockingHire;
    if (
      displayedHire.status === 'pending_payment' &&
      displayedHire.trainer_response_deadline
    ) {
      return {
        label: isDifferentPost
          ? 'Another Hire Waiting for Trainer Decision'
          : 'Waiting for Trainer Decision',
        color: '#007AFF',
        icon: 'time-outline',
      };
    }
    if (displayedHire.status === 'pending_payment') {
      return {
        label: isDifferentPost
          ? 'Another Hire Payment Processing'
          : 'Payment Processing',
        color: '#FF9500',
        icon: 'card-outline',
      };
    }
    if (displayedHire.status === 'pending_approval') {
      return {
        label: isDifferentPost
          ? 'Another Hire Waiting for Trainer Decision'
          : 'Waiting for Trainer Decision',
        color: '#007AFF',
        icon: 'time-outline',
      };
    }
    if (displayedHire.status === 'enrolled') {
      return {
        label: isDifferentPost
          ? 'Already Enrolled Elsewhere'
          : 'Enrolled — Awaiting Program Start',
        color: '#5856D6',
        icon: 'school-outline',
      };
    }
    if (displayedHire.status === 'active') {
      return {
        label: isDifferentPost
          ? 'Another Subscription Active'
          : 'Active Subscription',
        color: '#34C759',
        icon: 'checkmark-circle-outline',
      };
    }
    return null;
  };
  const hireStatus = getHireStatusLabel();

  const isCohort =
    !!post?.program_start_date && isFutureDateOnly(post.program_start_date);
  const requiresTrainerApproval = post?.visibility === 'private';
  const avatarUrl = avatarLoadFailed
    ? null
    : resolveAvatarUrl(post?.avatar_url);
  const trainerFacts = [
    formatGender(post?.trainer_gender),
    getAge(post?.trainer_dob) != null
      ? `${getAge(post?.trainer_dob)} yrs`
      : null,
    post?.trainer_height != null ? `${Number(post.trainer_height)} cm` : null,
    post?.trainer_weight != null ? `${Number(post.trainer_weight)} kg` : null,
  ].filter(Boolean);
  const isDeadlineSoon =
    post?.enrollment_deadline &&
    (() => {
      const ms = parseDateOnly(post.enrollment_deadline).getTime() - Date.now();
      return ms > 0 && ms < 3 * 24 * 3600000; // within 3 days
    })();

  const handleHire = () => {
    const refundNotice =
      '\n\nAll payments are non-refundable. If a refund is necessary, contact fitdaptive@gmail.com.';
    const startStr = isCohort
      ? formatDateOnly(post.program_start_date, {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : null;
    const confirmMsg = isCohort
      ? `Enroll in ${post.trainer_name}'s program for ${formatPrice(
          post.price,
        )}/month?\n\nPayment is taken now. The program starts on ${startStr} — you'll be activated then along with all other enrolled members.${refundNotice}`
      : requiresTrainerApproval
      ? `Subscribe to ${post.trainer_name} for ${formatPrice(
          post.price,
        )}/month?\n\nPayment is taken now. After payment, the trainer can accept or decline your request. Your subscription starts once they accept.${refundNotice}`
      : `Subscribe to ${post.trainer_name} for ${formatPrice(
          post.price,
        )}/month?\n\nYour subscription starts immediately after payment.${refundNotice}`;
    Alert.alert('Confirm Subscription', confirmMsg, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: isCohort ? 'Enroll & Pay' : 'Proceed to Payment',
        onPress: processHire,
      },
    ]);
  };

  const processHire = async () => {
    setHiring(true);
    try {
      const res = await apiClient.post(`/trainers/${postId}/hire`);
      const {redirect_url} = res.data;
      // Open Midtrans payment page in browser
      await Linking.openURL(redirect_url);
      const paymentMessage = isCohort
        ? 'Complete the payment in your browser. Once confirmed, you will be enrolled and activated when the program starts.'
        : requiresTrainerApproval
        ? 'Complete the payment in your browser. Once confirmed, wait for the trainer to accept or decline your request.'
        : 'Complete the payment in your browser. Once confirmed, your subscription will activate automatically.';
      Alert.alert('Payment Initiated', paymentMessage, [
        {text: 'OK', onPress: () => load()},
      ]);
    } catch (e: any) {
      Alert.alert(
        'Error',
        e?.response?.data?.error || 'Failed to initiate payment.',
      );
    } finally {
      setHiring(false);
    }
  };

  const openLocationInMaps = async () => {
    if (!post?.location) {
      return;
    }

    try {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(post.location)}`;
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Failed to open Google Maps.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator
          size="large"
          color="#007AFF"
          style={{marginTop: 60}}
        />
      </View>
    );
  }
  if (!post) {
    return (
      <View style={styles.container}>
        <Text style={{textAlign: 'center', marginTop: 60, color: '#999'}}>
          Trainer not found.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          {avatarUrl ? (
            <Image
              source={{uri: avatarUrl}}
              style={styles.profileImage}
              onError={() => setAvatarLoadFailed(true)}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Icon name="person" size={54} color="#fff" />
            </View>
          )}
          <Text style={styles.trainerName}>{post.trainer_name}</Text>
          <View style={styles.ratingContainer}>
            <Icon name="star" size={18} color="#FFD700" />
            <Text style={styles.rating}> {post.avg_rating ?? '—'}</Text>
            <Text style={styles.ratingCount}>
              {' '}
              ({post.review_count} review{post.review_count !== 1 ? 's' : ''})
            </Text>
          </View>
          {!!post.trainer_phone_number && (
            <View style={styles.contactRow}>
              <Icon name="call-outline" size={15} color="#555" />
              <Text style={styles.contactText}>
                {post.trainer_phone_number}
              </Text>
            </View>
          )}
          {trainerFacts.length > 0 && (
            <View style={styles.profileFactsRow}>
              {trainerFacts.map(fact => (
                <View key={String(fact)} style={styles.profileFactChip}>
                  <Text style={styles.profileFactText}>{fact}</Text>
                </View>
              ))}
            </View>
          )}
          {!!post.trainer_bio && (
            <Text style={styles.trainerBio}>{post.trainer_bio}</Text>
          )}
          {!!post.trainer_profession && (
            <View style={styles.trainerSpecRow}>
              <Icon name="briefcase-outline" size={14} color="#FF6B35" />
              <Text style={styles.trainerSpecText}>
                {post.trainer_profession}
              </Text>
            </View>
          )}
          {!!post.trainer_experience_years && (
            <View style={styles.trainerSpecRow}>
              <Icon name="trophy-outline" size={14} color="#FF9500" />
              <Text style={[styles.trainerSpecText, {color: '#FF9500'}]}>
                {post.trainer_experience_years} years experience
              </Text>
            </View>
          )}
          {!!post.trainer_certification && (
            <View style={styles.trainerSpecRow}>
              <Icon name="ribbon-outline" size={14} color="#34C759" />
              <Text style={[styles.trainerSpecText, {color: '#34C759'}]}>
                {post.trainer_certification}
              </Text>
            </View>
          )}
        </View>

        {/* Session info chips */}
        <View style={styles.infoChipsSection}>
          {/* Visibility / slots */}
          {post.visibility === 'private' ? (
            <View style={styles.infoChip}>
              <Icon name="lock-closed-outline" size={15} color="#5856D6" />
              <Text style={[styles.infoChipText, {color: '#5856D6'}]}>
                1-on-1 Private
              </Text>
            </View>
          ) : (
            <View style={styles.infoChip}>
              <Icon name="people-outline" size={15} color="#007AFF" />
              <Text style={[styles.infoChipText, {color: '#007AFF'}]}>
                {post.max_slots
                  ? `${Math.max(
                      0,
                      post.max_slots - (post.current_slots || 0),
                    )}/${post.max_slots} slots left`
                  : 'Open Group'}
              </Text>
            </View>
          )}
          {/* Session type */}
          <View style={styles.infoChip}>
            <Icon
              name={
                post.session_type === 'offline'
                  ? 'location-outline'
                  : 'videocam-outline'
              }
              size={15}
              color={post.session_type === 'offline' ? '#FF6B35' : '#34C759'}
            />
            <Text
              style={[
                styles.infoChipText,
                {
                  color:
                    post.session_type === 'offline' ? '#FF6B35' : '#34C759',
                },
              ]}>
              {post.session_type === 'offline' ? 'Offline' : 'Online'}
            </Text>
          </View>
        </View>

        {/* Location (offline only) */}
        {post.session_type === 'offline' && !!post.location && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <TouchableOpacity
              style={styles.locationRow}
              activeOpacity={0.8}
              onPress={openLocationInMaps}>
              <Icon name="location" size={18} color="#FF6B35" />
              <Text style={styles.locationText}>{post.location}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Schedule */}
        {Array.isArray(post.schedule) && post.schedule.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Schedule</Text>
            {post.schedule.map((sc: any, i: number) => (
              <View key={i} style={styles.scheduleItem}>
                <View style={styles.scheduleDayBadge}>
                  <Text style={styles.scheduleDayText}>{sc.day}</Text>
                </View>
                <View style={styles.scheduleTimeRow}>
                  <Icon name="time-outline" size={14} color="#888" />
                  <Text style={styles.scheduleTimeText}>
                    {sc.start} – {sc.end} WIB
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {!!post.title && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Offering</Text>
            <Text style={styles.description}>{post.title}</Text>
          </View>
        )}

        {!!post.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{post.description}</Text>
          </View>
        )}

        {!!post.focus_areas && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Focus Areas</Text>
            <View style={styles.specializationContainer}>
              {post.focus_areas.split(',').map((s: string, i: number) => (
                <View key={i} style={styles.specializationBadge}>
                  <Icon name="checkmark-circle" size={15} color="#007AFF" />
                  <Text style={styles.specializationText}>{s.trim()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {!!post.services && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What You'll Get</Text>
            {post.services.split(',').map((s: string, i: number) => (
              <View key={i} style={styles.benefitItem}>
                <Icon name="checkmark-circle" size={18} color="#34C759" />
                <Text style={styles.benefitText}>{s.trim()}</Text>
              </View>
            ))}
          </View>
        )}

        {(!!post.enrollment_deadline || !!post.program_start_date) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Program Schedule</Text>
            {!!post.enrollment_deadline && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8,
                }}>
                <Icon
                  name="time-outline"
                  size={16}
                  color={isDeadlineSoon ? '#FF3B30' : '#FF9500'}
                />
                <Text
                  style={{
                    fontSize: 14,
                    color: isDeadlineSoon ? '#FF3B30' : '#555',
                    fontWeight: isDeadlineSoon ? '700' : '400',
                  }}>
                  Enrollment closes{' '}
                  {formatDateOnly(post.enrollment_deadline, {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                  {isDeadlineSoon ? ' — Closing soon!' : ''}
                </Text>
              </View>
            )}
            {!!post.program_start_date && (
              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <Icon name="calendar-outline" size={16} color="#007AFF" />
                <Text style={{fontSize: 14, color: '#555'}}>
                  Program starts{' '}
                  {formatDateOnly(post.program_start_date, {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            )}
          </View>
        )}

        {post.reviews?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {post.reviews.map((r: any) => (
              <View key={r.id} style={{marginBottom: 12}}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 4,
                  }}>
                  <Text style={{fontWeight: '600', color: '#333'}}>
                    {r.member_name}
                  </Text>
                  <View style={{flexDirection: 'row'}}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Icon
                        key={s}
                        name={s <= r.rating ? 'star' : 'star-outline'}
                        size={13}
                        color="#FFD700"
                      />
                    ))}
                  </View>
                  <Text
                    style={{fontSize: 11, color: '#bbb', marginLeft: 'auto'}}>
                    {new Date(r.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                {!!r.review && (
                  <Text style={{fontSize: 14, color: '#555'}}>{r.review}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>Monthly Subscription</Text>
          <Text style={styles.price}>{formatPrice(post.price)}/mo</Text>
        </View>
        {hireStatus ? (
          <>
            <View
              style={[
                styles.hireButton,
                {
                  backgroundColor: hireStatus.color,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                },
              ]}>
              <Icon name={hireStatus.icon} size={18} color="#fff" />
              <Text style={styles.hireButtonText}>{hireStatus.label}</Text>
            </View>
            {awaitingTrainerApproval && approvalTimeLeft && (
              <Text style={styles.statusHint}>
                {isDifferentBlockingHire
                  ? `Your current hire has ${approvalTimeLeft} left for the trainer to accept or decline`
                  : `Trainer has ${approvalTimeLeft} to accept or decline`}
              </Text>
            )}
            {isDifferentBlockingHire && !awaitingTrainerApproval && (
              <Text style={styles.statusHint}>
                Check My Subscriptions to manage your current trainer hire
                before starting another one.
              </Text>
            )}
          </>
        ) : isFull ? (
          <View style={[styles.hireButton, styles.buttonDisabled]}>
            <Text style={styles.hireButtonText}>No Slots Available</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.hireButton, hiring && styles.buttonDisabled]}
            onPress={handleHire}
            disabled={hiring}>
            {hiring ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon
                  name={isCohort ? 'school' : 'card'}
                  size={20}
                  color="#fff"
                />
                <Text style={styles.hireButtonText}>
                  {' '}
                  {isCohort ? 'Enroll Now' : 'Hire Trainer'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
