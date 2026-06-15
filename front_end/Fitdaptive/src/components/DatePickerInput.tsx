import React, {useState} from 'react';
import {View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet} from 'react-native';

type Props = {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  minDate?: Date;
};

export default function DatePickerInput({label, value, onChange, minDate}: Props) {
  const [show, setShow] = useState(false);
  const [temp, setTemp] = useState(value || new Date());

  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const handleChange = (type: 'day' | 'month' | 'year', val: number) => {
    const d = new Date(temp);
    if (type === 'day') d.setDate(val);
    if (type === 'month') d.setMonth(val);
    if (type === 'year') d.setFullYear(val);
    setTemp(d);
  };

  const handleConfirm = () => {
    onChange(temp);
    setShow(false);
  };

  const currentYear = new Date().getFullYear();
  const minYear = minDate ? minDate.getFullYear() : currentYear;

  return (
    <>
      <Text style={s.label}>{label}</Text>
      <TouchableOpacity
        style={s.input}
        onPress={() => { setTemp(value || new Date()); setShow(true); }}>
        <Text style={value ? s.valueText : s.placeholderText}>
          {value ? formatDate(value) : 'Select date'}
        </Text>
      </TouchableOpacity>

      <Modal visible={show} transparent animationType="fade" onRequestClose={() => setShow(false)}>
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>{label}</Text>
            <View style={s.columns}>
              <View style={s.col}>
                <Text style={s.colLabel}>Day</Text>
                <ScrollView style={s.picker} showsVerticalScrollIndicator={false}>
                  {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                    <TouchableOpacity
                      key={d}
                      style={[s.item, temp.getDate() === d && s.itemActive]}
                      onPress={() => handleChange('day', d)}>
                      <Text style={[s.itemText, temp.getDate() === d && s.itemTextActive]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={s.col}>
                <Text style={s.colLabel}>Month</Text>
                <ScrollView style={s.picker} showsVerticalScrollIndicator={false}>
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[s.item, temp.getMonth() === i && s.itemActive]}
                      onPress={() => handleChange('month', i)}>
                      <Text style={[s.itemText, temp.getMonth() === i && s.itemTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={s.col}>
                <Text style={s.colLabel}>Year</Text>
                <ScrollView style={s.picker} showsVerticalScrollIndicator={false}>
                  {Array.from({length: 10}, (_, i) => minYear + i).map(y => (
                    <TouchableOpacity
                      key={y}
                      style={[s.item, temp.getFullYear() === y && s.itemActive]}
                      onPress={() => handleChange('year', y)}>
                      <Text style={[s.itemText, temp.getFullYear() === y && s.itemTextActive]}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <View style={s.buttons}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShow(false)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={handleConfirm}>
                <Text style={s.confirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  label: {fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 4},
  input: {borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 14, backgroundColor: '#F9F9F9', marginBottom: 16, justifyContent: 'center'},
  valueText: {fontSize: 15, color: '#333'},
  placeholderText: {fontSize: 15, color: '#aaa'},
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'},
  modal: {backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '85%', maxHeight: '70%'},
  modalTitle: {fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16, textAlign: 'center'},
  columns: {flexDirection: 'row', gap: 10, marginBottom: 20},
  col: {flex: 1},
  colLabel: {fontSize: 13, fontWeight: '600', color: '#FF6B35', textAlign: 'center', marginBottom: 8},
  picker: {height: 200, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10},
  item: {padding: 12, alignItems: 'center'},
  itemActive: {backgroundColor: '#FF6B35'},
  itemText: {fontSize: 15, color: '#333'},
  itemTextActive: {color: '#fff', fontWeight: 'bold'},
  buttons: {flexDirection: 'row', gap: 10},
  cancelBtn: {flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#F0F0F0'},
  confirmBtn: {flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#FF6B35'},
  cancelText: {color: '#666', fontSize: 15, fontWeight: '600'},
  confirmText: {color: '#fff', fontSize: 15, fontWeight: 'bold'},
});
