import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9F9F9'},
  content: {padding: 24, paddingTop: 32},
  iconWrap: {width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF0EB', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 16},
  title: {fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 8},
  subtitle: {fontSize: 14, color: '#999', textAlign: 'center', marginBottom: 32},
  label: {fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8},
  inputRow: {flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, marginBottom: 16, paddingRight: 12},
  input: {flex: 1, padding: 14, fontSize: 15, color: '#333'},
  eyeBtn: {padding: 4},
  strengthRow: {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: -8, marginBottom: 16},
  strengthBar: {flex: 1, height: 4, borderRadius: 2},
  strengthLabel: {fontSize: 12, fontWeight: '600', marginLeft: 4},
  matchRow: {flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -8, marginBottom: 16},
  matchText: {fontSize: 13},
  button: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FF6B35', padding: 16, borderRadius: 12, marginTop: 8, shadowColor: '#FF6B35', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: 'bold'},
});
