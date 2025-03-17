import React from 'react';
import { Modal, Typography, Collapse, Divider, Space } from 'antd';
import { QuestionCircleOutlined, BookOutlined, UserOutlined, SettingOutlined, EnvironmentOutlined, CarOutlined, BankOutlined, CalendarOutlined, FileTextOutlined, TeamOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

interface UserManualProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserManual: React.FC<UserManualProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      title={
        <Space>
          <BookOutlined />
          <span>旅行計劃管理系統 - 使用者操作手冊</span>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={800}
      style={{ top: 20 }}
      bodyStyle={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
    >
      <Typography className="user-manual-content">
        <Title level={4}>歡迎使用旅行計劃管理系統</Title>
        <Paragraph>
          這是一個全面的旅行管理應用程式，幫助您規劃、組織和管理您的旅行體驗。以下是使用本系統的詳細說明，以幫助您快速上手並充分利用系統的所有功能。
        </Paragraph>

        <Divider />

        <Collapse defaultActiveKey={['1']} bordered={false}>
          <Panel 
            header={
              <Space>
                <UserOutlined />
                <Text strong>登入與用戶管理</Text>
              </Space>
            } 
            key="1"
          >
            <Title level={5}>登入系統</Title>
            <Paragraph>
              <ul>
                <li>使用您的電子郵件地址和密碼登入系統。</li>
                <li>預設管理員帳號：test@example.com，密碼：password123</li>
                <li>如果沒有帳號，可以點擊「還沒有帳號？立即註冊」進行註冊。</li>
              </ul>
            </Paragraph>

            <Title level={5}>用戶管理（管理員功能）</Title>
            <Paragraph>
              <ul>
                <li>管理員可以在「用戶管理」頁面查看所有用戶清單。</li>
                <li>可以新增、編輯或停用現有用戶。</li>
                <li>使用頁面上的篩選功能可以快速找到特定角色或狀態的用戶。</li>
              </ul>
            </Paragraph>
          </Panel>

          <Panel 
            header={
              <Space>
                <EnvironmentOutlined />
                <Text strong>旅程管理</Text>
              </Space>
            } 
            key="2"
          >
            <Title level={5}>創建新旅程</Title>
            <Paragraph>
              <ol>
                <li>從儀表板點擊「新增旅程」按鈕。</li>
                <li>填寫旅程基本信息（名稱、目的地、日期等）。</li>
                <li>設置旅程預算和參與人數。</li>
                <li>點擊「創建」完成旅程創建。</li>
              </ol>
            </Paragraph>

            <Title level={5}>管理現有旅程</Title>
            <Paragraph>
              <ul>
                <li>在儀表板上可以看到所有旅程概覽，包括即將到來和已完成的旅程。</li>
                <li>點擊任意旅程卡片進入詳細頁面。</li>
                <li>使用頁面上的「編輯」按鈕修改旅程信息。</li>
                <li>可以使用「刪除」按鈕移除不再需要的旅程（謹慎使用，操作不可恢復）。</li>
              </ul>
            </Paragraph>
          </Panel>

          <Panel 
            header={
              <Space>
                <CalendarOutlined />
                <Text strong>行程規劃</Text>
              </Space>
            } 
            key="3"
          >
            <Title level={5}>創建行程項目</Title>
            <Paragraph>
              <ol>
                <li>在旅程詳細頁面，切換到「行程」標籤。</li>
                <li>選擇要添加行程的日期，點擊「新增行程」按鈕。</li>
                <li>填寫行程標題、時間、地點和說明等信息。</li>
                <li>可選擇行程類型（景點參觀、餐飲、活動等）。</li>
                <li>點擊「儲存」完成創建。</li>
              </ol>
            </Paragraph>

            <Title level={5}>調整行程順序</Title>
            <Paragraph>
              <ul>
                <li>在行程列表中，可以通過拖拽調整同一天內行程的順序。</li>
                <li>使用「時間」欄位精確設定每個行程的開始和結束時間。</li>
                <li>系統會自動檢測時間衝突並提醒您調整。</li>
              </ul>
            </Paragraph>
          </Panel>

          <Panel 
            header={
              <Space>
                <BankOutlined />
                <Text strong>住宿管理</Text>
              </Space>
            } 
            key="4"
          >
            <Title level={5}>添加住宿信息</Title>
            <Paragraph>
              <ol>
                <li>在旅程詳細頁面，切換到「住宿」標籤。</li>
                <li>點擊「新增住宿」按鈕。</li>
                <li>選擇住宿類型（酒店、民宿、公寓等）。</li>
                <li>填寫住宿名稱、地址、價格等詳細信息。</li>
                <li>設置入住和退房日期與時間。</li>
                <li>添加重要附註，如取鑰匙方式、早餐供應時間等。</li>
              </ol>
            </Paragraph>

            <Title level={5}>管理多個住宿</Title>
            <Paragraph>
              <ul>
                <li>系統支持添加多個住宿場所，適合長途旅行或多個目的地的行程。</li>
                <li>可以為每個住宿設置不同的日期范圍，系統會自動進行日期衝突檢查。</li>
                <li>使用篩選功能快速查找特定日期或類型的住宿信息。</li>
              </ul>
            </Paragraph>
          </Panel>

          <Panel 
            header={
              <Space>
                <CarOutlined />
                <Text strong>交通管理</Text>
              </Space>
            } 
            key="5"
          >
            <Title level={5}>添加交通信息</Title>
            <Paragraph>
              <ol>
                <li>在旅程詳細頁面，切換到「交通」標籤。</li>
                <li>點擊「新增交通」按鈕。</li>
                <li>選擇交通類型（飛機、火車、公車、租車等）。</li>
                <li>填寫出發和到達地點、時間、班次號等信息。</li>
                <li>添加票價、訂票號和確認信息。</li>
                <li>可上傳電子票或訂票確認截圖。</li>
              </ol>
            </Paragraph>

            <Title level={5}>交通路線規劃</Title>
            <Paragraph>
              <ul>
                <li>系統會自動將您的交通安排按時間順序排列，方便查看整個旅程的移動路線。</li>
                <li>使用地圖視圖可以直觀地看到您的移動路線。</li>
                <li>系統會檢測交通時間與行程安排的衝突，並提醒您進行調整。</li>
              </ul>
            </Paragraph>
          </Panel>

          <Panel 
            header={
              <Space>
                <FileTextOutlined />
                <Text strong>旅行指南生成</Text>
              </Space>
            } 
            key="6"
          >
            <Title level={5}>生成HTML旅行指南</Title>
            <Paragraph>
              <ol>
                <li>在旅程詳細頁面，點擊右上角的「生成旅行指南」按鈕。</li>
                <li>系統會自動整合旅程中的所有信息，生成一份完整的HTML旅行指南。</li>
                <li>生成的指南包含旅程概述、行程安排、住宿信息和交通詳情。</li>
                <li>點擊「查看HTML指南」可以在新窗口中查看並打印您的旅行指南。</li>
              </ol>
            </Paragraph>

            <Title level={5}>分享與打印指南</Title>
            <Paragraph>
              <ul>
                <li>生成的HTML指南可以直接打印，攜帶在旅途中使用。</li>
                <li>可以通過電子郵件共享指南鏈接給旅伴。</li>
                <li>HTML格式支持各種語言和文字，包括中文字符，確保信息顯示正確。</li>
              </ul>
            </Paragraph>
          </Panel>

          <Panel 
            header={
              <Space>
                <SettingOutlined />
                <Text strong>系統設定</Text>
              </Space>
            } 
            key="7"
          >
            <Title level={5}>個人化設定</Title>
            <Paragraph>
              <ul>
                <li>點擊側邊欄底部的「系統設定」進入設定頁面。</li>
                <li>主題設定：選擇明亮或暗黑模式，自定義主題顏色和字體大小。</li>
                <li>語言與地區：設定系統語言、日期格式、時間格式和貨幣單位。</li>
                <li>通知與提醒：設定是否啟用通知、通知聲音和旅行倒數提醒。</li>
              </ul>
            </Paragraph>

            <Title level={5}>管理員設定（僅管理員可見）</Title>
            <Paragraph>
              <ul>
                <li>資料管理：設定自動備份頻率和位置。</li>
                <li>關於系統：查看和編輯系統版本、開發者信息和版權聲明等。</li>
                <li>可以匯出和匯入設定，便於跨設備使用相同配置。</li>
                <li>必要時可以重置所有設定回到默認值。</li>
              </ul>
            </Paragraph>
          </Panel>

          <Panel 
            header={
              <Space>
                <TeamOutlined />
                <Text strong>協作與共享</Text>
              </Space>
            } 
            key="8"
          >
            <Title level={5}>邀請他人協作</Title>
            <Paragraph>
              <ol>
                <li>在旅程詳細頁面，點擊「管理共享」按鈕。</li>
                <li>輸入要邀請的用戶電子郵件地址。</li>
                <li>選擇授予的權限級別（僅查看或編輯）。</li>
                <li>點擊「邀請」發送邀請。</li>
              </ol>
            </Paragraph>

            <Title level={5}>管理共享權限</Title>
            <Paragraph>
              <ul>
                <li>旅程創建者可以查看當前所有協作者列表。</li>
                <li>可以隨時調整或撤銷任何用戶的權限。</li>
                <li>協作者可以根據權限查看或編輯旅程內容。</li>
                <li>所有編輯操作都會記錄修改歷史，便於查看誰進行了哪些更改。</li>
              </ul>
            </Paragraph>
          </Panel>

          <Panel 
            header={
              <Space>
                <QuestionCircleOutlined />
                <Text strong>常見問題與疑難排解</Text>
              </Space>
            } 
            key="9"
          >
            <Title level={5}>無法登入</Title>
            <Paragraph>
              <ul>
                <li>確認您的電子郵件地址和密碼輸入正確，注意區分大小寫。</li>
                <li>檢查您的帳號是否仍處於活躍狀態，未被停用。</li>
                <li>如果忘記密碼，請聯繫系統管理員重置密碼。</li>
              </ul>
            </Paragraph>

            <Title level={5}>數據未正確保存</Title>
            <Paragraph>
              <ul>
                <li>確保在編輯後點擊「儲存」或「確認」按鈕。</li>
                <li>檢查您的網絡連接是否穩定。</li>
                <li>如果操作後沒有顯示成功訊息，可嘗試重新整理頁面後查看是否已保存。</li>
              </ul>
            </Paragraph>

            <Title level={5}>其他技術問題</Title>
            <Paragraph>
              <ul>
                <li>嘗試清除瀏覽器緩存和Cookie，然後重新登入。</li>
                <li>確保使用最新版本的現代瀏覽器（Chrome、Firefox、Edge等）。</li>
                <li>如問題持續存在，請記錄錯誤訊息並聯繫系統管理員或技術支持。</li>
              </ul>
            </Paragraph>
          </Panel>
        </Collapse>

        <Divider />
        
        <Text type="secondary" className="text-center block">
          版本 {new Date().getFullYear()} © 旅行計劃管理系統
        </Text>
      </Typography>
    </Modal>
  );
};

export default UserManual;
