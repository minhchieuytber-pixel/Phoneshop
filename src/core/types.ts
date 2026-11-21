export type SimSpeed = 'paused' | 'slow' | 'normal' | 'fast';
export type WeatherType = 'clear' | 'rain';

export type Department =
  | 'sales'
  | 'tech'
  | 'cashier'
  | 'warehouse'
  | 'cs'
  | 'shipping'
  | 'management';

export type LifecycleStage =
  | 'upcoming'
  | 'launch'
  | 'hot'
  | 'saturated'
  | 'discount'
  | 'eol';

export type EmployeeActivityState =
  | 'idle'
  | 'working'
  | 'consulting'
  | 'repairing'
  | 'cashier'
  | 'warehouse'
  | 'online_cs'
  | 'packing'
  | 'shipping'
  | 'reporting'
  | 'break'
  | 'training'
  | 'off_duty';

export interface Employee {
  id: string;
  name: string;
  age: number;
  role: string;
  department: Department;
  isAssistant?: boolean;
  salary: number; // VND per month
  experience: number; // 1 - 100
  skill: number; // 1 - 100
  speed: number; // 1 - 100
  communication: number; // 1 - 100
  morale: number; // 0 - 100
  performance: number; // 0 - 100
  customersServed: number;
  ordersClosed: number;
  revenueGenerated: number;
  tasksCompleted: number;
  errorCount: number;
  satisfactionAvg: number;
  workHistory: string[];
  state: EmployeeActivityState;
  currentTaskId: string | null;
  trainingDaysLeft: number;
  avatarColor: string;
  shirtColor: string;
  hairColor: string;
  homeZone: 'showroom' | 'cashier' | 'tech' | 'warehouse' | 'online_cs' | 'shipping' | 'assistant' | 'director';
}

export interface Candidate {
  id: string;
  name: string;
  age: number;
  role: string;
  department: Department;
  expectedSalary: number;
  experience: number;
  skill: number;
  speed: number;
  communication: number;
  trait: string;
  avatarColor: string;
  shirtColor: string;
  hairColor: string;
}

export interface PhoneModel {
  id: string;
  brand: 'Apple' | 'Samsung' | 'Xiaomi' | 'OPPO' | 'Vivo' | 'Google';
  model: string;
  color: string;
  colorHex: string;
  storage: string;
  tier: 'flagship' | 'midrange' | 'budget';
  wholesalePrice: number;
  retailPrice: number;
  marketDemand: number; // 0.3 - 1.8
  lifecycle: LifecycleStage;
  stock: number;
  warrantyMonths: number;
  rating: number;
}

export type CustomerState =
  | 'entering'
  | 'browsing'
  | 'waiting_advisor'
  | 'consulting'
  | 'waiting_cashier'
  | 'paying'
  | 'repair_dropoff'
  | 'leaving';

export type RepairIssue =
  | 'Vỡ màn hình'
  | 'Hỏng pin'
  | 'Hỏng camera'
  | 'Hỏng loa'
  | 'Lỗi chân sạc'
  | 'Lỗi phần mềm'
  | 'Không lên nguồn';

export type HairStyle = 'short' | 'side_part' | 'long' | 'ponytail' | 'bob' | 'curly';
export type OutfitStyle = 'tshirt' | 'jacket' | 'hoodie' | 'formal' | 'polo';

export interface Customer {
  id: string;
  name: string;
  personality: 'patient' | 'picky' | 'hurried' | 'vip' | 'bargain';
  patience: number;
  maxPatience: number;
  budget: number;
  desiredBrand?: PhoneModel['brand'];
  desiredTier: 'flagship' | 'midrange' | 'budget' | 'repair' | 'accessory' | 'sell_used';
  repairIssue?: RepairIssue;
  accessoryItem?: string;
  tradeInDevice?: string;
  state: CustomerState;
  assignedEmployeeId: string | null;
  chosenModelId: string | null;
  satisfaction: number; // 0 - 100
  willBuy: boolean;
  waitMinutes: number;
  shirtColor: string;
  pantsColor: string;
  hairColor: string;
  skinColor: string;
  hairStyle: HairStyle;
  outfitStyle: OutfitStyle;
  hasGlasses: boolean;
  heightScale: number;
  exitedWorld?: boolean;
}

