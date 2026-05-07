import React, { createContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { apiUrl } from '../utils/apiUrl';
import { setLang } from '../i18n';
import { setClaudeConfigDir } from '../utils/tClaude';

// 集中管理 /api/claude-settings 与 /api/preferences,消除多组件重复 fetch。
// AppBase 通过 contextType 直接消费;ChatView/TerminalPanel/AppHeader 等子组件
// 走 props drill 接收 settings 与 updater 回调,避免与 TerminalWsContext 的 contextType 冲突。
//
// 数据更新走纯 React 渠道:updatePreferences 内 setState → preferences 引用变化 →
// ChatView/TerminalPanel.componentDidUpdate 接力调用 _loadPresets 等。
// 不再用 'ccv-presets-changed' window event,避免 props 驱动 + 事件驱动双重触发。

export const SettingsContext = createContext({
  claudeSettings: null,
  preferences: null,
  _prefsReady: Promise.resolve({}),
  _claudeSettingsReady: Promise.resolve({}),
  updatePreferences: () => Promise.resolve(null),
  updateClaudeSettings: () => Promise.resolve(null),
});

export function SettingsProvider({ children }) {
  const [claudeSettings, setClaudeSettings] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const mountedRef = useRef(true);

  // useState 的 lazy 初始化器同步启动 fetch,首次 render 时 Promise 已 in-flight,
  // 保证消费方(AppBase.componentDidMount)拿到的是真实数据 Promise 而非兜底 Promise。
  // setLang / setClaudeConfigDir 全局副作用在 fetch 回包时立即执行,不等 useEffect。
  const [readyPromises] = useState(() => {
    const prefsReady = fetch(apiUrl('/api/preferences'))
      .then(res => res.json())
      .then(data => {
        if (typeof data?.claudeConfigDir === 'string') setClaudeConfigDir(data.claudeConfigDir);
        if (data?.lang) setLang(data.lang);
        return data;
      })
      .catch(() => ({}));
    const claudeReady = fetch(apiUrl('/api/claude-settings'))
      .then(res => res.ok ? res.json() : {})
      .catch(() => ({}));
    return { prefsReady, claudeReady };
  });

  useEffect(() => {
    // effect 入口重置 mountedRef:StrictMode/HMR 下 mount → cleanup → remount 时 ref 对象复用,
    // 仅靠 useRef(true) 初始化无法在 remount 时重置,会让后续 setState 永远被跳过。
    mountedRef.current = true;
    readyPromises.prefsReady.then(data => {
      if (mountedRef.current && data) setPreferences(data);
    });
    readyPromises.claudeReady.then(data => {
      if (mountedRef.current && data) setClaudeSettings(data);
    });
    return () => { mountedRef.current = false; };
  }, [readyPromises]);

  // 乐观写本地缓存(与原 fire-and-forget 等价,不做回滚)。
  // setState 触发 Provider re-render → 子树拿到新 preferences 引用 → componentDidUpdate 接力 reload。
  const updatePreferences = useCallback((patch) => {
    if (mountedRef.current) {
      setPreferences(prev => ({ ...(prev || {}), ...patch }));
    }
    return fetch(apiUrl('/api/preferences'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }).then(r => r.ok ? r.json() : null).catch(() => null);
  }, []);

  const updateClaudeSettings = useCallback((patch) => {
    if (mountedRef.current) {
      setClaudeSettings(prev => ({ ...(prev || {}), ...patch }));
    }
    return fetch(apiUrl('/api/claude-settings'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }).then(r => r.ok ? r.json() : null).catch(() => null);
  }, []);

  const value = useMemo(() => ({
    claudeSettings,
    preferences,
    _prefsReady: readyPromises.prefsReady,
    _claudeSettingsReady: readyPromises.claudeReady,
    updatePreferences,
    updateClaudeSettings,
  }), [claudeSettings, preferences, readyPromises, updatePreferences, updateClaudeSettings]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
