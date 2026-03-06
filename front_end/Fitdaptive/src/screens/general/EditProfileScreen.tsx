import React, {useState} from 'react';
import {View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView} from 'react-native';

export default function EditProfileScreen({navigation}: any) {
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john@test.com');
  const [phone, setPhone] = useState('');

  const handleSave = () => {
    alert('Profile updated');
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>
      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />
      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" />
      <Text style={styles.label}>Phone</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff', padding: 20},
  title: {fontSize: 28, fontWeight: 'bold', marginBottom: 30},
  label: {fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333'},
  input: {borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 16},
  button: {backgroundColor: '#007AFF', padding: 15, borderRadius: 8, marginTop: 10},
  buttonText: {color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '600'},
});
