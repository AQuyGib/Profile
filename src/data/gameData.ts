export interface Zone {
  id: string;
  name: string;
  vietnameseName: string;
  icon: string;
  color: string; // Tailwinds colors for highlights
  coords: { x: number; y: number };
  size: { w: number; h: number };
  description: string;
}

export const gameZones: Zone[] = [
  {
    id: "home",
    name: "Home",
    vietnameseName: "Vùng Đất Khởi Đầu",
    icon: "Home",
    color: "amber",
    coords: { x: 150, y: 150 },
    size: { w: 120, h: 100 },
    description: "Nơi giới thiệu bản thân Nguyễn Anh Quý, định hướng Thực tập sinh Web Developer & UI-focused Full-stack Developer."
  },
  {
    id: "academy",
    name: "Academy",
    vietnameseName: "Học Viện Công Nghệ TDC",
    icon: "GraduationCap",
    color: "emerald",
    coords: { x: 550, y: 150 },
    size: { w: 130, h: 100 },
    description: "Nơi ghi nhận chặng đường học tập tại Trường Cao Đẳng Công Nghệ Thủ Đức chuyên ngành CNTT (GPA 3.1/4.0, Học bổng Học kỳ 1)."
  },
  {
    id: "lab",
    name: "Lab",
    vietnameseName: "Xưởng Kỹ Năng",
    icon: "Cpu",
    color: "blue",
    coords: { x: 150, y: 450 },
    size: { w: 120, h: 100 },
    description: "Trung tâm đúc kết kỹ năng: Frontend (Tailwind, JS), Backend (PHP, MySQL), Mobile (Flutter), Bảo mật (2FA, WAF) và AI Assistance."
  },
  {
    id: "museum",
    name: "Museum",
    vietnameseName: "Bảo Tàng Dự Án",
    icon: "Award",
    color: "purple",
    coords: { x: 550, y: 450 },
    size: { w: 130, h: 100 },
    description: "Nơi trưng bày dự án DIENMAYPRO siêu đẳng cấp. Hệ sinh thái kết hợp cả Backend PHP, Webhook PayOS, AI RAG Chatbot và Mobile Flutter."
  },
  {
    id: "library",
    name: "Library",
    vietnameseName: "Thư Viện Triết Lý",
    icon: "BookOpen",
    color: "indigo",
    coords: { x: 350, y: 300 },
    size: { w: 140, h: 100 },
    description: "Nơi lưu hành triết lý lập trình AI-Augmented Developer, chú trọng tư duy hệ thống (System Thinking) và làm việc chuyên nghiệp."
  },
  {
    id: "portal",
    name: "Portal",
    vietnameseName: "Trạm Liên Lạc",
    icon: "Send",
    color: "pink",
    coords: { x: 370, y: 550 },
    size: { w: 100, h: 90 },
    description: "Điểm kết nối trực tiếp đến Nguyễn Anh Quý qua Số điện thoại, Email, Github hoặc gửi tin nhắn liên hệ."
  }
];
