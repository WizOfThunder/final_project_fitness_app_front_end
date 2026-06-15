import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../../../services/api';
import {useAuth} from '../../../store/AuthContext';
import {styles} from './styles';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', {
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
    return {
      label: '0m left',
      urgent: true,
    };
  }
  if (secondsLeft < 3600) {
    return {
      label: `${Math.max(1, Math.ceil(secondsLeft / 60))}m left`,
      urgent: true,
    };
  }
  const hours = Math.max(1, Math.floor(secondsLeft / 3600));
  return {
    label: `${hours}h left`,
    urgent: hours <= 6,
  };
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

const getClientFacts = (item: any) => {
  const facts = [];
  const age = getAge(item.member_dob);
  const gender = formatGender(item.member_gender);

  if (gender) {
    facts.push(gender);
  }
  if (age != null) {
    facts.push(`${age} yrs`);
  }
  if (item.member_height != null) {
    facts.push(`${Number(item.member_height)} cm`);
  }
  if (item.member_weight != null) {
    facts.push(`${Number(item.member_weight)} kg`);
  }

  return facts;
};

const PAST_STATUS_LABEL: Record<string, string> = {
  ended: 'Ended',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

const PAST_STATUS_COLOR: Record<string, string> = {
  ended: '#999',
  cancelled: '#FF3B30',
  expired: '#FF6B35',
};

export default function TrainerHireManagementScreen({navigation, route}: any) {
  const {notifRefreshKey} = useAuth();
  const [tab, setTab] = useState<'pending' | 'active' | 'past'>('pending');
  const [pending, setPending] = useState<any[]>([]);
  const [active, setActive] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState<number | null>(null);
  const [countdownNow, setCountdownNow] = useState(Date.now());
  const [pendingLoadedAt, setPendingLoadedAt] = useState(Date.now());
  const [failedAvatarIds, setFailedAvatarIds] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    const timer = setInterval(() => setCountdownNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const load = useCallback(async () => {
    try {
      const [pRes, aRes, pastRes] = await Promise.all([
        apiClient.get('/trainers/hires/pending'),
        apiClient.get('/trainers/hires/active'),
        apiClient.get('/trainers/hires/past'),
      ]);
      setPending(pRes.data);
      setActive(aRes.data);
      setPast(pastRes.data);
      setFailedAvatarIds({});
      const loadedAt = Date.now();
      setPendingLoadedAt(loadedAt);
      setCountdownNow(loadedAt);
    } catch (e) {
      console.error('TrainerHireManagement fetch error:', e);
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

  useEffect(() => {
    if (notifRefreshKey > 0) {
      load();
    }
  }, [notifRefreshKey, load]);

  useEffect(() => {
    const requestedTab = route?.params?.initialTab;
    if (
      requestedTab === 'pending' ||
      requestedTab === 'active' ||
      requestedTab === 'past'
    ) {
      setTab(requestedTab);
    }
  }, [route?.params?.initialTab]);

  const handleAccept = (hire: any) => {
    Alert.alert(
      'Accept Request',
      `Accept ${hire.member_name}'s subscription request for ${formatPrice(
        hire.price,
      )}/month?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Accept',
          onPress: async () => {
            setActing(hire.id);
            try {
              await apiClient.put(`/trainers/hires/${hire.id}/accept`);
              Alert.alert(
                'Accepted!',
                `${hire.member_name} is now your client.`,
              );
              load();
            } catch (e: any) {
              Alert.alert(
                'Error',
                e?.response?.data?.error || 'Failed to accept.',
              );
            } finally {
              setActing(null);
            }
          },
        },
      ],
    );
  };

  const handleDecline = (hire: any) => {
    Alert.alert(
      'Decline Request',
      `Decline ${hire.member_name}'s request? Their payment will be refunded.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setActing(hire.id);
            try {
              await apiClient.put(`/trainers/hires/${hire.id}/decline`);
              Alert.alert(
                'Declined',
                'The request has been declined and payment refunded.',
              );
              load();
            } catch (e: any) {
              Alert.alert(
                'Error',
                e?.response?.data?.error || 'Failed to decline.',
              );
            } finally {
              setActing(null);
            }
          },
        },
      ],
    );
  };

  const openChat = (hire: any) => {
    navigation.navigate('Chat', {
      receiverId: hire.member_user_id,
      receiverName: hire.member_name,
    });
  };

  const handleRequestEnd = (hire: any) => {
    Alert.alert(
      'Request End Subscription',
      `Ask ${hire.member_name} to end this subscription early? It will only end if they accept.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Send Request',
          onPress: async () => {
            setActing(hire.id);
            try {
              await apiClient.put(`/trainers/hires/${hire.id}/end-request`);
              Alert.alert(
                'Request Sent',
                'The member has been asked to end the subscription.',
              );
              load();
            } catch (e: any) {
              Alert.alert(
                'Error',
                e?.response?.data?.error || 'Failed to send end request.',
              );
            } finally {
              setActing(null);
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
        ? `End your subscription with ${hire.member_name} by agreement?`
        : `Reject ${hire.member_name}'s request and keep the subscription active?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: isAccept ? 'Accept' : 'Reject Request',
          style: isAccept ? 'destructive' : 'default',
          onPress: async () => {
            setActing(hire.id);
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
              setActing(null);
            }
          },
        },
      ],
    );
  };

  const getApprovalSecondsLeft = (hire: any) => {
    if (typeof hire.trainer_response_seconds_left !== 'number') {
      return null;
    }
    const elapsed = Math.max(
      0,
      Math.floor((countdownNow - pendingLoadedAt) / 1000),
    );
    return Math.max(0, hire.trainer_response_seconds_left - elapsed);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, tab === 'pending' && styles.tabActive]}
          onPress={() => setTab('pending')}>
          <Text
            style={[styles.tabText, tab === 'pending' && styles.tabTextActive]}>
            Pending{pending.length > 0 ? ` (${pending.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'active' && styles.tabActive]}
          onPress={() => setTab('active')}>
          <Text
            style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>
            Active Clients{active.length > 0 ? ` (${active.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'past' && styles.tabActive]}
          onPress={() => setTab('past')}>
          <Text
            style={[styles.tabText, tab === 'past' && styles.tabTextActive]}>
            Past{past.length > 0 ? ` (${past.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'pending' ? (
        <FlatList
          data={pending}
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
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="time-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No pending requests</Text>
            </View>
          }
          renderItem={({item}) => {
            const itemId = String(item.id);
            const avatarUrl = failedAvatarIds[itemId]
              ? null
              : resolveAvatarUrl(item.member_avatar);
            const memberFacts = getClientFacts(item);
            const dl = formatTimeLeft(getApprovalSecondsLeft(item));
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  {avatarUrl ? (
                    <Image
                      source={{uri: avatarUrl}}
                      style={styles.avatar}
                      onError={() =>
                        setFailedAvatarIds(prev => ({...prev, [itemId]: true}))
                      }
                    />
                  ) : (
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {item.member_name?.charAt(0)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.info}>
                    <Text style={styles.name}>{item.member_name}</Text>
                    <Text style={styles.sub}>{item.title}</Text>
                    <Text style={styles.price}>
                      {formatPrice(item.price)}/mo
                    </Text>
                    {!!item.member_phone_number && (
                      <View style={styles.contactRow}>
                        <Icon name="call-outline" size={13} color="#666" />
                        <Text style={styles.contactText}>
                          {item.member_phone_number}
                        </Text>
                      </View>
                    )}
                    {memberFacts.length > 0 && (
                      <View style={styles.profileFactsRow}>
                        {memberFacts.map(fact => (
                          <View key={fact} style={styles.profileFactChip}>
                            <Text style={styles.profileFactText}>{fact}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.dateText}>
                  Requested: {formatDate(item.created_at)}
                </Text>
                {dl && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      marginTop: 4,
                    }}>
                    <Icon
                      name="time-outline"
                      size={13}
                      color={dl.urgent ? '#FF3B30' : '#888'}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        color: dl.urgent ? '#FF3B30' : '#888',
                        fontWeight: dl.urgent ? '600' : '400',
                      }}>
                      {dl.label}
                    </Text>
                  </View>
                )}
                <View style={styles.actions}>
                  {acting === item.id ? (
                    <ActivityIndicator color="#FF6B35" />
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.chatBtn}
                        onPress={() => openChat(item)}>
                        <Icon
                          name="chatbubble-outline"
                          size={16}
                          color="#fff"
                        />
                        <Text style={styles.btnText}> Chat</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.acceptBtn}
                        onPress={() => handleAccept(item)}>
                        <Icon name="checkmark" size={16} color="#fff" />
                        <Text style={styles.btnText}> Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.declineBtn}
                        onPress={() => handleDecline(item)}>
                        <Icon name="close" size={16} color="#fff" />
                        <Text style={styles.btnText}> Decline</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            );
          }}
        />
      ) : tab === 'active' ? (
        <FlatList
          data={active}
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
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="people-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No active clients</Text>
            </View>
          }
          renderItem={({item, index}) => {
            const itemId = String(item.id);
            const avatarUrl = failedAvatarIds[itemId]
              ? null
              : resolveAvatarUrl(item.member_avatar);
            const memberFacts = getClientFacts(item);
            const prevItem = active[index - 1];
            const showPostHeader =
              !prevItem || prevItem.post_id !== item.post_id;
            const memberRequestedEnd = item.early_end_requested_by === 'member';
            const trainerRequestedEnd =
              item.early_end_requested_by === 'trainer';
            return (
              <>
                {showPostHeader && (
                  <TouchableOpacity
                    style={styles.postHeader}
                    onPress={() =>
                      item.visibility === 'public'
                        ? navigation.navigate('PostAnnouncements', {
                            postId: item.post_id,
                            postTitle: item.title,
                            memberCount: active.filter(
                              (h: any) => h.post_id === item.post_id,
                            ).length,
                          })
                        : null
                    }
                    activeOpacity={item.visibility === 'public' ? 0.7 : 1}>
                    <Icon
                      name={
                        item.visibility === 'private'
                          ? 'lock-closed-outline'
                          : 'people-outline'
                      }
                      size={13}
                      color="#FF6B35"
                    />
                    <Text style={styles.postHeaderText}> {item.title}</Text>
                    {item.visibility === 'public' && (
                      <>
                        <Icon
                          name="megaphone-outline"
                          size={13}
                          color="#FF6B35"
                          style={{marginLeft: 8}}
                        />
                        <Text style={styles.postHeaderText}>
                          {' '}
                          Announcements
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    {avatarUrl ? (
                      <Image
                        source={{uri: avatarUrl}}
                        style={styles.avatar}
                        onError={() =>
                          setFailedAvatarIds(prev => ({...prev, [itemId]: true}))
                        }
                      />
                    ) : (
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {item.member_name?.charAt(0)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.info}>
                      <Text style={styles.name}>{item.member_name}</Text>
                      <View style={styles.dateRow}>
                        <Icon name="calendar-outline" size={13} color="#888" />
                        <Text style={styles.dateText}>
                          {' '}
                          {formatDate(item.start_date)} –{' '}
                          {formatDate(item.end_date)}
                        </Text>
                      </View>
                      {!!item.member_phone_number && (
                        <View style={styles.contactRow}>
                          <Icon name="call-outline" size={13} color="#666" />
                          <Text style={styles.contactText}>
                            {item.member_phone_number}
                          </Text>
                        </View>
                      )}
                      {memberFacts.length > 0 && (
                        <View style={styles.profileFactsRow}>
                          {memberFacts.map(fact => (
                            <View key={fact} style={styles.profileFactChip}>
                              <Text style={styles.profileFactText}>{fact}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                  {item.status === 'active' && memberRequestedEnd && (
                    <View style={styles.noticeRow}>
                      <Icon name="warning-outline" size={14} color="#FF6B35" />
                      <Text style={[styles.noticeText, {color: '#FF6B35'}]}>
                        {' '}
                        Member requested to end this subscription
                      </Text>
                    </View>
                  )}
                  {item.status === 'active' && trainerRequestedEnd && (
                    <View style={styles.noticeRow}>
                      <Icon
                        name="hourglass-outline"
                        size={14}
                        color="#FF9500"
                      />
                      <Text style={[styles.noticeText, {color: '#FF9500'}]}>
                        {' '}
                        End request sent to member
                      </Text>
                    </View>
                  )}
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.chatBtn}
                      onPress={() => openChat(item)}>
                      <Icon name="chatbubble-outline" size={16} color="#fff" />
                      <Text style={styles.btnText}> Chat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.chatBtn, {backgroundColor: '#FF6B35'}]}
                      onPress={() =>
                        navigation.navigate('TrainerSessions', {
                          hireId: item.id,
                          memberName: item.member_name,
                          memberId: item.member_user_id,
                        })
                      }>
                      <Icon
                        name="checkmark-done-outline"
                        size={16}
                        color="#fff"
                      />
                      <Text style={styles.btnText}> Sessions</Text>
                    </TouchableOpacity>
                    {item.status === 'active' &&
                      !item.early_end_requested_by && (
                        <TouchableOpacity
                          style={[styles.chatBtn, {backgroundColor: '#FF3B30'}]}
                          onPress={() => handleRequestEnd(item)}
                          disabled={acting === item.id}>
                          {acting === item.id ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Icon
                                name="close-circle-outline"
                                size={16}
                                color="#fff"
                              />
                              <Text style={styles.btnText}> Request End</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    {item.status === 'active' && memberRequestedEnd && (
                      <>
                        <TouchableOpacity
                          style={[styles.chatBtn, {backgroundColor: '#FF3B30'}]}
                          onPress={() =>
                            handleRespondEndRequest(item, 'accept')
                          }
                          disabled={acting === item.id}>
                          {acting === item.id ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Icon
                                name="checkmark-circle-outline"
                                size={16}
                                color="#fff"
                              />
                              <Text style={styles.btnText}> Accept End</Text>
                            </>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.chatBtn, {backgroundColor: '#34C759'}]}
                          onPress={() =>
                            handleRespondEndRequest(item, 'reject')
                          }
                          disabled={acting === item.id}>
                          <Icon
                            name="arrow-undo-outline"
                            size={16}
                            color="#fff"
                          />
                          <Text style={styles.btnText}> Keep Active</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              </>
            );
          }}
        />
      ) : (
        <FlatList
          data={past}
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
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="archive-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No past hires</Text>
            </View>
          }
          renderItem={({item}) => {
            const itemId = String(item.id);
            const avatarUrl = failedAvatarIds[itemId]
              ? null
              : resolveAvatarUrl(item.member_avatar);
            const memberFacts = getClientFacts(item);
            const statusLabel = PAST_STATUS_LABEL[item.status] || item.status;
            const statusColor = PAST_STATUS_COLOR[item.status] || '#999';
            const disputeText = item.latest_dispute_status
              ? item.latest_dispute_status === 'open'
                ? 'Dispute currently open'
                : `${
                    item.latest_dispute_status === 'resolved'
                      ? 'Dispute resolved'
                      : 'Dispute rejected'
                  }${
                    item.latest_dispute_admin_note
                      ? `: ${item.latest_dispute_admin_note}`
                      : ''
                  }`
              : null;

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  {avatarUrl ? (
                    <Image
                      source={{uri: avatarUrl}}
                      style={styles.avatar}
                      onError={() =>
                        setFailedAvatarIds(prev => ({...prev, [itemId]: true}))
                      }
                    />
                  ) : (
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {item.member_name?.charAt(0)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.info}>
                    <Text style={styles.name}>{item.member_name}</Text>
                    <Text style={styles.sub}>{item.title}</Text>
                    <Text style={styles.dateText}>
                      {item.start_date && item.end_date
                        ? `${formatDate(item.start_date)} – ${formatDate(
                            item.end_date,
                          )}`
                        : `Requested: ${formatDate(item.created_at)}`}
                    </Text>
                    {!!item.member_phone_number && (
                      <View style={styles.contactRow}>
                        <Icon name="call-outline" size={13} color="#666" />
                        <Text style={styles.contactText}>
                          {item.member_phone_number}
                        </Text>
                      </View>
                    )}
                    {memberFacts.length > 0 && (
                      <View style={styles.profileFactsRow}>
                        {memberFacts.map(fact => (
                          <View key={fact} style={styles.profileFactChip}>
                            <Text style={styles.profileFactText}>{fact}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                  <View
                    style={{
                      alignSelf: 'flex-start',
                      backgroundColor: `${statusColor}20`,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 999,
                    }}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: statusColor,
                      }}>
                      {statusLabel}
                    </Text>
                  </View>
                </View>

                {item.has_review ? (
                  <View style={styles.noticeRow}>
                    <Icon name="star" size={14} color="#FF9500" />
                    <Text style={[styles.noticeText, {color: '#FF9500'}]}>
                      {' '}
                      Review received
                      {item.review_rating ? ` (${item.review_rating}/5)` : ''}
                    </Text>
                  </View>
                ) : item.status === 'ended' &&
                  item.latest_dispute_status !== 'resolved' ? (
                  <View style={styles.noticeRow}>
                    <Icon name="time-outline" size={14} color="#007AFF" />
                    <Text style={[styles.noticeText, {color: '#007AFF'}]}>
                      {' '}
                      Awaiting member review
                    </Text>
                  </View>
                ) : null}

                {!!disputeText && (
                  <View style={styles.noticeRow}>
                    <Icon
                      name={
                        item.latest_dispute_status === 'resolved'
                          ? 'checkmark-circle-outline'
                          : item.latest_dispute_status === 'rejected'
                          ? 'close-circle-outline'
                          : 'warning-outline'
                      }
                      size={14}
                      color={
                        item.latest_dispute_status === 'resolved'
                          ? '#34C759'
                          : item.latest_dispute_status === 'rejected'
                          ? '#FF3B30'
                          : '#FF9500'
                      }
                    />
                    <Text
                      style={[
                        styles.noticeText,
                        {
                          color:
                            item.latest_dispute_status === 'resolved'
                              ? '#34C759'
                              : item.latest_dispute_status === 'rejected'
                              ? '#FF3B30'
                              : '#FF9500',
                        },
                      ]}>
                      {' '}
                      {disputeText}
                    </Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
