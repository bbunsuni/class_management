/* ==========================================================================
   수학 클래스Quest - State Management & LocalStorage Persistence
   ========================================================================== */

const STORAGE_KEY = 'MATH_CLASS_QUEST_STATE_V1';

// Initial Mock Data Generator
const DEFAULT_STUDENT_NAMES = [
  '김민준', '이서연', '박도윤', '최하은', '정시우',
  '강지유', '조현우', '윤아린', '장준서', '임수아',
  '한예준', '오지민', '서건우', '신유나', '권우진',
  '황다은', '송민재', '전채원', '홍태양', '유지호',
  '고은서', '문주원', '양서윤', '손도현', '배하율'
];

function generateDefaultStudents() {
  return DEFAULT_STUDENT_NAMES.map((name, index) => {
    // Generate initial varied balance & XP for demo realism
    const initialXp = (index % 5) * 350 + (index * 40);
    const initialBalance = Math.floor(initialXp * 0.8 / 100) * 100;
    const avatarIcons = ['🐶', '🐱', '🦊', '🐻', '🐼', '🐯', '🦁', '🐰', '🦄', '🐲'];
    const avatar = avatarIcons[index % avatarIcons.length];

    return {
      id: `std_${index + 1}`,
      number: index + 1,
      name,
      avatar,
      balance: initialBalance,
      totalXp: initialXp,
      coupons: [
        // One default sample coupon for first few students
        ...(index < 5 ? [{
          id: `cpn_sample_${index}`,
          name: '🎟️ 자리 배치 지정권',
          desc: '원하는 자리를 선택할 수 있는 쿠폰',
          purchasedAt: new Date().toLocaleDateString(),
          used: false
        }] : [])
      ],
      completedMissions: []
    };
  });
}

function generateDefaultShopItems() {
  return [
    {
      id: 'shop_1',
      name: '자리 배치 지정권',
      category: 'coupon',
      icon: '🎟️',
      price: 2000,
      desc: '다음 짝꿍/자리 배치 시 원하는 자리를 지정할 수 있는 권한'
    },
    {
      id: 'shop_2',
      name: '수학 숙제 1회 면제권',
      category: 'coupon',
      icon: '📝',
      price: 3000,
      desc: '일반 수학 일일 숙제를 1회 제출 면제받을 수 있는 쿠폰'
    },
    {
      id: 'shop_3',
      name: '고급 캐릭터 샤프',
      category: 'item',
      icon: '✏️',
      price: 1500,
      desc: '수학 문제 풀이에 딱 좋은 필기감 만점 학용품'
    },
    {
      id: 'shop_4',
      name: '수학 간식 세트',
      category: 'item',
      icon: '🍫',
      price: 1000,
      desc: '수업 쉬는 시간에 즐기는 달콤한 간식 묶음'
    },
    {
      id: 'shop_5',
      name: '수업 BGM 신청권',
      category: 'perk',
      icon: '🎵',
      price: 800,
      desc: '자율 수학 문제 풀이 시간에 원하는 음악 재생 신청권'
    }
  ];
}

function generateDefaultMissions() {
  return [
    {
      id: 'mis_1',
      title: '수학 2단원 형성평가 학습지 제출하기',
      desc: '오늘 수업시간 내 탐구 문제지 풀이 및 제출 완료',
      reward: 300,
      icon: '📐',
      createdAt: new Date().toLocaleDateString()
    },
    {
      id: 'mis_2',
      title: '수학 칠판 풀이 발표 1회 참여하기',
      desc: '대표로 나와 칠판에 문제 풀이 과정 설명하기',
      reward: 200,
      icon: '🙋‍♂️',
      createdAt: new Date().toLocaleDateString()
    },
    {
      id: 'mis_3',
      title: '모둠 수학 탐구 협동활동 완료',
      desc: '모둠원 전원이 협력하여 퀴즈 해결하기',
      reward: 150,
      icon: '🤝',
      createdAt: new Date().toLocaleDateString()
    }
  ];
}

class AppState {
  constructor() {
    this.data = this.loadState();
    this.currentMode = 'picker'; // 'picker', 'student', 'teacher'
    this.activeStudentId = null;
    this.listeners = [];
  }

  loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse state:', e);
      }
    }

    // Default Initial State
    return {
      teacherPin: '1234',
      currentClassId: 'class_2_1',
      classes: [
        { id: 'class_2_1', name: '2학년 1반' },
        { id: 'class_2_2', name: '2학년 2반' },
        { id: 'class_2_3', name: '2학년 3반' }
      ],
      // Map classId to students list
      studentsData: {
        'class_2_1': generateDefaultStudents(),
        'class_2_2': generateDefaultStudents().map((s, idx) => ({ ...s, name: `(2반) ${s.name}` })),
        'class_2_3': generateDefaultStudents().map((s, idx) => ({ ...s, name: `(3반) ${s.name}` }))
      },
      shopItems: generateDefaultShopItems(),
      missions: generateDefaultMissions()
    };
  }

  saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.data));
  }

  // Getters
  getCurrentClassId() {
    return this.data.currentClassId;
  }

  getCurrentClassObj() {
    return this.data.classes.find(c => c.id === this.data.currentClassId) || this.data.classes[0];
  }

  getStudents() {
    return this.data.studentsData[this.data.currentClassId] || [];
  }

  getStudentById(id) {
    const students = this.getStudents();
    return students.find(s => s.id === id);
  }

  getShopItems() {
    return this.data.shopItems || [];
  }

  getMissions() {
    return this.data.missions || [];
  }

  getTeacherPin() {
    return this.data.teacherPin || '1234';
  }

  // Actions
  setCurrentClass(classId) {
    this.data.currentClassId = classId;
    this.saveState();
  }

  addClass(className) {
    const newId = `class_${Date.now()}`;
    this.data.classes.push({ id: newId, name: className });
    this.data.studentsData[newId] = generateDefaultStudents();
    this.data.currentClassId = newId;
    this.saveState();
  }

  // Import student roster from Excel/CSV parsed list
  importStudentsFromList(rawList) {
    const avatarIcons = ['🐶', '🐱', '🦊', '🐻', '🐼', '🐯', '🦁', '🐰', '🦄', '🐲'];
    const newStudents = rawList.map((item, index) => {
      const studentNum = item.number || (index + 1);
      const studentName = item.name;
      return {
        id: `std_${Date.now()}_${index}`,
        number: studentNum,
        name: studentName,
        avatar: avatarIcons[index % avatarIcons.length],
        balance: 1000, // Initial welcome currency
        totalXp: 1000,
        coupons: [],
        completedMissions: []
      };
    });

    this.data.studentsData[this.data.currentClassId] = newStudents;
    this.saveState();
    return newStudents;
  }

  // Grant or Deduct Currency/XP for individual student
  updateStudentCurrency(studentId, amount, isGrant = true) {
    const students = this.getStudents();
    const student = students.find(s => s.id === studentId);
    if (!student) return null;

    const oldLevel = calculateLevelInfo(student.totalXp).level;

    if (isGrant) {
      student.balance += amount;
      student.totalXp += amount; // 1:1 XP match
    } else {
      student.balance = Math.max(0, student.balance - amount);
      // XP is NOT deducted when spending coins!
    }

    const newLevel = calculateLevelInfo(student.totalXp).level;
    const isLevelUp = newLevel > oldLevel;

    this.saveState();
    return { student, isLevelUp, newLevel };
  }

  // Bulk grant currency to all students in current class
  bulkGrantCurrency(amount, reason) {
    const students = this.getStudents();
    let levelUps = [];

    students.forEach(student => {
      const oldLevel = calculateLevelInfo(student.totalXp).level;
      student.balance += amount;
      student.totalXp += amount;
      const newLevel = calculateLevelInfo(student.totalXp).level;

      if (newLevel > oldLevel) {
        levelUps.push({ name: student.name, newLevel });
      }
    });

    this.saveState();
    return levelUps;
  }

  // Student buys shop item
  purchaseShopItem(studentId, itemId) {
    const student = this.getStudentById(studentId);
    const item = this.getShopItems().find(i => i.id === itemId);

    if (!student || !item) return { success: false, reason: '아이템 정보 오류' };
    if (student.balance < item.price) return { success: false, reason: '잔액이 부족합니다.' };

    student.balance -= item.price;
    const newCoupon = {
      id: `cpn_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: `${item.icon} ${item.name}`,
      desc: item.desc,
      purchasedAt: new Date().toLocaleDateString(),
      used: false
    };
    student.coupons.push(newCoupon);

    this.saveState();
    return { success: true, item, coupon: newCoupon };
  }

  // Student uses coupon
  useCoupon(studentId, couponId) {
    const student = this.getStudentById(studentId);
    if (!student) return false;

    const coupon = student.coupons.find(c => c.id === couponId);
    if (!coupon || coupon.used) return false;

    coupon.used = true;
    coupon.usedAt = new Date().toLocaleDateString();
    this.saveState();
    return true;
  }

  // Student toggles mission completion
  toggleStudentMission(studentId, missionId) {
    const student = this.getStudentById(studentId);
    const mission = this.getMissions().find(m => m.id === missionId);
    if (!student || !mission) return null;

    if (!student.completedMissions) student.completedMissions = [];

    const isCompleted = student.completedMissions.includes(missionId);

    if (!isCompleted) {
      student.completedMissions.push(missionId);
      // Grant reward
      student.balance += mission.reward;
      student.totalXp += mission.reward;
    } else {
      student.completedMissions = student.completedMissions.filter(id => id !== missionId);
      // Revert reward
      student.balance = Math.max(0, student.balance - mission.reward);
      student.totalXp = Math.max(0, student.totalXp - mission.reward);
    }

    this.saveState();
    return { isCompleted: !isCompleted, mission };
  }

  // Shop item CRUD
  addShopItem(item) {
    const newItem = {
      id: `shop_${Date.now()}`,
      ...item
    };
    this.data.shopItems.push(newItem);
    this.saveState();
    return newItem;
  }

  updateShopItem(id, updated) {
    const idx = this.data.shopItems.findIndex(i => i.id === id);
    if (idx !== -1) {
      this.data.shopItems[idx] = { ...this.data.shopItems[idx], ...updated };
      this.saveState();
    }
  }

  deleteShopItem(id) {
    this.data.shopItems = this.data.shopItems.filter(i => i.id !== id);
    this.saveState();
  }

  // Mission CRUD
  addMission(mission) {
    const newMission = {
      id: `mis_${Date.now()}`,
      createdAt: new Date().toLocaleDateString(),
      ...mission
    };
    this.data.missions.push(newMission);
    this.saveState();
    return newMission;
  }

  deleteMission(id) {
    this.data.missions = this.data.missions.filter(m => m.id !== id);
    this.saveState();
  }

  // Reset to default
  resetAllData() {
    localStorage.removeItem(STORAGE_KEY);
    this.data = this.loadState();
    this.saveState();
  }
}

// Global App State Instance
window.appState = new AppState();
