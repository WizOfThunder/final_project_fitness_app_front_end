import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  sessionContextCard: {
    backgroundColor: '#EAF3FF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  sessionContextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sessionContextTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007AFF',
  },
  sessionContextText: {
    fontSize: 13,
    color: '#335C85',
    lineHeight: 18,
  },
  sessionContextDate: {
    fontSize: 12,
    color: '#335C85',
    marginTop: 8,
    fontWeight: '600',
  },
  sessionContextMeta: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 8,
    fontWeight: '700',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  smallLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  exerciseCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  exerciseInfoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exerciseInfoContent: {
    flex: 1,
  },
  exerciseNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  deleteExerciseButton: {
    paddingLeft: 12,
    paddingTop: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  createButton: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerInfoArea: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 12,
  },
  pickerItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  pickerItemMeta: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  pickerHint: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 6,
    fontWeight: '600',
  },
  pickerAddButton: {
    paddingLeft: 10,
    paddingVertical: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
