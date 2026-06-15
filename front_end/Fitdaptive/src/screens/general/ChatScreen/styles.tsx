import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F0F2F5'},
  hiddenList: {opacity: 0},
  messageList: {padding: 12, paddingBottom: 8},

  // Date separator
  dateSeparator: {alignItems: 'center', marginVertical: 12},
  dateSeparatorText: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#E4E6EB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },

  // Message rows
  messageRow: {marginBottom: 4, flexDirection: 'row'},
  messageRowRight: {justifyContent: 'flex-end'},
  messageRowLeft: {justifyContent: 'flex-start'},

  // Bubbles
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMine: {backgroundColor: '#007AFF', borderBottomRightRadius: 4},
  bubbleTheirs: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },

  messageText: {fontSize: 15, color: '#1a1a1a', lineHeight: 20},
  messageTextMine: {color: '#fff'},

  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timestamp: {fontSize: 11, color: '#aaa'},
  timestampMine: {color: 'rgba(255,255,255,0.7)'},

  // Typing indicator
  typingContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  typingBubble: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  typingText: {fontSize: 13, color: '#888', fontStyle: 'italic'},

  // Input bar
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    maxHeight: 100,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
