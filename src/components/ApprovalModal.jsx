import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { t } from '../i18n';
import { ApprovalPortalContext } from './ApprovalPortalContext';
import styles from './ApprovalModal.module.css';

const KIND_PRIORITY = ['ptyPlan', 'ask'];

function _idForKind(kind, payload) {
  if (!payload) return null;
  if (kind === 'ptyPlan') return payload.ptyPlan?.ptyPlan?.id ?? null;
  if (kind === 'ask') return payload.ask?.ask?.id ?? null;
  return null;
}

function _projectNameFor(kind, payload) {
  if (!payload) return '';
  if (kind === 'ptyPlan') return payload.ptyPlan?.ptyPlan?.projectName || '';
  if (kind === 'ask') return payload.ask?.ask?.projectName || '';
  return '';
}

function _isDismissed(dismissedSet, kind, id) {
  if (!id || !(dismissedSet instanceof Set)) return false;
  return dismissedSet.has(`${kind}:${id}`);
}

const _tr = (key, params, fallback) => {
  try {
    const r = t(key, params);
    return (r && r !== key) ? r : fallback;
  } catch { return fallback; }
};

/**
 * Wrap the entire app with this component. It provides the ApprovalPortalContext
 * to descendants AND renders the modal UI (when applicable) on top via a sibling
 * `<div>` inside its single React fragment.
 *
 * Inline AskQuestionForm and inline PTY planModeBox consume the context to decide
 * whether to portal themselves into the modal slot. State is preserved across the
 * portal switch — Portals do not unmount their child tree, so any in-flight feedback
 * textarea content survives ESC dismiss → reopen.
 *
 * Permission and SDK ExitPlanMode panels deliberately stay inline-only and are NOT
 * routed through this modal.
 */
