import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Linking, Image} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../../../services/api';
import {formatMuscleLabel} from '../../../utils/formatMuscleLabel';
import {styles as s} from './styles';

function getYoutubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function getInstructionSteps(instructions: unknown): string[] {
  if (typeof instructions !== 'string') return [];
  const normalized = instructions.trim();
  if (!normalized) return [];

  try {
    const parsed = JSON.parse(normalized);
    if (Array.isArray(parsed)) {
      return parsed.map(step => String(step).trim()).filter(Boolean);
    }
  } catch {}

  const lineSteps = normalized
    .split(/\r?\n+/)
    .map(step => step.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);
  if (lineSteps.length > 1) return lineSteps;

  const numberedSteps = normalized
    .split(/(?=\d+\.\s)/)
    .map(step => step.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);
  if (numberedSteps.length > 1) return numberedSteps;

  const sentenceSteps = (normalized.match(/[^.!?]+[.!?]?/g) || [])
    .map(step => step.trim())
    .filter(Boolean);
  return sentenceSteps.length > 1 ? sentenceSteps : [normalized];
}

export default function ExerciseDetailScreen({route}: any) {
  const passed = route?.params?.exercise;
  const exerciseId = passed?.exercise_id || passed?.id;

  const [exercise, setExercise] = useState<any>(passed || null);
  const [loading, setLoading] = useState(!!exerciseId);

  useEffect(() => {
    if (!exerciseId) return;
    apiClient.get('/exercises/' + exerciseId)
      .then(res => setExercise(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [exerciseId]);

  if (loading) return <ActivityIndicator style={{flex: 1}} size="large" color="#FF6B35" />;
  if (!exercise) return null;

  const ytId = getYoutubeId(exercise.youtube_url || '');
  const instructionSteps = getInstructionSteps(exercise.instructions);
  const diffColor = exercise.difficulty === 'beginner' ? '#34C759' : exercise.difficulty === 'intermediate' ? '#FF9500' : '#FF3B30';

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <Text style={s.name}>{exercise.name}</Text>
        <View style={s.badges}>
          {exercise.type ? (
            <View style={s.badge}>
              <Text style={s.badgeText}>{exercise.type}</Text>
            </View>
          ) : null}
          {exercise.difficulty ? (
            <View style={[s.badge, {backgroundColor: diffColor + '22', borderColor: diffColor}]}>
              <Text style={[s.badgeText, {color: diffColor}]}>{exercise.difficulty}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={s.infoRow}>
        <View style={s.infoItem}>
          <Icon name="body-outline" size={20} color="#FF6B35" />
          <Text style={s.infoLabel}>Muscle</Text>
          <Text style={s.infoValue}>{formatMuscleLabel(exercise.muscle) || '—'}</Text>
        </View>
        <View style={s.infoItem}>
          <Icon name="barbell-outline" size={20} color="#FF6B35" />
          <Text style={s.infoLabel}>Equipment</Text>
          <Text style={s.infoValue}>{exercise.equipment || 'None'}</Text>
        </View>
      </View>

      {ytId ? (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Video</Text>
          <TouchableOpacity
            style={s.videoContainer}
            onPress={() => Linking.openURL('https://www.youtube.com/watch?v=' + ytId)}>
            <Image
              source={{uri: 'https://img.youtube.com/vi/' + ytId + '/hqdefault.jpg'}}
              style={s.thumbnail}
            />
            <View style={s.playOverlay}>
              <Icon name="logo-youtube" size={48} color="#FF0000" />
            </View>
          </TouchableOpacity>
        </View>
      ) : null}

      {instructionSteps.length ? (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Instructions</Text>
          {instructionSteps.map((step, index) => (
            <View key={`${index}-${step}`} style={s.stepRow}>
              <Text style={s.stepNumber}>{index + 1}.</Text>
              <Text style={s.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {exercise.safety_info ? (
        <View style={s.section}>
          <View style={s.safetyHeader}>
            <Icon name="warning-outline" size={18} color="#FF9500" />
            <Text style={[s.sectionTitle, {color: '#FF9500', marginBottom: 0}]}>Safety Tips</Text>
          </View>
          <Text style={s.body}>{exercise.safety_info}</Text>
        </View>
      ) : null}

      <View style={{height: 30}} />
    </ScrollView>
  );
}
