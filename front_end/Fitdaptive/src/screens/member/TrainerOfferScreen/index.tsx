import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
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

const formatDate = (d: string) =>
  parseDateOnly(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

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

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Payment Processing',
  pending_approval: 'Waiting for Trainer Decision',
  enrolled: 'Enrolled — Awaiting Start',
  active: 'Active',
  ended: 'Ended',
  cancelled: 'Cancelled',
  expired: 'Expired — Trainer Did Not Respond',
};
const STATUS_COLOR: Record<string, string> = {
  pending_payment: '#FF9500',
  pending_approval: '#007AFF',
  enrolled: '#5856D6',
  active: '#34C759',
  ended: '#999',
  cancelled: '#FF3B30',
  expired: '#FF6B35',
};

const getDisputeNotice = (hire: any) => {
  if (!hire.latest_dispute_status) {
    return null;
  }

  if (hire.latest_dispute_status === 'open') {
    return {
      icon: 'warning-outline',
      color: '#FF9500',
      text: 'Dispute under review by admin',
    };
  }

  const note = hire.latest_dispute_admin_note
    ? `: ${hire.latest_dispute_admin_note}`
    : '';

  if (hire.latest_dispute_status === 'resolved') {
    return {
      icon: 'checkmark-circle-outline',
      color: '#34C759',
      text: `Dispute resolved${note}`,
    };
  }

  return {
    icon: 'close-circle-outline',
    color: '#FF3B30',
    text: `Dispute rejected${note}`,
  };
};

