import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, Image, Linking} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {launchImageLibrary} from 'react-native-image-picker';
import {apiClient} from '../../../services/api';
import {useAuth} from '../../../store/AuthContext';
import {styles} from './styles';

function toLocalDate(value: string | Date | null | undefined) {
  if (!value) return null;

  const datePart = (value instanceof Date)
    ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
    : value.split('T')[0];

  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function todayLocal() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function hasTimePassed(date: Date, timeStr: string | null | undefined): boolean {
  if (!timeStr) return true;
  const now = new Date();
  const [h, m] = timeStr.split(':').map(Number);
  return now >= new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m, 0);
}

function getChallengeUnit(type: string | null | undefined) {
  return type === 'distance' ? 'km' : type || 'progress';
}

function formatChallengeValue(
  value: number | string | null | undefined,
  type: string | null | undefined,
  fixedDecimals = false,
) {
  const numericValue = Number(value ?? 0);
  if (type === 'distance') {
    return numericValue.toLocaleString(undefined, {
      minimumFractionDigits: fixedDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    });
  }
  return numericValue.toLocaleString();
}

export default function ChallengeDetailScreen({route, navigation}: any) {
  const {challengeId, viewOnly = false} = route.params;
  const {user} = useAuth();

  const [challenge, setChallenge] = useState<any>(null);
  const [userChallenge, setUserChallenge] = useState<any>(null);
  const [pendingRequest, setPendingRequest] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [submitNote, setSubmitNote] = useState('');
  const [submitProofImage, setSubmitProofImage] = useState<{uri: string; type: string; name: string} | null>(null);

  const load = useCallback(async () => {
    try {
      const [cRes, myRes] = await Promise.all([
        apiClient.get(`/challenges/${challengeId}`),
        viewOnly ? Promise.resolve({data: []}) : apiClient.get('/challenges/my'),
      ]);
      setChallenge(cRes.data);
      if (!viewOnly) {
        const uc = (myRes.data as any[]).find(
          (u: any) => Number(u.challenge_id) === Number(challengeId),
        );
        setUserChallenge(uc || null);
        if (uc?.has_pending_request) setPendingRequest(true);
      }
    } catch (e) {
      console.error('ChallengeDetail fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [challengeId, viewOnly]);

  useEffect(() => { load(); }, [load]);

  const handleJoin = async () => {
    setActionLoading(true);
    try {
      const res = await apiClient.post(`/challenges/${challengeId}/join`);
      setUserChallenge(res.data);
      setChallenge((prev: any) => {
        if (!prev) return prev;

        const currentCount = Number(prev.participant_count ?? 0);
        const maxParticipants = Number(prev.max_participants ?? 0);
        const nextCount = currentCount + 1;

        return {
          ...prev,
          participant_count: prev.max_participants
            ? Math.min(nextCount, maxParticipants)
            : nextCount,
        };
      });
      load().catch(() => {});
      Alert.alert('Joined!', 'You have accepted this challenge. Good luck! 💪');
    } catch (e: any) {
      const code = e?.response?.data?.code;
      if (code === 'CHALLENGE_FULL') {
        Alert.alert('Challenge Full', 'This challenge just reached its participant limit.', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      } else if (code === 'EVENT_STARTED') {
        Alert.alert('Registration Closed', 'This event has already started. Registration is no longer available.', [
          {text: 'OK', onPress: () => load()},
        ]);
      } else {
        Alert.alert('Error', e?.response?.data?.error || 'Failed to join challenge.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!userChallenge) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/challenges/user-challenge/${userChallenge.id}/submit`, {});
      Alert.alert('🎉 Reward Claimed!', 'Congratulations! Your points have been awarded.', [
        {text: 'OK', onPress: load},
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed to claim reward.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!userChallenge) return;
    setActionLoading(true);
    try {
      const formData = new FormData();
      if (submitNote.trim()) formData.append('note', submitNote.trim());
      if (submitProofImage) {
        formData.append('proof_image', {
          uri: submitProofImage.uri,
          type: submitProofImage.type,
          name: submitProofImage.name,
        } as any);
      }
      await apiClient.post(`/challenges/user-challenge/${userChallenge.id}/submit`, formData);
      setPendingRequest(true);
      setSubmitModalVisible(false);
      Alert.alert('Submitted!', 'Your completion has been submitted for review.');
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Failed to submit.';
      if (msg === 'Completion request already pending') setPendingRequest(true);
      Alert.alert('Error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#FF6B35" /></View>;
  }
  if (!challenge) {
    return <View style={styles.center}><Text style={styles.errorText}>Challenge not found.</Text></View>;
  }

  const today = todayLocal();
  const startDate = toLocalDate(challenge.start_date);
  const endDate = toLocalDate(challenge.end_date);
  const joined = !!userChallenge;
  const isCompleted = userChallenge?.status === 'completed';
  const isAuto = challenge.challenge_type === 'auto';
  const targetValue = Number(challenge.target_value ?? 0);
  const currentValue = Number(userChallenge?.current_value ?? 0);
  const challengeUnit = getChallengeUnit(challenge.type);
  const showDecimalProgress = challenge.type === 'distance';

  const isUpcoming = !!today && !!startDate && (
    today < startDate || (
      !isAuto && challenge.event_start_time && today.getTime() === startDate.getTime() && !hasTimePassed(startDate, challenge.event_start_time)
    )
  );
  const isEnded = !!today && !!endDate && (
    today > endDate || (
      !isAuto && challenge.event_end_time && today.getTime() === endDate.getTime() && hasTimePassed(endDate, challenge.event_end_time)
    )
  );
  const isActive = !isUpcoming && !isEnded && !!today && !!startDate && !!endDate && startDate <= today && endDate >= today;
  const progressPercent = joined
    && targetValue > 0
    ? Math.min((currentValue / targetValue) * 100, 100)
    : 0;
  const progressPercentLabel = showDecimalProgress
    ? progressPercent.toFixed(2)
    : Math.round(progressPercent).toString();
  const targetMet = joined && currentValue >= targetValue;
  const isReadyToClaim = isAuto && targetMet && !isCompleted;

  // For online/offline: can submit only after end_date AND event_end_time
  const canSubmitTimed = (() => {
    if (isAuto) return true;
    if (!isEnded && !isActive) return false; // upcoming, can't submit
    if (isActive) return false; // event still running
    // ended date — check time if set
    if (!challenge.event_end_time) return true;
    const now = new Date();
    const [endH, endM] = challenge.event_end_time.split(':').map(Number);
    const endDateTime = new Date(endDate!.getFullYear(), endDate!.getMonth(), endDate!.getDate(), endH, endM, 0);
    return now >= endDateTime;
  })();

  const renderActionButton = () => {
    if (viewOnly) return null;
    if (challenge.created_by === user?.id) return null;
    if (isEnded && !joined) return null; // ended and never joined

    // Not joined yet — can join if upcoming or active (auto), but not if online/offline has started
    if (!joined) {
      if (!isAuto && isActive) {
        return (
          <View style={styles.pendingBanner}>
            <Icon name="lock-closed-outline" size={18} color="#888" />
            <Text style={styles.pendingText}> Registration closed — event has started</Text>
          </View>
        );
      }
      if (isUpcoming || (isAuto && isActive)) {
        return (
          <TouchableOpacity style={styles.joinButton} onPress={handleJoin} disabled={actionLoading}>
            {actionLoading
              ? <ActivityIndicator color="#fff" />
              : <><Icon name="add-circle-outline" size={20} color="#fff" /><Text style={styles.joinButtonText}> {isUpcoming ? 'Register' : 'Accept Challenge'}</Text></>}
          </TouchableOpacity>
        );
      }
      return null;
    }

    if (isCompleted) return null;

    // Auto challenge
    if (isAuto) {
      if (!targetMet) return null;
      return (
        <TouchableOpacity style={styles.claimButton} onPress={handleClaim} disabled={actionLoading}>
          {actionLoading
            ? <ActivityIndicator color="#fff" />
            : <><Icon name="gift-outline" size={20} color="#fff" /><Text style={styles.joinButtonText}> Claim Reward</Text></>}
        </TouchableOpacity>
      );
    }

    // Online/offline: joined, waiting for event to end before submitting
    if (pendingRequest) {
      return (
        <View style={styles.pendingBanner}>
          <Icon name="time-outline" size={18} color="#FF9500" />
          <Text style={styles.pendingText}> Awaiting review by organizer</Text>
        </View>
      );
    }

    if (!canSubmitTimed) {
      const endLabel = challenge.event_end_time
        ? ` after ${challenge.event_end_time} on ${challenge.end_date?.split('T')[0]}`
        : ` after ${challenge.end_date?.split('T')[0]}`;
      return (
        <View style={styles.pendingBanner}>
          <Icon name="time-outline" size={18} color="#888" />
          <Text style={styles.pendingText}> Submission opens{endLabel}</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity style={styles.submitButton} onPress={() => { setSubmitNote(''); setSubmitProofImage(null); setSubmitModalVisible(true); }} disabled={actionLoading}>
        {actionLoading
          ? <ActivityIndicator color="#fff" />
          : <><Icon name="checkmark-done-outline" size={20} color="#fff" /><Text style={styles.joinButtonText}> Submit for Review</Text></>}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <View style={[styles.statusBadge, isActive ? styles.activeBadge : isUpcoming ? styles.activeBadge : styles.endedBadge]}>
            <Text style={styles.statusText}>{isActive ? 'Active' : isUpcoming ? 'Upcoming' : 'Ended'}</Text>
          </View>
          <View style={[styles.typeBadge, isAuto ? styles.autoBadge : styles.manualBadge]}>
            <Icon name={isAuto ? 'sync-outline' : challenge.challenge_type === 'online' ? 'globe-outline' : 'location-outline'} size={12} color={isAuto ? '#007AFF' : '#5856D6'} />
            <Text style={[styles.typeText, {color: isAuto ? '#007AFF' : '#5856D6'}]}> {isAuto ? 'Auto-tracked' : challenge.challenge_type === 'online' ? 'Online event' : 'Offline event'}</Text>
          </View>
        </View>
        <Text style={styles.title}>{challenge.title}</Text>
        <View style={styles.metaRow}>
          <Icon name="trophy" size={15} color="#FF9500" />
          <Text style={styles.metaText}>
            {' '}{challenge.points} points{isAuto ? ` • ${challenge.type}` : challenge.challenge_type === 'online' ? ' • Online event' : ' • Offline event'}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Icon name="calendar-outline" size={15} color="#888" />
          <Text style={styles.metaText}> {challenge.start_date?.split('T')[0]} – {challenge.end_date?.split('T')[0]}</Text>
        </View>
        <View style={styles.metaRow}>
          <Icon name="person-outline" size={15} color="#888" />
          <Text style={styles.metaText}> By {challenge.creator_role === 'admin' ? 'Administrator' : challenge.creator_name}</Text>
        </View>
        {challenge.max_participants && (
          <View style={styles.metaRow}>
            {(() => {
              const spots = challenge.max_participants - Number(challenge.participant_count ?? 0);
              return (
                <>
                  <Icon name="people-outline" size={15} color={spots <= 5 ? '#FF3B30' : '#34C759'} />
                  <Text style={[styles.metaText, {color: spots <= 5 ? '#FF3B30' : '#34C759', fontWeight: '600'}]}>
                    {' '}{spots} / {challenge.max_participants} spots left
                  </Text>
                </>
              );
            })()}
          </View>
        )}
      </View>

      {/* Description */}
      {!!challenge.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{challenge.description}</Text>
        </View>
      )}

      {/* Target — auto only */}
      {isAuto && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target</Text>
          <View style={styles.targetRow}>
            <Icon name="flag" size={18} color="#FF6B35" />
            <Text style={styles.target}> {formatChallengeValue(targetValue, challenge.type)} {challengeUnit}</Text>
          </View>
          <Text style={styles.autoNote}>Progress is synced automatically from your health data.</Text>
        </View>
      )}

      {/* Event details — manual only */}
      {!isAuto && (challenge.url || challenge.event_start_time || challenge.event_end_time || (challenge.challenge_type === 'offline' && challenge.location)) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event Details</Text>
          {(challenge.event_start_time || challenge.event_end_time) && (
            <View style={styles.targetRow}>
              <Icon name="time-outline" size={18} color="#FF6B35" />
              <Text style={styles.target}>
                {' '}{challenge.event_start_time} – {challenge.event_end_time}
              </Text>
            </View>
          )}
          {!!challenge.url && (
            <TouchableOpacity
              style={[styles.targetRow, {marginTop: 8}]}
              onPress={() => Linking.openURL(challenge.url)}>
              <Icon name="link-outline" size={18} color="#007AFF" />
              <Text style={[styles.target, {color: '#007AFF', textDecorationLine: 'underline'}]}> Event Link</Text>
            </TouchableOpacity>
          )}
          {challenge.challenge_type === 'offline' && !!challenge.location && (
            <TouchableOpacity
              style={[styles.targetRow, {marginTop: 8}]}
              onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(challenge.location)}`)}>
              <Icon name="location-outline" size={18} color="#FF3B30" />
              <Text style={[styles.target, {color: '#FF3B30', textDecorationLine: 'underline'}]}> {challenge.location}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Progress — only if joined and auto-tracked */}
      {joined && isAuto && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, {width: `${progressPercent}%`}, targetMet && styles.progressFillComplete]} />
          </View>
          <Text style={styles.progressText}>
            {formatChallengeValue(currentValue, challenge.type, showDecimalProgress)} / {formatChallengeValue(targetValue, challenge.type)} {challengeUnit}
            {'  '}({progressPercentLabel}%)
          </Text>
          <View style={[styles.statusChip, isCompleted ? styles.completedChip : isReadyToClaim ? styles.readyChip : styles.activeChip]}>
            <Icon
              name={isCompleted ? 'checkmark-circle' : isReadyToClaim ? 'gift-outline' : 'time-outline'}
              size={14}
              color={isCompleted ? '#34C759' : isReadyToClaim ? '#007AFF' : '#FF9500'}
            />
            <Text style={[styles.statusChipText, {color: isCompleted ? '#34C759' : isReadyToClaim ? '#007AFF' : '#FF9500'}]}>
              {' '}{isCompleted ? 'Completed' : isReadyToClaim ? 'Ready to Claim' : 'In Progress'}
            </Text>
          </View>
          <View style={styles.syncReminder}>
            <Icon name="information-circle-outline" size={15} color="#007AFF" />
            <Text style={styles.syncReminderText}>
              Open the app at the end of the day to sync your Health Connect data and keep your progress up to date.
            </Text>
          </View>
        </View>
      )}

      {/* Status chip for manual challenges */}
      {joined && !isAuto && (
        <View style={styles.section}>
          <View style={[styles.statusChip, isCompleted ? styles.completedChip : styles.activeChip]}>
            <Icon
              name={isCompleted ? 'checkmark-circle' : 'time-outline'}
              size={14}
              color={isCompleted ? '#34C759' : '#FF9500'}
            />
            <Text style={[styles.statusChipText, {color: isCompleted ? '#34C759' : '#FF9500'}]}>
              {' '}{isCompleted ? 'Completed' : 'In Progress'}
            </Text>
          </View>
        </View>
      )}

      {/* Action area */}
      {isCompleted ? (
        <View style={styles.joinedBanner}>
          <Icon name="checkmark-circle" size={20} color="#34C759" />
          <Text style={styles.joinedBannerText}> Challenge completed! Reward earned 🎉</Text>
        </View>
      ) : (
        renderActionButton()
      )}

      {/* Submit for Review Modal */}
      <Modal visible={submitModalVisible} transparent animationType="slide" onRequestClose={() => setSubmitModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Submit Completion</Text>
            <Text style={styles.modalDesc}>Provide proof of your attendance to help the organizer verify your completion.</Text>

            <Text style={styles.modalLabel}>Proof Image (optional)</Text>
            <TouchableOpacity
              style={styles.modalImagePicker}
              onPress={() => launchImageLibrary({mediaType: 'photo', quality: 0.8}, res => {
                if (res.didCancel || !res.assets?.[0]) return;
                const asset = res.assets[0];
                setSubmitProofImage({uri: asset.uri!, type: asset.type || 'image/jpeg', name: asset.fileName || 'proof.jpg'});
              })}>
              {submitProofImage ? (
                <Image source={{uri: submitProofImage.uri}} style={styles.modalImagePreview} resizeMode="cover" />
              ) : (
                <View style={styles.modalImagePlaceholder}>
                  <Icon name="camera-outline" size={28} color="#aaa" />
                  <Text style={{color: '#aaa', marginTop: 6, fontSize: 13}}>Tap to select image</Text>
                </View>
              )}
            </TouchableOpacity>
            {submitProofImage && (
              <TouchableOpacity onPress={() => setSubmitProofImage(null)} style={{alignSelf: 'flex-start', marginBottom: 8}}>
                <Text style={{fontSize: 12, color: '#FF3B30'}}>✕ Remove image</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.modalLabel}>Note (optional)</Text>
            <TextInput
              style={[styles.modalInput, {height: 80, textAlignVertical: 'top'}]}
              value={submitNote}
              onChangeText={setSubmitNote}
              placeholder="Describe how you participated..."
              placeholderTextColor="#aaa"
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setSubmitModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleSubmitForReview} disabled={actionLoading}>
                {actionLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.modalConfirmText}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
