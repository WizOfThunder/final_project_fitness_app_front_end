import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../../../services/api';
import {styles} from './styles';

export default function ChangePasswordScreen({navigation}: any) {
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const strengthScore = () => {
    let score = 0;
    if (newPass.length >= 6) score++;
    if (newPass.length >= 10) score++;
    if (/[A-Z]/.test(newPass)) score++;
    if (/[0-9]/.test(newPass)) score++;
    if (/[^A-Za-z0-9]/.test(newPass)) score++;
    return score;
  };

  const strengthLabel = () => {
    const s = strengthScore();
    if (!newPass) return null;
    if (s <= 1) return {label: 'Weak', color: '#FF3B30'};
    if (s <= 3) return {label: 'Fair', color: '#FF9500'};
    return {label: 'Strong', color: '#34C759'};
  };

  const handleChange = async () => {
    if (!current || !newPass || !confirm) return Alert.alert('Error', 'All fields are required');
    if (newPass.length < 6) return Alert.alert('Error', 'New password must be at least 6 characters');
    if (newPass !== confirm) return Alert.alert('Error', 'New passwords do not match');
    if (current === newPass) return Alert.alert('Error', 'New password must be different from current');

    setSaving(true);
    try {
      await apiClient.put('/auth/change-password', {currentPassword: current, newPassword: newPass});
      Alert.alert('Success', 'Password changed successfully', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const strength = strengthLabel();

  return (
    <KeyboardAvoidingView style={{flex: 1}} behavior="padding">
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <View style={styles.iconWrap}>
        <Icon name="lock-closed" size={40} color="#FF6B35" />
      </View>
      <Text style={styles.title}>Change Password</Text>
      <Text style={styles.subtitle}>Enter your current password and choose a new one</Text>

      <Text style={styles.label}>Current Password</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={current}
          onChangeText={setCurrent}
          secureTextEntry={!showCurrent}
          placeholder="Enter current password"
          placeholderTextColor="#999"
        />
        <TouchableOpacity onPress={() => setShowCurrent(v => !v)} style={styles.eyeBtn}>
          <Icon name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>New Password</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={newPass}
          onChangeText={setNewPass}
          secureTextEntry={!showNew}
          placeholder="Enter new password"
          placeholderTextColor="#999"
        />
        <TouchableOpacity onPress={() => setShowNew(v => !v)} style={styles.eyeBtn}>
          <Icon name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color="#999" />
        </TouchableOpacity>
      </View>
      {strength && (
        <View style={styles.strengthRow}>
          {[1, 2, 3, 4, 5].map(i => (
            <View key={i} style={[styles.strengthBar, {backgroundColor: i <= strengthScore() ? strength.color : '#eee'}]} />
          ))}
          <Text style={[styles.strengthLabel, {color: strength.color}]}>{strength.label}</Text>
        </View>
      )}

      <Text style={styles.label}>Confirm New Password</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry={!showConfirm}
          placeholder="Confirm new password"
          placeholderTextColor="#999"
        />
        <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={styles.eyeBtn}>
          <Icon name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#999" />
        </TouchableOpacity>
      </View>
      {confirm.length > 0 && (
        <View style={styles.matchRow}>
          <Icon
            name={newPass === confirm ? 'checkmark-circle' : 'close-circle'}
            size={16}
            color={newPass === confirm ? '#34C759' : '#FF3B30'}
          />
          <Text style={[styles.matchText, {color: newPass === confirm ? '#34C759' : '#FF3B30'}]}>
            {newPass === confirm ? 'Passwords match' : 'Passwords do not match'}
          </Text>
        </View>
      )}

      <TouchableOpacity style={[styles.button, saving && {opacity: 0.6}]} onPress={handleChange} disabled={saving}>
        {saving
          ? <ActivityIndicator color="#fff" />
          : <>
              <Icon name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Change Password</Text>
            </>
        }
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