export default function ApprovalModal({
  enabled,
  soundEnabled,
  approvalGlobal,
  dismissedIds,
  onDismiss,
  onJumpTab,
  otherTabs,
  children,
}) {
  const askSlotRef = useRef(null);
  const ptyPlanSlotRef = useRef(null);
  const [activeKind, setActiveKind] = useState(null);
  const [slotsReady, setSlotsReady] = useState(false);
  const lastNotifyKeyRef = useRef('');
  const audioRef = useRef(null);

  // Visible kinds: present in approvalGlobal AND id not in dismissed set.
  const visibleKinds = useMemo(() => {
    if (!enabled || !approvalGlobal) return [];
    const out = [];
    for (const k of KIND_PRIORITY) {
      const id = _idForKind(k, approvalGlobal);
      if (id != null && !_isDismissed(dismissedIds, k, id)) out.push(k);
    }
    return out;
  }, [enabled, approvalGlobal, dismissedIds]);

  // Pick the highest-priority visible kind as initial active. If activeKind dropped out
  // (resolved or dismissed), pick the new top.
  useEffect(() => {
    if (visibleKinds.length === 0) {
      if (activeKind !== null) setActiveKind(null);
      return;
    }
    if (!activeKind || !visibleKinds.includes(activeKind)) {
      setActiveKind(visibleKinds[0]);
    }
  }, [visibleKinds, activeKind]);

  // Slot refs — flag readiness once the modal UI is mounted so portals can target stable nodes.
  // Use useLayoutEffect to flip slotsReady SYNCHRONOUSLY before paint — otherwise the inline
  // form would render for one frame inline before the Portal kicks in (visible flicker).
  useLayoutEffect(() => {
    const ready = visibleKinds.length > 0
      && askSlotRef.current
      && ptyPlanSlotRef.current;
    if (ready && !slotsReady) setSlotsReady(true);
    if (!ready && slotsReady) setSlotsReady(false);
  });

  const ctxValue = useMemo(() => ({
    askSlot: slotsReady ? askSlotRef.current : null,
    ptyPlanSlot: slotsReady ? ptyPlanSlotRef.current : null,
    activeAskId: visibleKinds.includes('ask') ? _idForKind('ask', approvalGlobal) : null,
    activePtyPlanId: visibleKinds.includes('ptyPlan') ? _idForKind('ptyPlan', approvalGlobal) : null,
  }), [slotsReady, visibleKinds, approvalGlobal]);

  // ESC dismiss — listens globally so it works even when focus is elsewhere.
  const handleEsc = useCallback((e) => {
    if (e.key !== 'Escape') return;
    if (!activeKind) return;
    const id = _idForKind(activeKind, approvalGlobal);
    if (id != null && onDismiss) onDismiss(activeKind, id);
  }, [activeKind, approvalGlobal, onDismiss]);

  useEffect(() => {
    if (visibleKinds.length === 0) return undefined;
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [visibleKinds.length, handleEsc]);

  // Sound: play once per (kind,id) tuple becoming visible. Synthesised via Web Audio API
  // so we don't ship a binary asset — keeps npm package size small and avoids autoplay quirks.
  useEffect(() => {
    if (!soundEnabled || visibleKinds.length === 0) return;
    const key = visibleKinds.map(k => `${k}:${_idForKind(k, approvalGlobal)}`).join('|');
    if (key === lastNotifyKeyRef.current) return;
    lastNotifyKeyRef.current = key;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioRef.current) audioRef.current = new Ctx();
      const ctx = audioRef.current;
      // Two-tone soft chime (660Hz → 880Hz over 220ms) — pleasant but unmistakable.
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.18);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch {}
  }, [soundEnabled, visibleKinds, approvalGlobal]);

  const handleBackdropClick = (e) => {
    if (e.target !== e.currentTarget) return;
    if (!activeKind) return;
    const id = _idForKind(activeKind, approvalGlobal);
    if (id != null && onDismiss) onDismiss(activeKind, id);
  };

  const handleManualDismiss = () => {
    if (!activeKind) return;
    const id = _idForKind(activeKind, approvalGlobal);
    if (id != null && onDismiss) onDismiss(activeKind, id);
  };

  const projectName = activeKind ? _projectNameFor(activeKind, approvalGlobal) : '';

  const titleKey = activeKind === 'ptyPlan' ? 'ui.approval.modal.title.ptyPlan'
    : 'ui.approval.modal.title.ask';
  const titleFallback = activeKind === 'ptyPlan' ? 'Plan review'
    : 'Question';

  const isVisible = visibleKinds.length > 0;

  return (
    <ApprovalPortalContext.Provider value={ctxValue}>
      {children}
      {isVisible && (
        <div className={styles.backdrop} onClick={handleBackdropClick} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.header}>
              <span className={styles.title}>{_tr(titleKey, null, titleFallback)}</span>
              {projectName && <span className={styles.chip}>{projectName}</span>}
              {Array.isArray(otherTabs) && otherTabs.map((ot) => (
                <span
                  key={ot.tabId}
                  className={`${styles.chip} ${styles.chipAction}`}
                  onClick={() => onJumpTab && onJumpTab(ot.tabId)}
                >
                  {_tr('ui.approval.modal.jumpToSession', { project: ot.projectName || '' }, `→ ${ot.projectName || 'session'}`)}
                </span>
              ))}
            </div>
            {visibleKinds.length > 1 && (
              <div className={styles.kindTabs}>
                {visibleKinds.map((k) => (
                  <button
                    key={k}
                    className={`${styles.kindTab} ${k === activeKind ? styles.kindTabActive : ''}`}
                    onClick={() => setActiveKind(k)}
                  >
                    {_tr(`ui.approval.modal.title.${k}`, null, k)}
                  </button>
                ))}
              </div>
            )}
            <div className={styles.body}>
              <div ref={ptyPlanSlotRef} className={`${styles.slot}${activeKind !== 'ptyPlan' ? ' ' + styles.slotHidden : ''}`} />
              <div ref={askSlotRef} className={`${styles.slot}${activeKind !== 'ask' ? ' ' + styles.slotHidden : ''}`} />
            </div>
            <div className={styles.footer}>
              <span>{_tr('ui.approval.modal.dismissHint', null, 'ESC or click outside to minimise (pending stays)')}</span>
              <button className={styles.dismissBtn} onClick={handleManualDismiss}>
                {_tr('ui.approval.modal.dismiss', null, 'Minimise')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ApprovalPortalContext.Provider>
  );
}
