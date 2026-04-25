/**
 * Chat — 聊天主頁（左對話清單 + 右訊息流）
 * @module pages/Chat
 *
 * 路由：
 *   /chat              — 顯示對話清單，行動版顯示清單 only
 *   /chat/:id          — 顯示單一對話內容
 */

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { chatService, type ChatConversation } from "@/services/chat.service";
import { useChatNotificationContext } from "@/context/ChatNotificationContext";
import ConversationList from "@/components/chat/ConversationList";
import MessageThread from "@/components/chat/MessageThread";
import NewChatModal from "@/components/chat/NewChatModal";

const ChatPage: React.FC = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { conversations, refreshConversations } = useChatNotificationContext();
  const [activeConv, setActiveConv] = useState<ChatConversation | null>(null);
  const [activeLoading, setActiveLoading] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);

  // 拉某個對話的詳情（含 participants）
  useEffect(() => {
    if (!conversationId) {
      setActiveConv(null);
      return;
    }
    let cancelled = false;
    setActiveLoading(true);
    chatService
      .getConversation(conversationId)
      .then((c) => !cancelled && setActiveConv(c))
      .catch(() => {
        if (!cancelled) {
          setActiveConv(null);
          navigate("/chat", { replace: true });
        }
      })
      .finally(() => !cancelled && setActiveLoading(false));
    return () => {
      cancelled = true;
    };
  }, [conversationId, navigate]);

  return (
    <div className="fixed inset-0 top-[64px] z-10 bg-surface flex justify-center">
    <div className="flex w-full max-w-[1440px] border-x border-gold/10">
      {/* 左欄 — 對話清單 */}
      <div
        className={`${
          conversationId ? "hidden lg:flex" : "flex"
        } flex-col w-full lg:w-[320px] xl:w-[360px] shrink-0`}
      >
        <ConversationList
          conversations={conversations}
          loading={conversations.length === 0}
          onNewChat={() => setShowNewChat(true)}
        />
      </div>

      {/* 右欄 — 訊息流 */}
      <div
        className={`${
          conversationId ? "flex" : "hidden lg:flex"
        } flex-col flex-1 min-w-0`}
      >
        {!conversationId ? (
          <div className="flex-1 flex items-center justify-center text-muted text-sm">
            <div className="text-center">
              <div className="text-5xl mb-3">💬</div>
              <p>選擇左側對話開始聊天</p>
              <button
                onClick={() => setShowNewChat(true)}
                className="mt-3 text-gold hover:underline"
              >
                或開啟新對話
              </button>
            </div>
          </div>
        ) : activeLoading ? (
          <div className="flex-1 flex items-center justify-center text-muted text-sm">
            載入中...
          </div>
        ) : activeConv ? (
          <MessageThread
            conversation={activeConv}
            onBack={() => navigate("/chat")}
            onAfterSend={refreshConversations}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted text-sm">
            對話不存在或已被移除
          </div>
        )}
      </div>

      <NewChatModal
        isOpen={showNewChat}
        onClose={() => setShowNewChat(false)}
      />
    </div>
    </div>
  );
};

export default ChatPage;
