export const ZONE_I18N = {
  home: {
    vi: {
      name: 'Vùng Đất Khởi Đầu',
      description: 'Nơi giới thiệu bản thân Nguyễn Anh Quý.'
    },
    en: {
      name: 'Origin Zone',
      description: 'Introduction of Nguyen Anh Quy.'
    }
  },
  academy: {
    vi: {
      name: 'Học Viện Công Nghệ TDC',
      description: 'Thông tin học vấn tại TDC.'
    },
    en: {
      name: 'TDC Academy',
      description: 'Education at TDC.'
    }
  },
  lab: {
    vi: {
      name: 'Xưởng Kỹ Năng',
      description: 'Tổng quan kỹ năng và công nghệ.'
    },
    en: {
      name: 'Skills Lab',
      description: 'Skills and technologies overview.'
    }
  },
  museum: {
    vi: {
      name: 'Phòng Trưng Bày Dự Án',
      description: 'Trưng bày các dự án tiêu biểu.'
    },
    en: {
      name: 'Project Museum',
      description: 'Showcase of featured projects.'
    }
  },
  portal: {
    vi: {
      name: 'Cổng Kết Nối',
      description: 'Liên hệ và điều hướng nhanh.'
    },
    en: {
      name: 'Connection Portal',
      description: 'Contact and quick navigation.'
    }
  }
};

export const DEFAULT_ZONES = [
  {
    id: 'home',
    name: 'Home',
    vietnameseName: 'Vùng Đất Khởi Đầu',
    icon: 'Home',
    color: 'amber',
    coords: { x: 150, y: 150 },
    size: { w: 120, h: 100 },
    description_vi: 'Nơi giới thiệu bản thân Nguyễn Anh Quý.',
    description_en: 'Introduction of Nguyen Anh Quy.',
    details_vi: { fullName: 'NGUYỄN ANH QUÝ', role: 'Thực tập sinh Web Developer' },
    details_en: { fullName: 'NGUYEN ANH QUY', role: 'Web Developer Intern' }
  },
  {
    id: 'academy',
    name: 'Academy',
    vietnameseName: 'Học Viện Công Nghệ TDC',
    icon: 'GraduationCap',
    color: 'emerald',
    coords: { x: 550, y: 150 },
    size: { w: 130, h: 100 },
    description_vi: 'Thông tin học vấn tại TDC.',
    description_en: 'Education at TDC.',
    details_vi: { institution: 'Trường Cao Đẳng Công Nghệ Thủ Đức', gpa: '3.1 / 4.0' },
    details_en: { institution: 'Thu Duc College of Technology', gpa: '3.1 / 4.0' }
  },
  {
    id: 'lab',
    name: 'Lab',
    vietnameseName: 'Xưởng Kỹ Năng',
    icon: 'Cpu',
    color: 'blue',
    coords: { x: 150, y: 450 },
    size: { w: 120, h: 100 },
    description_vi: 'Tổng quan kỹ năng và công nghệ.',
    description_en: 'Skills and technologies overview.',
    details_vi: { intro: 'Frontend, Backend, Mobile, Security, AI.' },
    details_en: { intro: 'Frontend, Backend, Mobile, Security, AI.' }
  },
  {
    id: 'museum',
    name: 'Museum',
    vietnameseName: 'Phòng Trưng Bày Dự Án',
    icon: 'Briefcase',
    color: 'purple',
    coords: { x: 550, y: 450 },
    size: { w: 130, h: 100 },
    description_vi: 'Trưng bày các dự án tiêu biểu.',
    description_en: 'Showcase of featured projects.',
    details_vi: { intro: 'DIENMAYPRO và các sản phẩm thực chiến.' },
    details_en: { intro: 'DIENMAYPRO and practical projects.' }
  },
  {
    id: 'portal',
    name: 'Portal',
    vietnameseName: 'Cổng Kết Nối',
    icon: 'MapPinned',
    color: 'pink',
    coords: { x: 350, y: 650 },
    size: { w: 110, h: 90 },
    description_vi: 'Liên hệ và điều hướng nhanh.',
    description_en: 'Contact and quick navigation.',
    details_vi: { intro: 'Kết nối trực tiếp với Nguyễn Anh Quý.' },
    details_en: { intro: 'Direct contact with Nguyen Anh Quy.' }
  }
];

export function normalizeZone(zone = {}, fallbackZones = DEFAULT_ZONES) {
  const base = fallbackZones.find((item) => item.id === zone.id) || {};
  return {
    ...base,
    ...zone,
    details_vi: { ...(base.details_vi || {}), ...(zone.details_vi || {}) },
    details_en: { ...(base.details_en || {}), ...(zone.details_en || {}) }
  };
}

export function getZoneLabel(zone, language = 'vi') {
  if (!zone) return '';
  return language === 'vi' ? zone.vietnameseName || zone.name : zone.name;
}
