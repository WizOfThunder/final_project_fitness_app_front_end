import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../../../services/api';
import {styles} from './styles';
import DatePickerInput from '../../../components/DatePickerInput';
import TimeRangePickerInput from '../../../components/TimeRangePickerInput';

const TYPES = ['steps', 'calories', 'distance'];
const CHALLENGE_TYPES = [
  {label: 'Auto (tracked via Health Connect)', value: 'auto'},
  {label: 'Online Event', value: 'online'},
  {label: 'Offline Event', value: 'offline'},
];
const DATE_MODES = [
  {label: 'Same Day', value: 'same_day'},
  {label: 'Multi-Day', value: 'multi_day'},
] as const;

export default function CreateChallengeScreen({navigation}: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [challengeType, setChallengeType] = useState<
    'auto' | 'online' | 'offline'
  >('auto');
  const [type, setType] = useState('steps');
  const [targetValue, setTargetValue] = useState('');
  const [points, setPoints] = useState('10');
  const [dateMode, setDateMode] = useState<'same_day' | 'multi_day'>(
    'multi_day',
  );
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [eventStartTime, setEventStartTime] = useState<string | null>(null);
  const [eventEndTime, setEventEndTime] = useState<string | null>(null);
  const [maxParticipants, setMaxParticipants] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`;

  const toDateOnly = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate());

  const compareTimes = (start: string | null, end: string | null) => {
    if (!start || !end) {
      return null;
    }

    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    return endHour * 60 + endMinute - (startHour * 60 + startMinute);
  };

  useEffect(() => {
    if (dateMode !== 'same_day' || !startDate) {
      return;
    }

    const sameDay = toDateOnly(startDate);
    const currentEnd = endDate ? toDateOnly(endDate) : null;

    if (!currentEnd || currentEnd.getTime() !== sameDay.getTime()) {
      setEndDate(sameDay);
    }
  }, [dateMode, endDate, startDate]);

  const handleDateModeChange = (mode: 'same_day' | 'multi_day') => {
    setDateMode(mode);

    if (mode !== 'same_day') {
      return;
    }

    if (startDate) {
      setEndDate(toDateOnly(startDate));
      return;
    }

    if (endDate) {
      const sameDay = toDateOnly(endDate);
      setStartDate(sameDay);
      setEndDate(sameDay);
    }
  };

  const validate = () => {
    const effectiveEndDate = dateMode === 'same_day' ? startDate : endDate;

    if (!title.trim()) {
      return 'Title is required';
    }
    if (
      challengeType === 'auto' &&
      (!targetValue || isNaN(Number(targetValue)) || Number(targetValue) <= 0)
    ) {
      return 'Target value must be a positive number';
    }
    if (
      challengeType === 'offline' &&
      (!maxParticipants ||
        isNaN(Number(maxParticipants)) ||
        Number(maxParticipants) <= 0)
    ) {
      return 'Participant limit is required for offline events';
    }
    if (!startDate) {
      return 'Start date is required';
    }
    if (!effectiveEndDate) {
      return dateMode === 'same_day'
        ? 'Event date is required'
        : 'End date is required';
    }

    const startDateOnly = toDateOnly(startDate);
    const endDateOnly = toDateOnly(effectiveEndDate);

    if (endDateOnly < startDateOnly) {
      return 'End date must be on or after start date';
    }

    if (challengeType !== 'auto') {
      if (!eventStartTime || !eventEndTime) {
        return 'Event time range is required';
      }

      if (
        endDateOnly.getTime() === startDateOnly.getTime() &&
        (compareTimes(eventStartTime, eventEndTime) ?? 0) <= 0
      ) {
        return 'For same-day events, end time must be after start time';
      }
    }

    return null;
  };

  const handleCreate = async () => {
    const error = validate();
    if (error) {
      return Alert.alert('Validation Error', error);
    }

    const effectiveEndDate = dateMode === 'same_day' ? startDate : endDate;

    setLoading(true);
    try {
      await apiClient.post('/challenges', {
        title: title.trim(),
        description: description.trim() || null,
        url: url.trim() || null,
        challenge_type: challengeType,
        type: challengeType !== 'auto' ? 'steps' : type,
        target_value: challengeType !== 'auto' ? 0 : Number(targetValue),
        points: Number(points) || 10,
        start_date: formatDate(startDate!),
        end_date: formatDate(effectiveEndDate!),
        event_start_time: challengeType !== 'auto' ? eventStartTime : null,
        event_end_time: challengeType !== 'auto' ? eventEndTime : null,
        max_participants:
          challengeType !== 'auto' && maxParticipants
            ? Number(maxParticipants)
            : null,
        location: challengeType === 'offline' ? location.trim() || null : null,
      });
      Alert.alert('Success', 'Challenge created successfully', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.response?.data?.error || 'Failed to create challenge',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Title *</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. 10K Steps Daily Challenge"
        placeholderTextColor="#aaa"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.textArea}
        value={description}
        onChangeText={setDescription}
        placeholder="Optional description..."
        placeholderTextColor="#aaa"
        multiline
      />

      <Text style={styles.label}>Challenge Type *</Text>
      <View style={styles.optionRow}>
        {CHALLENGE_TYPES.map(ct => (
          <TouchableOpacity
            key={ct.value}
            style={[
              styles.optionBtn,
              challengeType === ct.value && styles.optionBtnActive,
            ]}
            onPress={() =>
              setChallengeType(ct.value as 'auto' | 'online' | 'offline')
            }>
            <Text
              style={[
                styles.optionText,
                challengeType === ct.value && styles.optionTextActive,
              ]}>
              {ct.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {challengeType !== 'auto' && (
        <>
          <Text style={styles.label}>
            Event URL{' '}
            {challengeType === 'online' ? '(Zoom / Meet link)' : '(Optional)'}
          </Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="https://zoom.us/j/..."
            placeholderTextColor="#aaa"
            autoCapitalize="none"
            keyboardType="url"
          />
          <TimeRangePickerInput
            label="Event Time Range"
            startTime={eventStartTime}
            endTime={eventEndTime}
            onChangeStart={setEventStartTime}
            onChangeEnd={setEventEndTime}
          />
          {challengeType === 'offline' && (
            <>
              <Text style={styles.label}>Location *</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="e.g. GOR Sudirman, Jakarta"
                placeholderTextColor="#aaa"
              />
            </>
          )}
          <Text style={styles.label}>
            Participant Limit {challengeType === 'offline' ? '*' : '(optional)'}
          </Text>
          <TextInput
            style={styles.input}
            value={maxParticipants}
            onChangeText={setMaxParticipants}
            placeholder={
              challengeType === 'offline'
                ? 'e.g. 30'
                : 'Leave blank for unlimited'
            }
            placeholderTextColor="#aaa"
            keyboardType="numeric"
          />
        </>
      )}

      {challengeType === 'auto' && (
        <>
          <Text style={styles.label}>Metric Type *</Text>
          <View style={styles.optionRow}>
            {TYPES.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.optionBtn, type === t && styles.optionBtnActive]}
                onPress={() => setType(t)}>
                <Text
                  style={[
                    styles.optionText,
                    type === t && styles.optionTextActive,
                  ]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>
            Target Value *{' '}
            <Text style={styles.hint}>
              (
              {type === 'steps' ? 'steps' : type === 'calories' ? 'kcal' : 'km'}
              )
            </Text>
          </Text>
          <TextInput
            style={styles.input}
            value={targetValue}
            onChangeText={setTargetValue}
            placeholder={
              type === 'steps' ? '10000' : type === 'calories' ? '500' : '5'
            }
            placeholderTextColor="#aaa"
            keyboardType="numeric"
          />
        </>
      )}

      <Text style={styles.label}>Points Reward *</Text>
      <TextInput
        style={styles.input}
        value={points}
        onChangeText={setPoints}
        placeholder="10"
        placeholderTextColor="#aaa"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Date Mode</Text>
      <View style={styles.optionRow}>
        {DATE_MODES.map(mode => (
          <TouchableOpacity
            key={mode.value}
            style={[
              styles.optionBtn,
              dateMode === mode.value && styles.optionBtnActive,
            ]}
            onPress={() => handleDateModeChange(mode.value)}>
            <Text
              style={[
                styles.optionText,
                dateMode === mode.value && styles.optionTextActive,
              ]}>
              {mode.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {dateMode === 'same_day' ? (
        <>
          <DatePickerInput
            label="Event Date *"
            value={startDate}
            onChange={setStartDate}
          />
          <Text style={styles.dateModeHint}>
            End date will be matched automatically to the selected event date.
          </Text>
        </>
      ) : (
        <>
          <DatePickerInput
            label="Start Date *"
            value={startDate}
            onChange={setStartDate}
          />

          <DatePickerInput
            label="End Date *"
            value={endDate}
            onChange={setEndDate}
            minDate={startDate || new Date()}
          />
        </>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={handleCreate}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.buttonInner}>
            <Icon name="trophy" size={18} color="#fff" />
            <Text style={styles.buttonText}>Create Challenge</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}
