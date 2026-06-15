import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  header: {fontSize: 24, fontWeight: 'bold', padding: 16, backgroundColor: '#fff', textAlign: 'center'},
  exerciseListContainer: {flex: 1, padding: 16},
  dateTitle: {fontSize: 18, fontWeight: 'bold', marginBottom: 16},
  exerciseList: {paddingBottom: 16},
  exerciseItem: {flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4},
  checkbox: {marginRight: 12},
  checkboxInner: {width: 24, height: 24, borderWidth: 2, borderColor: '#007AFF', borderRadius: 4, justifyContent: 'center', alignItems: 'center'},
  checkboxChecked: {backgroundColor: '#007AFF'},
  checkmark: {color: '#fff', fontSize: 16, fontWeight: 'bold'},
  exerciseDetails: {flex: 1},
  exerciseName: {fontSize: 16, fontWeight: '600', marginBottom: 4},
  exerciseCompleted: {textDecorationLine: 'line-through', color: '#999'},
  exerciseInfo: {fontSize: 14, color: '#666'},
  noExercises: {textAlign: 'center', color: '#999', marginTop: 32, fontSize: 16},
  selectDateText: {textAlign: 'center', color: '#999', marginTop: 32, fontSize: 16},
});
