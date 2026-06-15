import React, {useState, useCallback, useEffect} from 'react';
import {TouchableOpacity, View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../services/api';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../store/AuthContext';

type Props = {navigation: any};

export default function NotificationBell({navigation}: Props) {
  const [unread, setUnread] = useState(0);
  const {notifRefreshKey} = useAuth();

  const fetchUnread = useCallback(async () => {
    try {
      const res = await apiClient.get('/notification/my');
      const count = (res.data as any[]).filter((n: any) => !n.is_read).length;
      setUnread(count);
    } catch (_) {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUnread();
    }, [fetchUnread]),
  );

  useEffect(() => {
    if (notifRefreshKey > 0) {
      fetchUnread();
    }
  }, [notifRefreshKey, fetchUnread]);

  const label = unread > 99 ? '99+' : String(unread);

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Notification')}
      style={s.wrapper}>
      <Icon name="notifications-outline" size={24} color="#FF6B35" />
      {unread > 0 && (
        <View style={s.badge}>
          <Text style={s.badgeText}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  wrapper: {
    marginLeft: 15,
    marginRight: 12,
    width: 36,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {color: '#fff', fontSize: 10, fontWeight: '700'},
});
