# CC-Viewer

基於 Claude Code、提煉自身開發經驗、沉澱而成的 Vibe Coding 工具：

1. 提升能力上限，可在本機執行 /ultraPlan、/ultraReview，避免將專案程式碼完全暴露給 Claude 雲端；
2. 多端同時適配，可在區域網路內實現行動裝置程式設計，Web 版自適應各種場景，方便嵌入瀏覽器擴充功能、作業系統分割畫面，並提供原生安裝程式；
3. 完整日誌留痕，提供 Claude Code 完整封包攔截分析能力，方便記錄日誌、分析問題、學習借鑑、逆向研發；
4. 學習經驗分享，沉澱了大量學習資料與開發經驗（詳見系統各處的「?」圖示）；
5. 保持原生體驗，僅對 Claude Code 能力進行增強，對核心無任何實質性修改，保持原生體驗；
6. 適配三方模型，已適配 deepseek-v4-*、GLM 5.1、Kimi K2.6，內建 cc-switch 能力，可隨時熱切第三方工具。

[English](../README.md) | [简体中文](./README.zh.md) | 繁體中文 | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [Deutsch](./README.de.md) | [Español](./README.es.md) | [Français](./README.fr.md) | [Italiano](./README.it.md) | [Dansk](./README.da.md) | [Polski](./README.pl.md) | [Русский](./README.ru.md) | [العربية](./README.ar.md) | [Norsk](./README.no.md) | [Português (Brasil)](./README.pt-BR.md) | [ไทย](./README.th.md) | [Türkçe](./README.tr.md) | [Українська](./README.uk.md)

## 使用方式

### 前提

