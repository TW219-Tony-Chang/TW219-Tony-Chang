# 福代遴選 App

部門福代／福委：**報名 → 投票／主管指定 → 加權抽籤 → 結果**。

## 跑起來

```bash
cd welfare-app
npm install
npm run dev
```

## 流程

| 階段 | 功能 |
|------|------|
| 設定 | 標題、報名天數、Team 人數權重 |
| 報名 | 志願者登記（姓名／Team／email） |
| 投票 | 工號防重複投票、票數結算、或主管直接指定 |
| 抽籤 | 無人報名時依人數加權抽 Team |
| 結果 | 公示當選者或中籤 Team |

資料存在瀏覽器 `localStorage`，可匯出／匯入 JSON 備份或換機。

## 舊版

純抽籤頁仍在 `../welfare-lottery/`。
