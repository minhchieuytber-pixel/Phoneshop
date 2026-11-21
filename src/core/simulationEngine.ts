import { eventBus } from './eventBus';
import { formatGameTime, formatShortVND, SPEED_MULTIPLIERS } from './timeManager';
import type {
  AttendanceRecord,
  Candidate,
  Complaint,
  Contract,
  Customer,
  DailySnapshot,
  Department,
  Employee,
  ExpansionStage,
  GameState,
  OnlineOrder,
  OnlineOrderChannel,
  PhoneModel,
  PurchaseOrder,
  RepairIssue,
  SimSpeed,
  SimTask,
  Transaction,
  WeatherType,
} from './types';

export const EXPANSION_STAGES: ExpansionStage[] = [
  {
    level: 1,
    name: 'Cửa hàng nhỏ',
    description: 'Cửa hàng độc lập tại khu phố trung tâm với đội ngũ tinh gọn.',
    upgradeCost: 0,
    maxStaff: 12,
    trafficBonus: 1.0,
    unlockedFeatures: ['Showroom cơ bản', 'Phòng kỹ thuật 3 kỹ thuật viên', 'CSKH Online & Giao vận'],
  },
  {
    level: 2,
    name: 'Cửa hàng chuyên nghiệp',
    description: 'Mở rộng khu trải nghiệm flagship, nâng cao uy tín thương hiệu.',
    upgradeCost: 180_000_000,
    maxStaff: 16,
    trafficBonus: 1.25,
    unlockedFeatures: ['Tăng 25% lượng khách', 'Chiết khấu đối tác +2%', 'Quảng bá khu vực'],
  },
  {
    level: 3,
    name: 'Trung tâm điện thoại & sửa chữa',
    description: 'Trung tâm bán lẻ kết hợp bảo hành chuyên sâu, đón khách VIP.',
    upgradeCost: 420_000_000,
    maxStaff: 14,
    trafficBonus: 1.55,
    unlockedFeatures: ['Tăng 55% lượng khách', 'Khách VIP & Hợp đồng B2B', 'Sửa chữa cao cấp'],
  },
  {
    level: 4,
    name: 'Chuỗi cửa hàng nội thành',
    description: 'Vận hành chi nhánh Quận 1, Quận 3 và Thủ Đức đồng bộ.',
    upgradeCost: 950_000_000,
    maxStaff: 20,
    trafficBonus: 1.9,
    unlockedFeatures: ['Quản lý chi nhánh', 'Phòng Nhân sự & Kế toán', 'Đàm phán cấp hãng'],
  },
  {
    level: 5,
    name: 'Chuỗi cửa hàng toàn quốc',
    description: 'Hệ thống phân phối phủ sóng các đô thị lớn.',
    upgradeCost: 2_200_000_000,
    maxStaff: 30,
    trafficBonus: 2.35,
    unlockedFeatures: ['Kho trung tâm đa vùng', 'Chiết khấu sỉ đặc biệt'],
  },
  {
    level: 6,
    name: 'Doanh nghiệp phân phối điện thoại',
    description: 'Nhập khẩu trực tiếp và phân phối lại cho đại lý cấp dưới.',
    upgradeCost: 4_800_000_000,
    maxStaff: 45,
    trafficBonus: 2.8,
    unlockedFeatures: ['Phân phối B2B quy mô lớn', 'Độc quyền sản phẩm mới'],
  },
  {
    level: 7,
    name: 'Tập đoàn bán lẻ công nghệ',
    description: 'Đỉnh cao hệ sinh thái bán lẻ & dịch vụ công nghệ toàn quốc.',
    upgradeCost: 10_000_000_000,
    maxStaff: 70,
    trafficBonus: 3.4,
    unlockedFeatures: ['Hội đồng điều hành tập đoàn', 'Thương hiệu dẫn đầu thị trường'],
  },
];

const CUSTOMER_NAMES = [
  'Nguyễn Minh Tuấn', 'Trần Thu Hà', 'Lê Hoàng Long', 'Phạm Khánh Linh',
  'Võ Đức Anh', 'Đặng Ngọc Mai', 'Bùi Quang Huy', 'Hoàng Phương Thảo',
  'Đỗ Gia Bảo', 'Phan Thanh Trúc', 'Ngô Hải Đăng', 'Dương Bảo Ngọc',
  'Trương Tấn Tài', 'Lý Mỹ Duyên', 'Vũ Trọng Nghĩa', 'Hồ Yến Nhi',
];

const SHIRT_PALETTE = ['#2563eb', '#0f766e', '#b45309', '#be123c', '#4338ca', '#334155', '#047857', '#6d28d9', '#ea580c', '#0891b2'];
const PANTS_PALETTE = ['#1e293b', '#0f172a', '#334155', '#3f3f46', '#451a03', '#1e3a5f'];
const HAIR_PALETTE = ['#1c1917', '#292524', '#44403c', '#78350f', '#09090b', '#92400e'];
const SKIN_PALETTE = ['#f1c27d', '#e0ac69', '#ffdbac', '#c68642'];
const HAIR_STYLES = ['short', 'side_part', 'long', 'ponytail', 'bob', 'curly'] as const;
const OUTFIT_STYLES = ['tshirt', 'jacket', 'hoodie', 'formal', 'polo'] as const;
const REPAIR_ISSUES: RepairIssue[] = [
  'Vỡ màn hình',
  'Hỏng pin',
  'Hỏng camera',
  'Hỏng loa',
  'Lỗi chân sạc',
  'Lỗi phần mềm',
  'Không lên nguồn',
];

const ONLINE_CHANNELS: OnlineOrderChannel[] = ['Website', 'Shopee Mall', 'TikTok Shop', 'Zalo OA'];
const ONLINE_ADDRESSES = [
  '128 Nguyễn Huệ, Q.1, TP.HCM',
  '45 Lê Văn Sỹ, Phú Nhuận, TP.HCM',
  '210 Võ Văn Ngân, Thủ Đức, TP.HCM',
  '89 Phan Xích Long, Bình Thạnh, TP.HCM',
  '312 Cách Mạng Tháng 8, Q.3, TP.HCM',
  '19 Nguyễn Thị Thập, Q.7, TP.HCM',
  '504 Sư Vạn Hạnh, Q.10, TP.HCM',
];
const ONLINE_PHONES = ['0903 412 889', '0987 651 204', '0918 224 760', '0932 908 115', '0976 540 318', '0944 817 502'];

const ACCESSORY_CATALOG: { name: string; retail: number; cost: number }[] = [
  { name: 'Bộ sạc nhanh GaN 65W + Cáp C-C', retail: 890_000, cost: 420_000 },
  { name: 'Ốp lưng MagSafe & Cường lực Sapphire', retail: 650_000, cost: 260_000 },
  { name: 'Tai nghe Bluetooth ANC Pro', retail: 1_850_000, cost: 1_050_000 },
  { name: 'Pin dự phòng 20.000mAh PD', retail: 1_150_000, cost: 610_000 },
  { name: 'Dán PPF toàn thân & Kính chống nhìn trộm', retail: 480_000, cost: 140_000 },
];

const USED_TRADEIN_DEVICES: { name: string; buyPrice: number; resaleValue: number }[] = [
  { name: 'iPhone 15 Pro 256GB (Máy cũ)', buyPrice: 15_500_000, resaleValue: 18_400_000 },
  { name: 'iPhone 14 Pro Max 128GB (Máy cũ)', buyPrice: 12_800_000, resaleValue: 15_300_000 },
  { name: 'Galaxy S24 Ultra 256GB (Máy cũ)', buyPrice: 14_200_000, resaleValue: 16_900_000 },
  { name: 'Xiaomi 14 256GB (Máy cũ)', buyPrice: 8_500_000, resaleValue: 10_400_000 },
  { name: 'OPPO Reno11 Pro (Máy cũ)', buyPrice: 5_800_000, resaleValue: 7_300_000 },
];

let uidCounter = 1000;
function uid(prefix: string): string {
  uidCounter += 1;
  return `${prefix}_${uidCounter}_${Math.floor(Math.random() * 999)}`;
}

