import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  header: {fontSize: 24, fontWeight: 'bold', padding: 16, backgroundColor: '#fff', textAlign: 'center'},
  mealListContainer: {flex: 1, padding: 16},
  dateTitle: {fontSize: 18, fontWeight: 'bold', marginBottom: 16},
  mealList: {paddingBottom: 16},
  mealItem: {flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4},
  checkbox: {marginRight: 12, marginTop: 4},
  checkboxInner: {width: 24, height: 24, borderWidth: 2, borderColor: '#4CAF50', borderRadius: 4, justifyContent: 'center', alignItems: 'center'},
  checkboxChecked: {backgroundColor: '#4CAF50'},
  checkmark: {color: '#fff', fontSize: 16, fontWeight: 'bold'},
  mealDetails: {flex: 1},
  mealHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8},
  mealName: {fontSize: 16, fontWeight: '600', flex: 1},
  mealCompleted: {textDecorationLine: 'line-through', color: '#999'},
  mealTypeBadge: {paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4},
  mealTypeText: {color: '#fff', fontSize: 10, fontWeight: 'bold'},
  nutritionInfo: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  nutritionText: {fontSize: 12, color: '#666'},
  noMeals: {textAlign: 'center', color: '#999', marginTop: 32, fontSize: 16},
  selectDateText: {textAlign: 'center', color: '#999', marginTop: 32, fontSize: 16},
});
