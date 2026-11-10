# 福代抽籤

部門福利服務代表（福代／福委）**Step 2** 加權抽籤工具。

## 用法

直接開 `index.html`，或：

```bash
python3 -m http.server 8080 --bind 127.0.0.1
# → http://127.0.0.1:8080
```

1. 調整各 Team 工程師（含）以上人數  
2. 確認機率條  
3. 按「開始抽籤」

亂數來源：`crypto.getRandomValues`（密碼學安全）。人數設定會存 `localStorage`。

## 對應辦法（Draft）

- Step 1 Closed：email 自願報名 → 主管擇一  
- **Step 2**：無報名 → 依 Team 人數加權抽 Team  
- Step 3 Closed：中籤 Team 由主管／TL 推派
