import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../../../services/api';
import {styles} from './styles';

const RateTrainerScreen = ({route, navigation}: any) => {
  const {subscription} = route.params;
  const hireId = subscription.hireId ?? subscription.subscriptionId;
  const trainerName = subscription.trainerName;
  const postId = subscription.postId;
  const visibility = subscription.visibility;
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sessionStats, setSessionStats] = useState<any>(null);
  const [dispute, setDispute] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      apiClient.get(`/sessions/hire/${hireId}`),
      apiClient
        .get(`/sessions/hire/${hireId}/dispute`)
        .catch(() => ({data: null})),
    ])
      .then(([sessionRes, disputeRes]) => {
        setSessionStats(sessionRes.data.stats);
        setDispute(disputeRes.data);
      })
      .catch(() => {});
  }, [hireId]);

  const attended = Number(sessionStats?.confirmed || 0);
  const total = Number(sessionStats?.total || 0);
  const meetsGate = total === 0 || attended >= Math.ceil(total * 0.5);
  const hasOpenDispute = dispute?.status === 'open';

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert(
        'Rating Required',
        'Please select a star rating before submitting.',
      );
      return;
    }

    if (hasOpenDispute) {
      Alert.alert(
        'Review Unavailable',
        'You can submit a review after your dispute has been resolved.',
      );
      return;
    }

    Alert.alert(
      'Submit Review',
      `Submit ${rating}-star rating for ${subscription.trainerName}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Submit',
          onPress: async () => {
            setSubmitting(true);
            try {
              await apiClient.post(`/trainers/hires/${hireId}/review`, {
                rating,
                review: review || null,
              });
              navigation.goBack();
              setTimeout(() => {
                Alert.alert('Thank You!', 'Your rating has been submitted.');
              }, 150);
            } catch (e: any) {
              Alert.alert(
                'Error',
                e?.response?.data?.error || 'Failed to submit review.',
              );
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  const ratingLabels: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent',
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}>
        <View style={styles.trainerInfo}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {subscription.trainerName.charAt(0)}
            </Text>
          </View>
          <Text style={styles.trainerName}>{trainerName}</Text>
          <Text style={styles.subtitle}>
            How was your experience this month?
          </Text>
        </View>

        {/* Session attendance info */}
        {total > 0 && (
          <View
            style={[
              styles.section,
              {
                backgroundColor: meetsGate ? '#E8F5E9' : '#FFEBEE',
                borderRadius: 12,
                marginHorizontal: 0,
              },
            ]}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <Icon
                name={meetsGate ? 'checkmark-circle' : 'warning'}
                size={18}
                color={meetsGate ? '#34C759' : '#FF3B30'}
              />
              <Text
                style={{
                  fontSize: 14,
                  color: meetsGate ? '#34C759' : '#FF3B30',
                  fontWeight: '600',
                }}>
                {attended}/{total} sessions attended
              </Text>
            </View>
            {!meetsGate && (
              <Text style={{fontSize: 12, color: '#FF3B30', marginTop: 6}}>
                You need to attend at least {Math.ceil(total * 0.5)} sessions to
                leave a review.
              </Text>
            )}
          </View>
        )}

        {!!dispute && (
          <View
            style={[
              styles.section,
              {
                backgroundColor:
                  dispute.status === 'resolved'
                    ? '#E8F5E9'
                    : dispute.status === 'rejected'
                    ? '#FFEBEE'
                    : '#FFF3E0',
              },
            ]}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <Icon
                name={
                  dispute.status === 'resolved'
                    ? 'checkmark-circle'
                    : dispute.status === 'rejected'
                    ? 'close-circle'
                    : 'warning'
                }
                size={18}
                color={
                  dispute.status === 'resolved'
                    ? '#34C759'
                    : dispute.status === 'rejected'
                    ? '#FF3B30'
                    : '#FF9500'
                }
              />
              <Text
                style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: '600',
                  color:
                    dispute.status === 'resolved'
                      ? '#34C759'
                      : dispute.status === 'rejected'
                      ? '#FF3B30'
                      : '#FF9500',
                }}>
                {dispute.status === 'open'
                  ? 'Review is unavailable while your dispute is open.'
                  : dispute.status === 'resolved'
                  ? `Dispute resolved${
                      dispute.admin_note ? `: ${dispute.admin_note}` : ''
                    }`
                  : `Dispute rejected${
                      dispute.admin_note ? `: ${dispute.admin_note}` : ''
                    }`}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.hireAgainButton}
              onPress={() =>
                navigation.navigate('MemberSessions', {
                  hireId,
                  trainerName,
                  hireStatus: 'ended',
                })
              }>
              <Icon name="checkmark-done-outline" size={18} color="#FF6B35" />
              <Text style={styles.hireAgainText}> View Sessions & Dispute</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Star Rating — mandatory */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Rating <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                activeOpacity={0.7}>
                <Icon
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={40}
                  color={star <= rating ? '#FFD700' : '#ccc'}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>{ratingLabels[rating]}</Text>
          )}
        </View>

        {/* Review — optional */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Review <Text style={styles.optional}>(optional)</Text>
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="Share your experience with this trainer..."
            placeholderTextColor="#aaa"
            multiline
            numberOfLines={5}
            value={review}
            onChangeText={setReview}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{review.length}/500</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (rating === 0 || submitting || !meetsGate || hasOpenDispute) &&
              styles.submitDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting || !meetsGate || hasOpenDispute}>
          <Icon name="checkmark-circle-outline" size={20} color="#fff" />
          <Text style={styles.submitText}>
            {submitting ? 'Submitting...' : 'Submit Rating'}
          </Text>
        </TouchableOpacity>

        {!!postId && (
          <TouchableOpacity
            style={styles.hireAgainButton}
            onPress={() => navigation.navigate('TrainerDetail', {postId})}>
            <Icon
              name={
                visibility === 'private' ? 'person-outline' : 'people-outline'
              }
              size={18}
              color="#FF6B35"
            />
            <Text style={styles.hireAgainText}>
              {visibility === 'private'
                ? ' Rehire This Trainer'
                : ' View Post & Hire Again'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RateTrainerScreen;