export function createInitialGameState(): GameState {
  const models: PhoneModel[] = [
    {
      id: 'ip17pm',
      brand: 'Apple',
      model: 'iPhone 17 Pro Max',
      color: 'Titan Tự Nhiên',
      colorHex: '#b8b2a6',
      storage: '256GB',
      tier: 'flagship',
      wholesalePrice: 28_500_000,
      retailPrice: 33_990_000,
      marketDemand: 1.45,
      lifecycle: 'hot',
      stock: 8,
      warrantyMonths: 12,
      rating: 4.9,
    },
    {
      id: 'ip17',
      brand: 'Apple',
      model: 'iPhone 17',
      color: 'Xanh Lưu Ly',
      colorHex: '#3b82f6',
      storage: '128GB',
      tier: 'flagship',
      wholesalePrice: 19_200_000,
      retailPrice: 22_990_000,
      marketDemand: 1.3,
      lifecycle: 'hot',
      stock: 10,
      warrantyMonths: 12,
      rating: 4.8,
    },
    {
      id: 's26u',
      brand: 'Samsung',
      model: 'Galaxy S26 Ultra',
      color: 'Đen Titanium',
      colorHex: '#1f2937',
      storage: '256GB',
      tier: 'flagship',
      wholesalePrice: 25_400_000,
      retailPrice: 30_490_000,
      marketDemand: 1.25,
      lifecycle: 'launch',
      stock: 6,
      warrantyMonths: 12,
      rating: 4.8,
    },
    {
      id: 'a56',
      brand: 'Samsung',
      model: 'Galaxy A56 5G',
      color: 'Bạc Ánh Kim',
      colorHex: '#cbd5e1',
      storage: '128GB',
      tier: 'midrange',
      wholesalePrice: 8_100_000,
      retailPrice: 9_990_000,
      marketDemand: 1.35,
      lifecycle: 'hot',
      stock: 12,
      warrantyMonths: 12,
      rating: 4.6,
    },
    {
      id: 'xm15p',
      brand: 'Xiaomi',
      model: 'Xiaomi 15 Pro',
      color: 'Xanh Rừng',
      colorHex: '#14532d',
      storage: '256GB',
      tier: 'flagship',
      wholesalePrice: 16_800_000,
      retailPrice: 19_990_000,
      marketDemand: 1.1,
      lifecycle: 'saturated',
      stock: 7,
      warrantyMonths: 18,
      rating: 4.7,
    },
    {
      id: 'rn14',
      brand: 'Xiaomi',
      model: 'Redmi Note 14 Pro',
      color: 'Tím Oải Hương',
      colorHex: '#7c3aed',
      storage: '128GB',
      tier: 'budget',
      wholesalePrice: 5_400_000,
      retailPrice: 6_790_000,
      marketDemand: 1.5,
      lifecycle: 'hot',
      stock: 14,
      warrantyMonths: 18,
      rating: 4.5,
    },
    {
      id: 'reno13',
      brand: 'OPPO',
      model: 'OPPO Reno13 5G',
      color: 'Trắng Ngọc Trai',
      colorHex: '#f1f5f9',
      storage: '256GB',
      tier: 'midrange',
      wholesalePrice: 10_200_000,
      retailPrice: 12_490_000,
      marketDemand: 1.15,
      lifecycle: 'hot',
      stock: 9,
      warrantyMonths: 12,
      rating: 4.6,
    },
    {
      id: 'vivov40',
      brand: 'Vivo',
      model: 'Vivo V40 5G',
      color: 'Xanh Thiên Thanh',
      colorHex: '#0284c7',
      storage: '256GB',
      tier: 'midrange',
      wholesalePrice: 9_600_000,
      retailPrice: 11_790_000,
      marketDemand: 0.95,
      lifecycle: 'discount',
      stock: 6,
      warrantyMonths: 12,
      rating: 4.5,
    },
    {
      id: 'px10p',
      brand: 'Google',
      model: 'Pixel 10 Pro',
      color: 'Xám Đá',
      colorHex: '#64748b',
      storage: '256GB',
      tier: 'flagship',
      wholesalePrice: 21_500_000,
      retailPrice: 25_490_000,
      marketDemand: 0.9,
      lifecycle: 'upcoming',
      stock: 3,
      warrantyMonths: 12,
      rating: 4.8,
    },
  ];

  const employees: Employee[] = [
    {
      id: 'emp_assistant',
      name: 'Nguyễn Minh Anh',
      age: 26,
      role: 'Trợ lý Giám đốc',
      department: 'management',
      isAssistant: true,
      salary: 16_000_000,
      experience: 82,
      skill: 86,
      speed: 82,
      communication: 92,
      morale: 88,
      performance: 88,
      customersServed: 0,
      ordersClosed: 0,
      revenueGenerated: 0,
      tasksCompleted: 4,
      errorCount: 0,
      satisfactionAvg: 95,
      workHistory: ['Gia nhập từ ngày đầu khai trương', 'Phụ trách điều phối & báo cáo tổng hợp'],
      state: 'working',
      currentTaskId: null,
      trainingDaysLeft: 0,
      avatarColor: '#f1c27d',
      shirtColor: '#1e293b',
      hairColor: '#1c1917',
      homeZone: 'assistant',
    },
    {
      id: 'emp_sales_1',
      name: 'Trần Hoàng Nam',
      age: 25,
      role: 'Chuyên viên Tư vấn',
      department: 'sales',
      salary: 11_000_000,
      experience: 74,
      skill: 82,
      speed: 62,
      communication: 90,
      morale: 84,
      performance: 80,
      customersServed: 0,
      ordersClosed: 0,
      revenueGenerated: 0,
      tasksCompleted: 0,
      errorCount: 0,
      satisfactionAvg: 90,
      workHistory: ['Tư vấn rất khéo léo nhưng xử lý hơi chậm'],
      state: 'idle',
      currentTaskId: null,
      trainingDaysLeft: 0,
      avatarColor: '#ffdbac',
      shirtColor: '#1d4ed8',
      hairColor: '#1c1917',
      homeZone: 'showroom',
    },
    {
      id: 'emp_sales_2',
      name: 'Lê Thảo Vy',
      age: 22,
      role: 'Nhân viên Bán hàng',
      department: 'sales',
      salary: 9_000_000,
      experience: 52,
      skill: 62,
      speed: 86,
      communication: 66,
      morale: 78,
      performance: 71,
      customersServed: 0,
      ordersClosed: 0,
      revenueGenerated: 0,
      tasksCompleted: 0,
      errorCount: 0,
      satisfactionAvg: 78,
      workHistory: ['Nhanh nhẹn, nhiệt tình, cần đào tạo kỹ năng chốt đơn'],
      state: 'idle',
      currentTaskId: null,
      trainingDaysLeft: 0,
      avatarColor: '#f1c27d',
      shirtColor: '#2563eb',
      hairColor: '#44403c',
      homeZone: 'showroom',
    },
    {
      id: 'emp_tech_1',
      name: 'Phạm Quốc Bảo',
      age: 29,
      role: 'Kỹ thuật viên Trưởng',
      department: 'tech',
      salary: 15_000_000,
      experience: 88,
      skill: 90,
      speed: 74,
      communication: 56,
      morale: 80,
      performance: 85,
      customersServed: 0,
      ordersClosed: 0,
      revenueGenerated: 0,
      tasksCompleted: 0,
      errorCount: 0,
      satisfactionAvg: 88,
      workHistory: ['Chuyên sửa main & thay màn hình iPhone/Samsung', 'Ít nói, làm việc chuẩn xác'],
      state: 'idle',
      currentTaskId: null,
      trainingDaysLeft: 0,
      avatarColor: '#e0ac69',
      shirtColor: '#0f766e',
      hairColor: '#09090b',
      homeZone: 'tech',
    },
    {
      id: 'emp_tech_2',
      name: 'Lê Minh Trí',
      age: 26,
      role: 'Kỹ thuật viên Phần cứng',
      department: 'tech',
      salary: 12_500_000,
      experience: 76,
      skill: 82,
      speed: 80,
      communication: 65,
      morale: 84,
      performance: 81,
      customersServed: 0,
      ordersClosed: 0,
      revenueGenerated: 0,
      tasksCompleted: 0,
      errorCount: 0,
      satisfactionAvg: 86,
      workHistory: ['Chuyên thay pin, chân sạc, camera và hàn mạch IC'],
      state: 'idle',
      currentTaskId: null,
      trainingDaysLeft: 0,
      avatarColor: '#f1c27d',
      shirtColor: '#0d9488',
      hairColor: '#1c1917',
      homeZone: 'tech',
    },
    {
      id: 'emp_tech_3',
      name: 'Trần Thanh Tùng',
      age: 24,
      role: 'Kỹ thuật viên Phần mềm & Ép kính',
      department: 'tech',
      salary: 11_000_000,
      experience: 68,
      skill: 75,
      speed: 85,
      communication: 72,
      morale: 86,
      performance: 79,
      customersServed: 0,
      ordersClosed: 0,
      revenueGenerated: 0,
      tasksCompleted: 0,
      errorCount: 0,
      satisfactionAvg: 85,
      workHistory: ['Chuyên ép kính màn hình, chạy phần mềm & kiểm tra linh kiện'],
      state: 'idle',
      currentTaskId: null,
      trainingDaysLeft: 0,
      avatarColor: '#ffdbac',
      shirtColor: '#115e59',
      hairColor: '#292524',
      homeZone: 'tech',
    },
    {
      id: 'emp_cashier_1',
      name: 'Vũ Ngọc Hân',
      age: 23,
      role: 'Thu ngân & CSKH',
      department: 'cashier',
      salary: 9_500_000,
      experience: 66,
      skill: 76,
      speed: 82,
      communication: 80,
      morale: 85,
      performance: 80,
      customersServed: 0,
      ordersClosed: 0,
      revenueGenerated: 0,
      tasksCompleted: 0,
      errorCount: 0,
      satisfactionAvg: 86,
      workHistory: ['Thao tác POS chuẩn xác, hỗ trợ xuất hóa đơn nhanh'],
      state: 'idle',
      currentTaskId: null,
      trainingDaysLeft: 0,
      avatarColor: '#ffdbac',
      shirtColor: '#334155',
      hairColor: '#1c1917',
      homeZone: 'cashier',
    },
    {
      id: 'emp_wh_1',
      name: 'Đặng Tuấn Kiệt',
      age: 25,
      role: 'Thủ kho & Kiểm kê',
      department: 'warehouse',
      salary: 9_500_000,
      experience: 68,
      skill: 74,
      speed: 76,
      communication: 60,
      morale: 81,
      performance: 77,
      customersServed: 0,
      ordersClosed: 0,
      revenueGenerated: 0,
      tasksCompleted: 0,
      errorCount: 0,
      satisfactionAvg: 82,
      workHistory: ['Quản lý nhập xuất IMEI và kiểm tra hàng cũ'],
      state: 'working',
      currentTaskId: null,
      trainingDaysLeft: 0,
      avatarColor: '#e0ac69',
      shirtColor: '#b45309',
      hairColor: '#292524',
      homeZone: 'warehouse',
    },
    {
      id: 'emp_cs_online_1',
      name: 'Hoàng Bảo Châu',
      age: 24,
      role: 'CSKH Online & Chốt đơn',
      department: 'cs',
      salary: 10_500_000,
      experience: 74,
      skill: 80,
      speed: 82,
      communication: 92,
      morale: 87,
      performance: 84,
      customersServed: 0,
      ordersClosed: 0,
      revenueGenerated: 0,
      tasksCompleted: 0,
      errorCount: 0,
      satisfactionAvg: 91,
      workHistory: ['Trực fanpage, sàn TMĐT & gọi xác nhận đơn đặt hàng online'],
      state: 'idle',
      currentTaskId: null,
      trainingDaysLeft: 0,
      avatarColor: '#ffdbac',
      shirtColor: '#4338ca',
      hairColor: '#1c1917',
      homeZone: 'online_cs',
    },
    {
      id: 'emp_ship_1',
      name: 'Nguyễn Văn Phong',
      age: 26,
      role: 'Đóng gói & Vận chuyển',
      department: 'shipping',
      salary: 10_000_000,
      experience: 72,
      skill: 76,
      speed: 86,
      communication: 74,
      morale: 85,
      performance: 81,
      customersServed: 0,
      ordersClosed: 0,
      revenueGenerated: 0,
      tasksCompleted: 0,
      errorCount: 0,
      satisfactionAvg: 88,
      workHistory: ['Đóng gói hàng từ kho và giao nhanh tận tay khách đặt online'],
      state: 'idle',
      currentTaskId: null,
      trainingDaysLeft: 0,
      avatarColor: '#e0ac69',
      shirtColor: '#ea580c',
      hairColor: '#09090b',
      homeZone: 'shipping',
    },
  ];

  const candidates: Candidate[] = [
    {
      id: 'cand_1',
      name: 'Bùi Nhật Minh',
      age: 27,
      role: 'Tư vấn Flagship',
      department: 'sales',
      expectedSalary: 13_500_000,
      experience: 80,
      skill: 85,
      speed: 75,
      communication: 89,
      trait: 'Kinh nghiệm cao, chốt đơn flagship tốt nhưng đòi hỏi lương cao.',
      avatarColor: '#f1c27d',
      shirtColor: '#1d4ed8',
      hairColor: '#1c1917',
    },
    {
      id: 'cand_2',
      name: 'Ngô Tấn Phát',
      age: 21,
      role: 'Kỹ thuật viên Tập sự',
      department: 'tech',
      expectedSalary: 7_500_000,
      experience: 35,
      skill: 48,
      speed: 65,
      communication: 70,
      trait: 'Mức lương thấp, tiếp thu nhanh nếu được đào tạo bài bản.',
      avatarColor: '#e0ac69',
      shirtColor: '#0f766e',
      hairColor: '#292524',
    },
    {
      id: 'cand_3',
      name: 'Đinh Mỹ Linh',
      age: 24,
      role: 'CSKH Online & Khiếu nại',
      department: 'cs',
      expectedSalary: 10_000_000,
      experience: 64,
      skill: 74,
      speed: 78,
      communication: 91,
      trait: 'Chốt đơn online và xử lý khiếu nại khéo léo, giữ chân khách hàng quay lại.',
      avatarColor: '#ffdbac',
      shirtColor: '#4338ca',
      hairColor: '#1c1917',
    },
    {
      id: 'cand_4',
      name: 'Trương Vĩnh Phúc',
      age: 26,
      role: 'Chuyên viên Kho vận',
      department: 'warehouse',
      expectedSalary: 10_500_000,
      experience: 72,
      skill: 79,
      speed: 84,
      communication: 61,
      trait: 'Kiểm kê nhanh và chuẩn, hỗ trợ nhập hàng số lượng lớn.',
      avatarColor: '#c68642',
      shirtColor: '#b45309',
      hairColor: '#09090b',
    },
    {
      id: 'cand_5',
      name: 'Phạm Hữu Nghĩa',
      age: 24,
      role: 'Nhân viên Giao hàng & Đóng gói',
      department: 'shipping',
      expectedSalary: 9_500_000,
      experience: 65,
      skill: 70,
      speed: 88,
      communication: 76,
      trait: 'Rành đường nội thành, đóng gói cẩn thận và giao đơn online siêu tốc.',
      avatarColor: '#f1c27d',
      shirtColor: '#ea580c',
      hairColor: '#1c1917',
    },
  ];

  const suppliers = [
    {
      id: 'sup_fpt',
      name: 'Synnex FPT Distribution',
      repName: 'Ông Trần Văn Hùng',
      phone: '028 7300 8899',
      email: 'hung.tv@synnex-retail.vn',
      brands: ['Apple', 'Samsung'] as PhoneModel['brand'][],
      baseDiscount: 0.05,
      qualityRating: 4.9,
      warrantyPolicy: 'Đổi mới 30 ngày, bảo hành chính hãng 12 tháng',
      deliveryHours: 4,
      reputation: 68,
      paymentTermsDays: 15,
    },
    {
      id: 'sup_dgw',
      name: 'DigiWorld Mobile Corp',
      repName: 'Bà Lê Mai Phương',
      phone: '028 3929 0055',
      email: 'phuong.lm@dgw-supply.vn',
      brands: ['Xiaomi', 'OPPO', 'Vivo'] as PhoneModel['brand'][],
      baseDiscount: 0.08,
      qualityRating: 4.6,
      warrantyPolicy: 'Bảo hành 18 tháng, hỗ trợ trưng bày POSM',
      deliveryHours: 3,
      reputation: 64,
      paymentTermsDays: 10,
    },
    {
      id: 'sup_vt',
      name: 'Viettel Tech Wholesale',
      repName: 'Ông Nguyễn Khắc Duy',
      phone: '024 6266 1122',
      email: 'duy.nk@viettel-wholesale.vn',
      brands: ['Apple', 'OPPO', 'Samsung'] as PhoneModel['brand'][],
      baseDiscount: 0.06,
      qualityRating: 4.8,
      warrantyPolicy: 'Hỗ trợ công nợ 20 ngày với đối tác uy tín',
      deliveryHours: 5,
      reputation: 60,
      paymentTermsDays: 20,
    },
    {
      id: 'sup_ap',
      name: 'Asia Pacific Tech Supply',
      repName: 'Mr. David Chen',
      phone: '028 3822 7744',
      email: 'd.chen@aptech-import.com',
      brands: ['Google', 'Xiaomi', 'Apple'] as PhoneModel['brand'][],
      baseDiscount: 0.09,
      qualityRating: 4.4,
      warrantyPolicy: 'Giao nhanh hàng hiếm & flagship quốc tế',
      deliveryHours: 6,
      reputation: 55,
      paymentTermsDays: 7,
    },
  ];

  const competitors = [
    {
      id: 'comp_1',
      name: 'CellZone Pro',
      capital: 850_000_000,
      staffCount: 8,
      priceModifier: 0.98,
      reputation: 66,
      strategy: 'Phá giá' as const,
      monthlyRevenue: 320_000_000,
      lastAction: 'Giảm 2% dòng máy tầm trung cuối tuần',
    },
    {
      id: 'comp_2',
      name: 'TechHub 24h',
      capital: 1_200_000_000,
      staffCount: 11,
      priceModifier: 1.02,
      reputation: 74,
      strategy: 'Dịch vụ nhanh' as const,
      monthlyRevenue: 460_000_000,
      lastAction: 'Tuyển thêm 1 kỹ thuật viên sửa chữa lấy liền',
    },
    {
      id: 'comp_3',
      name: 'MegaPhone Center',
      capital: 1_800_000_000,
      staffCount: 15,
      priceModifier: 1.0,
      reputation: 79,
      strategy: 'Cao cấp' as const,
      monthlyRevenue: 690_000_000,
      lastAction: 'Nhập lô Galaxy S26 Ultra trưng bày sớm',
    },
  ];

  return {
    storeName: 'Minh Chiêu Mobile',
    ownerName: 'Giám đốc',
    totalMinutes: 6 * 60, // Day 1, 06:00 AM
    speed: 'normal',
    weather: 'clear',
    lightsOn: true,
    doorOpen: false,
    directorDoorOpen: false,
    businessBalance: 320_000_000,
    personalBalance: 45_000_000,
    loanDebt: 0,
    reputation: 62,
    expansionLevel: 1,
    employees,
    candidates,
    models,
    customers: [],
    onlineOrders: [
      {
        id: 'onl_init_1',
        orderCode: 'MC-1001',
        channel: 'Website',
        customerName: 'Trần Thu Hà',
        customerPhone: '0903 412 889',
        deliveryAddress: '128 Nguyễn Huệ, Q.1, TP.HCM',
        modelId: 'ip17',
        modelName: 'iPhone 17 (128GB)',
        quantity: 1,
        unitPrice: 22_990_000,
        totalAmount: 22_990_000,
        cogs: 19_200_000,
        profit: 3_790_000,
        status: 'new',
        createdMinute: 360,
        day: 1,
        csEmployeeId: null,
        csEmployeeName: null,
        shipperEmployeeId: null,
        shipperEmployeeName: null,
        note: 'Khách đặt giao nhanh trong ngày',
      },
    ],
    tasks: [],
    transactions: [],
    suppliers,
    contracts: [],
    orders: [],
    complaints: [],
    messages: [
      {
        id: 'msg_init_1',
        senderId: 'emp_assistant',
        senderName: 'Nguyễn Minh Anh',
        senderRole: 'Trợ lý Giám đốc',
        text: 'Chào sếp buổi sáng 06:00! Toàn bộ nhân sự đã chấm công vào ca. Sếp có thể ngồi tại bàn giám đốc mở máy tính, tiếp khách ở phòng tiếp khách, hoặc gọi đối tác Synnex FPT để nhập lô hàng đầu tiên.',
        minute: 360,
        day: 1,
        read: false,
        category: 'assistant',
      },
      {
        id: 'msg_init_2',
        senderId: 'sup_fpt',
        senderName: 'Ông Trần Văn Hùng',
        senderRole: 'Synnex FPT Distribution',
        text: 'Chào anh/chị chủ Minh Chiêu Mobile. Bên em đang có bảng giá sỉ mới cho iPhone 17 Pro Max và Galaxy S26 Ultra. Nếu lấy đơn trên 20 máy sẽ có chiết khấu tốt.',
        minute: 360,
        day: 1,
        read: false,
        category: 'supplier',
      },
    ],
    emails: [
      {
        id: 'mail_init_1',
        from: 'hung.tv@synnex-retail.vn',
        fromName: 'Trần Văn Hùng - Synnex FPT',
        subject: 'Báo giá sỉ Quý mới & Đề nghị hợp tác phân phối',
        body: 'Kính gửi Ban Giám Đốc Minh Chiêu Mobile,\n\nSynnex FPT trân trọng gửi bảng chính sách chiết khấu 5% - 11% tùy sản lượng cam kết. Quý cửa hàng có thể phản hồi qua Điện thoại hoặc Email để đặt lịch đại diện qua gặp trực tiếp tại văn phòng.\n\nTrân trọng.',
        minute: 360,
        day: 1,
        read: false,
      },
    ],
    calendar: [
      {
        id: 'cal_1',
        title: 'Đóng cửa & Chấm công tan làm nhân viên',
        day: 1,
        timeText: '22:00',
        type: 'review',
        participant: 'Toàn bộ nhân sự',
      },
      {
        id: 'cal_2',
        title: 'Theo dõi ra mắt Pixel 10 Pro',
        day: 3,
        timeText: '09:00',
        type: 'launch',
        participant: 'Thị trường',
      },
    ],
    callHistory: [],
    competitors,
    dailyHistory: [],
    attendanceLogs: [],
    settings: {
      wallpaperIndex: 0,
      musicVolume: 0.35,
      sfxVolume: 0.7,
      muted: false,
      graphicsQuality: 'high',
      showControlsHint: true,
    },
    lastDailyReportDay: 0,
    lastClockOutDay: 0,
    lastMonthlyReportMonth: 0,
    activeSupplierVisitId: null,
    coffeeBreaksTaken: 0,
  };
}

