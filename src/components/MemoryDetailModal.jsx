import React from 'react';
import { Modal } from 'antd';
import { t } from '../i18n';
import { renderMarkdown } from '../utils/markdown';
import { parseMemoryLink } from '../utils/memoryLinkParser';
import styles from './AppHeader.module.css';

// 持久记忆条目明细 Modal（PC + iPad + 手机三处都需要 mount 一份）。
// zIndex 1100 跨过 popover 的 1030 —— 不需要先关 popover。
// 内容里点其它 .md 链接通过 onOpenMemoryDetail(name) 回到父级 loadMemoryDetail，
// 父级负责 seq 防快慢回包乱序、setState 切换当前 detail。
export default function MemoryDetailModal({ detail, onClose, onOpenMemoryDetail }) {
  if (!detail) return null;
  const { name, content, error, loading } = detail;

  // 链接拦截：规则统一在 parseMemoryLink；命中 .md basename 切到对应明细。
  const handleLinkClick = (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const hrefRaw = a.getAttribute('href') || '';
    const r = parseMemoryLink(hrefRaw);
    if (r.allow) return;
    e.preventDefault();
    if (r.open) onOpenMemoryDetail?.(r.open);
  };

  let body;
  if (loading) {
    body = <div className={styles.cachePopoverEmpty}>{t('ui.memoryLoading')}</div>;
  } else if (error) {
    body = <div className={styles.cachePopoverEmpty}>{t('ui.memoryLoadError')}: {error}</div>;
  } else if (!content || !content.trim()) {
    body = <div className={styles.cachePopoverEmpty}>{t('ui.memoryEmpty')}</div>;
  } else {
    body = (
      <div
        className={styles.memoryMarkdown}
        onClick={handleLinkClick}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />
    );
  }
  return (
    <Modal
      open={true}
      title={name}
      onCancel={onClose}
      footer={null}
      width={720}
      zIndex={1100}
      destroyOnClose
    >
      {body}
    </Modal>
  );
}