- 請確認已安裝 Node.js 22.0.0+；[下載安裝](https://nodejs.org)
- 請確認已安裝 Claude Code；[安裝教學](https://github.com/anthropics/claude-code)

### 安裝 ccv

#### 透過 npm 安裝

```bash
npm install -g cc-viewer --registry=https://registry.npmjs.org
```

#### 透過 Homebrew 安裝（macOS / Linux 推薦）

```bash
brew tap weiesky/cc-viewer
brew install cc-viewer
brew upgrade cc-viewer   # 升級用這個，brew 安裝的 ccv 不要用 npm install -g 升級
```

### 啟動方式

ccv 是 claude 的直接替代品 —— 所有參數都會傳遞給 claude，同時啟動 Web Viewer。

```bash
ccv                    # == claude (interactive mode)
```

作者本人最常用的指令是：
```
ccv -c --d             # == claude --continue --dangerously-skip-permissions
                       # ccv 透傳所有 Claude Code 的啟動參數，你可以任意組合使用
```

以程式設計模式啟動後，網頁將會自動開啟。

CC-Viewer 也提供原生桌面應用程式：[下載頁面](https://github.com/weiesky/cc-viewer/releases)


### 記錄器模式

如果你仍然偏好原生 claude 工具或 VS Code 擴充功能，請使用此模式。

在此模式下，啟動 `claude` 會自動啟動一個記錄程序，將請求日誌寫入 ~/.claude/cc-viewer/*yourproject*/date.jsonl

啟用記錄器模式：
```bash
ccv -logger
```

當主控台無法列印具體連接埠時，預設第一個連接埠為 127.0.0.1:7008。多個執行個體會依序使用 7009、7010 等連接埠。

解除安裝記錄器模式：
```bash
ccv --uninstall
```

### 疑難排解

如果你在啟動 cc-viewer 時遇到問題，以下是終極疑難排解方法：

步驟 1：在任何目錄中開啟 Claude Code。

步驟 2：向 Claude Code 下達以下指示：

```
I have installed the cc-viewer npm package, but after running ccv it still doesn't work properly. Please check cc-viewer's cli.js and findcc.js, and adapt them to the local Claude Code deployment based on the specific environment. Keep the scope of changes as constrained as possible within findcc.js.
```

讓 Claude Code 自行診斷問題，比詢問任何人或閱讀任何文件都更有效！

完成上述指令後，`findcc.js` 會被更新。如果你的專案經常需要本地部署，或分叉的程式碼常常需要解決安裝問題，保留此檔案可讓你下次直接複製使用。目前許多使用 Claude Code 的專案與公司並非部署在 Mac，而是部署在伺服器端託管環境中，因此作者將 `findcc.js` 獨立出來，方便未來追蹤 cc-viewer 原始碼更新。


### 其他指令

請參考：

```bash
ccv -h
```

### 靜默模式

預設情況下，`ccv` 在包裝 `claude` 時會以靜默模式執行，讓你的終端機輸出保持整潔，並與原生體驗保持一致。所有日誌皆在背景擷取，可於 `http://localhost:7008` 檢視。

設定完成後，照常使用 `claude` 指令。造訪 `http://localhost:7008` 即可開啟監控介面。


## 功能特色


### 程式設計模式

使用 ccv 啟動後，你可以看到：

<img width="1500" height="765" alt="image" src="https://github.com/user-attachments/assets/ab353a2b-f101-409d-a28c-6a4e41571ea2" />


你可以在編輯後直接檢視程式碼差異：

<img width="1500" height="728" alt="image" src="https://github.com/user-attachments/assets/2a4acdaa-fc5f-4dc0-9e5f-f3273f0849b2" />

雖然你可以手動開啟檔案與程式碼，但並不建議手動編寫 —— 那是老派的寫法了！

### 行動裝置程式設計

你甚至可以掃描 QR code 從行動裝置寫程式：

<img width="3018" height="1460" alt="image" src="https://github.com/user-attachments/assets/8debf48e-daec-420c-b37a-609f8b81cd20" />
<img width="1700" height="790" alt="image" src="https://github.com/user-attachments/assets/da3e519f-ff66-4cd2-81d1-f4e131215f6c" />

實現你對行動程式設計的想像。此外還提供外掛機制 —— 如果你需要依自己的寫作習慣客製化，請持續關注外掛 hook 更新。


### 記錄器模式（檢視完整的 Claude Code 會談）

<img width="1500" height="768" alt="image" src="https://github.com/user-attachments/assets/a8a9f3f7-d876-4f6b-a64d-f323a05c4d21" />


- 即時擷取 Claude Code 的所有 API 請求，確保是原始文字 —— 而非遭去敏化的日誌（這很重要！！！）
- 自動識別並標記 Main Agent 與 Sub Agent 請求（子類型：Plan、Search、Bash）
- MainAgent 請求支援 Body Diff JSON，以折疊方式顯示與上一個 MainAgent 請求的差異（僅顯示變更/新增欄位）
- 每個請求皆內嵌顯示 Token 使用統計（輸入/輸出 tokens、快取建立/讀取、命中率）
- 相容 Claude Code Router (CCR) 與其他代理情境 —— 會退回採用 API 路徑比對方式

### 對話模式

點擊右上角的「對話模式」按鈕，可將 Main Agent 的完整對話歷史解析為聊天介面：

<img width="1500" height="764" alt="image" src="https://github.com/user-attachments/assets/725b57c8-6128-4225-b157-7dba2738b1c6" />

- 尚未支援 Agent Team 顯示
- 使用者訊息靠右對齊（藍色氣泡）、Main Agent 回覆靠左對齊（深色氣泡）
- `thinking` 區塊預設折疊，以 Markdown 呈現 —— 點擊即可展開並檢視思考過程；支援一鍵翻譯（功能仍不穩定）
- 使用者選擇訊息（AskUserQuestion）以問答格式顯示
- 雙向模式同步：切換到對話模式時會自動捲動到與所選請求對應的對話；切換回原始模式時會自動捲動到所選請求
- 設定面板：可切換工具結果與 thinking 區塊的預設折疊狀態
- 行動裝置對話瀏覽：在行動 CLI 模式下，點擊頂部列的「對話瀏覽」按鈕可滑出唯讀的對話檢視，在行動裝置上瀏覽完整對話歷史

### 日誌管理

透過左上角的 CC-Viewer 下拉選單：

<img width="1500" height="760" alt="image" src="https://github.com/user-attachments/assets/33295e2b-f2e0-4968-a6f1-6f3d1404454e" />

**日誌壓縮**
關於日誌，作者想澄清：Anthropic 官方定義並未被修改，以確保日誌完整性。然而，由於 1M Opus 模型後期的單條日誌條目可能變得極為龐大，感謝對 MainAgent 所做的某些日誌最佳化，在不使用 gzip 的情況下可達到至少 66% 的大小縮減。這些壓縮日誌的解析方式可從目前的儲存庫中取得。

### 更多實用功能

<img width="1500" height="767" alt="image" src="https://github.com/user-attachments/assets/add558c5-9c4d-468a-ac6f-d8d64759fdbd" />

你可以透過側邊欄工具快速定位你的提示詞。

--- 

<img width="1500" height="765" alt="image" src="https://github.com/user-attachments/assets/82b8eb67-82f5-41b1-89d6-341c95a047ed" />

有趣的 KV-Cache-Text 功能能讓你看到 Claude 所看到的內容。

---

<img width="1500" height="765" alt="image" src="https://github.com/user-attachments/assets/54cdfa4e-677c-4aed-a5bb-5fd946600c46" />

你可以上傳圖片並描述你的需求 —— Claude 的圖像理解能力非常強大。如你所知，你也可以使用 Ctrl+V 直接貼上圖片，完整內容將會顯示在對話中。

---

<img width="600" height="370" alt="image" src="https://github.com/user-attachments/assets/87d332ea-3e34-4957-b442-f9d070211fbf" />

你可以自訂外掛、管理所有 CC-Viewer 程序，CC-Viewer 也支援熱切換第三方 API（沒錯，你可以使用 GLM、Kimi、MiniMax、Qwen、DeepSeek —— 儘管作者認為它們目前都還相當薄弱）。

---

<img width="1500" height="746" alt="image" src="https://github.com/user-attachments/assets/b1f60c7c-1438-4ecc-8c64-193d21ee3445" />

還有更多功能等待你去發現…… 例如：系統支援 Agent Team，並內建 Code Reviewer。Codex Code Reviewer 整合即將推出（作者強烈推薦使用 Codex 來審閱 Claude Code 的程式碼）。

## License

MIT