export class SimulationEngine {
  public state: GameState;
  private customerSpawnCooldown = 6; // game minutes until first customer
  private onlineOrderCooldown = 9; // game minutes until next online order
  private marketTickTimer = 0;
  private complaintCheckTimer = 0;
  private minuteAccumulator = 0;

  constructor(initialState?: GameState) {
    this.state = initialState ?? createInitialGameState();
  }

  public replaceState(nextState: GameState): void {
    this.state = nextState;
    eventBus.emit('sim:updated', this.state);
  }

  public setSpeed(speed: SimSpeed): void {
    this.state.speed = speed;
    eventBus.emit('sim:updated', this.state);
  }

  public toggleLights(): void {
    this.state.lightsOn = !this.state.lightsOn;
    eventBus.emit('world:lights', this.state.lightsOn);
    eventBus.emit('sim:updated', this.state);
  }

  public toggleDoor(): void {
    this.state.doorOpen = !this.state.doorOpen;
    eventBus.emit('world:door', this.state.doorOpen);
    eventBus.emit('sim:updated', this.state);
  }

  public toggleDirectorDoor(): void {
    this.state.directorDoorOpen = !this.state.directorDoorOpen;
    eventBus.emit('world:director_door', this.state.directorDoorOpen);
    eventBus.emit('sim:updated', this.state);
  }

  public toggleWeather(): void {
    this.state.weather = this.state.weather === 'clear' ? 'rain' : 'clear';
    eventBus.emit('world:weather', this.state.weather);
    eventBus.emit('sim:updated', this.state);
  }

  public setWeather(weather: WeatherType): void {
    this.state.weather = weather;
    eventBus.emit('world:weather', weather);
    eventBus.emit('sim:updated', this.state);
  }

  public tick(realDt: number): void {
    const mult = SPEED_MULTIPLIERS[this.state.speed];
    if (mult <= 0) return;

    const deltaMinutes = realDt * mult;
    const prevTime = formatGameTime(this.state.totalMinutes);
    this.state.totalMinutes += deltaMinutes;
    const curTime = formatGameTime(this.state.totalMinutes);

    this.minuteAccumulator += deltaMinutes;
    this.marketTickTimer += deltaMinutes;
    this.complaintCheckTimer += deltaMinutes;

    // 1. Advance active tasks
    this.updateTasks(deltaMinutes);

    // 2. Spawn & advance customers during store hours
    this.updateCustomers(deltaMinutes, curTime);

    // 2b. Spawn & process Online Orders (CSKH Online -> Packing in Warehouse -> Shipping)
    this.updateOnlineOrders(deltaMinutes, curTime);

    // 3. Advance orders & multi-stage contracts
    this.updateOrdersAndContracts();

    // 4. Morning clock-in (06:00), Evening closing & attendance clock-out (22:00), Daily & Monthly checks
    if (curTime.hour >= 6 && curTime.hour < 22 && this.state.employees.some((e) => e.state === 'off_duty')) {
      this.clockInMorningShift(curTime.day);
    }

    // Welcome initial VIP supplier partner at 06:08 Day 1 if no contract visit has occurred yet
    if (
      curTime.day === 1 &&
      this.state.totalMinutes >= 368 &&
      this.state.contracts.length === 0 &&
      !this.state.activeSupplierVisitId
    ) {
      this.negotiateContract('sup_fpt', 'ip17pm', 10, 6, 15);
    }

    if (curTime.hour >= 22 && this.state.lastDailyReportDay < curTime.day) {
      this.generateDailyReport(curTime.day);
    }

    if (curTime.hour >= 22 && this.state.lastClockOutDay < curTime.day) {
      this.clockOutAllEmployees(curTime.day);
    }

    if (curTime.day > prevTime.day) {
      this.onNewDay(curTime.day);
    }

    // Periodic market & competitor activity every ~180 game minutes
    if (this.marketTickTimer >= 180) {
      this.marketTickTimer = 0;
      this.updateMarketAndCompetitors(curTime.day);
    }

    // Periodic UI sync (~once per 1.2 game minutes or when tasks finish)
    if (this.minuteAccumulator >= 0.8) {
      this.minuteAccumulator = 0;
      eventBus.emit('sim:updated', this.state);
    }
  }

  private updateTasks(deltaMinutes: number): void {
    const completedTasks: SimTask[] = [];

    for (const task of this.state.tasks) {
      if (task.status !== 'active') continue;
      const emp = this.state.employees.find((e) => e.id === task.assigneeId);
      const speedBonus = emp
        ? (0.55 + (emp.speed / 100) * 0.6 + (emp.skill / 100) * 0.25) *
          (0.65 + (emp.morale / 100) * 0.45)
        : 1;

      task.elapsedMinutes += deltaMinutes * speedBonus;
      task.progress = Math.min(1, task.elapsedMinutes / task.estimatedDurationMinutes);

      if (task.progress >= 1) {
        task.status = 'completed';
        completedTasks.push(task);
      }
    }

    for (const task of completedTasks) {
      this.handleTaskCompletion(task);
    }

    // Clean old completed tasks (keep recent 25 for logs)
    const active = this.state.tasks.filter((t) => t.status === 'active');
    const done = this.state.tasks.filter((t) => t.status !== 'active').slice(-20);
    this.state.tasks = [...done, ...active];
  }

  private handleTaskCompletion(task: SimTask): void {
    const emp = this.state.employees.find((e) => e.id === task.assigneeId);
    if (emp) {
      emp.currentTaskId = null;
      emp.tasksCompleted += 1;
      emp.experience = Math.min(100, emp.experience + 0.15);
      emp.state = 'idle';
    }

    const curTime = formatGameTime(this.state.totalMinutes);

    if (task.type === 'consult' && task.customerId) {
      const cust = this.state.customers.find((c) => c.id === task.customerId);
      if (cust && emp) {
        emp.customersServed += 1;
        this.resolveConsultation(cust, emp);
      }
    } else if (task.type === 'checkout' && task.customerId) {
      const cust = this.state.customers.find((c) => c.id === task.customerId);
      if (cust && emp) {
        this.completeCheckout(cust, emp);
      }
    } else if (task.type === 'repair' && task.customerId) {
      const cust = this.state.customers.find((c) => c.id === task.customerId);
      if (cust && emp) {
        this.completeRepair(cust, emp, task.repairIssue ?? 'Vỡ màn hình');
      }
    } else if (task.type === 'inspect_used' && task.customerId) {
      const cust = this.state.customers.find((c) => c.id === task.customerId);
      if (cust && emp) {
        this.completeUsedBuyback(cust, emp);
      }
    } else if (task.type === 'audit_stock') {
      task.resultSummary = 'Hoàn tất kiểm kê tồn kho chính xác 100%.';
      this.pushMessage({
        senderId: emp?.id ?? 'emp_wh_1',
        senderName: emp?.name ?? 'Bộ phận Kho',
        senderRole: emp?.role ?? 'Thủ kho',
        text: `Đã hoàn tất kiểm kê kho ngày ${curTime.day}. Tổng tồn kho hiện tại: ${this.getTotalStock()} máy.`,
        category: 'staff',
      });
    } else if (task.type === 'import_goods') {
      task.resultSummary = 'Đã sắp xếp lô hàng mới lên kệ kho.';
    } else if (task.type === 'online_cs' && task.customerId) {
      this.completeOnlineConfirm(task.customerId, emp);
    } else if (task.type === 'packing' && task.customerId) {
      this.completeOnlinePacking(task.customerId, emp);
    } else if (task.type === 'shipping' && task.customerId) {
      this.completeOnlineShipping(task.customerId, emp);
    }
  }

  private resolveConsultation(cust: Customer, emp: Employee): void {
    // Accessory buyer: high conversion, routes to cashier immediately
    if (cust.desiredTier === 'accessory') {
      cust.willBuy = true;
      cust.state = 'waiting_cashier';
      cust.assignedEmployeeId = null;
      cust.satisfaction = Math.min(100, Math.round(74 + emp.communication * 0.25));
      emp.satisfactionAvg = Math.round(emp.satisfactionAvg * 0.85 + cust.satisfaction * 0.15);
      this.recalculateEmployeePerformance(emp);
      return;
    }

    // Seller bringing used phone: inspect and buyback/resell
    if (cust.desiredTier === 'sell_used') {
      const inspectTask: SimTask = {
        id: uid('task'),
        type: 'inspect_used',
        title: `Định giá thu mua ${cust.tradeInDevice ?? 'máy cũ'} (${cust.name})`,
        assigneeId: emp.id,
        assigneeName: emp.name,
        customerId: cust.id,
        startMinute: this.state.totalMinutes,
        estimatedDurationMinutes: 6 + Math.random() * 4,
        elapsedMinutes: 0,
        progress: 0,
        status: 'active',
        difficulty: 1.1,
      };
      emp.currentTaskId = inspectTask.id;
      emp.state = 'working';
      cust.assignedEmployeeId = emp.id;
      this.state.tasks.push(inspectTask);
      return;
    }

    // Pick matching in-stock model within budget (with slight flexibility)
    const candidates = this.state.models
      .filter((m) => m.stock > 0 && m.lifecycle !== 'upcoming' && m.lifecycle !== 'eol')
      .filter((m) => (cust.desiredBrand ? m.brand === cust.desiredBrand : true))
      .filter((m) => m.retailPrice <= cust.budget * 1.12)
      .sort((a, b) => b.marketDemand - a.marketDemand);

    const fallbackCandidates =
      candidates.length > 0
        ? candidates
        : this.state.models
            .filter((m) => m.stock > 0 && m.lifecycle !== 'upcoming' && m.retailPrice <= cust.budget * 1.15)
            .sort((a, b) => b.marketDemand - a.marketDemand);

    const chosen = fallbackCandidates[0] ?? null;

    // Conversion chance depends on employee communication + skill + store reputation + model availability
    const compFactor = this.getCompetitorPricePressure();
    const convChance = chosen
      ? Math.min(
          0.95,
          0.35 +
            (emp.communication / 100) * 0.35 +
            (emp.skill / 100) * 0.18 +
            (this.state.reputation / 100) * 0.15 -
            compFactor,
        )
      : 0;

    if (chosen && Math.random() < convChance) {
      cust.chosenModelId = chosen.id;
      cust.willBuy = true;
      cust.state = 'waiting_cashier';
      cust.assignedEmployeeId = null;
      cust.satisfaction = Math.min(100, Math.round(65 + emp.communication * 0.3));
    } else {
      cust.willBuy = false;
      cust.state = 'leaving';
      cust.assignedEmployeeId = null;
      cust.satisfaction = chosen ? 55 : 35;

      // Out of stock notice if no matching phone was available
      if (!chosen && Math.random() < 0.45) {
        this.pushMessage({
          senderId: 'emp_assistant',
          senderName: 'Nguyễn Minh Anh',
          senderRole: 'Trợ lý Giám đốc',
          text: `Khách ${cust.name} vừa rời đi vì hết mẫu máy tầm giá ${formatShortVND(cust.budget)}. Sếp cân nhắc nhập thêm hàng nhé.`,
          category: 'assistant',
        });
      }

      // Chance of complaint if employee communication/morale is low
      if (emp.communication < 65 && Math.random() < 0.12) {
        this.spawnComplaint(cust.name, emp, 'rude_service', 'Khách phản ánh nhân viên tư vấn thiếu kiên nhẫn.');
      }
    }

    emp.satisfactionAvg = Math.round(emp.satisfactionAvg * 0.85 + cust.satisfaction * 0.15);
    this.recalculateEmployeePerformance(emp);
  }

  private completeCheckout(cust: Customer, emp: Employee): void {
    const methods: Transaction['paymentMethod'][] = ['transfer', 'card', 'cash'];
    const paymentMethod = methods[Math.floor(Math.random() * methods.length)];
    const curTime = formatGameTime(this.state.totalMinutes);

    // Handle Accessory checkout
    if (cust.desiredTier === 'accessory') {
      const acc =
        ACCESSORY_CATALOG.find((a) => a.name === cust.accessoryItem) ?? ACCESSORY_CATALOG[0];
      const profit = acc.retail - acc.cost;
      this.state.businessBalance += acc.retail;
      this.state.reputation = Math.min(100, this.state.reputation + 0.1);
      emp.ordersClosed += 1;
      emp.revenueGenerated += acc.retail;
      this.recalculateEmployeePerformance(emp);

      this.state.transactions.unshift({
        id: uid('tx'),
        minute: Math.floor(this.state.totalMinutes),
        day: curTime.day,
        type: 'accessory_sale',
        amount: acc.retail,
        cogs: acc.cost,
        profit,
        paymentMethod,
        customerName: cust.name,
        employeeId: emp.id,
        employeeName: emp.name,
        itemName: `Phụ kiện: ${acc.name}`,
        note: 'Bán phụ kiện tại quầy',
      });
      if (this.state.transactions.length > 200) this.state.transactions.length = 200;
      eventBus.emit('audio:pos');
      cust.state = 'leaving';
      cust.assignedEmployeeId = null;
      eventBus.emit('sim:updated', this.state);
      return;
    }

    const model = this.state.models.find((m) => m.id === cust.chosenModelId);
    if (!model || model.stock <= 0) {
      cust.state = 'leaving';
      cust.willBuy = false;
      return;
    }

    // Real stock deduction
    model.stock -= 1;

    // Possible pricing error if low skill/morale
    const hadError = emp.skill < 65 && Math.random() < 0.06;
    if (hadError) {
      emp.errorCount += 1;
      this.spawnComplaint(
        cust.name,
        emp,
        'wrong_price',
        `Khách khiếu nại báo giá chênh lệch khi thanh toán máy ${model.model}.`,
      );
    }

    const salePrice = model.retailPrice;
    const cogs = model.wholesalePrice;
    const profit = salePrice - cogs;

    this.state.businessBalance += salePrice;
    this.state.reputation = Math.min(100, this.state.reputation + 0.2);

    // Credit salesperson who advised OR cashier
    emp.ordersClosed += 1;
    emp.revenueGenerated += salePrice;
    this.recalculateEmployeePerformance(emp);

    this.state.transactions.unshift({
      id: uid('tx'),
      minute: Math.floor(this.state.totalMinutes),
      day: curTime.day,
      type: 'sale',
      amount: salePrice,
      cogs,
      profit,
      paymentMethod,
      customerName: cust.name,
      employeeId: emp.id,
      employeeName: emp.name,
      itemName: `${model.model} (${model.storage})`,
      note: 'Bán lẻ tại quầy',
    });

    if (this.state.transactions.length > 200) {
      this.state.transactions.length = 200;
    }

    eventBus.emit('audio:pos');
    cust.state = 'leaving';
    cust.assignedEmployeeId = null;
    eventBus.emit('sim:updated', this.state);
  }

