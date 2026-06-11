import { useCallback, useEffect, useRef, useState } from 'react';
import client from '../api/client.js';
import { notifyAppDataChanged } from '../lib/app-events.js';

export function useConversations() {
  const [conversations, setConversations] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(false);
  const [threadLoading, setThreadLoading] = useState(false);
  const [error, setError] = useState(null);
  const [threadError, setThreadError] = useState(null);
  const selectedPhoneRef = useRef(null);
  const threadPhoneRef = useRef(null);

  useEffect(() => {
    selectedPhoneRef.current = selectedPhone;
  }, [selectedPhone]);

  useEffect(() => {
    threadPhoneRef.current = thread?.customerPhone ?? null;
  }, [thread?.customerPhone]);

  const fetchConversations = useCallback(async (limit = 20) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await client.get('/conversations', { params: { limit } });
      setConversations(data);
      const currentPhone = selectedPhoneRef.current;
      const currentExists = currentPhone ? data.some((item) => item.customerPhone === currentPhone) : false;
      const nextPhone = currentExists ? currentPhone : data[0]?.customerPhone ?? null;

      setSelectedPhone(nextPhone);

      if (!nextPhone) {
        setThread(null);
        setThreadError(null);
      } else if (nextPhone !== currentPhone) {
        setThread(null);
        setThreadError(null);
      } else if (nextPhone && threadPhoneRef.current === nextPhone) {
        void fetchThread(nextPhone);
      }

      return data;
    } catch (err) {
      setError(err.response?.data?.error ?? err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchThread = useCallback(async (phone) => {
    if (!phone) return null;
    setSelectedPhone(phone);
    setThreadLoading(true);
    setThreadError(null);
    setThread(null);
    try {
      const { data } = await client.get(`/conversations/${encodeURIComponent(phone)}`);
      setThread(data);
      return data;
    } catch (err) {
      setThreadError(err.response?.data?.error ?? err.message);
      setThread(null);
      return null;
    } finally {
      setThreadLoading(false);
    }
  }, []);

  const sendReply = useCallback(async (phone, text) => {
    const normalized = text.trim();
    if (!phone || !normalized) return null;

    const { data } = await client.post(`/conversations/${encodeURIComponent(phone)}/reply`, { text: normalized });
    setThread((current) => {
      if (!current || current.customerPhone !== phone) return current;
      return {
        ...current,
        messages: [
          ...(current.messages ?? []),
          {
            role: 'assistant',
            content: data.content,
            createdAt: data.createdAt,
          },
        ],
      };
    });
    setConversations((prev) => prev.map((item) => (
      item.customerPhone === phone
        ? {
            ...item,
            preview: data.content,
            updatedAt: data.createdAt,
            lastDirection: 'OUT',
            outboundCount: (item.outboundCount ?? 0) + 1,
            messageCount: (item.messageCount ?? 0) + 1,
          }
        : item
    )));
    notifyAppDataChanged({ type: 'conversation', action: 'reply', phone });
    return data;
  }, []);

  return {
    conversations,
    selectedPhone,
    thread,
    loading,
    threadLoading,
    error,
    threadError,
    fetchConversations,
    fetchThread,
    sendReply,
    setSelectedPhone,
    setConversations,
    setThread,
  };
}
