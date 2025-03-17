# 旅行管理系統部署指南

本指南將幫助您將旅行管理系統部署到雲端，使用 Render 托管前後端應用程序，Render PostgreSQL 提供數據庫服務，以及 Azure Blob Storage 存儲照片。

## 準備工作

在開始部署之前，您需要：

1. 一個 [Render](https://render.com/) 帳戶
2. 一個 [Microsoft Azure](https://azure.microsoft.com/) 帳戶
3. 您的項目代碼已上傳到 GitHub 倉庫 (如果使用 Render 的 GitHub 集成)

## 第一步：設置 Azure Blob Storage

1. 登錄到 [Azure 門戶](https://portal.azure.com/)

2. 創建存儲帳戶
   - 點擊左側菜單中的「存儲帳戶」
   - 點擊「+ 創建」按鈕
   - 選擇您的訂閱和資源組
   - 輸入存儲帳戶名稱 (例如 `travelplanimages`)
   - 選擇性能為「標準」
   - 選擇備援配置為「本地冗餘存儲 (LRS)」（低成本選項）
   - 點擊「審核 + 創建」，然後「創建」

3. 創建 Blob 容器
   - 存儲帳戶創建成功後，導航到該帳戶
   - 在左側菜單中，點擊「容器」
   - 點擊「+ 容器」
   - 輸入容器名稱 `travel-plan-images`
   - 設置公共訪問級別為「Blob（僅限 blob 的匿名讀取訪問）」
   - 點擊「創建」

4. 獲取連接字符串
   - 在存儲帳戶下，點擊左側菜單中的「訪問密鑰」
   - 複製「連接字符串」，您將在配置 Render 環境變量時使用它

## 第二步：部署到 Render

您可以使用我們提供的 `render.yaml` 文件通過 Render 藍圖功能進行部署。

### 使用藍圖部署 (推薦)

1. 登錄到您的 Render 帳戶

2. 點擊 Dashboard 中的「New +」按鈕，選擇「Blueprint」

3. 連接您的 GitHub 倉庫

4. Render 會自動檢測 `render.yaml` 文件並顯示要創建的資源
   - 應該包括前端 Web 服務、後端 API 服務和 PostgreSQL 數據庫

5. 點擊「Apply」按鈕開始部署流程

6. 在部署配置頁面中，您需要填寫一些環境變量：
   - `AZURE_STORAGE_CONNECTION_STRING`：粘貼您從 Azure 獲取的連接字符串
   - 確認其他自動填充的環境變量是否正確

7. 點擊「Apply」開始部署

### 手動部署 (替代方案)

如果您不想使用藍圖功能，也可以手動部署各個服務：

1. 部署 PostgreSQL 數據庫
   - 在 Render Dashboard 中，點擊「New +」按鈕，選擇「PostgreSQL」
   - 輸入數據庫名稱，例如 `travel-db`
   - 選擇區域，例如 `Singapore`
   - 選擇計劃（免費或付費）
   - 點擊「Create Database」按鈕

2. 部署後端 API
   - 點擊「New +」按鈕，選擇「Web Service」
   - 連接您的 GitHub 倉庫
   - 名稱設置為 `travel-plan-backend`
   - 構建命令設置為 `cd server && npm install && npm run build`
   - 啟動命令設置為 `cd server && node dist/index.js`
   - 選擇區域，例如 `Singapore`
   - 選擇計劃（免費或付費）
   - 在環境變量部分，添加以下變量：
     - `NODE_ENV`: `production`
     - `PORT`: `4000`
     - `DB_HOST`: 從數據庫連接信息複製
     - `DB_PORT`: 從數據庫連接信息複製
     - `DB_USER`: 從數據庫連接信息複製
     - `DB_PASSWORD`: 從數據庫連接信息複製
     - `DB_NAME`: 從數據庫連接信息複製
     - `JWT_SECRET`: 生成一個隨機字符串
     - `JWT_EXPIRE`: `7d`
     - `AZURE_STORAGE_CONNECTION_STRING`: 粘貼 Azure 連接字符串
     - `AZURE_STORAGE_CONTAINER_NAME`: `travel-plan-images`
   - 點擊「Create Web Service」按鈕

3. 部署前端
   - 點擊「New +」按鈕，選擇「Static Site」
   - 連接您的 GitHub 倉庫
   - 名稱設置為 `travel-plan-frontend`
   - 構建命令設置為 `npm run build`
   - 發布路徑設置為 `build`
   - 在環境變量部分，添加以下變量：
     - `REACT_APP_API_URL`: 後端服務的 URL (例如 `https://travel-plan-backend.onrender.com`)
   - 點擊「Create Static Site」按鈕

## 第三步：初始化數據庫

部署完成後，您需要初始化數據庫架構：

1. 登錄到 Render Dashboard

2. 找到您的「PostgreSQL」數據庫服務並點擊它

3. 在「Shell」標籤中，點擊「開啟數據庫 Shell」按鈕

4. 將 `server/src/models/database.sql` 文件中的 SQL 腳本複製粘貼到 Shell 中並執行

## 第四步：驗證部署

1. 訪問您的前端網站 URL (例如 `https://travel-plan-frontend.onrender.com`)

2. 嘗試註冊一個新帳戶並登錄

3. 創建一個旅行計劃並上傳照片，確保 Azure Blob Storage 集成正常工作

## 部署後更新

如果您需要更新已部署的應用程序：

1. 將更改推送到您的 GitHub 倉庫

2. Render 將自動檢測更改並重新部署服務

## 故障排除

### 數據庫連接問題

- 確認環境變量中的數據庫連接信息是否正確
- 檢查數據庫服務狀態是否為「可用」

### 照片上傳失敗

- 確認 Azure 存儲連接字符串是否正確
- 確認 Blob 容器存在並配置了正確的訪問權限

### 部署失敗

- 檢查 Render 部署日誌以查看具體錯誤
- 確認構建命令和啟動命令是否正確

## 注意事項

- Render 的免費計劃有一些限制，例如服務會在不活動一段時間後進入休眠狀態
- Azure Blob Storage 可能會產生一些費用，根據您存儲的數據量和訪問頻率而定
- 確保您定期備份重要數據
