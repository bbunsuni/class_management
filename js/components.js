/* ==========================================================================
   수학 클래스Quest - UI Component Renderer Modules
   ========================================================================== */

const Components = {

  // 1. Student Profile Selector View
  renderStudentPicker(students) {
    const studentCardsHtml = students.map(s => {
      const lvlInfo = calculateLevelInfo(s.totalXp);
      return `
        <div class="student-card-pick" data-student-id="${s.id}">
          <div class="student-avatar">${s.avatar || '🎓'}</div>
          <div class="student-name-title">${s.number}. ${s.name}</div>
          <div class="student-card-badges">
            <span class="badge-level">Lv.${lvlInfo.level}</span>
            <span class="badge-coin">💰 ${s.balance.toLocaleString()}원</span>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="picker-container animate-pop">
        <div class="picker-header">
          <h2>👋 안녕하세요! 본인의 이름을 클릭하세요</h2>
          <p>오늘의 수학 수업 미션 확인 및 학급 상점 이용을 위해 이름을 선택합니다.</p>
        </div>
        <div class="student-grid">
          ${studentCardsHtml}
        </div>
      </div>
    `;
  },

  // 2. Student Main View Dashboard
  renderStudentDashboard(student, missions, shopItems) {
    const lvlInfo = calculateLevelInfo(student.totalXp);

    // Render Missions HTML
    const completedSet = new Set(student.completedMissions || []);
    const missionsHtml = missions.length > 0 ? missions.map(m => {
      const isDone = completedSet.has(m.id);
      return `
        <div class="mission-item-card ${isDone ? 'done' : ''}">
          <div class="mission-left">
            <div class="mission-icon">${m.icon || '🎯'}</div>
            <div class="mission-info">
              <h4>${m.title}</h4>
              <p>${m.desc || ''}</p>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span class="mission-reward-badge">+${m.reward.toLocaleString()}원 (${m.reward} XP)</span>
            <button class="btn btn-sm ${isDone ? 'btn-success' : 'btn-secondary'} btn-toggle-mission" data-mission-id="${m.id}">
              ${isDone ? '✓ 완료됨' : '미션 완료하기'}
            </button>
          </div>
        </div>
      `;
    }).join('') : `<p class="text-muted" style="text-align: center; padding: 20px;">등록된 오늘의 수업 미션이 없습니다.</p>`;

    // Render Shop Items HTML
    const shopHtml = shopItems.map(item => {
      const canAfford = student.balance >= item.price;
      return `
        <div class="shop-card-item">
          <div class="shop-item-icon">${item.icon || '🛍️'}</div>
          <div class="shop-item-name">${item.name}</div>
          <div class="shop-item-desc">${item.desc || ''}</div>
          <div class="shop-item-price">💰 ${item.price.toLocaleString()}원</div>
          <button class="btn btn-sm ${canAfford ? 'btn-primary' : 'btn-secondary'} btn-buy-item" 
                  data-item-id="${item.id}" ${canAfford ? '' : 'disabled style="opacity: 0.6; cursor: not-allowed;"'}>
            ${canAfford ? '구매하기' : '잔액 부족'}
          </button>
        </div>
      `;
    }).join('');

    // Render Coupons HTML
    const coupons = student.coupons || [];
    const couponsHtml = coupons.length > 0 ? coupons.map(c => `
      <div class="coupon-item-card">
        <div>
          <div style="font-weight: 700; font-size: 14px;">${c.name}</div>
          <div style="font-size: 12px; color: var(--text-muted);">${c.desc} (구매일: ${c.purchasedAt})</div>
        </div>
        <div>
          ${c.used ? 
            `<span class="btn-chip" style="background:#e2e8f0; color:#64748b;">사용 완료</span>` : 
            `<button class="btn btn-sm btn-success btn-use-coupon" data-coupon-id="${c.id}">쿠폰 사용하기</button>`
          }
        </div>
      </div>
    `).join('') : `<p class="text-muted" style="text-align: center; padding: 14px; font-size: 13px;">보유 중인 쿠폰이 없습니다. 상점에서 필요한 쿠폰을 구매해 보세요!</p>`;

    return `
      <div class="student-dashboard animate-pop">
        <!-- Hero Header -->
        <div class="student-hero-card">
          <div class="student-hero-bg-sparkles"></div>
          <div class="student-info-group">
            <div class="student-large-avatar">${student.avatar || '🎓'}</div>
            <div class="student-details-text">
              <h2>${student.name} 학생</h2>
              <div class="student-class-name">학번: ${student.number}번 | 수학 클래스원</div>
            </div>
          </div>

          <!-- XP & Level Progress -->
          <div class="level-xp-container">
            <div class="level-row">
              <span class="level-tag">Lv.${lvlInfo.level} Master</span>
              <span>총 누적 ${lvlInfo.totalXp.toLocaleString()} XP</span>
            </div>
            <div class="xp-bar-wrapper">
              <div class="xp-bar-fill" style="width: ${lvlInfo.progressPercent}%;"></div>
            </div>
            <div class="xp-text">다음 레벨까지: ${lvlInfo.xpInCurrentLevel} / ${lvlInfo.xpRequiredForNextLevel} XP (${lvlInfo.progressPercent}%)</div>
          </div>

          <!-- Current Balance Badge -->
          <div class="balance-card">
            <div class="balance-label">현재 보유 학급 화폐</div>
            <div class="balance-amount">💰 ${student.balance.toLocaleString()}원</div>
          </div>
        </div>

        <!-- Dashboard Main Grid -->
        <div class="dashboard-grid">
          <!-- Today's Math Missions -->
          <div class="dashboard-card">
            <div class="card-title-bar">
              <h3>🎯 오늘의 수학 수업 미션</h3>
              <span class="btn-chip">수업 참여 보상</span>
            </div>
            <div class="mission-list">
              ${missionsHtml}
            </div>
          </div>

          <!-- Shop & Coupons Section -->
          <div class="dashboard-card">
            <div class="card-title-bar">
              <h3>🎟️ 나의 쿠폰함 & 학급 상점</h3>
              <button class="btn btn-sm btn-secondary" id="btn-back-picker">👤 다른 학생으로 변경</button>
            </div>

            <!-- Coupons Sub-section -->
            <div>
              <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 10px; color: var(--text-main);">🎫 내가 보유한 쿠폰 (${coupons.length}개)</h4>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${couponsHtml}
              </div>
            </div>

            <!-- Shop Items Grid -->
            <div style="margin-top: 10px;">
              <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 12px; color: var(--text-main);">🛍️ 학급 상점 상품 목록</h4>
              <div class="shop-cards-grid">
                ${shopHtml}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // 3. Teacher Dashboard Main View
  renderTeacherDashboard(students, searchQuery = '') {
    const filtered = students.filter(s => 
      s.name.includes(searchQuery) || String(s.number).includes(searchQuery)
    );

    const totalCoins = students.reduce((acc, curr) => acc + curr.balance, 0);
    const avgXp = students.length > 0 ? Math.round(students.reduce((acc, curr) => acc + curr.totalXp, 0) / students.length) : 0;

    const studentCardsHtml = filtered.map(s => {
      const lvlInfo = calculateLevelInfo(s.totalXp);
      return `
        <div class="teacher-student-card">
          <div class="t-card-top">
            <div class="t-student-info">
              <div class="t-avatar">${s.avatar || '🎓'}</div>
              <div class="t-name-lvl">
                <h4>${s.number}. ${s.name}</h4>
                <span class="badge-level">Lv.${lvlInfo.level} (${lvlInfo.totalXp} XP)</span>
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-top: 1px dashed var(--border-light); border-bottom: 1px dashed var(--border-light);">
            <span style="font-size: 13px; color: var(--text-muted);">보유 화폐</span>
            <div class="t-balance">💰 ${s.balance.toLocaleString()}원</div>
          </div>
          <div class="t-card-actions">
            <button class="btn btn-sm btn-success btn-grant-currency" data-student-id="${s.id}" style="flex:1;">
              + 지급
            </button>
            <button class="btn btn-sm btn-secondary btn-deduct-currency" data-student-id="${s.id}">
              - 차감
            </button>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="teacher-dashboard animate-pop">
        <!-- Control Header Bar -->
        <div class="teacher-header-bar">
          <div class="teacher-title">
            <h2>👨‍🏫 교사 학급 관리 센터</h2>
            <p style="font-size: 13px; color: var(--text-muted);">학생 활동 보상 화폐 지급, 상점 상품 및 오늘의 수학 수업 미션을 관리합니다.</p>
          </div>

          <div class="teacher-actions-group">
            <button class="btn btn-primary" id="btn-open-bulk-modal">
              ✨ 전체 학생 일괄 지급
            </button>
            <button class="btn btn-secondary" id="btn-open-excel-modal">
              📁 엑셀 명단 등록
            </button>
            <button class="btn btn-secondary" id="btn-open-shop-modal">
              🛍️ 상점 관리
            </button>
            <button class="btn btn-secondary" id="btn-open-mission-modal">
              🎯 수업 미션 관리
            </button>
            <button class="btn btn-secondary" id="btn-reset-data-confirm" style="color: var(--danger);">
              ⚙️ 데이터 초기화
            </button>
          </div>
        </div>

        <!-- Class Stats Summary Chips -->
        <div style="display: flex; gap: 14px; flex-wrap: wrap;">
          <div style="background: white; border: 1px solid var(--border-light); padding: 12px 20px; border-radius: var(--radius-md); font-weight: 700;">
            👥 총 학생 수: <span style="color: var(--primary);">${students.length}명</span>
          </div>
          <div style="background: white; border: 1px solid var(--border-light); padding: 12px 20px; border-radius: var(--radius-md); font-weight: 700;">
            💰 학급 총 유통 화폐: <span style="color: var(--accent-gold);">${totalCoins.toLocaleString()}원</span>
          </div>
          <div style="background: white; border: 1px solid var(--border-light); padding: 12px 20px; border-radius: var(--radius-md); font-weight: 700;">
            ⭐ 학생 평균 XP: <span style="color: var(--accent-purple);">${avgXp.toLocaleString()} XP</span>
          </div>
        </div>

        <!-- Student Cards Section -->
        <div class="students-manage-card">
          <div class="student-table-header">
            <h3>📋 학급 학생 목록 (25명)</h3>
            <div class="search-filter-box">
              <input type="text" id="student-search-input" class="custom-input" placeholder="학생 이름/번호 검색..." value="${searchQuery}" style="width: 220px;">
            </div>
          </div>

          <div class="teacher-student-grid">
            ${studentCardsHtml || `<p class="text-muted" style="padding: 20px; text-align: center; grid-column: 1/-1;">검색된 학생이 없습니다.</p>`}
          </div>
        </div>
      </div>
    `;
  },

  // 4. Render Shop Table Rows inside Teacher Modal
  renderShopManageRows(shopItems) {
    return shopItems.map(item => `
      <tr>
        <td style="font-size: 20px;">${item.icon || '🛍️'}</td>
        <td style="font-weight: 700;">${item.name}</td>
        <td>
          <span class="btn-chip" style="font-size: 11px;">
            ${item.category === 'coupon' ? '🎟️ 쿠폰' : (item.category === 'item' ? '✏️ 물품' : '🌟 혜택')}
          </span>
        </td>
        <td style="font-weight: 800; color: var(--accent-gold);">💰 ${item.price.toLocaleString()}원</td>
        <td>
          <button class="btn btn-sm btn-secondary btn-edit-shop-item" data-item-id="${item.id}">수정</button>
          <button class="btn btn-sm btn-danger btn-delete-shop-item" data-item-id="${item.id}">삭제</button>
        </td>
      </tr>
    `).join('');
  },

  // 5. Render Mission Cards inside Teacher Modal
  renderMissionManageCards(missions) {
    return missions.map(m => `
      <div class="mission-item-card">
        <div class="mission-left">
          <div class="mission-icon">${m.icon || '🎯'}</div>
          <div class="mission-info">
            <h4>${m.title}</h4>
            <p>${m.desc || ''}</p>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="mission-reward-badge">+${m.reward.toLocaleString()}원</span>
          <button class="btn btn-sm btn-danger btn-delete-mission" data-mission-id="${m.id}">삭제</button>
        </div>
      </div>
    `).join('');
  }

};
