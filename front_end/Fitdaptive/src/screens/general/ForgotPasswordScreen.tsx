import React, {useState} from 'react';
import {View, Text, StyleSheet, TextInput, TouchableOpacity} from 'react-native';

export default function ForgotPasswordScreen({navigation}: any) {
  const [email, setEmail] = useState('');

  const handleReset = () => {
    alert('Password reset link sent to ' + email);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>Enter your email to reset password</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.button} onPress={handleReset}>
        <Text style={styles.buttonText}>Send Reset Link</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff'},
  title: {fontSize: 32, fontWeight: 'bold', marginBottom: 10, textAlign: 'center'},
  subtitle: {fontSize: 16, color: '#666', marginBottom: 30, textAlign: 'center'},
  input: {borderWidth: 1, borderColor: '#ddd', padding: 15, marginBottom: 15, borderRadius: 8, fontSize: 16},
  button: {backgroundColor: '#007AFF', padding: 15, borderRadius: 8, marginTop: 10},
  buttonText: {color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '600'},
  link: {color: '#007AFF', textAlign: 'center', marginTop: 20},
});