  private completeUsedBuyback(cust: Customer, emp: Employee): void {
    const dev =
      USED_TRADEIN_DEVICES.find((d) => d.name === cust.tradeInDevice) ?? USED_TRADEIN_DEVICES[0];
    const profit = dev.resaleValue - dev.buyPrice;

    // Store buys used device & sells refurbished/trade-in unit for net revenue + margin
    this.state.businessBalance += profit;
    this.state.reputation = Math.min(100, this.state.reputation + 0.15);
    emp.ordersClosed += 1;
    emp.revenueGenerated += dev.resaleValue;
    emp.customersServed += 1;
    this.recalculateEmployeePerformance(emp);

    const curTime = formatGameTime(this.state.totalMinutes);
    this.state.transactions.unshift({
      id: uid('tx'),
      minute: Math.floor(this.state.totalMinutes),
      day: curTime.day,
      type: 'trade_in',
      amount: dev.resaleValue,
      cogs: dev.buyPrice,
      profit,
      paymentMethod: 'transfer',
      customerName: cust.name,
      employeeId: emp.id,
      employeeName: emp.name,
      itemName: `Thu mua & bán lại: ${dev.name}`,
      note: `Thu vào ${formatShortVND(dev.buyPrice)} · Bán ra ${formatShortVND(dev.resaleValue)}`,
    });

    if (this.state.transactions.length > 200) {
      this.state.transactions.length = 200;
    }

    eventBus.emit('audio:pos');
    cust.state = 'leaving';
    cust.assignedEmployeeId = null;
    eventBus.emit('sim:updated', this.state);
  }

  private completeRepair(cust: Customer, emp: Employee, issue: RepairIssue): void {
    const feeMap: Record<RepairIssue, [number, number]> = {
      'Vỡ màn hình': [3_200_000, 1_900_000],
      'Hỏng pin': [1_100_000, 520_000],
      'Hỏng camera': [2_400_000, 1_300_000],
      'Hỏng loa': [850_000, 350_000],
      'Lỗi chân sạc': [950_000, 380_000],
      'Lỗi phần mềm': [450_000, 50_000],
      'Không lên nguồn': [2_800_000, 1_100_000],
    };

    const [price, partsCost] = feeMap[issue];
    const profit = price - partsCost;

    this.state.businessBalance += price;
    emp.ordersClosed += 1;
    emp.revenueGenerated += price;
    emp.customersServed += 1;
    this.recalculateEmployeePerformance(emp);

    const curTime = formatGameTime(this.state.totalMinutes);
    this.state.transactions.unshift({
      id: uid('tx'),
      minute: Math.floor(this.state.totalMinutes),
      day: curTime.day,
      type: 'repair',
      amount: price,
      cogs: partsCost,
      profit,
      paymentMethod: 'cash',
      customerName: cust.name,
      employeeId: emp.id,
      employeeName: emp.name,
      itemName: `Sửa chữa: ${issue}`,
      note: 'Phòng kỹ thuật hoàn tất',
    });

    if (emp.skill < 60 && Math.random() < 0.08) {
      emp.errorCount += 1;
      this.spawnComplaint(cust.name, emp, 'bad_repair', `Khách phản ánh lỗi "${issue}" vẫn tái phát sau sửa.`);
    }

    eventBus.emit('audio:pos');
    cust.state = 'leaving';
    cust.assignedEmployeeId = null;
    eventBus.emit('sim:updated', this.state);
  }

  private updateCustomers(deltaMinutes: number, curTime: ReturnType<typeof formatGameTime>): void {
    const stage = EXPANSION_STAGES[this.state.expansionLevel - 1] ?? EXPANSION_STAGES[0];

    // Spawn new customer if within store hours and max active < cap
    if (curTime.isOpenHours && this.state.customers.length < 4 + this.state.expansionLevel * 2) {
      this.customerSpawnCooldown -= deltaMinutes * stage.trafficBonus * (0.65 + this.state.reputation / 120);
      if (this.customerSpawnCooldown <= 0) {
        this.spawnCustomer();
        this.customerSpawnCooldown = 14 + Math.random() * 18;
      }
    }

    // Update each customer AI
    for (let i = this.state.customers.length - 1; i >= 0; i--) {
      const cust = this.state.customers[i];

      if (cust.state === 'entering') {
        cust.waitMinutes += deltaMinutes;
        if (cust.waitMinutes > 2.5) {
          cust.waitMinutes = 0;
          cust.state = cust.desiredTier === 'repair' ? 'repair_dropoff' : 'browsing';
          eventBus.emit('audio:doorbell');
        }
      } else if (cust.state === 'browsing') {
        cust.waitMinutes += deltaMinutes;
        if (cust.waitMinutes > 5 + Math.random() * 4) {
          cust.waitMinutes = 0;
          cust.state = 'waiting_advisor';
        }
      } else if (cust.state === 'waiting_advisor') {
        cust.patience -= deltaMinutes * (cust.personality === 'hurried' ? 2.8 : 1.4);
        const advisor = this.findAvailableEmployee('sales');
        if (advisor) {
          this.assignConsultTask(cust, advisor);
        } else if (cust.patience <= 0) {
          cust.state = 'leaving';
          cust.satisfaction = 25;
          this.state.reputation = Math.max(10, this.state.reputation - 0.35);
        }
      } else if (cust.state === 'waiting_cashier') {
        cust.patience -= deltaMinutes * 1.6;
        const cashier =
          this.findAvailableEmployee('cashier') ?? this.findAvailableEmployee('sales');
        if (cashier) {
          this.assignCheckoutTask(cust, cashier);
        } else if (cust.patience <= 0) {
          cust.state = 'leaving';
          cust.satisfaction = 30;
        }
      } else if (cust.state === 'repair_dropoff') {
        cust.patience -= deltaMinutes * 1.2;
        const tech = this.findAvailableEmployee('tech');
        if (tech) {
          this.assignRepairTask(cust, tech);
        } else if (cust.patience <= 0) {
          cust.state = 'leaving';
        }
      } else if (cust.state === 'leaving') {
        cust.waitMinutes += deltaMinutes;
        // Only remove customer after 3D NPC finishes walking out onto the street (or failsafe timeout)
        if (cust.exitedWorld || cust.waitMinutes > 45) {
          this.state.customers.splice(i, 1);
        }
      }
    }
  }

  public markCustomerExited(customerId: string): void {
    const cust = this.state.customers.find((c) => c.id === customerId);
    if (cust) cust.exitedWorld = true;
  }

