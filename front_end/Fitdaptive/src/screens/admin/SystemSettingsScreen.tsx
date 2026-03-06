import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity} from 'react-native';

export default function SystemSettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [aiValidation, setAiValidation] = useState(true);
  const [autoSync, setAutoSync] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>System Settings</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General</Text>
        <View style={styles.item}>
          <Text style={styles.label}>Push Notifications</Text>
          <Switch value={notifications} onValueChange={setNotifications} />
        </View>
        <View style={styles.item}>
          <Text style={styles.label}>AI Validation Required</Text>
          <Switch value={aiValidation} onValueChange={setAiValidation} />
        </View>
        <View style={styles.item}>
          <Text style={styles.label}>Auto Sync Google Fit</Text>
          <Switch value={autoSync} onValueChange={setAutoSync} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Configuration</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Configure Gemini API</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Configure Exercise API</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff', padding: 20},
  title: {fontSize: 28, fontWeight: 'bold', marginBottom: 30},
  section: {marginBottom: 30},
  sectionTitle: {fontSize: 20, fontWeight: '600', marginBottom: 15},
  item: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee'},
  label: {fontSize: 16},
  button: {backgroundColor: '#007AFF', padding: 15, borderRadius: 8, marginBottom: 10},
  buttonText: {color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '600'},
});