export type TaskType =
  | 'consult'
  | 'checkout'
  | 'inspect_used'
  | 'repair'
  | 'audit_stock'
  | 'import_goods'
  | 'online_cs'
  | 'packing'
  | 'shipping'
  | 'train_staff'
  | 'negotiate_contract'
  | 'assistant_report';

export interface SimTask {
  id: string;
  type: TaskType;
  title: string;
  assigneeId: string;
  assigneeName: string;
  customerId?: string;
  repairIssue?: RepairIssue;
  startMinute: number;
  estimatedDurationMinutes: number;
  elapsedMinutes: number;
  progress: number; // 0 - 1
  status: 'active' | 'completed' | 'failed';
  difficulty: number; // 0.6 - 2.0
  resultSummary?: string;
}

export interface Transaction {
  id: string;
  minute: number;
  day: number;
  type:
    | 'sale'
    | 'online_sale'
    | 'accessory_sale'
    | 'trade_in'
    | 'repair'
    | 'wholesale'
    | 'salary'
    | 'bonus'
    | 'rent'
    | 'loan_in'
    | 'loan_repay'
    | 'expansion'
    | 'transfer';
  amount: number; // positive = inflow, negative = outflow
  cogs: number;
  profit: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  customerName?: string;
  employeeId?: string;
  employeeName?: string;
  itemName: string;
  note?: string;
}

export interface Supplier {
  id: string;
  name: string;
  repName: string;
  phone: string;
  email: string;
  brands: PhoneModel['brand'][];
  baseDiscount: number; // 0 - 0.18
  qualityRating: number; // 1 - 5
  warrantyPolicy: string;
  deliveryHours: number;
  reputation: number; // 0 - 100 (relationship with player)
  paymentTermsDays: number;
}

export interface Contract {
  id: string;
  supplierId: string;
  supplierName: string;
  repName: string;
  modelId: string;
  modelName: string;
  quantity: number;
  unitPrice: number;
  listUnitPrice?: number;
  discountPercent: number;
  totalValue: number;
  paymentTermsDays: number;
  deliveryHours: number;
  stage: number; // 1..8 multi-day/multi-step lifecycle
  stageLabel: string;
  status: 'negotiating' | 'rep_visiting' | 'signed' | 'preparing' | 'delivering' | 'auditing' | 'completed' | 'cancelled';
  createdDay: number;
  nextStageMinute: number;
  priceAgreed?: boolean;
  supplierOfferDiscount?: number;
  playerProposedDiscount?: number;
  negotiationRound?: number;
  maxNegotiationRounds?: number;
  supplierMood?: number;
  coffeeServed?: boolean;
  lastNegotiationNote?: string;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  modelId: string;
  modelName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  orderMinute: number;
  etaMinute: number;
  status: 'ordered' | 'preparing' | 'in_transit' | 'arrived' | 'stocked';
  paid: boolean;
  dueDay: number;
}

export interface Complaint {
  id: string;
  day: number;
  minute: number;
  customerName: string;
  employeeId: string;
  employeeName: string;
  type:
    | 'rude_service'
    | 'wrong_price'
    | 'overcharge'
    | 'bad_repair'
    | 'damaged_device'
    | 'late_delivery';
  description: string;
  verifiedTruth: 'employee_fault' | 'customer_misunderstanding' | 'system_error';
  evidenceChecked: {
    camera: boolean;
    receipt: boolean;
    repairLog: boolean;
    statement: boolean;
  };
  employeeStatement: string;
  status: 'open' | 'resolved';
  resolution?: string;
}

export interface MessageItem {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  minute: number;
  day: number;
  read: boolean;
  category: 'assistant' | 'supplier' | 'staff' | 'customer';
}

export interface EmailItem {
  id: string;
  from: string;
  fromName: string;
  subject: string;
  body: string;
  minute: number;
  day: number;
  read: boolean;
  contractId?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  day: number;
  timeText: string;
  type: 'meeting' | 'delivery' | 'launch' | 'review';
  participant: string;
}

