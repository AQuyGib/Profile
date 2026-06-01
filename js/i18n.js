export const I18N = {
  vi: {
    appTitle: 'Cyber-Oasis Workspace',
    jobTitle: 'Ứng viên Thực tập sinh Web Developer (Full-stack Web Intern)',
    mapHeading: 'Không Gian Vũ Trụ 3D (3D Space Map)',
    mapDescription: 'Di chuyển phi hành gia bằng WASD / Mũi tên. Kéo chuột để xoay camera.',
    detailsHeading: 'Chi Tiết Hồ Sơ',
    detailsDescription: 'Nạp thông tin chi tiết một cách tự động khi nhân vật đi vào khu vực',
    footerText: '© {year} Nguyễn Anh Quý. Bảo trì & bảo mật dưới mô hình AI-Augmented.',
    footerSchool: 'Cao Đẳng Công Nghệ Thủ Đức',
    chatbotTitle: 'AI Trợ Lý Nguyễn Anh Quý',
    chatbotPlaceholder: 'Hỏi về Quý (Ví dụ: Dự án của Quý)...',
    dimensionToggle: { on2d: 'VỀ BẢN ĐỒ 2D', on3d: 'XEM KHÔNG GIAN 3D' },
    loading: {
      status: 'SYS_STATUS: BOOTSTRAPPING',
      progress: 'SCANNING FREQUENCIES...',
      enter: 'ACTIVATE CYBER-OASIS WORKSPACE'
    }
  },
  en: {
    appTitle: 'Cyber-Oasis Workspace',
    jobTitle: 'Full-stack Web Intern Candidate & IT Specialist',
    mapHeading: '3D Galaxy Space Map',
    mapDescription: 'Move astronaut with WASD / Arrows. Click & drag to rotate camera.',
    detailsHeading: 'Profile Manifest Intel',
    detailsDescription: 'Loads details dynamically once character steps on fields',
    footerText: '© {year} Nguyen Anh Quy. Structured & styled under the AI-Augmented architecture.',
    footerSchool: 'Thu Duc College of Tech',
    chatbotTitle: "AI Double Agent (Quy's Clone)",
    chatbotPlaceholder: "Ask about Quy (e.g., Tech stack)...",
    dimensionToggle: { on2d: 'GO TO 2D MAP', on3d: 'VIEW 3D SPACE' },
    loading: {
      status: 'SYS_STATUS: BOOTSTRAPPING',
      progress: 'SCANNING FREQUENCIES...',
      enter: 'ACTIVATE CYBER-OASIS WORKSPACE'
    }
  }
};

export function t(lang, keyPath, fallback = '') {
  const parts = keyPath.split('.');
  let value = I18N[lang] || I18N.vi;
  for (const part of parts) {
    value = value?.[part];
  }
  return value ?? fallback;
}
