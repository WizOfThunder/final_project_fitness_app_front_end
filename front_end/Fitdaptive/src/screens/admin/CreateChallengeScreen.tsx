import React, {useState} from 'react';
import {View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView} from 'react-native';

export default function CreateChallengeScreen({navigation}: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');

  const handleCreate = () => {
    alert('Challenge created!');
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create Challenge</Text>
      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Challenge title" />
      <Text style={styles.label}>Description</Text>
      <TextInput style={styles.textArea} value={description} onChangeText={setDescription} placeholder="Challenge description" multiline />
      <Text style={styles.label}>Duration (days)</Text>
      <TextInput style={styles.input} value={duration} onChangeText={setDuration} placeholder="30" keyboardType="numeric" />
      <TouchableOpacity style={styles.button} onPress={handleCreate}>
        <Text style={styles.buttonText}>Create Challenge</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff', padding: 20},
  title: {fontSize: 28, fontWeight: 'bold', marginBottom: 30},
  label: {fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333'},
  input: {borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 16},
  textArea: {borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 16, height: 100, textAlignVertical: 'top'},
  button: {backgroundColor: '#007AFF', padding: 15, borderRadius: 8, marginTop: 10},
  buttonText: {color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '600'},
});