export default function TrainerOfferScreen({navigation}: any) {
  const [hires, setHires] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingHireId, setActingHireId] = useState<number | null>(null);
  const [countdownNow, setCountdownNow] = useState(Date.now());
  const [hiresLoadedAt, setHiresLoadedAt] = useState(Date.now());
  const [failedAvatarIds, setFailedAvatarIds] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    const timer = setInterval(() => setCountdownNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get('/trainers/hires/mine');
      setHires(res.data);
      setFailedAvatarIds({});
      const loadedAt = Date.now();
      setHiresLoadedAt(loadedAt);
      setCountdownNow(loadedAt);
    } catch (e) {
      console.error('TrainerOffers fetch error:', e);
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

  const handleRequestEnd = (hire: any) => {
    Alert.alert(
      'Request End Subscription',
      `Ask ${hire.trainer_name} to end this subscription early? The subscription will only end if they accept.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Send Request',
          onPress: async () => {
            setActingHireId(hire.id);
            try {
              await apiClient.put(`/trainers/hires/${hire.id}/end-request`);
              Alert.alert(
                'Request Sent',
                'Your trainer has been asked to end the subscription.',
              );
              load();
            } catch (e: any) {
              Alert.alert(
                'Error',
                e?.response?.data?.error || 'Failed to send end request.',
              );
            } finally {
              setActingHireId(null);
            }
          },
        },
      ],
    );
  };

  const handleRespondEndRequest = (hire: any, action: 'accept' | 'reject') => {
    const isAccept = action === 'accept';
    Alert.alert(
      isAccept ? 'End Subscription' : 'Keep Subscription',
      isAccept
        ? `End your subscription with ${hire.trainer_name} by agreement?`
        : `Reject ${hire.trainer_name}'s request and keep the subscription active?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: isAccept ? 'Accept' : 'Reject Request',
          style: isAccept ? 'destructive' : 'default',
          onPress: async () => {
            setActingHireId(hire.id);
            try {
              await apiClient.put(
                `/trainers/hires/${hire.id}/end-request/respond`,
                {action},
              );
              Alert.alert(
                isAccept ? 'Subscription Ended' : 'Request Rejected',
                isAccept
                  ? 'The subscription has been ended by agreement.'
                  : 'The subscription remains active.',
              );
              load();
            } catch (e: any) {
              Alert.alert(
                'Error',
                e?.response?.data?.error || 'Failed to respond to end request.',
              );
            } finally {
              setActingHireId(null);
            }
          },
        },
      ],
    );
  };

  const openChat = (hire: any) => {
    navigation.navigate('Chat', {
      receiverId: hire.trainer_user_id,
      receiverName: hire.trainer_name,
    });
  };

  const openSessions = (hire: any) => {
    navigation.navigate('MemberSessions', {
      hireId: hire.id,
      trainerName: hire.trainer_name,
      hireStatus: hire.status,
    });
  };

  const openDispute = (hire: any) => {
    navigation.navigate('MemberSessions', {
      hireId: hire.id,
      trainerName: hire.trainer_name,
      hireStatus: hire.status,
      openDispute: true,
    });
  };

  const openTrainerDetail = (hire: any) => {
    navigation.navigate('TrainerDetail', {postId: hire.post_id});
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

  const normalizeStatus = (hire: any) =>
    hire.status === 'pending_payment' && hire.trainer_response_deadline
      ? 'pending_approval'
      : hire.status;

  const displayStatus = (hire: any) =>
    hire.status === 'cancelled' && hire.trainer_response_deadline
      ? 'expired'
      : normalizeStatus(hire);

  const getApprovalSecondsLeft = (hire: any) => {
    if (typeof hire.trainer_response_seconds_left !== 'number') {
      return null;
    }
    const elapsed = Math.max(
      0,
      Math.floor((countdownNow - hiresLoadedAt) / 1000),
    );
    return Math.max(0, hire.trainer_response_seconds_left - elapsed);
  };

  const active = hires.filter(h => normalizeStatus(h) === 'active');
  const pending = hires.filter(h =>
    ['pending_payment', 'pending_approval', 'enrolled'].includes(
      normalizeStatus(h),
    ),
  );
  const past = hires.filter(h =>
    ['ended', 'cancelled', 'expired'].includes(displayStatus(h)),
  );

  const renderCard = (hire: any) => {
    const ds = displayStatus(hire);
    const hireId = String(hire.id);
    const avatarUrl = failedAvatarIds[hireId]
      ? null
      : resolveAvatarUrl(hire.trainer_avatar);
    const approvalTimeLeft = formatTimeLeft(getApprovalSecondsLeft(hire));
    const memberRequestedEnd = hire.early_end_requested_by === 'member';
    const trainerRequestedEnd = hire.early_end_requested_by === 'trainer';
    const hasOpenDispute = Boolean(hire.has_open_dispute);
    const disputeNotice = getDisputeNotice(hire);
    const canOpenPreActiveChat =
      (hire.visibility === 'private' &&
        ['pending_payment', 'pending_approval'].includes(ds)) ||
      (hire.visibility === 'public' && ds === 'enrolled');
    return (
      <View key={hire.id} style={styles.card}>
        <View style={styles.cardHeader}>
          {avatarUrl ? (
            <Image
              source={{uri: avatarUrl}}
              style={styles.avatar}
              onError={() =>
                setFailedAvatarIds(prev => ({...prev, [hireId]: true}))
              }
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {hire.trainer_name?.charAt(0)}
              </Text>
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.trainerName}>{hire.trainer_name}</Text>
            <View
              style={[
                styles.statusBadge,
                {backgroundColor: (STATUS_COLOR[ds] ?? '#999') + '20'},
              ]}>
              <Text
                style={[
                  styles.statusText,
                  {color: STATUS_COLOR[ds] ?? '#999'},
                ]}>
                {STATUS_LABEL[ds] ?? hire.status}
              </Text>
            </View>
          </View>
          <Text style={styles.price}>
            {formatPrice(hire.price)}
            <Text style={styles.priceSuffix}>/mo</Text>
          </Text>
        </View>

        <Text style={styles.dateText} numberOfLines={1}>
          {hire.title}
        </Text>

        {hire.trainer_phone_number && (
          <View style={styles.contactRow}>
            <Icon name="call-outline" size={13} color="#666" />
            <Text style={styles.dateText}>{hire.trainer_phone_number}</Text>
          </View>
        )}

        {hire.start_date && hire.status === 'active' && (
          <View style={styles.dateRow}>
            <Icon name="calendar-outline" size={13} color="#666" />
            <Text style={styles.dateText}>
              {' '}
              {formatDate(hire.start_date)} – {formatDate(hire.end_date)}
            </Text>
          </View>
        )}

        {hire.status === 'active' && memberRequestedEnd && (
          <View style={styles.activeInfo}>
            <Icon name="hourglass-outline" size={15} color="#FF9500" />
            <Text style={[styles.activeInfoText, {color: '#FF9500'}]}>
              {' '}
              End request sent to trainer
            </Text>
          </View>
        )}

        {hire.status === 'active' && trainerRequestedEnd && (
          <View style={styles.activeInfo}>
            <Icon name="warning-outline" size={15} color="#FF6B35" />
            <Text style={[styles.activeInfoText, {color: '#FF6B35'}]}>
              {' '}
              Trainer requested to end this subscription
            </Text>
          </View>
        )}

        {hire.status === 'ended' && disputeNotice && (
          <View style={styles.activeInfo}>
            <Icon
              name={disputeNotice.icon}
              size={15}
              color={disputeNotice.color}
            />
            <Text
              style={[
                styles.activeInfoText,
                {color: disputeNotice.color},
              ]}>{` ${disputeNotice.text}`}</Text>
          </View>
        )}

        <View style={styles.actions}>
          {(hire.status === 'active' || hire.status === 'enrolled') &&
            hire.visibility === 'public' && (
              <TouchableOpacity
                style={styles.rateButton}
                onPress={() =>
                  navigation.navigate('MemberAnnouncements', {
                    postId: hire.post_id,
                    postTitle: hire.title,
                    trainerName: hire.trainer_name,
                  })
                }>
                <Icon name="megaphone-outline" size={15} color="#fff" />
                <Text style={styles.rateButtonText}> Announcements</Text>
              </TouchableOpacity>
            )}
          {canOpenPreActiveChat && (
            <TouchableOpacity
              style={styles.rateButton}
              onPress={() => openChat(hire)}>
              <Icon name="chatbubble-outline" size={15} color="#fff" />
              <Text style={styles.rateButtonText}> Chat</Text>
            </TouchableOpacity>
          )}
          {hire.status === 'active' && (
            <>
              <TouchableOpacity
                style={styles.rateButton}
                onPress={() => openChat(hire)}>
                <Icon name="chatbubble-outline" size={15} color="#fff" />
                <Text style={styles.rateButtonText}> Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rateButton, {backgroundColor: '#5856D6'}]}
                onPress={() => openSessions(hire)}>
                <Icon name="checkmark-done-outline" size={15} color="#fff" />
                <Text style={styles.rateButtonText}> Sessions</Text>
              </TouchableOpacity>
              {!hasOpenDispute && (
                <TouchableOpacity
                  style={[styles.renewButton, {borderColor: '#FF9500'}]}
                  onPress={() => openDispute(hire)}>
                  <Icon name="warning-outline" size={15} color="#FF9500" />
                  <Text style={[styles.renewButtonText, {color: '#FF9500'}]}>
                    Report Issue
                  </Text>
                </TouchableOpacity>
              )}
              {!hire.early_end_requested_by && (
                <TouchableOpacity
                  style={[styles.renewButton, {borderColor: '#FF3B30'}]}
                  onPress={() => handleRequestEnd(hire)}
                  disabled={actingHireId === hire.id}>
                  {actingHireId === hire.id ? (
                    <ActivityIndicator size="small" color="#FF3B30" />
                  ) : (
                    <>
                      <Icon
                        name="close-circle-outline"
                        size={15}
                        color="#FF3B30"
                      />
                      <Text
                        style={[styles.renewButtonText, {color: '#FF3B30'}]}>
                        {' '}
                        Request End
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {trainerRequestedEnd && (
                <>
                  <TouchableOpacity
                    style={[styles.rateButton, {backgroundColor: '#FF3B30'}]}
                    onPress={() => handleRespondEndRequest(hire, 'accept')}
                    disabled={actingHireId === hire.id}>
                    {actingHireId === hire.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Icon
                          name="checkmark-circle-outline"
                          size={15}
                          color="#fff"
                        />
                        <Text style={styles.rateButtonText}> Accept End</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.renewButton, {borderColor: '#34C759'}]}
                    onPress={() => handleRespondEndRequest(hire, 'reject')}
                    disabled={actingHireId === hire.id}>
                    <Icon name="arrow-undo-outline" size={15} color="#34C759" />
                    <Text style={[styles.renewButtonText, {color: '#34C759'}]}>
                      {' '}
                      Keep Active
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
          {hire.status === 'ended' && (
            <>
              <TouchableOpacity
                style={[styles.rateButton, {backgroundColor: '#5856D6'}]}
                onPress={() => openSessions(hire)}>
                <Icon name="checkmark-done-outline" size={15} color="#fff" />
                <Text style={styles.rateButtonText}> Sessions</Text>
              </TouchableOpacity>
              {hire.has_review ? (
                <View style={[styles.rateButton, {backgroundColor: '#34C759'}]}>
                  <Icon name="checkmark-circle" size={15} color="#fff" />
                  <Text style={styles.rateButtonText}> Reviewed</Text>
                </View>
              ) : hire.can_review ? (
                <TouchableOpacity
                  style={styles.rateButton}
                  onPress={() =>
                    navigation.navigate('RateTrainer', {
                      subscription: {
                        hireId: hire.id,
                        trainerName: hire.trainer_name,
                        postId: hire.post_id,
                        visibility: hire.visibility,
                      },
                    })
                  }>
                  <Icon name="star-outline" size={15} color="#fff" />
                  <Text style={styles.rateButtonText}> Rate Trainer</Text>
                </TouchableOpacity>
              ) : hasOpenDispute ? (
                <View style={[styles.renewButton, {borderColor: '#FF9500'}]}>
                  <Icon name="warning-outline" size={15} color="#FF9500" />
                  <Text style={[styles.renewButtonText, {color: '#FF9500'}]}>
                    {' '}
                    Review Locked
                  </Text>
                </View>
              ) : null}
              {!!hire.post_id && (
                <TouchableOpacity
                  style={[styles.rateButton, {backgroundColor: '#FF6B35'}]}
                  onPress={() => openTrainerDetail(hire)}>
                  <Icon
                    name={
                      hire.visibility === 'private'
                        ? 'person-outline'
                        : 'refresh-outline'
                    }
                    size={15}
                    color="#fff"
                  />
                  <Text style={styles.rateButtonText}>
                    {hire.visibility === 'private'
                      ? ' Rehire Trainer'
                      : ' Hire Again'}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
          {hire.status === 'enrolled' && (
            <View style={styles.activeInfo}>
              <Icon name="school-outline" size={15} color="#5856D6" />
              <Text style={[styles.activeInfoText, {color: '#5856D6'}]}>
                {hire.program_start_date
                  ? ` Program starts ${parseDateOnly(
                      hire.program_start_date,
                    ).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}`
                  : ' Enrolled — awaiting program start'}
              </Text>
            </View>
          )}
          {ds === 'pending_approval' && (
            <View style={styles.activeInfo}>
              <Icon name="time-outline" size={15} color="#007AFF" />
              <Text style={[styles.activeInfoText, {color: '#007AFF'}]}>
                {approvalTimeLeft
                  ? ` Trainer has ${approvalTimeLeft} to accept or decline`
                  : ' Waiting for trainer to accept or decline'}
              </Text>
            </View>
          )}
          {ds === 'pending_payment' && (
            <View style={styles.activeInfo}>
              <Icon name="card-outline" size={15} color="#FF9500" />
              <Text style={[styles.activeInfoText, {color: '#FF9500'}]}>
                {' '}
                Waiting for payment confirmation. Then the trainer can accept or
                decline your request.
              </Text>
            </View>
          )}
          {ds === 'expired' && (
            <TouchableOpacity
              style={[styles.rateButton, {backgroundColor: '#FF6B35'}]}
              onPress={() => openTrainerDetail(hire)}>
              <Icon name="refresh-outline" size={15} color="#fff" />
              <Text style={styles.rateButtonText}> Hire Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          colors={['#007AFF']}
        />
      }>
      <Text style={styles.sectionLabel}>Active</Text>
      {active.length === 0 ? (
        <Text style={styles.empty}>No active subscriptions.</Text>
      ) : (
        active.map(renderCard)
      )}

      <Text style={styles.sectionLabel}>Pending</Text>
      {pending.length === 0 ? (
        <Text style={styles.empty}>No pending requests.</Text>
      ) : (
        pending.map(renderCard)
      )}

      <Text style={styles.sectionLabel}>Past</Text>
      {past.length === 0 ? (
        <Text style={styles.empty}>No past subscriptions.</Text>
      ) : (
        past.map(renderCard)
      )}
    </ScrollView>
  );
}
