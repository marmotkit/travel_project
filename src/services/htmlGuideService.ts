import { Accommodation } from '../pages/Accommodation';
import { Transportation } from '../pages/Transportation';

// 定義主要使用的介面
interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  description?: string;
  budget?: number;
  currency?: string;
  categories?: string[];
  participants?: { id: string; name: string; email?: string }[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ItineraryDay {
  id: string;
  tripId: string;
  date: string;
  dayNumber: number;
  title: string;
  description: string;
  activities: ItineraryActivity[];
  accommodationId?: string;
  transportationIds?: string[];
  mealIds?: string[];
  createdAt: string;
  updatedAt: string;
}

interface ItineraryActivity {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  location: string;
  address?: string;
  cost?: number;
  currency?: string;
  category: 'sightseeing' | 'activity' | 'transportation' | 'accommodation' | 'meal' | 'other';
  notes?: string;
}

export class HtmlGuideService {
  /**
   * 生成可打印的HTML旅遊手冊
   * @param trip 旅遊信息
   * @param itineraryDays 行程日信息
   * @param accommodations 住宿信息
   * @param transportations 交通信息
   * @returns 包含HTML內容的字符串
   */
  static generateTravelGuide(
    trip: Trip,
    itineraryDays: ItineraryDay[],
    accommodations: Accommodation[],
    transportations: Transportation[]
  ): string {
    // 對行程日進行排序
    const sortedDays = [...itineraryDays].sort((a, b) => a.dayNumber - b.dayNumber);
    
    // 對住宿按入住日期排序
    const sortedAccommodations = [...accommodations].sort(
      (a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime()
    );
    
    // 對交通按出發時間排序
    const sortedTransportations = [...transportations].sort(
      (a, b) => new Date(a.departureDateTime).getTime() - new Date(b.departureDateTime).getTime()
    );
    
    // 生成HTML內容
    return `
      <!DOCTYPE html>
      <html lang="zh-TW">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${trip.title} - 旅遊手冊</title>
        <style>
          body {
            font-family: "Microsoft JhengHei", "微軟正黑體", "Heiti TC", "黑體-繁", Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #333;
            background-color: #f9f9f9;
            line-height: 1.6;
          }
          .container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            background-color: white;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          .cover {
            background-color: #2980b9;
            color: white;
            padding: 50px 0;
            text-align: center;
            margin-bottom: 30px;
          }
          .cover h1 {
            font-size: 36px;
            margin: 0 0 10px 0;
          }
          .cover .subtitle {
            font-size: 18px;
            margin: 0;
          }
          .white-stripe {
            background-color: white;
            margin: 20px 0;
            padding: 10px 0;
            color: #2980b9;
          }
          h2 {
            color: #2980b9;
            border-bottom: 2px solid #2980b9;
            padding-bottom: 5px;
            margin-top: 40px;
          }
          h3 {
            color: #2980b9;
            margin-top: 30px;
          }
          .info-box {
            background-color: #f2f2f2;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .day-header {
            background-color: #2980b9;
            color: white;
            padding: 10px 15px;
            border-radius: 5px 5px 0 0;
          }
          .day-content {
            border: 1px solid #ddd;
            border-top: none;
            padding: 15px;
            border-radius: 0 0 5px 5px;
            margin-bottom: 20px;
          }
          .activity {
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px dashed #ddd;
          }
          .activity:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          table, th, td {
            border: 1px solid #ddd;
          }
          th, td {
            padding: 10px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          .no-print {
            text-align: center;
            margin: 20px 0;
          }
          .toc {
            background-color: #f2f2f2;
            padding: 15px;
            border-radius: 5px;
            margin: 30px 0;
          }
          .toc ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .toc li {
            margin-bottom: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 14px;
          }
          /* 打印樣式 */
          @media print {
            body {
              background-color: white;
            }
            .container {
              box-shadow: none;
              max-width: 100%;
            }
            .no-print {
              display: none;
            }
            /* 適合A4紙張的換頁控制 */
            h2 {
              page-break-before: always;
            }
            .day-content {
              page-break-inside: avoid;
            }
            table {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- 封面 -->
          <div class="cover">
            <h1>${trip.title}</h1>
            <div class="white-stripe">
              <p class="subtitle">${trip.destination}</p>
              <p class="subtitle">${this.formatDate(trip.startDate)} - ${this.formatDate(trip.endDate)}</p>
            </div>
            <p>旅行計劃管理系統製作</p>
            <p>製作日期: ${new Date().toLocaleDateString('zh-TW')}</p>
          </div>
          
          <!-- 列印按鈕 -->
          <div class="no-print">
            <button onclick="window.print()">打印旅遊手冊</button>
            <button onclick="window.history.back()">返回</button>
          </div>
          
          <!-- 目錄 -->
          <h2>目錄</h2>
          <div class="toc">
            <ul>
              <li><a href="#overview">1. 旅程概述</a></li>
              ${sortedDays.length > 0 ? `<li><a href="#itinerary">2. 行程詳情</a></li>` : ''}
              ${sortedAccommodations.length > 0 ? `<li><a href="#accommodation">3. 住宿資訊</a></li>` : ''}
              ${sortedTransportations.length > 0 ? `<li><a href="#transportation">4. 交通資訊</a></li>` : ''}
              <li><a href="#budget">5. 預算資訊</a></li>
              ${trip.participants && trip.participants.length > 0 ? `<li><a href="#participants">6. 緊急聯絡資訊</a></li>` : ''}
              <li><a href="#notes">7. 備註和提示</a></li>
            </ul>
          </div>
          
          <!-- 旅程概述 -->
          <h2 id="overview">1. 旅程概述</h2>
          <div class="info-box">
            <p><strong>目的地:</strong> ${trip.destination}</p>
            <p><strong>日期:</strong> ${this.formatDate(trip.startDate)} 到 ${this.formatDate(trip.endDate)}</p>
            <p><strong>行程天數:</strong> ${this.calculateDuration(trip.startDate, trip.endDate)} 天</p>
            ${trip.budget ? `<p><strong>預算:</strong> ${this.formatCurrency(trip.budget, trip.currency || 'TWD')}</p>` : ''}
            ${trip.categories && trip.categories.length > 0 ? 
              `<p><strong>類別:</strong> ${trip.categories.join(', ')}</p>` : ''}
            ${trip.participants && trip.participants.length > 0 ? 
              `<p><strong>參與人數:</strong> ${trip.participants.length} 人</p>` : ''}
          </div>
          
          ${trip.description ? `
          <h3>旅程描述</h3>
          <p>${trip.description}</p>
          ` : ''}
          
          <!-- 行程詳情 -->
          ${sortedDays.length > 0 ? `
          <h2 id="itinerary">2. 行程詳情</h2>
          ${sortedDays.map(day => `
            <div class="day-header">
              <h3>第 ${day.dayNumber} 天: ${day.title}</h3>
              <p>${this.formatDate(day.date)}</p>
            </div>
            <div class="day-content">
              ${day.description ? `<p>${day.description}</p>` : ''}
              
              <!-- 當日住宿信息 -->
              ${this.getDayAccommodation(day, sortedAccommodations)}
              
              <!-- 當日交通信息 -->
              ${this.getDayTransportation(day, sortedTransportations)}
              
              <h4>行程安排</h4>
              ${day.activities.length > 0 ? day.activities
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map(activity => `
                <div class="activity">
                  <p><strong>${this.formatTime(activity.startTime)} - ${this.formatTime(activity.endTime)}</strong></p>
                  <p><strong>${activity.title}</strong> (${this.getCategoryName(activity.category)})</p>
                  <p>${activity.description}</p>
                  <p><strong>地點:</strong> ${activity.location}${activity.address ? ` (${activity.address})` : ''}</p>
                  ${activity.cost ? `<p><strong>費用:</strong> ${this.formatCurrency(activity.cost, activity.currency)}</p>` : ''}
                  ${activity.notes ? `<p><strong>備註:</strong> ${activity.notes}</p>` : ''}
                </div>
              `).join('') : '<p>今日無計劃活動</p>'}
            </div>
          `).join('')}
          ` : ''}
          
          <!-- 住宿資訊 -->
          ${sortedAccommodations.length > 0 ? `
          <h2 id="accommodation">3. 住宿資訊</h2>
          <table>
            <tr>
              <th>住宿類型</th>
              <th>名稱</th>
              <th>入住日期</th>
              <th>退房日期</th>
              <th>費用</th>
            </tr>
            ${sortedAccommodations.map(accommodation => `
            <tr>
              <td>${this.getAccommodationTypeName(accommodation.type)}</td>
              <td>${accommodation.name}</td>
              <td>${this.formatDate(accommodation.checkInDate)}</td>
              <td>${this.formatDate(accommodation.checkOutDate)}</td>
              <td>${this.formatCurrency(accommodation.totalPrice, accommodation.currency)}</td>
            </tr>
            `).join('')}
          </table>
          
          ${sortedAccommodations.map(accommodation => `
          <h3>${accommodation.name}</h3>
          <div class="info-box">
            <p><strong>類型:</strong> ${this.getAccommodationTypeName(accommodation.type)}</p>
            <p><strong>地址:</strong> ${accommodation.address}</p>
            <p><strong>入住日期:</strong> ${this.formatDate(accommodation.checkInDate)}</p>
            <p><strong>退房日期:</strong> ${this.formatDate(accommodation.checkOutDate)}</p>
            ${accommodation.roomType ? `<p><strong>房型:</strong> ${accommodation.roomType}</p>` : ''}
            <p><strong>每晚價格:</strong> ${this.formatCurrency(accommodation.pricePerNight, accommodation.currency)}</p>
            <p><strong>總價:</strong> ${this.formatCurrency(accommodation.totalPrice, accommodation.currency)}</p>
            ${accommodation.contactPhone || accommodation.contactEmail ? 
              `<p><strong>聯絡方式:</strong> ${accommodation.contactPhone || ''} ${accommodation.contactEmail ? ` / ${accommodation.contactEmail}` : ''}</p>` : ''}
            ${accommodation.bookingReference ? `<p><strong>訂房確認號:</strong> ${accommodation.bookingReference}</p>` : ''}
            ${accommodation.notes ? `<p><strong>備註:</strong> ${accommodation.notes}</p>` : ''}
          </div>
          `).join('')}
          ` : ''}
          
          <!-- 交通資訊 -->
          ${sortedTransportations.length > 0 ? `
          <h2 id="transportation">4. 交通資訊</h2>
          <table>
            <tr>
              <th>交通類型</th>
              <th>出發時間</th>
              <th>抵達時間</th>
              <th>出發地</th>
              <th>目的地</th>
              <th>費用</th>
            </tr>
            ${sortedTransportations.map(transportation => `
            <tr>
              <td>${this.getTransportationTypeName(transportation.type)}</td>
              <td>${this.formatDateTime(transportation.departureDateTime)}</td>
              <td>${this.formatDateTime(transportation.arrivalDateTime)}</td>
              <td>${transportation.departureLocation}</td>
              <td>${transportation.arrivalLocation}</td>
              <td>${this.formatCurrency(transportation.price, transportation.currency)}</td>
            </tr>
            `).join('')}
          </table>
          
          ${sortedTransportations.map(transportation => `
          <h3>${this.getTransportationTypeName(transportation.type)}: ${transportation.departureLocation} → ${transportation.arrivalLocation}</h3>
          <div class="info-box">
            <p><strong>出發時間:</strong> ${this.formatDateTime(transportation.departureDateTime)}</p>
            <p><strong>抵達時間:</strong> ${this.formatDateTime(transportation.arrivalDateTime)}</p>
            <p><strong>出發地點:</strong> ${transportation.departureLocation}</p>
            <p><strong>抵達地點:</strong> ${transportation.arrivalLocation}</p>
            <p><strong>價格:</strong> ${this.formatCurrency(transportation.price, transportation.currency)}</p>
            
            ${transportation.bookingReference ? `<p><strong>預訂編號:</strong> ${transportation.bookingReference}</p>` : ''}
            
            <!-- 不同交通類型的特定信息 -->
            ${transportation.type === 'flight' && transportation.airline ? `<p><strong>航空公司:</strong> ${transportation.airline}</p>` : ''}
            ${transportation.type === 'flight' && transportation.flightNumber ? `<p><strong>航班號:</strong> ${transportation.flightNumber}</p>` : ''}
            ${transportation.type === 'flight' && transportation.cabinClass ? `<p><strong>艙等:</strong> ${transportation.cabinClass}</p>` : ''}
            
            ${transportation.type === 'train' && transportation.trainNumber ? `<p><strong>車次:</strong> ${transportation.trainNumber}</p>` : ''}
            ${transportation.type === 'train' && transportation.carNumber ? `<p><strong>車廂號:</strong> ${transportation.carNumber}</p>` : ''}
            
            ${transportation.type === 'rental' && transportation.rentalCompany ? `<p><strong>租車公司:</strong> ${transportation.rentalCompany}</p>` : ''}
            ${transportation.type === 'rental' && transportation.carModel ? `<p><strong>車型:</strong> ${transportation.carModel}</p>` : ''}
            
            ${transportation.notes ? `<p><strong>備註:</strong> ${transportation.notes}</p>` : ''}
          </div>
          `).join('')}
          ` : ''}
          
          <!-- 預算資訊 -->
          <h2 id="budget">5. 預算資訊</h2>
          <h3>預算總覽</h3>
          <div class="info-box">
            <p><strong>總預算:</strong> ${this.formatCurrency(trip.budget, trip.currency || 'TWD')}</p>
            
            <!-- 住宿預算 -->
            ${sortedAccommodations.length > 0 ? `
            <h4>住宿預算</h4>
            <p><strong>住宿總預算:</strong> ${this.formatCurrency(
              sortedAccommodations.reduce((total, acc) => total + acc.totalPrice, 0), 
              'TWD'
            )}</p>
            ` : ''}
            
            <!-- 交通預算 -->
            ${sortedTransportations.length > 0 ? `
            <h4>交通預算</h4>
            <p><strong>交通總預算:</strong> ${this.formatCurrency(
              sortedTransportations.reduce((total, trans) => total + trans.price, 0), 
              'TWD'
            )}</p>
            ` : ''}
            
            <!-- 活動預算 -->
            ${sortedDays.length > 0 ? `
            <h4>活動預算</h4>
            <p><strong>活動總預算:</strong> ${this.formatCurrency(
              sortedDays.reduce((total, day) => {
                return total + day.activities.reduce((actTotal, act) => {
                  return actTotal + (act.cost || 0);
                }, 0);
              }, 0),
              'TWD'
            )}</p>
            ` : ''}
          </div>
          
          <!-- 緊急聯絡資訊 -->
          ${trip.participants && trip.participants.length > 0 ? `
          <h2 id="participants">6. 緊急聯絡資訊</h2>
          <table>
            <tr>
              <th>姓名</th>
              <th>聯絡方式</th>
            </tr>
            ${trip.participants.map(participant => `
            <tr>
              <td>${participant.name}</td>
              <td>${participant.email || '無'}</td>
            </tr>
            `).join('')}
          </table>
          ` : ''}
          
          <!-- 備註和提示 -->
          <h2 id="notes">7. 備註和提示</h2>
          ${trip.notes ? `
          <h3>備註</h3>
          <p>${trip.notes}</p>
          ` : ''}
          
          <h3>旅行提示</h3>
          <ul>
            <li>請確保您的旅遊文件齊全，包括護照、簽證、機票等。</li>
            <li>請注意當地的氣候和天氣預報，做好相應的準備。</li>
            <li>請尊重當地的文化和習俗，避免不必要的麻煩。</li>
            <li>建議攜帶重要物品（如藥品、充電器等）的清單，以免遺忘。</li>
            <li>出發前請確認所有預訂和確認信息，將重要文件備份。</li>
            <li>請記住緊急聯絡方式，包括當地救援電話和使領館信息。</li>
          </ul>
          
          <!-- 頁腳 -->
          <div class="footer">
            <p>© ${new Date().getFullYear()} 旅行計劃管理系統 | 本旅遊手冊包含行程、住宿、交通、預算等相關信息</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  /**
   * 獲取當日住宿信息
   */
  private static getDayAccommodation(day: ItineraryDay, accommodations: Accommodation[]): string {
    const matchingAccommodations = accommodations.filter(acc =>
      new Date(acc.checkInDate) <= new Date(day.date) && new Date(acc.checkOutDate) > new Date(day.date)
    );
    
    if (matchingAccommodations.length === 0) {
      return '';
    }
    
    return `
      <h4>當日住宿</h4>
      ${matchingAccommodations.map(acc => `
        <p><strong>${acc.name}</strong> (${this.getAccommodationTypeName(acc.type)})</p>
        <p>${acc.address}</p>
      `).join('')}
    `;
  }
  
  /**
   * 獲取當日交通信息
   */
  private static getDayTransportation(day: ItineraryDay, transportations: Transportation[]): string {
    const dayDate = new Date(day.date);
    const nextDay = new Date(dayDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const matchingTransportations = transportations.filter(trans => {
      const depDate = new Date(trans.departureDateTime);
      return depDate >= dayDate && depDate < nextDay;
    });
    
    if (matchingTransportations.length === 0) {
      return '';
    }
    
    return `
      <h4>當日交通</h4>
      ${matchingTransportations.map(trans => `
        <p><strong>${this.formatTime(trans.departureDateTime)}</strong> ${this.getTransportationTypeName(trans.type)}: ${trans.departureLocation} → ${trans.arrivalLocation}</p>
      `).join('')}
    `;
  }
  
  /**
   * 獲取住宿類型名稱
   */
  private static getAccommodationTypeName(type: string): string {
    const typeMap: Record<string, string> = {
      'hotel': '酒店',
      'hostel': '青年旅舍',
      'apartment': '公寓',
      'resort': '度假村',
      'homestay': '民宿',
      'guesthouse': '旅館',
      'camping': '露營地',
      'villa': '別墅',
      'other': '其他'
    };
    
    return typeMap[type] || type;
  }
  
  /**
   * 獲取交通類型名稱
   */
  private static getTransportationTypeName(type: string): string {
    const typeMap: Record<string, string> = {
      'flight': '飛機',
      'train': '火車',
      'rental': '租車',
      'taxi': '計程車',
      'charter': '包車',
      'other': '其他'
    };
    
    return typeMap[type] || type;
  }
  
  /**
   * 獲取活動類別名稱
   */
  private static getCategoryName(category: string): string {
    const categoryMap: Record<string, string> = {
      'sightseeing': '觀光',
      'activity': '活動',
      'transportation': '交通',
      'accommodation': '住宿',
      'meal': '餐飲',
      'other': '其他'
    };
    
    return categoryMap[category] || category;
  }
  
  /**
   * 格式化日期
   */
  private static formatDate(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  }
  
  /**
   * 格式化時間
   */
  private static formatTime(timeString: string): string {
    if (!timeString) return '';
    
    if (timeString.includes(':') && !timeString.includes('-') && !timeString.includes('/')) {
      return timeString;
    }
    
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timeString;
    }
  }
  
  /**
   * 格式化日期和時間
   */
  private static formatDateTime(dateTimeString: string): string {
    if (!dateTimeString) return '';
    
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateTimeString;
    }
  }
  
  /**
   * 格式化貨幣
   */
  private static formatCurrency(amount: number | undefined, currency: string = 'TWD'): string {
    if (amount === undefined) return '未設定';
    return `${currency} ${amount.toLocaleString('zh-TW')}`;
  }
  
  /**
   * 計算行程天數
   */
  private static calculateDuration(startDateString: string, endDateString: string): number {
    const startDate = new Date(startDateString);
    const endDate = new Date(endDateString);
    
    // 計算天數差異
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 包含開始和結束當天
  }
}
