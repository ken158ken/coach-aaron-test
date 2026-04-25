/**
 * UserAvatar — 用戶頭像（有圖片就用，無則顯示首字母圓圈）
 * @module components/chat/UserAvatar
 */

import React from "react";
import type { ChatUser } from "@/services/chat.service";

interface UserAvatarProps {
  user: Pick<ChatUser, "name" | "display_name" | "email" | "avatar_url" | "admin_display_name">;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLS: Record<"sm" | "md" | "lg", string> = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = "md",
  className = "",
}) => {
  const name =
    user.admin_display_name ||
    user.display_name ||
    user.name ||
    user.email ||
    "?";
  const initial = name.charAt(0).toUpperCase();
  const cls = `${SIZE_CLS[size]} rounded-full shrink-0 ${className}`;

  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={name}
        className={`${cls} object-cover bg-gold/10`}
        loading="lazy"
      />
    );
  }
  return (
    <div
      className={`${cls} bg-gold/15 text-gold flex items-center justify-center font-medium`}
      aria-label={name}
    >
      {initial}
    </div>
  );
};

export default UserAvatar;
