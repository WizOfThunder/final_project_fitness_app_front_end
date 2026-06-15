import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  ActivityIndicator,
  Platform,
  InteractionManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useAuth} from '../../../store/AuthContext';
import {apiClient} from '../../../services/api';
import {
  getSocket,
  sendMessage,
  onReceiveMessage,
  onMessageSent,
  emitTyping,
  onUserTyping,
} from '../../../services/socketService';
import {styles} from './styles';

interface Message {
  id: number | string;
  sender_id: number;
  receiver_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

const parseMessageDate = (value: string) => {
  if (!value) return new Date(NaN);
  if (value.includes('T')) return new Date(value);

  const [datePart, timePart = '00:00:00'] = value.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour = 0, minute = 0, second = 0] = timePart.split(':').map(Number);
  return new Date(year, (month || 1) - 1, day || 1, hour, minute, second);
};

export default function ChatScreen({route, navigation}: any) {
  const {receiverId: receiverIdRaw, receiverName} = route.params;
  const receiverId = Number(receiverIdRaw);
  const {user} = useAuth();
  const userId = user?.id;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [initialPositionReady, setInitialPositionReady] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeout = useRef<any>(null);
  const hasInitialScroll = useRef(false);

  const scrollToLatest = useCallback((animated: boolean) => {
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({animated});
      });
    });
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const res = await apiClient.get(`/chat/conversation/${receiverId}`);
      setMessages(res.data || []);
      // Mark as read
      apiClient.put(`/chat/read/${receiverId}`).catch(() => {});
    } catch (_) {}
    setLoading(false);
  }, [receiverId]);

  useEffect(() => {
    setLoading(true);
    setInitialPositionReady(false);
    hasInitialScroll.current = false;
    navigation.setOptions({title: receiverName});
    loadHistory();

    onReceiveMessage((msg: Message) => {
      if (
        (msg.sender_id === receiverId && msg.receiver_id === userId) ||
        (msg.sender_id === userId && msg.receiver_id === receiverId)
      ) {
        setMessages(prev => [...prev, msg]);
        apiClient.put(`/chat/read/${receiverId}`).catch(() => {});
      }
    });

    onMessageSent((msg: Message) => {
      setMessages(prev => {
        // replace optimistic message (string id) with real one from server
        const idx = prev.findIndex(
          m => typeof m.id === 'string' && m.message === msg.message,
        );
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = msg;
          return updated;
        }
        return prev;
      });
    });

    onUserTyping(({sender_id, isTyping: typing}) => {
      if (Number(sender_id) === receiverId) setIsTyping(typing);
    });

    return () => {
      // Only remove chat-specific listeners, don't disconnect the shared socket
      const s = getSocket();
      s?.off('receive_message');
      s?.off('message_sent');
      s?.off('user_typing');
      clearTimeout(typingTimeout.current);
    };
  }, [receiverId, loadHistory, navigation, receiverName, userId]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (messages.length === 0) {
      setInitialPositionReady(true);
      return;
    }

    if (!initialPositionReady) {
      return;
    }

    scrollToLatest(hasInitialScroll.current);
    hasInitialScroll.current = true;
  }, [initialPositionReady, loading, messages, scrollToLatest]);

  const handleContentSizeChange = useCallback(() => {
    if (loading || messages.length === 0 || initialPositionReady) {
      return;
    }

    scrollToLatest(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        hasInitialScroll.current = true;
        setInitialPositionReady(true);
      });
    });
  }, [initialPositionReady, loading, messages.length, scrollToLatest]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || !userId) return;

    // Optimistic message
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      sender_id: userId,
      receiver_id: receiverId,
      message: text,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setInputText('');

    sendMessage({sender_id: userId, receiver_id: receiverId, message: text});
    emitTyping({sender_id: userId, receiver_id: receiverId, isTyping: false});
  };

  const handleTyping = (text: string) => {
    setInputText(text);
    if (!userId) return;

    emitTyping({sender_id: userId, receiver_id: receiverId, isTyping: true});
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      emitTyping({sender_id: userId, receiver_id: receiverId, isTyping: false});
    }, 1500);
  };

  const formatTime = (dateStr: string) => {
    const d = parseMessageDate(dateStr);
    if (Number.isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
  };

  const formatMessageDate = (dateStr: string) => {
    const d = parseMessageDate(dateStr);
    if (Number.isNaN(d.getTime())) return 'Unknown date';
    return d.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderMessage = ({item, index}: {item: Message; index: number}) => {
    const isMine = item.sender_id === userId;
    const prevItem = messages[index - 1];
    const currentDate = parseMessageDate(item.created_at);
    const previousDate = prevItem
      ? parseMessageDate(prevItem.created_at)
      : null;
    const showDate =
      !previousDate ||
      currentDate.toDateString() !== previousDate.toDateString();

    return (
      <>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>
              {formatMessageDate(item.created_at)}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.messageRow,
            isMine ? styles.messageRowRight : styles.messageRowLeft,
          ]}>
          <View
            style={[
              styles.bubble,
              isMine ? styles.bubbleMine : styles.bubbleTheirs,
            ]}>
            <Text
              style={[styles.messageText, isMine && styles.messageTextMine]}>
              {item.message}
            </Text>
            <View style={styles.messageMeta}>
              <Text style={[styles.timestamp, isMine && styles.timestampMine]}>
                {formatTime(item.created_at)}
              </Text>
              {isMine && (
                <Icon
                  name={
                    typeof item.id === 'string'
                      ? 'time-outline'
                      : item.is_read
                      ? 'checkmark-done'
                      : 'checkmark'
                  }
                  size={12}
                  color={isMine ? 'rgba(255,255,255,0.7)' : '#aaa'}
                  style={{marginLeft: 4}}
                />
              )}
            </View>
          </View>
        </View>
      </>
    );
  };

  if (loading)
    return <ActivityIndicator style={{flex: 1}} size="large" color="#007AFF" />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}>
      <FlatList
        ref={flatListRef}
        data={messages}
        style={!initialPositionReady ? styles.hiddenList : undefined}
        renderItem={renderMessage}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={handleContentSizeChange}
        ListFooterComponent={
          isTyping ? (
            <View style={styles.typingContainer}>
              <View style={styles.typingBubble}>
                <Text style={styles.typingText}>
                  {receiverName} is typing...
                </Text>
              </View>
            </View>
          ) : null
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={handleTyping}
          placeholder="Type a message..."
          placeholderTextColor="#aaa"
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && {opacity: 0.4}]}
          onPress={handleSend}
          disabled={!inputText.trim()}>
          <Icon name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