export interface CallRecord {
  id: string;
  contactName: string;
  contactRole: string;
  direction: 'incoming' | 'outgoing';
  minute: number;
  day: number;
  durationSec: number;
  summary: string;
}

export interface Competitor {
  id: string;
  name: string;
  capital: number;
  staffCount: number;
  priceModifier: number; // 0.92 - 1.08
  reputation: number;
  strategy: 'Phá giá' | 'Cao cấp' | 'Dịch vụ nhanh';
  monthlyRevenue: number;
  lastAction: string;
}

export interface DailySnapshot {
  day: number;
  revenue: number;
  profit: number;
  expenses: number;
  customers: number;
  orders: number;
}

export interface AttendanceRecord {
  day: number;
  employeeId: string;
  employeeName: string;
  role: string;
  department: Department;
  checkInTime: string;
  checkOutTime: string;
  ordersClosed: number;
  tasksCompleted: number;
  revenueGenerated: number;
  status: 'Hoàn thành ca' | 'Đang đào tạo';
}

export interface ExpansionStage {
  level: number;
  name: string;
  description: string;
  upgradeCost: number;
  maxStaff: number;
  trafficBonus: number;
  unlockedFeatures: string[];
}

export type OnlineOrderChannel = 'Website' | 'Shopee Mall' | 'TikTok Shop' | 'Zalo OA';

export type OnlineOrderStatus =
  | 'new'
  | 'confirming'
  | 'confirmed'
  | 'packing'
  | 'packed'
  | 'shipping'
  | 'delivered'
  | 'cancelled';

export interface OnlineOrder {
  id: string;
  orderCode: string;
  channel: OnlineOrderChannel;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  modelId: string;
  modelName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  cogs: number;
  profit: number;
  status: OnlineOrderStatus;
  createdMinute: number;
  day: number;
  csEmployeeId: string | null;
  csEmployeeName: string | null;
  packerEmployeeId?: string | null;
  packerEmployeeName?: string | null;
  shipperEmployeeId: string | null;
  shipperEmployeeName: string | null;
  note?: string;
}

export interface GameSettings {
  wallpaperIndex: number;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
  graphicsQuality: 'high' | 'medium';
  showControlsHint: boolean;
}

export interface GameState {
  storeName: string;
  ownerName: string;
  totalMinutes: number; // Starts Day 1, 06:00 -> 6 * 60 = 360
  speed: SimSpeed;
  weather: WeatherType;
  lightsOn: boolean;
  doorOpen: boolean;
  directorDoorOpen: boolean;
  businessBalance: number;
  personalBalance: number;
  loanDebt: number;
  reputation: number; // 0 - 100
  expansionLevel: number; // 1 - 7
  employees: Employee[];
  candidates: Candidate[];
  models: PhoneModel[];
  customers: Customer[];
  onlineOrders: OnlineOrder[];
  tasks: SimTask[];
  transactions: Transaction[];
  suppliers: Supplier[];
  contracts: Contract[];
  orders: PurchaseOrder[];
  complaints: Complaint[];
  messages: MessageItem[];
  emails: EmailItem[];
  calendar: CalendarEvent[];
  callHistory: CallRecord[];
  competitors: Competitor[];
  dailyHistory: DailySnapshot[];
  attendanceLogs: AttendanceRecord[];
  settings: GameSettings;
  lastDailyReportDay: number;
  lastClockOutDay: number;
  lastMonthlyReportMonth: number;
  activeSupplierVisitId: string | null;
  coffeeBreaksTaken: number;
}

export interface InteractableTarget {
  id: string;
  type:
    | 'door'
    | 'director_door'
    | 'light_switch'
    | 'director_pc'
    | 'director_chair'
    | 'desk_phone'
    | 'filing_cabinet'
    | 'pos_terminal'
    | 'assistant_npc'
    | 'employee_npc'
    | 'customer_npc'
    | 'supplier_rep'
    | 'cafe_table'
    | 'display_phone'
    | 'repair_bench'
    | 'warehouse_shelf'
    | 'online_cs_desk'
    | 'packing_bench'
    | 'assistant_pc'
    | 'tech_pc'
    | 'vip_seat'
    | 'vip_table';
  label: string;
  sublabel?: string;
  payloadId?: string;
}
