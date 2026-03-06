import React, {useState} from 'react';
import {View, Text, StyleSheet, TextInput, TouchableOpacity} from 'react-native';

export default function ChangePasswordScreen({navigation}: any) {
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleChange = () => {
    if (newPass !== confirm) {
      alert('Passwords do not match');
      return;
    }
    alert('Password changed successfully');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Change Password</Text>
      <TextInput style={styles.input} placeholder="Current Password" value={current} onChangeText={setCurrent} secureTextEntry />
      <TextInput style={styles.input} placeholder="New Password" value={newPass} onChangeText={setNewPass} secureTextEntry />
      <TextInput style={styles.input} placeholder="Confirm Password" value={confirm} onChangeText={setConfirm} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleChange}>
        <Text style={styles.buttonText}>Change Password</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff', padding: 20, justifyContent: 'center'},
  title: {fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center'},
  input: {borderWidth: 1, borderColor: '#ddd', padding: 15, marginBottom: 15, borderRadius: 8, fontSize: 16},
  button: {backgroundColor: '#007AFF', padding: 15, borderRadius: 8, marginTop: 10},
  buttonText: {color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '600'},
});
