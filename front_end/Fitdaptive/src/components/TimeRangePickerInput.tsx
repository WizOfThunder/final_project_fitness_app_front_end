import React, {useState} from 'react';
import {View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, Alert} from 'react-native';

type Props = {
  label: string;
  startTime: string | null; // 'HH:MM'
  endTime: string | null;
  onChangeStart: (time: string) => void;
  onChangeEnd: (time: string) => void;
};

function parseTime(t: string | null): {hour: number; minute: number} {
  if (!t) return {hour: 9, minute: 0};
  const [h, m] = t.split(':').map(Number);
  return {hour: h || 0, minute: m || 0};
}

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

const HOURS = Array.from({length: 24}, (_, i) => i);
const MINUTES = Array.from({length: 12}, (_, i) => i * 5); // 0,5,10,...55

export default function TimeRangePickerInput({label, startTime, endTime, onChangeStart, onChangeEnd}: Props) {
  const [show, setShow] = useState(false);
  const [tempStart, setTempStart] = useState(parseTime(startTime));
  const [tempEnd, setTempEnd] = useState(parseTime(endTime));

  const handleOpen = () => {
    setTempStart(parseTime(startTime));
    setTempEnd(parseTime(endTime));
    setShow(true);
  };

  const handleConfirm = () => {
    const start = formatTime(tempStart.hour, tempStart.minute);
    const end = formatTime(tempEnd.hour, tempEnd.minute);
    const startMins = tempStart.hour * 60 + tempStart.minute;
    const endMins = tempEnd.hour * 60 + tempEnd.minute;
    if (startMins >= endMins) {
      Alert.alert('Invalid Time', 'Start time must be before end time.');
      return;
    }
    onChangeStart(start);
    onChangeEnd(end);
    setShow(false);
  };

  const displayValue = startTime && endTime
    ? `${startTime} – ${endTime}`
    : 'Select time range';

  return (
    <>
      <Text style={s.label}>{label}</Text>
      <TouchableOpacity style={s.input} onPress={handleOpen}>
        <Text style={startTime ? s.valueText : s.placeholderText}>{displayValue}</Text>
      </TouchableOpacity>

      <Modal visible={show} transparent animationType="fade" onRequestClose={() => setShow(false)}>
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>{label}</Text>

            {(['start', 'end'] as const).map(which => {
              const temp = which === 'start' ? tempStart : tempEnd;
              const setTemp = which === 'start' ? setTempStart : setTempEnd;
              return (
                <View key={which} style={s.section}>
                  <Text style={s.sectionLabel}>{which === 'start' ? 'Start Time' : 'End Time'}</Text>
                  <View style={s.columns}>
                    <View style={s.col}>
                      <Text style={s.colLabel}>Hour</Text>
                      <ScrollView style={s.picker} showsVerticalScrollIndicator={false}>
                        {HOURS.map(h => (
                          <TouchableOpacity
                            key={h}
                            style={[s.item, temp.hour === h && s.itemActive]}
                            onPress={() => setTemp(prev => ({...prev, hour: h}))}>
                            <Text style={[s.itemText, temp.hour === h && s.itemTextActive]}>
                              {String(h).padStart(2, '0')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                    <View style={s.col}>
                      <Text style={s.colLabel}>Minute</Text>
                      <ScrollView style={s.picker} showsVerticalScrollIndicator={false}>
                        {MINUTES.map(m => (
                          <TouchableOpacity
                            key={m}
                            style={[s.item, temp.minute === m && s.itemActive]}
                            onPress={() => setTemp(prev => ({...prev, minute: m}))}>
                            <Text style={[s.itemText, temp.minute === m && s.itemTextActive]}>
                              {String(m).padStart(2, '0')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                </View>
              );
            })}

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
  modal: {backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '85%', maxHeight: '85%'},
  modalTitle: {fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12, textAlign: 'center'},
  section: {marginBottom: 12},
  sectionLabel: {fontSize: 13, fontWeight: '700', color: '#FF6B35', marginBottom: 6},
  columns: {flexDirection: 'row', gap: 10},
  col: {flex: 1},
  colLabel: {fontSize: 12, fontWeight: '600', color: '#888', textAlign: 'center', marginBottom: 6},
  picker: {height: 140, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10},
  item: {padding: 10, alignItems: 'center'},
  itemActive: {backgroundColor: '#FF6B35'},
  itemText: {fontSize: 15, color: '#333'},
  itemTextActive: {color: '#fff', fontWeight: 'bold'},
  buttons: {flexDirection: 'row', gap: 10, marginTop: 8},
  cancelBtn: {flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#F0F0F0'},
  confirmBtn: {flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#FF6B35'},
  cancelText: {color: '#666', fontSize: 15, fontWeight: '600'},
  confirmText: {color: '#fff', fontSize: 15, fontWeight: 'bold'},
});