  private spawnCustomer(): void {
    const personalities: Customer['personality'][] = ['patient', 'picky', 'hurried', 'vip', 'bargain'];
    const personality = personalities[Math.floor(Math.random() * personalities.length)];
    const roll = Math.random();
    const isRepair = roll < 0.18;
    const isAccessory = !isRepair && roll < 0.34;
    const isSellUsed = !isRepair && !isAccessory && roll < 0.48;

    let desiredTier: Customer['desiredTier'] = 'midrange';
    let budget = 11_000_000 + Math.random() * 6_000_000;
    let accessoryItem: string | undefined;
    let tradeInDevice: string | undefined;

    if (isRepair) {
      desiredTier = 'repair';
      budget = 4_000_000;
    } else if (isAccessory) {
      desiredTier = 'accessory';
      const acc = ACCESSORY_CATALOG[Math.floor(Math.random() * ACCESSORY_CATALOG.length)];
      accessoryItem = acc.name;
      budget = acc.retail;
    } else if (isSellUsed) {
      desiredTier = 'sell_used';
      const dev = USED_TRADEIN_DEVICES[Math.floor(Math.random() * USED_TRADEIN_DEVICES.length)];
      tradeInDevice = dev.name;
      budget = dev.buyPrice;
    } else if (personality === 'vip' || Math.random() < 0.35) {
      desiredTier = 'flagship';
      budget = 25_000_000 + Math.random() * 14_000_000;
    } else if (personality === 'bargain' || Math.random() < 0.25) {
      desiredTier = 'budget';
      budget = 6_500_000 + Math.random() * 3_500_000;
    }

    const brands: PhoneModel['brand'][] = ['Apple', 'Samsung', 'Xiaomi', 'OPPO', 'Vivo', 'Google'];
    const desiredBrand =
      !isRepair && !isAccessory && !isSellUsed && Math.random() < 0.55
        ? brands[Math.floor(Math.random() * brands.length)]
        : undefined;

    const cust: Customer = {
      id: uid('cust'),
      name: CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)],
      personality,
      patience: personality === 'hurried' ? 65 : 100,
      maxPatience: personality === 'hurried' ? 65 : 100,
      budget: Math.round(budget),
      desiredBrand,
      desiredTier,
      repairIssue: isRepair
        ? REPAIR_ISSUES[Math.floor(Math.random() * REPAIR_ISSUES.length)]
        : undefined,
      accessoryItem,
      tradeInDevice,
      state: 'entering',
      assignedEmployeeId: null,
      chosenModelId: null,
      satisfaction: 80,
      willBuy: false,
      waitMinutes: 0,
      shirtColor: SHIRT_PALETTE[Math.floor(Math.random() * SHIRT_PALETTE.length)],
      pantsColor: PANTS_PALETTE[Math.floor(Math.random() * PANTS_PALETTE.length)],
      hairColor: HAIR_PALETTE[Math.floor(Math.random() * HAIR_PALETTE.length)],
      skinColor: SKIN_PALETTE[Math.floor(Math.random() * SKIN_PALETTE.length)],
      hairStyle: HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)],
      outfitStyle: OUTFIT_STYLES[Math.floor(Math.random() * OUTFIT_STYLES.length)],
      hasGlasses: Math.random() < 0.32,
      heightScale: 0.94 + Math.random() * 0.12,
    };

    this.state.customers.push(cust);
  }

  private findAvailableEmployee(dept: Department): Employee | undefined {
    return this.state.employees.find(
      (e) =>
        e.department === dept &&
        e.state === 'idle' &&
        !e.currentTaskId &&
        e.trainingDaysLeft <= 0,
    );
  }

  private assignConsultTask(cust: Customer, emp: Employee): void {
    const duration = 6 + Math.random() * 8; // 6 - 14 game mins
    const task: SimTask = {
      id: uid('task'),
      type: 'consult',
      title: `Tư vấn khách ${cust.name}`,
      assigneeId: emp.id,
      assigneeName: emp.name,
      customerId: cust.id,
      startMinute: this.state.totalMinutes,
      estimatedDurationMinutes: duration,
      elapsedMinutes: 0,
      progress: 0,
      status: 'active',
      difficulty: cust.personality === 'picky' ? 1.35 : 1.0,
    };
    emp.currentTaskId = task.id;
    emp.state = 'consulting';
    cust.state = 'consulting';
    cust.assignedEmployeeId = emp.id;
    this.state.tasks.push(task);
  }

  private assignCheckoutTask(cust: Customer, emp: Employee): void {
    const duration = 3 + Math.random() * 5; // 3 - 8 game mins
    const task: SimTask = {
      id: uid('task'),
      type: 'checkout',
      title: `Thanh toán cho ${cust.name}`,
      assigneeId: emp.id,
      assigneeName: emp.name,
      customerId: cust.id,
      startMinute: this.state.totalMinutes,
      estimatedDurationMinutes: duration,
      elapsedMinutes: 0,
      progress: 0,
      status: 'active',
      difficulty: 1.0,
    };
    emp.currentTaskId = task.id;
    emp.state = 'cashier';
    cust.state = 'paying';
    cust.assignedEmployeeId = emp.id;
    this.state.tasks.push(task);
  }

  private assignRepairTask(cust: Customer, emp: Employee): void {
    const issue = cust.repairIssue ?? 'Vỡ màn hình';
    const duration = issue === 'Không lên nguồn' ? 75 : issue === 'Lỗi phần mềm' ? 28 : 45;
    const task: SimTask = {
      id: uid('task'),
      type: 'repair',
      title: `Sửa ${issue} (${cust.name})`,
      assigneeId: emp.id,
      assigneeName: emp.name,
      customerId: cust.id,
      repairIssue: issue,
      startMinute: this.state.totalMinutes,
      estimatedDurationMinutes: duration,
      elapsedMinutes: 0,
      progress: 0,
      status: 'active',
      difficulty: issue === 'Không lên nguồn' ? 1.45 : 1.0,
    };
    emp.currentTaskId = task.id;
    emp.state = 'repairing';
    cust.assignedEmployeeId = emp.id;
    this.state.tasks.push(task);
  }

  private updateOrdersAndContracts(): void {
    const now = this.state.totalMinutes;

    // Purchase orders progression
    for (const order of this.state.orders) {
      if (order.status === 'stocked') continue;
      const totalDuration = Math.max(1, order.etaMinute - order.orderMinute);
      const elapsed = now - order.orderMinute;
      const ratio = elapsed / totalDuration;

      if (ratio >= 1 && order.status !== 'arrived') {
        order.status = 'arrived';
        // Automatically stock if warehouse staff available, or move to stocked
        const model = this.state.models.find((m) => m.id === order.modelId);
        if (model) {
          model.stock += order.quantity;
        }
        order.status = 'stocked';

        const whEmp = this.state.employees.find((e) => e.department === 'warehouse');
        if (whEmp && !whEmp.currentTaskId) {
          this.state.tasks.push({
            id: uid('task'),
            type: 'import_goods',
            title: `Nhập kho ${order.quantity}x ${order.modelName}`,
            assigneeId: whEmp.id,
            assigneeName: whEmp.name,
            startMinute: now,
            estimatedDurationMinutes: 35,
            elapsedMinutes: 0,
            progress: 0,
            status: 'active',
            difficulty: 1.0,
          });
          whEmp.state = 'warehouse';
        }

        this.pushMessage({
          senderId: order.supplierId,
          senderName: order.supplierName,
          senderRole: 'Nhà cung cấp',
          text: `Đơn hàng ${order.quantity}x ${order.modelName} đã giao tới kho thành công.`,
          category: 'supplier',
        });
      } else if (ratio >= 0.45 && order.status === 'ordered') {
        order.status = 'in_transit';
      } else if (ratio >= 0.15 && order.status === 'ordered') {
        order.status = 'preparing';
      }
    }

    // Multi-stage Contracts progression
    for (const contract of this.state.contracts) {
      if (contract.status === 'completed' || contract.status === 'cancelled') continue;

      if (contract.status === 'signed' && now >= contract.nextStageMinute) {
        contract.status = 'preparing';
        contract.stage = 6;
        contract.stageLabel = 'Giai đoạn 6/8: Nhà cung cấp đóng gói & xuất kho';
        contract.nextStageMinute = now + contract.deliveryHours * 30;
      } else if (contract.status === 'preparing' && now >= contract.nextStageMinute) {
        contract.status = 'delivering';
        contract.stage = 7;
        contract.stageLabel = 'Giai đoạn 7/8: Xe tải đang giao hàng tới cửa hàng';
        contract.nextStageMinute = now + contract.deliveryHours * 30;
      } else if (contract.status === 'delivering' && now >= contract.nextStageMinute) {
        contract.status = 'auditing';
        contract.stage = 8;
        contract.stageLabel = 'Giai đoạn 8/8: Nhân viên kho kiểm kê & nhập hệ thống';
        contract.nextStageMinute = now + 45;
      } else if (contract.status === 'auditing' && now >= contract.nextStageMinute) {
        contract.status = 'completed';
        const model = this.state.models.find((m) => m.id === contract.modelId);
        if (model) {
          model.stock += contract.quantity;
        }
        this.pushMessage({
          senderId: 'emp_assistant',
          senderName: 'Nguyễn Minh Anh',
          senderRole: 'Trợ lý Giám đốc',
          text: `Hợp đồng ${contract.quantity}x ${contract.modelName} với ${contract.supplierName} đã hoàn tất nhập kho.`,
          category: 'assistant',
        });
      }
    }
  }

  private generateDailyReport(day: number): void {
    this.state.lastDailyReportDay = day;
    const todayTx = this.state.transactions.filter((t) => t.day === day);
    const revenue = todayTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const profit = todayTx.reduce((s, t) => s + t.profit, 0);
    const expenses = todayTx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const orders = todayTx.filter(
      (t) =>
        t.type === 'sale' ||
        t.type === 'online_sale' ||
        t.type === 'accessory_sale' ||
        t.type === 'trade_in' ||
        t.type === 'repair',
    ).length;
    const customers = this.state.employees.reduce((s, e) => s + e.customersServed, 0);

    const snapshot: DailySnapshot = { day, revenue, profit, expenses, customers, orders };
    this.state.dailyHistory.push(snapshot);
    if (this.state.dailyHistory.length > 60) this.state.dailyHistory.shift();

    const lowStock = this.state.models.filter((m) => m.stock <= 2).map((m) => m.model);

    this.pushMessage({
      senderId: 'emp_assistant',
      senderName: 'Nguyễn Minh Anh',
      senderRole: 'Trợ lý Giám đốc',
      text: `Báo cáo Ngày ${day}: Doanh thu ${formatShortVND(revenue)}, Lợi nhuận gộp ${formatShortVND(profit)}, ${orders} đơn hoàn thành.${
        lowStock.length > 0 ? ` Cảnh báo sắp hết hàng: ${lowStock.slice(0, 2).join(', ')}.` : ''
      }`,
      category: 'assistant',
    });
  }

  private clockOutAllEmployees(day: number): void {
    this.state.lastClockOutDay = day;
    const records: AttendanceRecord[] = this.state.employees.map((emp) => ({
      day,
      employeeId: emp.id,
      employeeName: emp.name,
      role: emp.role,
      department: emp.department,
      checkInTime: '06:00',
      checkOutTime: '22:00',
      ordersClosed: emp.ordersClosed,
      tasksCompleted: emp.tasksCompleted,
      revenueGenerated: emp.revenueGenerated,
      status: emp.trainingDaysLeft > 0 ? 'Đang đào tạo' : 'Hoàn thành ca',
    }));

    this.state.attendanceLogs = [...records, ...(this.state.attendanceLogs ?? [])].slice(0, 120);

    for (const task of this.state.tasks) {
      if (task.status === 'active') task.status = 'completed';
    }
    for (const ord of this.state.onlineOrders ?? []) {
      if (ord.status === 'confirming') {
        ord.status = 'new';
      } else if (ord.status === 'packing') {
        const m = this.state.models.find((item) => item.id === ord.modelId);
        if (m) m.stock += ord.quantity;
        ord.status = 'confirmed';
      } else if (ord.status === 'shipping') {
        const shipEmp = this.state.employees.find((e) => e.id === ord.shipperEmployeeId);
        this.completeOnlineShipping(ord.id, shipEmp);
      }
    }
    for (const emp of this.state.employees) {
      emp.currentTaskId = null;
      if (emp.trainingDaysLeft <= 0) {
        emp.state = 'off_duty';
      }
    }
    for (const cust of this.state.customers) {
      if (cust.state !== 'leaving') {
        cust.state = 'leaving';
        cust.waitMinutes = 0;
        cust.assignedEmployeeId = null;
      }
    }

    this.pushMessage({
      senderId: 'emp_assistant',
      senderName: 'Nguyễn Minh Anh',
      senderRole: 'Trợ lý Giám đốc',
      text: `Đã 22:00 đóng cửa! Toàn bộ ${this.state.employees.length} nhân viên đã chấm công tan làm ra về. Báo cáo chấm công Ngày ${day} đã gửi lên Máy tính Giám đốc.`,
      category: 'assistant',
    });
    eventBus.emit('sim:updated', this.state);
  }

  private clockInMorningShift(day: number): void {
    for (const emp of this.state.employees) {
      if (emp.state === 'off_duty') {
        emp.state = emp.isAssistant ? 'working' : 'idle';
      }
    }
    this.pushMessage({
      senderId: 'emp_assistant',
      senderName: 'Nguyễn Minh Anh',
      senderRole: 'Trợ lý Giám đốc',
      text: `Chào buổi sáng 06:00 Ngày ${day}! Toàn bộ nhân viên đã chấm công vào ca làm việc mới.`,
      category: 'assistant',
    });
    eventBus.emit('sim:updated', this.state);
  }

  private onNewDay(day: number): void {
    // Decrement training days
    for (const emp of this.state.employees) {
      if (emp.trainingDaysLeft > 0) {
        emp.trainingDaysLeft -= 1;
        emp.skill = Math.min(100, emp.skill + 4);
        emp.communication = Math.min(100, emp.communication + 3);
        if (emp.trainingDaysLeft === 0) {
          emp.state = 'idle';
          this.pushMessage({
            senderId: 'emp_assistant',
            senderName: 'Nguyễn Minh Anh',
            senderRole: 'Trợ lý Giám đốc',
            text: `Nhân viên ${emp.name} đã hoàn thành khóa đào tạo và quay lại làm việc với kỹ năng nâng cao.`,
            category: 'assistant',
          });
        }
      }
    }

    // Pay due purchase orders
    for (const order of this.state.orders) {
      if (!order.paid && day >= order.dueDay) {
        order.paid = true;
        this.state.businessBalance -= order.totalCost;
        this.state.transactions.unshift({
          id: uid('tx'),
          minute: Math.floor(this.state.totalMinutes),
          day,
          type: 'wholesale',
          amount: -order.totalCost,
          cogs: 0,
          profit: 0,
          paymentMethod: 'transfer',
          itemName: `Thanh toán công nợ: ${order.quantity}x ${order.modelName}`,
          note: order.supplierName,
        });
      }
    }

    // Monthly payroll & store rent every 30 days
    const month = Math.floor((day - 1) / 30);
    if (month > this.state.lastMonthlyReportMonth && day > 1) {
      this.state.lastMonthlyReportMonth = month;
      const totalPayroll = this.state.employees.reduce((s, e) => s + e.salary, 0);
      const rent = 25_000_000 + (this.state.expansionLevel - 1) * 15_000_000;
      this.state.businessBalance -= totalPayroll + rent;

      this.state.transactions.unshift(
        {
          id: uid('tx'),
          minute: Math.floor(this.state.totalMinutes),
          day,
          type: 'salary',
          amount: -totalPayroll,
          cogs: 0,
          profit: -totalPayroll,
          paymentMethod: 'transfer',
          itemName: `Chi trả lương tháng (${this.state.employees.length} nhân sự)`,
        },
        {
          id: uid('tx'),
          minute: Math.floor(this.state.totalMinutes),
          day,
          type: 'rent',
          amount: -rent,
          cogs: 0,
          profit: -rent,
          paymentMethod: 'transfer',
          itemName: 'Tiền thuê mặt bằng & điện nước',
        },
      );

      this.pushMessage({
        senderId: 'emp_assistant',
        senderName: 'Nguyễn Minh Anh',
        senderRole: 'Trợ lý Giám đốc',
        text: `Tổng kết tháng ${month}: Đã chi lương ${formatShortVND(totalPayroll)} và mặt bằng ${formatShortVND(rent)}. Sếp hãy vào mục Báo cáo để xem đề xuất tăng lương/thưởng.`,
        category: 'assistant',
      });
    }
  }

  private updateMarketAndCompetitors(day: number): void {
    // Launch Pixel 10 Pro on Day 3+
    const px = this.state.models.find((m) => m.id === 'px10p');
    if (px && px.lifecycle === 'upcoming' && day >= 3) {
      px.lifecycle = 'launch';
      px.marketDemand = 1.4;
      this.pushEmail({
        from: 'd.chen@aptech-import.com',
        fromName: 'Asia Pacific Tech Supply',
        subject: 'Pixel 10 Pro chính thức mở bán - Cập nhật giá nhập',
        body: 'Mẫu flagship Pixel 10 Pro đã chính thức ra mắt thị trường với nhu cầu tăng mạnh. Liên hệ đặt hàng ngay để đón đầu sóng khách.',
      });
    }

    // Subtle demand fluctuation
    for (const m of this.state.models) {
      const shift = (Math.random() - 0.48) * 0.08;
      m.marketDemand = Math.max(0.45, Math.min(1.7, Number((m.marketDemand + shift).toFixed(2))));
    }

    // Competitor moves
    const comp = this.state.competitors[Math.floor(Math.random() * this.state.competitors.length)];
    if (comp) {
      const actions = [
        'Chạy khuyến mãi giảm 500k phụ kiện đi kèm',
        'Giảm nhẹ giá bán lẻ 2% để hút khách',
        'Tăng ngân sách quảng cáo khu vực trung tâm',
        'Nhập thêm lô flagship mới về kho',
      ];
      comp.lastAction = actions[Math.floor(Math.random() * actions.length)];
      comp.priceModifier = Math.max(0.93, Math.min(1.06, Number((comp.priceModifier + (Math.random() - 0.5) * 0.02).toFixed(2))));
    }
  }

  private getCompetitorPricePressure(): number {
    const avgMod =
      this.state.competitors.reduce((s, c) => s + c.priceModifier, 0) /
      Math.max(1, this.state.competitors.length);
    return avgMod < 0.97 ? 0.08 : 0;
  }

  private spawnComplaint(
    customerName: string,
    emp: Employee,
    type: Complaint['type'],
    description: string,
  ): void {
    if (this.state.complaints.filter((c) => c.status === 'open').length >= 3) return;
    const curTime = formatGameTime(this.state.totalMinutes);
    const truths: Complaint['verifiedTruth'][] = [
      'employee_fault',
      'customer_misunderstanding',
      'system_error',
    ];
    const verifiedTruth =
      emp.skill < 65 ? (Math.random() < 0.65 ? 'employee_fault' : 'customer_misunderstanding') : truths[Math.floor(Math.random() * truths.length)];

    const complaint: Complaint = {
      id: uid('comp'),
      day: curTime.day,
      minute: Math.floor(this.state.totalMinutes),
      customerName,
      employeeId: emp.id,
      employeeName: emp.name,
      type,
      description,
      verifiedTruth,
      evidenceChecked: { camera: false, receipt: false, repairLog: false, statement: false },
      employeeStatement:
        verifiedTruth === 'employee_fault'
          ? `${emp.name}: "Em thừa nhận lúc đó hơi vội nên trao đổi/nhập liệu chưa kỹ với khách, em xin rút kinh nghiệm."`
          : `${emp.name}: "Em đã tư vấn đúng quy trình và báo đúng giá niêm yết trên hệ thống, sếp có thể xem lại camera và hóa đơn."`,
      status: 'open',
    };

    this.state.complaints.unshift(complaint);
    this.pushMessage({
      senderId: 'emp_assistant',
      senderName: 'Nguyễn Minh Anh',
      senderRole: 'Trợ lý Giám đốc',
      text: `Có khiếu nại mới từ khách ${customerName} liên quan đến ${emp.name}. Sếp hãy kiểm tra Camera và Hóa đơn trước khi xử lý nhé.`,
      category: 'assistant',
    });
  }

  // --- Player Management Actions (100% Real Effects) ---

  public placeWholesaleOrder(
    supplierId: string,
    modelId: string,
    quantity: number,
    discountPercent: number,
    payNow: boolean,
  ): { ok: boolean; message: string } {
    const sup = this.state.suppliers.find((s) => s.id === supplierId);
    const model = this.state.models.find((m) => m.id === modelId);
    if (!sup || !model || quantity <= 0) return { ok: false, message: 'Thông tin đặt hàng không hợp lệ.' };

    const unitCost = Math.round(model.wholesalePrice * (1 - discountPercent / 100));
    const totalCost = unitCost * quantity;

    if (payNow && this.state.businessBalance < totalCost) {
      return { ok: false, message: 'Số dư tài khoản doanh nghiệp không đủ.' };
    }

    const curTime = formatGameTime(this.state.totalMinutes);
    if (payNow) {
      this.state.businessBalance -= totalCost;
      this.state.transactions.unshift({
        id: uid('tx'),
        minute: Math.floor(this.state.totalMinutes),
        day: curTime.day,
        type: 'wholesale',
        amount: -totalCost,
        cogs: 0,
        profit: 0,
        paymentMethod: 'transfer',
        itemName: `Nhập ${quantity}x ${model.model}`,
        note: sup.name,
      });
    }

    const order: PurchaseOrder = {
      id: uid('po'),
      supplierId: sup.id,
      supplierName: sup.name,
      modelId: model.id,
      modelName: model.model,
      quantity,
      unitCost,
      totalCost,
      orderMinute: this.state.totalMinutes,
      etaMinute: this.state.totalMinutes + sup.deliveryHours * 60,
      status: 'ordered',
      paid: payNow,
      dueDay: curTime.day + sup.paymentTermsDays,
    };

    this.state.orders.unshift(order);
    sup.reputation = Math.min(100, sup.reputation + 2);
    eventBus.emit('sim:updated', this.state);
    return {
      ok: true,
      message: `Đã đặt ${quantity}x ${model.model} từ ${sup.name}. Dự kiến giao sau ${sup.deliveryHours} giờ.`,
    };
  }

  private calcMaxAcceptableDiscount(
    ctr: Pick<Contract, 'quantity' | 'paymentTermsDays' | 'coffeeServed'>,
    sup: { baseDiscount: number; reputation: number; paymentTermsDays: number },
  ): number {
    const basePct = Math.round(sup.baseDiscount * 100);
    const volBonus = Math.min(6, Math.floor(ctr.quantity / 8));
    const relBonus = Math.round(
      Math.max(0, (sup.reputation - 55) * 0.08 + (this.state.reputation - 55) * 0.05),
    );
    const coffeeBonus = ctr.coffeeServed ? 2 : 0;
    const termsPenalty = Math.round(Math.max(0, ctr.paymentTermsDays - sup.paymentTermsDays) * 0.15);
    return Math.max(2, Math.min(20, basePct + volBonus + relBonus + coffeeBonus - termsPenalty));
  }

  public negotiateContract(
    supplierId: string,
    modelId: string,
    quantity: number,
    requestedDiscountPct: number,
    requestedTermsDays: number,
  ): { ok: boolean; message: string; contract?: Contract } {
    const sup = this.state.suppliers.find((s) => s.id === supplierId);
    const model = this.state.models.find((m) => m.id === modelId);
    if (!sup || !model) return { ok: false, message: 'Không tìm thấy đối tác hoặc sản phẩm.' };

    if (this.state.activeSupplierVisitId) {
      return {
        ok: false,
        message: 'Đang có đối tác ngồi thương lượng tại Phòng Tiếp Khách. Hãy hoàn tất cuộc gặp hiện tại trước.',
      };
    }

    const basePct = Math.round(sup.baseDiscount * 100);
    // Supplier NEVER blindly accepts player's initial price; opens conservative and requires negotiation
    const openingDiscount = Math.max(1, Math.min(basePct - 2, Math.max(1, requestedDiscountPct - 3)));
    const offerUnitPrice = Math.round(model.wholesalePrice * (1 - openingDiscount / 100));
    const curTime = formatGameTime(this.state.totalMinutes);

    const contract: Contract = {
      id: uid('ctr'),
      supplierId: sup.id,
      supplierName: sup.name,
      repName: sup.repName,
      modelId: model.id,
      modelName: model.model,
      quantity,
      unitPrice: offerUnitPrice,
      listUnitPrice: model.wholesalePrice,
      discountPercent: openingDiscount,
      totalValue: offerUnitPrice * quantity,
      paymentTermsDays: requestedTermsDays,
      deliveryHours: sup.deliveryHours,
      stage: 4,
      stageLabel: 'Giai đoạn 4/8: Đang chờ Giám đốc deal giá tại Phòng Tiếp Khách',
      status: 'rep_visiting',
      createdDay: curTime.day,
      nextStageMinute: this.state.totalMinutes + 20,
      priceAgreed: false,
      supplierOfferDiscount: openingDiscount,
      playerProposedDiscount: requestedDiscountPct,
      negotiationRound: 1,
      maxNegotiationRounds: 4,
      supplierMood: 82,
      coffeeServed: false,
      lastNegotiationNote: `Chào Giám đốc, với lô ${quantity}x ${model.model}, bên ${sup.name} tạm chào mức chiết khấu khởi điểm ${openingDiscount}% (${formatShortVND(offerUnitPrice)}/máy). Sếp muốn thương lượng mức nào để hai bên chốt deal ạ?`,
    };

    this.state.contracts.unshift(contract);
    this.state.activeSupplierVisitId = contract.id;
    this.state.calendar.unshift({
      id: uid('cal'),
      title: `Deal giá & Ký HĐ với ${sup.repName} tại Phòng Khách (${quantity}x ${model.model})`,
      day: curTime.day,
      timeText: curTime.timeStr,
      type: 'meeting',
      participant: sup.repName,
    });
    this.pushMessage({
      senderId: 'emp_assistant',
      senderName: 'Nguyễn Minh Anh',
      senderRole: 'Trợ lý Giám đốc',
      text: `${sup.repName} (${sup.name}) đã vào Phòng Tiếp Khách chờ sếp thương lượng & deal giá lô ${quantity}x ${model.model} (họ mới chào giảm ${openingDiscount}%, cần sếp trả giá thêm).`,
      category: 'assistant',
    });

    eventBus.emit('world:supplier_visit', contract.id);
    eventBus.emit('sim:updated', this.state);
    return {
      ok: true,
      message: `${sup.repName} đã tới Phòng Tiếp Khách. Hãy vào thương lượng giá lô hàng trước khi ký!`,
      contract,
    };
  }

  public submitPriceDeal(
    contractId: string,
    proposedDiscountPct: number,
    updatedQuantity?: number,
    updatedTermsDays?: number,
  ): { ok: boolean; agreed: boolean; message: string } {
    const ctr = this.state.contracts.find((c) => c.id === contractId);
    if (!ctr || ctr.status !== 'rep_visiting') {
      return { ok: false, agreed: false, message: 'Hợp đồng không ở trạng thái thương lượng.' };
    }
    if (ctr.priceAgreed) {
      return { ok: true, agreed: true, message: 'Hai bên đã chốt giá lô hàng, có thể ký hợp đồng ngay.' };
    }

    const sup = this.state.suppliers.find((s) => s.id === ctr.supplierId);
    const model = this.state.models.find((m) => m.id === ctr.modelId);
    if (!sup || !model) return { ok: false, agreed: false, message: 'Không tìm thấy thông tin đối tác.' };

    const listPrice = ctr.listUnitPrice ?? model.wholesalePrice;
    if (updatedQuantity && updatedQuantity >= 5) {
      ctr.quantity = Math.min(200, Math.round(updatedQuantity));
    }
    if (updatedTermsDays !== undefined && updatedTermsDays >= 0) {
      ctr.paymentTermsDays = Math.min(45, Math.round(updatedTermsDays));
    }

    const proposed = Math.max(0, Math.min(25, Math.round(proposedDiscountPct)));
    ctr.playerProposedDiscount = proposed;

    const currentOffer = ctr.supplierOfferDiscount ?? ctr.discountPercent;
    const maxAccept = this.calcMaxAcceptableDiscount(ctr, sup);
    const round = ctr.negotiationRound ?? 1;
    const maxRounds = ctr.maxNegotiationRounds ?? 4;

    // Case 1: Supplier accepts player's proposed discount
    if (proposed <= currentOffer || proposed <= maxAccept) {
      const finalUnit = Math.round(listPrice * (1 - proposed / 100));
      ctr.priceAgreed = true;
      ctr.discountPercent = proposed;
      ctr.supplierOfferDiscount = proposed;
      ctr.unitPrice = finalUnit;
      ctr.totalValue = finalUnit * ctr.quantity;
      ctr.stageLabel = `Đã chốt deal giảm ${proposed}% · Sẵn sàng ký hợp đồng tại Phòng Tiếp Khách`;
      ctr.lastNegotiationNote = `Chốt deal! Bên ${sup.name} đồng ý chiết khấu ${proposed}% (${formatShortVND(finalUnit)}/máy) cho lô ${ctr.quantity} máy. Mời Giám đốc ký hợp đồng!`;
      eventBus.emit('audio:click');
      eventBus.emit('sim:updated', this.state);
      return { ok: true, agreed: true, message: ctr.lastNegotiationNote };
    }

    // Case 2: Proposed discount is above supplier's limit -> resistance & counter-offer!
    const gap = proposed - maxAccept;
    const moodDrop = gap >= 6 ? 30 : gap >= 3 ? 20 : 12;
    ctr.supplierMood = Math.max(0, (ctr.supplierMood ?? 82) - moodDrop);
    ctr.negotiationRound = round + 1;

    // Supplier walks out if pushed way too hard and patience hits 0
    if (ctr.supplierMood <= 0) {
      ctr.status = 'cancelled';
      ctr.stageLabel = 'Thương lượng bất thành — Đối tác rời Phòng Tiếp Khách';
      ctr.lastNegotiationNote = `Rất tiếc Giám đốc ép giá ${proposed}% quá sâu so với giá vốn, bên em xin phép rút về trước.`;
      this.state.activeSupplierVisitId = null;
      sup.reputation = Math.max(20, sup.reputation - 4);
      this.pushMessage({
        senderId: 'emp_assistant',
        senderName: 'Nguyễn Minh Anh',
        senderRole: 'Trợ lý Giám đốc',
        text: `Đàm phán với ${ctr.repName} (${ctr.supplierName}) bất thành do chênh lệch giá quá lớn, đối tác vừa rời cửa hàng.`,
        category: 'assistant',
      });
      eventBus.emit('world:supplier_leave');
      eventBus.emit('sim:updated', this.state);
      return { ok: false, agreed: false, message: ctr.lastNegotiationNote };
    }

    // Compute counter-offer step up toward maxAccept
    let nextOffer = currentOffer;
    if (currentOffer < maxAccept) {
      const stepUp =
        gap <= 3
          ? Math.max(1, Math.ceil((maxAccept - currentOffer) * 0.6))
          : gap <= 6
            ? 1
            : 0;
      nextOffer = Math.min(maxAccept, currentOffer + stepUp);
    }

    const offerUnit = Math.round(listPrice * (1 - nextOffer / 100));
    ctr.supplierOfferDiscount = nextOffer;
    ctr.discountPercent = nextOffer;
    ctr.unitPrice = offerUnit;
    ctr.totalValue = offerUnit * ctr.quantity;

    if (ctr.negotiationRound > maxRounds) {
      ctr.lastNegotiationNote = `Đây là mức giá chốt cuối cùng từ ${sup.name}: giảm ${nextOffer}% (${formatShortVND(offerUnit)}/máy) cho ${ctr.quantity} máy. Sếp đồng ý giá này thì mình ký luôn, hoặc tăng thêm số lượng máy nhé!`;
    } else if (gap >= 5) {
      ctr.lastNegotiationNote = `Giảm ${proposed}% (${formatShortVND(Math.round(listPrice * (1 - proposed / 100)))}/máy) thì bên em lỗ nặng rồi sếp ơi! Hiện bên em chỉ giữ được mức ${nextOffer}% (${formatShortVND(offerUnit)}/máy).`;
    } else {
      ctr.lastNegotiationNote = `Mức ${proposed}% hơi căng cho lô ${ctr.quantity} máy. Em cố gắng nhượng bộ nâng lên giảm ${nextOffer}% (${formatShortVND(offerUnit)}/máy) — sếp xem chốt được không ạ?`;
    }

    eventBus.emit('audio:click');
    eventBus.emit('sim:updated', this.state);
    return { ok: true, agreed: false, message: ctr.lastNegotiationNote };
  }

  public acceptSupplierOffer(contractId: string): { ok: boolean; message: string } {
    const ctr = this.state.contracts.find((c) => c.id === contractId);
    if (!ctr || ctr.status !== 'rep_visiting') {
      return { ok: false, message: 'Không tìm thấy hợp đồng đang thương lượng.' };
    }
    const sup = this.state.suppliers.find((s) => s.id === ctr.supplierId);
    const model = this.state.models.find((m) => m.id === ctr.modelId);
    const listPrice = ctr.listUnitPrice ?? model?.wholesalePrice ?? ctr.unitPrice;
    const agreedDisc = ctr.supplierOfferDiscount ?? ctr.discountPercent;
    const agreedUnit = Math.round(listPrice * (1 - agreedDisc / 100));

    ctr.priceAgreed = true;
    ctr.discountPercent = agreedDisc;
    ctr.unitPrice = agreedUnit;
    ctr.totalValue = agreedUnit * ctr.quantity;
    ctr.stageLabel = `Đã chốt giá giảm ${agreedDisc}% · Sẵn sàng ký hợp đồng tại Phòng Tiếp Khách`;
    ctr.lastNegotiationNote = `Cảm ơn Giám đốc! Hai bên đã thống nhất mức chiết khấu ${agreedDisc}% (${formatShortVND(agreedUnit)}/máy). Mời sếp đặt bút ký hợp đồng.`;
    if (sup) sup.reputation = Math.min(100, sup.reputation + 1);

    eventBus.emit('audio:click');
    eventBus.emit('sim:updated', this.state);
    return {
      ok: true,
      message: `Đã chốt giá ${agreedDisc}% (${formatShortVND(ctr.totalValue)}). Hãy bấm Ký hợp đồng & Cọc 30%!`,
    };
  }

  public signContract(contractId: string): { ok: boolean; message: string } {
    const ctr = this.state.contracts.find((c) => c.id === contractId);
    if (!ctr || ctr.status !== 'rep_visiting') {
      return { ok: false, message: 'Hợp đồng không ở trạng thái chờ ký.' };
    }
    if (ctr.priceAgreed === false) {
      return {
        ok: false,
        message: 'Hai bên chưa chốt giá lô hàng! Hãy thương lượng hoặc chấp nhận mức giá đối tác trước khi ký.',
      };
    }
    const deposit = Math.round(ctr.totalValue * 0.3);
    if (this.state.businessBalance < deposit) {
      return { ok: false, message: `Cần tối thiểu ${formatShortVND(deposit)} (30% cọc) để ký hợp đồng.` };
    }

    const curTime = formatGameTime(this.state.totalMinutes);
    this.state.businessBalance -= deposit;
    this.state.transactions.unshift({
      id: uid('tx'),
      minute: Math.floor(this.state.totalMinutes),
      day: curTime.day,
      type: 'wholesale',
      amount: -deposit,
      cogs: 0,
      profit: 0,
      paymentMethod: 'transfer',
      itemName: `Đặt cọc 30% HĐ ${ctr.quantity}x ${ctr.modelName}`,
      note: ctr.supplierName,
    });

    ctr.status = 'signed';
    ctr.stage = 5;
    ctr.stageLabel = 'Giai đoạn 5/8: Đã ký hợp đồng & chuyển cọc';
    ctr.nextStageMinute = this.state.totalMinutes + 40;

    // Create payable order for remaining 70%
    this.state.orders.unshift({
      id: uid('po'),
      supplierId: ctr.supplierId,
      supplierName: ctr.supplierName,
      modelId: ctr.modelId,
      modelName: ctr.modelName,
      quantity: ctr.quantity,
      unitCost: ctr.unitPrice,
      totalCost: ctr.totalValue - deposit,
      orderMinute: this.state.totalMinutes,
      etaMinute: this.state.totalMinutes + ctr.deliveryHours * 60,
      status: 'preparing',
      paid: false,
      dueDay: curTime.day + ctr.paymentTermsDays,
    });

    this.state.activeSupplierVisitId = null;
    this.state.reputation = Math.min(100, this.state.reputation + 2);
    this.pushMessage({
      senderId: 'emp_assistant',
      senderName: 'Nguyễn Minh Anh',
      senderRole: 'Trợ lý Giám đốc',
      text: `Đã hoàn tất tiếp khách & ký hợp đồng ${ctr.quantity}x ${ctr.modelName} (giảm ${ctr.discountPercent}%) với ${ctr.repName} tại Phòng Tiếp Khách!`,
      category: 'assistant',
    });
    eventBus.emit('world:supplier_leave');
    eventBus.emit('sim:updated', this.state);
    return { ok: true, message: `Đã ký hợp đồng ${ctr.quantity}x ${ctr.modelName} tại Phòng Tiếp Khách thành công!` };
  }

  public serveGuestCoffee(contractId: string): { ok: boolean; message: string } {
    const ctr = this.state.contracts.find((c) => c.id === contractId);
    if (!ctr || ctr.status !== 'rep_visiting') {
      return { ok: false, message: 'Hiện không có khách đối tác tại Phòng Tiếp Khách.' };
    }
    const sup = this.state.suppliers.find((s) => s.id === ctr.supplierId);
    if (sup && !ctr.coffeeServed) {
      sup.reputation = Math.min(100, sup.reputation + 3);
    }
    ctr.coffeeServed = true;
    ctr.supplierMood = Math.min(100, (ctr.supplierMood ?? 80) + 15);
    ctr.lastNegotiationNote = `Cảm ơn ly cà phê tuyệt vời của Giám đốc! Không khí trao đổi rất thoải mái — bên em sẵn sàng nhượng bộ thêm chút chiết khấu nếu sếp chốt lô hợp lý ạ.`;
    this.state.reputation = Math.min(100, this.state.reputation + 0.5);
    this.state.coffeeBreaksTaken += 1;
    eventBus.emit('audio:click');
    eventBus.emit('sim:updated', this.state);
    return {
      ok: true,
      message: `Đã mời cà phê ${ctr.repName}! Thiện cảm +15 & mở rộng thêm biên độ deal giá (+2%).`,
    };
  }

  public declineContractVisit(contractId: string): { ok: boolean; message: string } {
    const ctr = this.state.contracts.find((c) => c.id === contractId);
    if (!ctr || ctr.status !== 'rep_visiting') {
      return { ok: false, message: 'Không có lịch tiếp khách đang chờ.' };
    }
    ctr.status = 'cancelled';
    ctr.stageLabel = 'Đã hẹn lại dịp khác tại Phòng Tiếp Khách';
    this.state.activeSupplierVisitId = null;
    eventBus.emit('world:supplier_leave');
    eventBus.emit('sim:updated', this.state);
    return { ok: true, message: `Đã cảm ơn & tiễn ${ctr.repName} ra về, hẹn trao đổi lại sau.` };
  }

  public hireCandidate(candidateId: string): { ok: boolean; message: string } {
    const stage = EXPANSION_STAGES[this.state.expansionLevel - 1] ?? EXPANSION_STAGES[0];
    if (this.state.employees.length >= stage.maxStaff) {
      return { ok: false, message: `Cấp cửa hàng hiện tại tối đa ${stage.maxStaff} nhân sự.` };
    }
    const idx = this.state.candidates.findIndex((c) => c.id === candidateId);
    if (idx === -1) return { ok: false, message: 'Ứng viên không còn khả dụng.' };
    const cand = this.state.candidates[idx];

    const zoneMap: Record<Department, Employee['homeZone']> = {
      sales: 'showroom',
      tech: 'tech',
      cashier: 'cashier',
      warehouse: 'warehouse',
      cs: 'online_cs',
      shipping: 'shipping',
      management: 'assistant',
    };

    const newEmp: Employee = {
      id: uid('emp'),
      name: cand.name,
      age: cand.age,
      role: cand.role,
      department: cand.department,
      salary: cand.expectedSalary,
      experience: cand.experience,
      skill: cand.skill,
      speed: cand.speed,
      communication: cand.communication,
      morale: 85,
      performance: Math.round((cand.skill + cand.speed + cand.communication) / 3),
      customersServed: 0,
      ordersClosed: 0,
      revenueGenerated: 0,
      tasksCompleted: 0,
      errorCount: 0,
      satisfactionAvg: 82,
      workHistory: [`Được tuyển dụng ngày ${formatGameTime(this.state.totalMinutes).day}`],
      state: 'idle',
      currentTaskId: null,
      trainingDaysLeft: 0,
      avatarColor: cand.avatarColor,
      shirtColor: cand.shirtColor,
      hairColor: cand.hairColor,
      homeZone: zoneMap[cand.department],
    };

    this.state.employees.push(newEmp);
    this.state.candidates.splice(idx, 1);
    eventBus.emit('world:staff_changed');
    eventBus.emit('sim:updated', this.state);
    return { ok: true, message: `Đã tuyển dụng ${newEmp.name} vào bộ phận ${newEmp.role}.` };
  }

  public adjustEmployeeSalary(employeeId: string, deltaAmount: number): void {
    const emp = this.state.employees.find((e) => e.id === employeeId);
    if (!emp) return;
    emp.salary = Math.max(6_000_000, emp.salary + deltaAmount);
    if (deltaAmount > 0) {
      emp.morale = Math.min(100, emp.morale + 10);
      emp.workHistory.unshift(`Tăng lương +${formatShortVND(deltaAmount)} (Ngày ${formatGameTime(this.state.totalMinutes).day})`);
    } else {
      emp.morale = Math.max(15, emp.morale - 15);
    }
    this.recalculateEmployeePerformance(emp);
    eventBus.emit('sim:updated', this.state);
  }

  public bonusEmployee(employeeId: string, amount: number): boolean {
    if (this.state.businessBalance < amount) return false;
    const emp = this.state.employees.find((e) => e.id === employeeId);
    if (!emp) return false;
    this.state.businessBalance -= amount;
    emp.morale = Math.min(100, emp.morale + 12);
    emp.workHistory.unshift(`Thưởng nóng ${formatShortVND(amount)}`);
    this.state.transactions.unshift({
      id: uid('tx'),
      minute: Math.floor(this.state.totalMinutes),
      day: formatGameTime(this.state.totalMinutes).day,
      type: 'bonus',
      amount: -amount,
      cogs: 0,
      profit: -amount,
      paymentMethod: 'transfer',
      employeeId: emp.id,
      employeeName: emp.name,
      itemName: `Thưởng nhân viên ${emp.name}`,
    });
    eventBus.emit('sim:updated', this.state);
    return true;
  }

  public trainEmployee(employeeId: string): boolean {
    const cost = 4_000_000;
    if (this.state.businessBalance < cost) return false;
    const emp = this.state.employees.find((e) => e.id === employeeId);
    if (!emp || emp.trainingDaysLeft > 0) return false;
    this.state.businessBalance -= cost;
    emp.trainingDaysLeft = 2;
    emp.state = 'training';
    emp.workHistory.unshift(`Tham gia khóa đào tạo 2 ngày`);
    this.state.transactions.unshift({
      id: uid('tx'),
      minute: Math.floor(this.state.totalMinutes),
      day: formatGameTime(this.state.totalMinutes).day,
      type: 'transfer',
      amount: -cost,
      cogs: 0,
      profit: -cost,
      paymentMethod: 'transfer',
      itemName: `Đào tạo chuyên môn: ${emp.name}`,
    });
    eventBus.emit('sim:updated', this.state);
    return true;
  }

  public fireEmployee(employeeId: string): { ok: boolean; message: string } {
    const emp = this.state.employees.find((e) => e.id === employeeId);
    if (!emp) return { ok: false, message: 'Không tìm thấy nhân viên.' };
    if (emp.isAssistant) return { ok: false, message: 'Không thể sa thải trợ lý điều hành chính.' };

    const severance = Math.round(emp.salary * 0.5);
    this.state.businessBalance -= severance;
    this.state.employees = this.state.employees.filter((e) => e.id !== employeeId);

    // Morale ripple if fired employee had decent performance
    if (emp.performance >= 75) {
      for (const other of this.state.employees) {
        other.morale = Math.max(20, other.morale - 8);
      }
    }

    this.state.transactions.unshift({
      id: uid('tx'),
      minute: Math.floor(this.state.totalMinutes),
      day: formatGameTime(this.state.totalMinutes).day,
      type: 'salary',
      amount: -severance,
      cogs: 0,
      profit: -severance,
      paymentMethod: 'transfer',
      itemName: `Trợ cấp thôi việc: ${emp.name}`,
    });

    eventBus.emit('world:staff_changed');
    eventBus.emit('sim:updated', this.state);
    return { ok: true, message: `Đã cho thôi việc ${emp.name} (trợ cấp ${formatShortVND(severance)}).` };
  }

  public inspectComplaintEvidence(
    complaintId: string,
    evidenceType: 'camera' | 'receipt' | 'repairLog' | 'statement',
  ): void {
    const c = this.state.complaints.find((item) => item.id === complaintId);
    if (!c) return;
    c.evidenceChecked[evidenceType] = true;
    eventBus.emit('sim:updated', this.state);
  }

  public resolveComplaint(
    complaintId: string,
    action: 'no_fault' | 'remind' | 'retrain' | 'discipline' | 'fire',
  ): { ok: boolean; message: string } {
    const c = this.state.complaints.find((item) => item.id === complaintId);
    if (!c || c.status === 'resolved') return { ok: false, message: 'Khiếu nại đã xử lý.' };
    const emp = this.state.employees.find((e) => e.id === c.employeeId);

    const anyEvidenceChecked =
      c.evidenceChecked.camera ||
      c.evidenceChecked.receipt ||
      c.evidenceChecked.repairLog ||
      c.evidenceChecked.statement;

    if (!anyEvidenceChecked) {
      return {
        ok: false,
        message: 'Cần kiểm tra ít nhất 1 bằng chứng (Camera, Hóa đơn hoặc Giải trình) trước khi kết luận!',
      };
    }

    c.status = 'resolved';
    const isUnfair = c.verifiedTruth !== 'employee_fault' && action !== 'no_fault';

    if (isUnfair) {
      // Unfair punishment hurts whole team morale
      for (const e of this.state.employees) {
        e.morale = Math.max(20, e.morale - 10);
      }
      c.resolution = `Xử phạt (${action}) nhưng nhân viên không có lỗi — tinh thần đội ngũ giảm.`;
    } else if (c.verifiedTruth === 'employee_fault' && action === 'no_fault') {
      this.state.reputation = Math.max(10, this.state.reputation - 2);
      c.resolution = 'Bỏ qua lỗi nhân viên — uy tín cửa hàng giảm nhẹ.';
    } else {
      this.state.reputation = Math.min(100, this.state.reputation + 1);
      c.resolution = `Đã xác minh và xử lý hợp lý (${action}).`;
      if (emp && action === 'retrain') {
        this.trainEmployee(emp.id);
      } else if (emp && action === 'remind') {
        emp.skill = Math.min(100, emp.skill + 1);
      } else if (emp && action === 'fire') {
        this.fireEmployee(emp.id);
      }
    }

    eventBus.emit('sim:updated', this.state);
    return { ok: true, message: c.resolution };
  }

  public assignWarehouseAudit(): { ok: boolean; message: string } {
    const wh = this.findAvailableEmployee('warehouse') ?? this.state.employees.find((e) => e.department === 'warehouse');
    if (!wh) return { ok: false, message: 'Chưa có nhân viên kho.' };
    if (wh.currentTaskId) return { ok: false, message: `${wh.name} đang bận công việc khác.` };

    const task: SimTask = {
      id: uid('task'),
      type: 'audit_stock',
      title: 'Kiểm kê toàn bộ kho hàng',
      assigneeId: wh.id,
      assigneeName: wh.name,
      startMinute: this.state.totalMinutes,
      estimatedDurationMinutes: 75,
      elapsedMinutes: 0,
      progress: 0,
      status: 'active',
      difficulty: 1.0,
    };
    wh.currentTaskId = task.id;
    wh.state = 'warehouse';
    this.state.tasks.push(task);
    eventBus.emit('sim:updated', this.state);
    return { ok: true, message: `Đã giao ${wh.name} kiểm kê kho (dự kiến 75 phút mô phỏng).` };
  }

  public updateRetailPrice(modelId: string, newPrice: number): void {
    const m = this.state.models.find((item) => item.id === modelId);
    if (!m) return;
    m.retailPrice = Math.max(m.wholesalePrice, Math.round(newPrice));
    eventBus.emit('sim:updated', this.state);
  }

  public upgradeExpansion(): { ok: boolean; message: string } {
    const nextStage = EXPANSION_STAGES[this.state.expansionLevel];
    if (!nextStage) return { ok: false, message: 'Doanh nghiệp đã đạt cấp Tập đoàn tối đa!' };
    if (this.state.businessBalance < nextStage.upgradeCost) {
      return { ok: false, message: `Cần ${formatShortVND(nextStage.upgradeCost)} để nâng cấp lên ${nextStage.name}.` };
    }

    this.state.businessBalance -= nextStage.upgradeCost;
    this.state.expansionLevel = nextStage.level;
    this.state.reputation = Math.min(100, this.state.reputation + 5);
    this.state.transactions.unshift({
      id: uid('tx'),
      minute: Math.floor(this.state.totalMinutes),
      day: formatGameTime(this.state.totalMinutes).day,
      type: 'expansion',
      amount: -nextStage.upgradeCost,
      cogs: 0,
      profit: -nextStage.upgradeCost,
      paymentMethod: 'transfer',
      itemName: `Mở rộng doanh nghiệp: ${nextStage.name}`,
    });
    eventBus.emit('sim:updated', this.state);
    return { ok: true, message: `Chúc mừng! Doanh nghiệp đã phát triển lên cấp: ${nextStage.name}` };
  }

  public takeLoan(amount: number): { ok: boolean; message: string } {
    if (this.state.loanDebt + amount > 500_000_000) {
      return { ok: false, message: 'Hạn mức vay tối đa là 500 triệu ₫.' };
    }
    this.state.loanDebt += amount;
    this.state.businessBalance += amount;
    this.state.transactions.unshift({
      id: uid('tx'),
      minute: Math.floor(this.state.totalMinutes),
      day: formatGameTime(this.state.totalMinutes).day,
      type: 'loan_in',
      amount,
      cogs: 0,
      profit: 0,
      paymentMethod: 'transfer',
      itemName: 'Giải ngân vốn vay kinh doanh',
    });
    eventBus.emit('sim:updated', this.state);
    return { ok: true, message: `Đã giải ngân ${formatShortVND(amount)} vào tài khoản doanh nghiệp.` };
  }

  public repayLoan(amount: number): { ok: boolean; message: string } {
    const pay = Math.min(amount, this.state.loanDebt);
    if (pay <= 0) return { ok: false, message: 'Không có dư nợ vay.' };
    if (this.state.businessBalance < pay) return { ok: false, message: 'Số dư doanh nghiệp không đủ.' };
    this.state.businessBalance -= pay;
    this.state.loanDebt -= pay;
    this.state.transactions.unshift({
      id: uid('tx'),
      minute: Math.floor(this.state.totalMinutes),
      day: formatGameTime(this.state.totalMinutes).day,
      type: 'loan_repay',
      amount: -pay,
      cogs: 0,
      profit: 0,
      paymentMethod: 'transfer',
      itemName: 'Trả nợ vay ngân hàng',
    });
    eventBus.emit('sim:updated', this.state);
    return { ok: true, message: `Đã tất toán ${formatShortVND(pay)}.` };
  }

  public transferOwnerSalary(amount: number): boolean {
    if (this.state.businessBalance < amount || amount <= 0) return false;
    this.state.businessBalance -= amount;
    this.state.personalBalance += amount;
    this.state.transactions.unshift({
      id: uid('tx'),
      minute: Math.floor(this.state.totalMinutes),
      day: formatGameTime(this.state.totalMinutes).day,
      type: 'transfer',
      amount: -amount,
      cogs: 0,
      profit: 0,
      paymentMethod: 'transfer',
      itemName: 'Chuyển thu nhập chủ cửa hàng',
    });
    eventBus.emit('sim:updated', this.state);
    return true;
  }

  public takeCoffeeBreak(): void {
    this.state.coffeeBreaksTaken += 1;
    this.state.personalBalance = Math.max(0, this.state.personalBalance - 45_000);
    this.state.totalMinutes += 20;
    eventBus.emit('sim:updated', this.state);
  }

  public recordCall(contactName: string, contactRole: string, summary: string): void {
    const cur = formatGameTime(this.state.totalMinutes);
    this.state.callHistory.unshift({
      id: uid('call'),
      contactName,
      contactRole,
      direction: 'outgoing',
      minute: Math.floor(this.state.totalMinutes),
      day: cur.day,
      durationSec: 25 + Math.floor(Math.random() * 90),
      summary,
    });
    eventBus.emit('sim:updated', this.state);
  }

  public markMessagesRead(): void {
    for (const m of this.state.messages) m.read = true;
    eventBus.emit('sim:updated', this.state);
  }

  public markEmailsRead(): void {
    for (const e of this.state.emails) e.read = true;
    eventBus.emit('sim:updated', this.state);
  }

  public pushMessage(msg: {
    senderId: string;
    senderName: string;
    senderRole: string;
    text: string;
    category: 'assistant' | 'supplier' | 'staff' | 'customer';
  }): void {
    const cur = formatGameTime(this.state.totalMinutes);
    this.state.messages.unshift({
      id: uid('msg'),
      ...msg,
      minute: Math.floor(this.state.totalMinutes),
      day: cur.day,
      read: false,
    });
    if (this.state.messages.length > 60) this.state.messages.length = 60;
    eventBus.emit('audio:message');
  }

  public pushEmail(mail: {
    from: string;
    fromName: string;
    subject: string;
    body: string;
    contractId?: string;
  }): void {
    const cur = formatGameTime(this.state.totalMinutes);
    this.state.emails.unshift({
      id: uid('mail'),
      ...mail,
      minute: Math.floor(this.state.totalMinutes),
      day: cur.day,
      read: false,
    });
  }

  private updateOnlineOrders(deltaMinutes: number, curTime: ReturnType<typeof formatGameTime>): void {
    if (!this.state.onlineOrders) this.state.onlineOrders = [];

    const activePipelineCount = this.state.onlineOrders.filter(
      (o) => o.status !== 'delivered' && o.status !== 'cancelled',
    ).length;

    if (curTime.isOpenHours && activePipelineCount < 8) {
      const stage = EXPANSION_STAGES[this.state.expansionLevel - 1] ?? EXPANSION_STAGES[0];
      this.onlineOrderCooldown -= deltaMinutes * stage.trafficBonus * (0.7 + this.state.reputation / 140);
      if (this.onlineOrderCooldown <= 0) {
        this.spawnOnlineOrder();
        this.onlineOrderCooldown = 16 + Math.random() * 18;
      }
    }

    if (!curTime.isOpenHours) return;

    // 1. CSKH Online reviews & approves 'new' online orders -> transfers to Warehouse
    for (const ord of this.state.onlineOrders) {
      if (ord.status !== 'new') continue;
      const csEmp = this.findAvailableEmployee('cs');
      if (!csEmp) break;
      this.assignOnlineCsTask(ord, csEmp);
    }

    // 2. Warehouse Department ('warehouse') packs 'confirmed' orders from stock
    for (const ord of this.state.onlineOrders) {
      if (ord.status !== 'confirmed') continue;
      const whEmp =
        this.findAvailableEmployee('warehouse') ??
        (this.state.employees.some((e) => e.department === 'warehouse')
          ? undefined
          : this.findAvailableEmployee('shipping'));
      if (!whEmp) break;

      const model = this.state.models.find((m) => m.id === ord.modelId);
      if (!model || model.stock < ord.quantity) {
        ord.status = 'cancelled';
        ord.note = 'Kho báo hết hàng khi chuẩn bị đóng gói';
        continue;
      }

      // Deduct stock from warehouse when Warehouse begins packing
      model.stock -= ord.quantity;
      this.assignPackingTask(ord, whEmp);
    }

    // 3. Shipping Department ('shipping') picks up 'packed' parcels and delivers to customers
    for (const ord of this.state.onlineOrders) {
      if (ord.status !== 'packed') continue;
      const shipEmp = this.findAvailableEmployee('shipping');
      if (!shipEmp) break;
      this.assignShippingTask(ord, shipEmp);
    }
  }

  private spawnOnlineOrder(forcedChannel?: OnlineOrderChannel): OnlineOrder | null {
    const inStock = this.state.models.filter(
      (m) => m.stock > 0 && m.lifecycle !== 'upcoming' && m.lifecycle !== 'eol',
    );
    if (inStock.length === 0) return null;

    const model = inStock[Math.floor(Math.random() * inStock.length)];
    const quantity = model.stock >= 2 && Math.random() < 0.2 ? 2 : 1;
    const channel = forcedChannel ?? ONLINE_CHANNELS[Math.floor(Math.random() * ONLINE_CHANNELS.length)];
    const curTime = formatGameTime(this.state.totalMinutes);

    const order: OnlineOrder = {
      id: uid('onl'),
      orderCode: `MC-${1002 + this.state.onlineOrders.length}`,
      channel,
      customerName: CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)],
      customerPhone: ONLINE_PHONES[Math.floor(Math.random() * ONLINE_PHONES.length)],
      deliveryAddress: ONLINE_ADDRESSES[Math.floor(Math.random() * ONLINE_ADDRESSES.length)],
      modelId: model.id,
      modelName: `${model.model} (${model.storage})`,
      quantity,
      unitPrice: model.retailPrice,
      totalAmount: model.retailPrice * quantity,
      cogs: model.wholesalePrice * quantity,
      profit: (model.retailPrice - model.wholesalePrice) * quantity,
      status: 'new',
      createdMinute: Math.floor(this.state.totalMinutes),
      day: curTime.day,
      csEmployeeId: null,
      csEmployeeName: null,
      packerEmployeeId: null,
      packerEmployeeName: null,
      shipperEmployeeId: null,
      shipperEmployeeName: null,
      note: 'Chờ nhân viên CSKH duyệt đơn trên Windows',
    };

    this.state.onlineOrders.unshift(order);
    if (this.state.onlineOrders.length > 60) this.state.onlineOrders.length = 60;
    return order;
  }

  private assignOnlineCsTask(ord: OnlineOrder, emp: Employee): void {
    const task: SimTask = {
      id: uid('task'),
      type: 'online_cs',
      title: `CSKH duyệt đơn ${ord.orderCode} (${ord.channel})`,
      assigneeId: emp.id,
      assigneeName: emp.name,
      customerId: ord.id,
      startMinute: this.state.totalMinutes,
      estimatedDurationMinutes: 5 + Math.random() * 3,
      elapsedMinutes: 0,
      progress: 0,
      status: 'active',
      difficulty: 1.0,
    };
    emp.currentTaskId = task.id;
    emp.state = 'online_cs';
    ord.status = 'confirming';
    ord.csEmployeeId = emp.id;
    ord.csEmployeeName = emp.name;
    ord.note = `${emp.name} (CSKH) đang kiểm tra & gọi khách duyệt đơn`;
    this.state.tasks.push(task);
  }

  private completeOnlineConfirm(orderId: string, emp?: Employee): void {
    const ord = (this.state.onlineOrders ?? []).find((o) => o.id === orderId);
    if (!ord) return;
    const model = this.state.models.find((m) => m.id === ord.modelId);
    if (!model || model.stock < ord.quantity) {
      ord.status = 'cancelled';
      ord.note = 'Hết hàng trong kho, CSKH đã báo hủy với khách';
      return;
    }
    ord.status = 'confirmed';
    ord.note = `${emp?.name ?? 'CSKH'} đã duyệt đơn · Chuyển Bộ phận Kho đóng gói`;
    if (emp) {
      emp.customersServed += 1;
      emp.ordersClosed += 1;
      this.recalculateEmployeePerformance(emp);
    }
  }

  private assignPackingTask(ord: OnlineOrder, emp: Employee): void {
    const task: SimTask = {
      id: uid('task'),
      type: 'packing',
      title: `Bộ phận Kho đóng gói ${ord.orderCode} (${ord.quantity}x ${ord.modelName})`,
      assigneeId: emp.id,
      assigneeName: emp.name,
      customerId: ord.id,
      startMinute: this.state.totalMinutes,
      estimatedDurationMinutes: 5 + Math.random() * 3,
      elapsedMinutes: 0,
      progress: 0,
      status: 'active',
      difficulty: 1.0,
    };
    emp.currentTaskId = task.id;
    emp.state = 'packing';
    ord.status = 'packing';
    ord.packerEmployeeId = emp.id;
    ord.packerEmployeeName = emp.name;
    ord.note = `${emp.name} (Bộ phận Kho) đang lấy máy & đóng gói`;
    this.state.tasks.push(task);
  }

  private completeOnlinePacking(orderId: string, emp?: Employee): void {
    const ord = (this.state.onlineOrders ?? []).find((o) => o.id === orderId);
    if (!ord) return;
    ord.status = 'packed';
    ord.note = `${emp?.name ?? 'Bộ phận Kho'} đã đóng gói · Chờ Vận chuyển lấy đi giao`;
    if (emp) {
      this.recalculateEmployeePerformance(emp);
    }
  }

  private assignShippingTask(ord: OnlineOrder, emp: Employee): void {
    const shipTask: SimTask = {
      id: uid('task'),
      type: 'shipping',
      title: `Ship đơn ${ord.orderCode} tới ${ord.customerName}`,
      assigneeId: emp.id,
      assigneeName: emp.name,
      customerId: ord.id,
      startMinute: this.state.totalMinutes,
      estimatedDurationMinutes: 12 + Math.random() * 5,
      elapsedMinutes: 0,
      progress: 0,
      status: 'active',
      difficulty: 1.0,
    };
    emp.currentTaskId = shipTask.id;
    emp.state = 'shipping';
    ord.status = 'shipping';
    ord.shipperEmployeeId = emp.id;
    ord.shipperEmployeeName = emp.name;
    ord.note = `${emp.name} (Vận chuyển) đang giao tới ${ord.deliveryAddress}`;
    this.state.tasks.push(shipTask);
  }

  private completeOnlineShipping(orderId: string, emp?: Employee): void {
    const ord = (this.state.onlineOrders ?? []).find((o) => o.id === orderId);
    if (!ord || ord.status === 'delivered') return;

    ord.status = 'delivered';
    ord.note = 'Đã giao thành công & thu tiền đơn online';

    this.state.businessBalance += ord.totalAmount;
    this.state.reputation = Math.min(100, this.state.reputation + 0.25);

    if (emp) {
      emp.ordersClosed += 1;
      emp.revenueGenerated += ord.totalAmount;
      this.recalculateEmployeePerformance(emp);
    }

    const curTime = formatGameTime(this.state.totalMinutes);
    this.state.transactions.unshift({
      id: uid('tx'),
      minute: Math.floor(this.state.totalMinutes),
      day: curTime.day,
      type: 'online_sale',
      amount: ord.totalAmount,
      cogs: ord.cogs,
      profit: ord.profit,
      paymentMethod: 'transfer',
      customerName: ord.customerName,
      employeeId: emp?.id ?? ord.shipperEmployeeId ?? undefined,
      employeeName: emp?.name ?? ord.shipperEmployeeName ?? 'Vận chuyển',
      itemName: `[${ord.channel}] ${ord.quantity}x ${ord.modelName}`,
      note: `CSKH: ${ord.csEmployeeName ?? 'CSKH'} · Kho: ${ord.packerEmployeeName ?? 'Kho'}`,
    });

    if (this.state.transactions.length > 200) {
      this.state.transactions.length = 200;
    }

    eventBus.emit('audio:pos');
    eventBus.emit('sim:updated', this.state);
  }

  public confirmOnlineOrderNow(orderId: string): { ok: boolean; message: string } {
    const ord = (this.state.onlineOrders ?? []).find((o) => o.id === orderId);
    if (!ord) return { ok: false, message: 'Không tìm thấy đơn hàng online.' };
    if (ord.status !== 'new') {
      return { ok: false, message: 'Đơn hàng này đang được CSKH/Kho xử lý.' };
    }
    const csEmp = this.findAvailableEmployee('cs');
    if (!csEmp) {
      return { ok: false, message: 'Nhân viên CSKH đang bận xử lý đơn khác, vui lòng đợi.' };
    }
    this.assignOnlineCsTask(ord, csEmp);
    eventBus.emit('sim:updated', this.state);
    return {
      ok: true,
      message: `Đã chuyển ${ord.orderCode} cho CSKH ${csEmp.name} duyệt và gửi xuống Bộ phận Kho đóng gói.`,
    };
  }

  public launchOnlinePromoCampaign(): { ok: boolean; message: string } {
    const cost = 2_000_000;
    if (this.state.businessBalance < cost) {
      return { ok: false, message: 'Cần 2 triệu ₫ trong quỹ doanh nghiệp để chạy chiến dịch.' };
    }
    this.state.businessBalance -= cost;
    const curTime = formatGameTime(this.state.totalMinutes);
    this.state.transactions.unshift({
      id: uid('tx'),
      minute: Math.floor(this.state.totalMinutes),
      day: curTime.day,
      type: 'transfer',
      amount: -cost,
      cogs: 0,
      profit: -cost,
      paymentMethod: 'transfer',
      itemName: 'Quảng cáo bán hàng Online (Website / Sàn TMĐT)',
    });

    let spawned = 0;
    for (let i = 0; i < 3; i++) {
      if (this.spawnOnlineOrder()) spawned++;
    }
    eventBus.emit('sim:updated', this.state);
    return {
      ok: true,
      message: spawned > 0
        ? `Đã kích hoạt chiến dịch Online (-2tr) · Thu hút ngay ${spawned} đơn đặt hàng mới!`
        : 'Đã chạy quảng cáo nhưng kho đang hết hàng để tạo đơn mới.',
    };
  }

  public getTotalStock(): number {
    return this.state.models.reduce((s, m) => s + m.stock, 0);
  }

  private recalculateEmployeePerformance(emp: Employee): void {
    const convBonus = emp.customersServed > 0 ? (emp.ordersClosed / emp.customersServed) * 20 : 10;
    emp.performance = Math.min(
      100,
      Math.max(
        20,
        Math.round(
          emp.skill * 0.35 +
            emp.communication * 0.25 +
            emp.morale * 0.2 +
            convBonus -
            emp.errorCount * 4,
        ),
      ),
    );
  }
}
