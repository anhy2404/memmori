// src/screens/main/AIChatScreen.js - AI Chatbot về du lịch & địa điểm VN
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { chatWithAI } from '../../services/geminiService';

// Component 1 tin nhắn - memo để tránh re-render
const ChatBubble = React.memo(function ChatBubble({ message, theme }) {
  const isUser = message.role === 'user';
  return (
    <View style={[bubbleStyles.container, isUser ? bubbleStyles.userContainer : bubbleStyles.aiContainer]}>
      {!isUser && (
        <View style={[bubbleStyles.avatar, { backgroundColor: theme.colors.primary }]}>
          <Text style={bubbleStyles.avatarText}>🤖</Text>
        </View>
      )}
      <View style={[
        bubbleStyles.bubble,
        isUser
          ? { backgroundColor: theme.colors.chatBubbleSelf }
          : { backgroundColor: theme.colors.chatBubbleOther, ...theme.shadows.sm }
      ]}>
        <Text style={[bubbleStyles.messageText, { color: isUser ? theme.colors.chatTextSelf : theme.colors.chatTextOther }]}>
          {message.content}
        </Text>
        <Text style={[bubbleStyles.timeText, { color: isUser ? 'rgba(255,255,255,0.6)' : theme.colors.textTertiary }]}>
          {new Date(message.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      {isUser && (
        <View style={[bubbleStyles.avatar, { backgroundColor: theme.colors.secondary }]}>
          <Text style={bubbleStyles.avatarText}>👤</Text>
        </View>
      )}
    </View>
  );
});

const QUICK_PROMPTS_KEYS = [
  'aiChat.quickPrompt1', 'aiChat.quickPrompt2', 'aiChat.quickPrompt3',
  'aiChat.quickPrompt4', 'aiChat.quickPrompt5', 'aiChat.quickPrompt6',
];

export default function AIChatScreen() {
  const { theme, t, language } = useApp();
  const flatListRef = useRef(null);
  // Dùng ref để tránh stale closure khi gửi messages
  const messagesRef = useRef([]);

  const welcomeMsg = useMemo(() => ({
    id: 'welcome',
    role: 'assistant',
    content: t('aiChat.welcomeMessage'),
    timestamp: Date.now(),
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  const [messages, setMessages] = useState([welcomeMsg]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // Đồng bộ ref với state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Scroll to bottom - cleanup timeout để tránh memory leak
  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  const handleSend = useCallback(async (text = null) => {
    const messageText = (text || input).trim();
    if (!messageText || isThinking) return;

    const userMsg = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    try {
      // Dùng messagesRef.current để tránh stale closure
      const response = await chatWithAI(messageText, language, messagesRef.current);
      const aiMsg = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errMsg = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: t('aiChat.errorAI') + (error.message ? `\n\n${error.message}` : ''),
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsThinking(false);
    }
  }, [input, isThinking, language, t]);

  const handleClearChat = useCallback(() => {
    Alert.alert(
      t('aiChat.clearChat'),
      t('aiChat.confirmClear'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            const newWelcome = {
              id: `welcome_${Date.now()}`,
              role: 'assistant',
              content: t('aiChat.welcomeMessage'),
              timestamp: Date.now(),
            };
            setMessages([newWelcome]);
          },
        },
      ]
    );
  }, [t]);

  const styles = useMemo(() => makeStyles(theme), [theme]);

  const renderItem = useCallback(({ item }) => (
    <ChatBubble message={item} theme={theme} />
  ), [theme]);

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.header, borderBottomColor: theme.colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>🤖 {t('aiChat.title')}</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>{t('aiChat.subtitle')}</Text>
        </View>
        <TouchableOpacity
          style={[styles.clearBtn, { backgroundColor: theme.colors.error + '20' }]}
          onPress={handleClearChat}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.clearBtnText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Danh sách tin nhắn */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          ListFooterComponent={
            isThinking ? (
              <View style={[styles.thinkingContainer, { backgroundColor: theme.colors.chatBubbleOther }]}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={[styles.thinkingText, { color: theme.colors.textSecondary }]}>
                  {t('aiChat.thinking')}
                </Text>
              </View>
            ) : null
          }
        />

        {/* Quick prompts */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.quickPromptsRow, { backgroundColor: theme.colors.surface }]}
          contentContainerStyle={styles.quickPromptsContent}
        >
          {QUICK_PROMPTS_KEYS.map((key, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.quickPromptBtn,
                { backgroundColor: theme.colors.highlight, borderColor: theme.colors.primary },
                isThinking && styles.quickPromptDisabled,
              ]}
              onPress={() => handleSend(t(key))}
              disabled={isThinking}
              activeOpacity={0.7}
            >
              <Text style={[styles.quickPromptText, { color: isThinking ? theme.colors.textTertiary : theme.colors.primary }]} numberOfLines={1}>
                {t(key)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input area */}
        <View style={[styles.inputArea, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
          <TextInput
            style={[styles.input, {
              backgroundColor: theme.colors.inputBackground,
              borderColor: theme.colors.inputBorder,
              color: theme.colors.text,
            }]}
            placeholder={t('aiChat.placeholder')}
            placeholderTextColor={theme.colors.placeholder}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            returnKeyType="send"
            autoCapitalize="sentences"
            autoCorrect={false}
            blurOnSubmit={false}
            onSubmitEditing={() => handleSend()}
            editable={!isThinking}
          />
          <TouchableOpacity
            style={[styles.sendBtn, {
              backgroundColor: (input.trim() && !isThinking) ? theme.colors.primary : theme.colors.disabled,
            }]}
            onPress={() => handleSend()}
            disabled={!input.trim() || isThinking}
          >
            <Text style={styles.sendBtnText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const bubbleStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12, paddingHorizontal: 16 },
  userContainer: { justifyContent: 'flex-end' },
  aiContainer: { justifyContent: 'flex-start' },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginHorizontal: 6 },
  avatarText: { fontSize: 14 },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 18, borderBottomLeftRadius: 4 },
  messageText: { fontSize: 14, lineHeight: 20 },
  timeText: { fontSize: 10, marginTop: 4, textAlign: 'right' },
});

function makeStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1 },
    flex: { flex: 1 },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1,
    },
    headerTitle: { fontSize: 17, fontWeight: '700' },
    headerSubtitle: { fontSize: 12, marginTop: 2 },
    clearBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    clearBtnText: { fontSize: 16 },
    messageList: { paddingTop: 16, paddingBottom: 8, flexGrow: 1 },
    thinkingContainer: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      marginLeft: 52, marginBottom: 12, paddingHorizontal: 14, paddingVertical: 10,
      borderRadius: 18, alignSelf: 'flex-start', maxWidth: '60%',
    },
    thinkingText: { fontSize: 13 },
    quickPromptsRow: { maxHeight: 50, borderTopWidth: 1, borderTopColor: 'transparent' },
    quickPromptsContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
    quickPromptBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, maxWidth: 180 },
    quickPromptDisabled: { opacity: 0.4 },
    quickPromptText: { fontSize: 12, fontWeight: '500' },
    inputArea: {
      flexDirection: 'row', alignItems: 'flex-end',
      paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, gap: 10,
    },
    input: {
      flex: 1, minHeight: 44, maxHeight: 120,
      borderRadius: 22, borderWidth: 1.5,
      paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10,
      fontSize: 14, lineHeight: 20,
    },
    sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  });
}
