/**
 * 登入頁面元件
 *
 * 提供使用者登入介面,包含表單驗證、錯誤處理和載入狀態。
 * 登入成功後導向會員中心頁面。
 *
 * @module pages/Login
 */

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";

/**
 * 登入頁面元件
 *
 * 處理使用者登入流程,包含表單驗證和錯誤訊息顯示。
 *
 * @returns {JSX.Element} 登入頁面元件
 */
const Login: React.FC = (): JSX.Element => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  /**
   * 處理表單提交
   *
   * @param {React.FormEvent<HTMLFormElement>} e - 表單事件
   */
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login(email, password);
      setLoading(false);

      if (res?.success) {
        navigate("/member");
      } else {
        setError(res?.message || "登入失敗");
      }
    } catch (err) {
      setLoading(false);
      setError("登入過程發生錯誤");
      console.error("Login error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
      <div className="card w-full max-w-sm bg-base-100 shadow-2xl">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold justify-center mb-4">
            會員 <span className="text-primary">登入</span>
          </h2>

          {error && (
            <div className="alert alert-error text-sm py-2 mb-4">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input input-bordered"
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">密碼</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input input-bordered"
                required
              />
            </div>
            <div className="form-control mt-6">
              <button
                type="submit"
                className={`btn btn-primary ${loading ? "loading" : ""}`}
                disabled={loading}
              >
                {loading ? "登入中..." : "登入"}
              </button>
            </div>
          </form>

          <div className="divider">或</div>

          <p className="text-center text-sm">
            還沒有帳號?{" "}
            <Link to="/register" className="link link-primary">
              立即註冊
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
