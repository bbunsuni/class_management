/* ==========================================================================
   수학 클래스Quest - Main Application Controller Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const state = window.appState;

  // DOM Containers
  const mainContent = document.getElementById('main-content');
  const classSelect = document.getElementById('class-select');
  const currentClassTag = document.getElementById('current-class-tag');
  const modeBadgeContainer = document.getElementById('mode-badge-container');
  const switchModeBtn = document.getElementById('switch-mode-btn');
  const switchModeText = document.getElementById('switch-mode-text');

  // Modals
  const pinModal = document.getElementById('pin-modal');
  const currencyModal = document.getElementById('currency-modal');
  const bulkModal = document.getElementById('bulk-modal');
  const shopManageModal = document.getElementById('shop-manage-modal');
  const missionManageModal = document.getElementById('mission-manage-modal');
  const excelImportModal = document.getElementById('excel-import-modal');

  // Local Controller State
  let teacherPinBuffer = '';
  let targetStudentForCurrency = null;
  let teacherSearchQuery = '';
  let parsedStudentsFromExcel = [];

  // Initialize Navbar Controls
  function initNavbar() {
    renderClassOptions();
    updateModeBadge();
  }

  function renderClassOptions() {
    const classes = state.data.classes;
    const currentId = state.getCurrentClassId();

    classSelect.innerHTML = classes.map(c => `
      <option value="${c.id}" ${c.id === currentId ? 'selected' : ''}>${c.name}</option>
    `).join('') + `<option value="ADD_NEW_CLASS">➕ 새 학급 추가...</option>`;

    currentClassTag.textContent = state.getCurrentClassObj().name;
  }

  function updateModeBadge() {
    if (state.currentMode === 'teacher') {
      modeBadgeContainer.innerHTML = `<span class="mode-badge teacher">👨‍🏫 교사 모드</span>`;
      switchModeText.textContent = '학생 모드 전환';
    } else if (state.currentMode === 'student') {
      const activeStudent = state.getStudentById(state.activeStudentId);
      const studentName = activeStudent ? activeStudent.name : '학생';
      modeBadgeContainer.innerHTML = `<span class="mode-badge student">🎓 학생 모드 (${studentName})</span>`;
      switchModeText.textContent = '교사 모드 전환';
    } else {
      modeBadgeContainer.innerHTML = `<span class="mode-badge student">🎓 학생 선택 화면</span>`;
      switchModeText.textContent = '교사 모드 전환';
    }
  }

  // Render View Routing
  function renderView() {
    updateModeBadge();

    if (state.currentMode === 'picker') {
      const students = state.getStudents();
      mainContent.innerHTML = Components.renderStudentPicker(students);
    } else if (state.currentMode === 'student') {
      const student = state.getStudentById(state.activeStudentId);
      if (!student) {
        state.currentMode = 'picker';
        renderView();
        return;
      }
      const missions = state.getMissions();
      const shopItems = state.getShopItems();
      mainContent.innerHTML = Components.renderStudentDashboard(student, missions, shopItems);
    } else if (state.currentMode === 'teacher') {
      const students = state.getStudents();
      mainContent.innerHTML = Components.renderTeacherDashboard(students, teacherSearchQuery);
    }
  }

  // ==========================================================================
  // EVENT HANDLERS & DELEGATION
  // ==========================================================================

  // Class Selection Changed
  classSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'ADD_NEW_CLASS') {
      const newName = prompt('새로 추가할 학급 이름을 입력하세요 (예: 2학년 4반):');
      if (newName && newName.trim()) {
        state.addClass(newName.trim());
        showToast(`'${newName}' 학급이 새롭게 생성되었습니다!`, 'success');
      } else {
        renderClassOptions();
      }
    } else {
      state.setCurrentClass(val);
      state.activeStudentId = null;
      if (state.currentMode === 'student') state.currentMode = 'picker';
      showToast(`학급이 '${state.getCurrentClassObj().name}'(으)로 변경되었습니다.`);
    }
    renderClassOptions();
    renderView();
  });

  // Switch Mode Button Clicked (Teacher vs Student)
  switchModeBtn.addEventListener('click', () => {
    if (state.currentMode === 'teacher') {
      // Return to student picker
      state.currentMode = 'picker';
      state.activeStudentId = null;
      renderView();
      showToast('학생 선택 화면으로 전환되었습니다.');
    } else {
      // Open Teacher PIN modal
      teacherPinBuffer = '';
      updatePinDisplay();
      openModal(pinModal);
    }
  });

  // PIN Keypad Button Clicks
  document.querySelectorAll('.key-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const key = e.target.dataset.key;
      if (key === 'clear') {
        teacherPinBuffer = '';
      } else if (key === 'back') {
        teacherPinBuffer = teacherPinBuffer.slice(0, -1);
      } else if (key && teacherPinBuffer.length < 4) {
        teacherPinBuffer += key;
      }

      updatePinDisplay();

      // Check PIN when 4 digits reached
      if (teacherPinBuffer.length === 4) {
        setTimeout(() => {
          if (teacherPinBuffer === state.getTeacherPin()) {
            closeModal(pinModal);
            state.currentMode = 'teacher';
            renderView();
            playRewardSound();
            showToast('교사 모드로 인증 승인되었습니다!', 'success');
          } else {
            playErrorSound();
            showToast('PIN 번호가 일치하지 않습니다.', 'error');
            teacherPinBuffer = '';
            updatePinDisplay();
          }
        }, 150);
      }
    });
  });

  function updatePinDisplay() {
    const dots = document.querySelectorAll('#pin-display .pin-dot');
    dots.forEach((dot, index) => {
      if (index < teacherPinBuffer.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    });
  }

  // Delegated Main Content Clicks
  mainContent.addEventListener('click', (e) => {
    // 1. Student Picked from Picker Screen
    const pickCard = e.target.closest('.student-card-pick');
    if (pickCard) {
      const studentId = pickCard.dataset.studentId;
      state.activeStudentId = studentId;
      state.currentMode = 'student';
      renderView();
      playRewardSound();
      return;
    }

    // 2. Change Student Button in Dashboard
    if (e.target.id === 'btn-back-picker') {
      state.currentMode = 'picker';
      state.activeStudentId = null;
      renderView();
      return;
    }

    // 3. Student Toggles Mission
    const toggleBtn = e.target.closest('.btn-toggle-mission');
    if (toggleBtn) {
      const missionId = toggleBtn.dataset.missionId;
      const res = state.toggleStudentMission(state.activeStudentId, missionId);
      if (res) {
        if (res.isCompleted) {
          triggerConfetti();
          playRewardSound();
          showToast(`🎯 미션 완료! +${res.mission.reward}원 / XP 보상이 지급되었습니다.`, 'success');
        } else {
          showToast(`미션 완수를 취소하였습니다.`);
        }
        renderView();
      }
      return;
    }

    // 4. Student Buys Shop Item
    const buyBtn = e.target.closest('.btn-buy-item');
    if (buyBtn) {
      const itemId = buyBtn.dataset.itemId;
      const res = state.purchaseShopItem(state.activeStudentId, itemId);
      if (res.success) {
        triggerConfetti();
        playRewardSound();
        showToast(`🎉 '${res.item.name}' 구매 완료! 내 쿠폰함에서 확인하세요.`, 'success');
        renderView();
      } else {
        playErrorSound();
        showToast(res.reason, 'error');
      }
      return;
    }

    // 5. Student Uses Coupon
    const useCouponBtn = e.target.closest('.btn-use-coupon');
    if (useCouponBtn) {
      const couponId = useCouponBtn.dataset.couponId;
      if (confirm('이 쿠폰을 정말 사용하시겠습니까? (선생님께 확인 후 사용하세요)')) {
        const success = state.useCoupon(state.activeStudentId, couponId);
        if (success) {
          triggerConfetti();
          playRewardSound();
          showToast('쿠폰 사용이 승인되었습니다!', 'success');
          renderView();
        }
      }
      return;
    }

    // 6. Teacher Grant/Deduct Currency Buttons
    const grantBtn = e.target.closest('.btn-grant-currency');
    const deductBtn = e.target.closest('.btn-deduct-currency');

    if (grantBtn || deductBtn) {
      const studentId = (grantBtn || deductBtn).dataset.studentId;
      targetStudentForCurrency = state.getStudentById(studentId);
      if (!targetStudentForCurrency) return;

      const isGrant = !!grantBtn;
      const banner = document.getElementById('target-student-banner');
      banner.innerHTML = `
        <div style="background: var(--primary-light); padding: 12px 16px; border-radius: var(--radius-sm); margin-bottom: 16px; font-weight: 700;">
          🎓 대상 학생: ${targetStudentForCurrency.number}번 ${targetStudentForCurrency.name} 
          <span style="float: right; color: var(--accent-gold);">현재 잔액: 💰 ${targetStudentForCurrency.balance.toLocaleString()}원</span>
        </div>
      `;

      // Set radio choice
      const actionRadios = document.querySelectorAll('input[name="currency-action"]');
      actionRadios.forEach(r => {
        if (r.value === (isGrant ? 'grant' : 'deduct')) {
          r.checked = true;
          r.parentElement.classList.add('active');
        } else {
          r.parentElement.classList.remove('active');
        }
      });

      openModal(currencyModal);
      return;
    }

    // 7. Teacher Action Bar Buttons
    if (e.target.id === 'btn-open-bulk-modal') {
      openModal(bulkModal);
      return;
    }
    if (e.target.id === 'btn-open-excel-modal') {
      document.getElementById('excel-file-input').value = '';
      document.getElementById('excel-preview-container').classList.add('hidden');
      parsedStudentsFromExcel = [];
      openModal(excelImportModal);
      return;
    }
    if (e.target.id === 'btn-open-shop-modal') {
      refreshShopManageTable();
      openModal(shopManageModal);
      return;
    }
    if (e.target.id === 'btn-open-mission-modal') {
      refreshMissionManageCards();
      openModal(missionManageModal);
      return;
    }
    if (e.target.id === 'btn-reset-data-confirm') {
      if (confirm('학급 학생들의 모든 화폐, 레벨 및 설정 데이터를 초기 상태로 리셋하시겠습니까?')) {
        state.resetAllData();
        showToast('모든 데이터가 성공적으로 초기화되었습니다.', 'success');
        renderView();
      }
      return;
    }
  });

  // Student Search Filter Listener in Teacher View
  mainContent.addEventListener('input', (e) => {
    if (e.target.id === 'student-search-input') {
      teacherSearchQuery = e.target.value.trim();
      renderView();
    }
  });

  // Radio toggle UI state change
  document.querySelectorAll('.radio-btn').forEach(label => {
    label.addEventListener('click', (e) => {
      document.querySelectorAll('.radio-btn').forEach(l => l.classList.remove('active'));
      label.classList.add('active');
    });
  });

  // Quick Amount Chips for Individual Currency Modal
  document.querySelectorAll('[data-amount]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('currency-amount').value = btn.dataset.amount;
    });
  });

  // Quick Amount Chips for Bulk Modal
  document.querySelectorAll('[data-bulk-amount]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('bulk-amount').value = btn.dataset.bulkAmount;
    });
  });

  // Form Submission: Individual Currency Grant/Deduct
  document.getElementById('currency-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!targetStudentForCurrency) return;

    const action = document.querySelector('input[name="currency-action"]:checked').value;
    const amount = parseInt(document.getElementById('currency-amount').value, 10);
    const reason = document.getElementById('currency-reason').value.trim();

    const isGrant = action === 'grant';
    const res = state.updateStudentCurrency(targetStudentForCurrency.id, amount, isGrant);

    if (res) {
      closeModal(currencyModal);
      if (isGrant) {
        playRewardSound();
        if (res.isLevelUp) {
          triggerLevelUpConfetti();
          playLevelUpSound();
          showToast(`🎊 ${res.student.name} 학생이 Lv.${res.newLevel}(으)로 레벨업했습니다!`, 'success');
        } else {
          triggerConfetti();
          showToast(`💰 ${res.student.name} 학생에게 ${amount.toLocaleString()}원 (+${amount} XP) 지급 완료! (${reason})`, 'success');
        }
      } else {
        showToast(`➖ ${res.student.name} 학생의 화폐 ${amount.toLocaleString()}원 차감 완료. (${reason})`);
      }
      renderView();
    }
  });

  // Form Submission: Bulk Grant
  document.getElementById('bulk-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseInt(document.getElementById('bulk-amount').value, 10);
    const reason = document.getElementById('bulk-reason').value.trim();

    const levelUps = state.bulkGrantCurrency(amount, reason);
    closeModal(bulkModal);
    playRewardSound();
    triggerConfetti();

    showToast(`✨ 현재 학급 전원에게 각각 ${amount.toLocaleString()}원 (+${amount} XP) 지급 완료! (${reason})`, 'success');
    if (levelUps.length > 0) {
      triggerLevelUpConfetti();
      playLevelUpSound();
      showToast(`🎉 레벨업 학생: ${levelUps.map(l => `${l.name}(Lv.${l.newLevel})`).join(', ')}`, 'success');
    }
    renderView();
  });

  // Shop Item Form Submit (Add or Edit)
  const shopItemForm = document.getElementById('shop-item-form');
  shopItemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = document.getElementById('shop-item-id').value;
    const itemData = {
      name: document.getElementById('item-name').value.trim(),
      price: parseInt(document.getElementById('item-price').value, 10),
      category: document.getElementById('item-category').value,
      icon: document.getElementById('item-icon').value.trim() || '🎟️',
      desc: document.getElementById('item-desc').value.trim()
    };

    if (editId) {
      state.updateShopItem(editId, itemData);
      showToast(`'${itemData.name}' 상품 정보가 수정되었습니다.`, 'success');
    } else {
      state.addShopItem(itemData);
      showToast(`새 상품 '${itemData.name}'이(가) 추가되었습니다.`, 'success');
    }

    shopItemForm.reset();
    document.getElementById('shop-item-id').value = '';
    document.getElementById('shop-form-title').textContent = '➕ 새 상품/쿠폰 등록';
    document.getElementById('shop-submit-btn').textContent = '등록하기';
    document.getElementById('shop-cancel-edit-btn').classList.add('hidden');
    refreshShopManageTable();
  });

  // Shop Item Table Actions (Edit & Delete)
  document.getElementById('shop-items-tbody').addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-edit-shop-item');
    const deleteBtn = e.target.closest('.btn-delete-shop-item');

    if (editBtn) {
      const id = editBtn.dataset.itemId;
      const item = state.getShopItems().find(i => i.id === id);
      if (item) {
        document.getElementById('shop-item-id').value = item.id;
        document.getElementById('item-name').value = item.name;
        document.getElementById('item-price').value = item.price;
        document.getElementById('item-category').value = item.category;
        document.getElementById('item-icon').value = item.icon;
        document.getElementById('item-desc').value = item.desc || '';

        document.getElementById('shop-form-title').textContent = '✏️ 상품 정보 수정';
        document.getElementById('shop-submit-btn').textContent = '수정 완료';
        document.getElementById('shop-cancel-edit-btn').classList.remove('hidden');
      }
    }

    if (deleteBtn) {
      const id = deleteBtn.dataset.itemId;
      if (confirm('정말 이 상점 상품을 삭제하시겠습니까?')) {
        state.deleteShopItem(id);
        showToast('상품이 삭제되었습니다.');
        refreshShopManageTable();
      }
    }
  });

  document.getElementById('shop-cancel-edit-btn').addEventListener('click', () => {
    shopItemForm.reset();
    document.getElementById('shop-item-id').value = '';
    document.getElementById('shop-form-title').textContent = '➕ 새 상품/쿠폰 등록';
    document.getElementById('shop-submit-btn').textContent = '등록하기';
    document.getElementById('shop-cancel-edit-btn').classList.add('hidden');
  });

  function refreshShopManageTable() {
    const tbody = document.getElementById('shop-items-tbody');
    tbody.innerHTML = Components.renderShopManageRows(state.getShopItems());
  }

  // Mission Form Submit (Add)
  document.getElementById('mission-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const missionData = {
      title: document.getElementById('mission-title').value.trim(),
      desc: document.getElementById('mission-desc').value.trim(),
      reward: parseInt(document.getElementById('mission-reward').value, 10),
      icon: document.getElementById('mission-icon').value.trim() || '📐'
    };

    state.addMission(missionData);
    showToast(`새 수업 미션 '${missionData.title}'이(가) 추가되었습니다.`, 'success');
    document.getElementById('mission-form').reset();
    refreshMissionManageCards();
  });

  // Mission Delete Action
  document.getElementById('mission-manage-list').addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.btn-delete-mission');
    if (deleteBtn) {
      const id = deleteBtn.dataset.missionId;
      if (confirm('이 수업 미션을 삭제하시겠습니까?')) {
        state.deleteMission(id);
        showToast('수업 미션이 삭제되었습니다.');
        refreshMissionManageCards();
      }
    }
  });

  function refreshMissionManageCards() {
    const container = document.getElementById('mission-manage-list');
    container.innerHTML = Components.renderMissionManageCards(state.getMissions());
  }

  // ==========================================================================
  // EXCEL IMPORT & PARSING LOGIC
  // ==========================================================================
  const excelDropZone = document.getElementById('excel-drop-zone');
  const excelFileInput = document.getElementById('excel-file-input');

  excelDropZone.addEventListener('click', () => excelFileInput.click());

  excelDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    excelDropZone.classList.add('dragover');
  });

  excelDropZone.addEventListener('dragleave', () => {
    excelDropZone.classList.remove('dragover');
  });

  excelDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    excelDropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleExcelFile(e.dataTransfer.files[0]);
    }
  });

  excelFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleExcelFile(e.target.files[0]);
    }
  });

  // Download Sample Excel Template
  document.getElementById('btn-download-excel-template').addEventListener('click', () => {
    if (typeof XLSX !== 'undefined') {
      const sampleData = [
        ['번호', '이름'],
        [1, '김민준'],
        [2, '이서연'],
        [3, '박도윤'],
        [4, '최하은'],
        [5, '정시우']
      ];
      const ws = XLSX.utils.aoa_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '학생명단');
      XLSX.writeFile(wb, '수학클래스Quest_학생명단_양식.xlsx');
    } else {
      const csvContent = "data:text/csv;charset=utf-8,\uFEFF번호,이름\n1,김민준\n2,이서연\n3,박도윤\n4,최하은\n5,정시우";
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "수학클래스Quest_학생명단_양식.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  });

  function handleExcelFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        parsedStudentsFromExcel = [];

        if (typeof XLSX !== 'undefined') {
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          jsonRows.forEach((row, idx) => {
            if (!row || row.length === 0) return;
            const col1 = String(row[0] || '').trim();
            const col2 = String(row[1] || '').trim();

            if (col1 === '번호' || col1 === '이름' || col2 === '이름') return;

            let num = idx + 1;
            let name = '';

            if (col2) {
              num = parseInt(col1, 10) || (idx + 1);
              name = col2;
            } else if (col1) {
              name = col1;
            }

            if (name) {
              parsedStudentsFromExcel.push({ number: num, name });
            }
          });
        } else {
          const text = new TextDecoder('utf-8').decode(data);
          const lines = text.split('\n');
          lines.forEach((line, idx) => {
            const parts = line.split(/[,;\t]/).map(p => p.trim());
            if (parts.length > 0 && parts[0]) {
              if (parts[0] === '번호' || parts[0] === '이름') return;
              const name = parts[1] || parts[0];
              const num = parseInt(parts[0], 10) || (idx + 1);
              if (name) parsedStudentsFromExcel.push({ number: num, name });
            }
          });
        }

        if (parsedStudentsFromExcel.length === 0) {
          showToast('엑셀 파일에서 학생 명단을 읽어올 수 없습니다. 서식을 확인해 주세요.', 'error');
          return;
        }

        renderExcelPreviewTable(parsedStudentsFromExcel);
        showToast(`엑셀에서 ${parsedStudentsFromExcel.length}명의 학생 명단을 읽어왔습니다!`, 'success');
      } catch (err) {
        console.error(err);
        showToast('엑셀 파일 읽기 중 오류가 발생했습니다.', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function renderExcelPreviewTable(students) {
    const tbody = document.getElementById('excel-preview-tbody');
    const countEl = document.getElementById('excel-student-count');
    const container = document.getElementById('excel-preview-container');

    countEl.textContent = students.length;
    tbody.innerHTML = students.map(s => `
      <tr>
        <td>${s.number}번</td>
        <td style="font-weight:700;">${s.name}</td>
        <td><span class="btn-chip" style="color:var(--success); background:var(--success-light);">✓ 인식됨</span></td>
      </tr>
    `).join('');

    container.classList.remove('hidden');
  }

  // Confirm Excel Import Button Click
  document.getElementById('btn-confirm-excel-import').addEventListener('click', () => {
    if (parsedStudentsFromExcel.length === 0) return;

    state.importStudentsFromList(parsedStudentsFromExcel);
    closeModal(excelImportModal);
    triggerConfetti();
    playRewardSound();

    showToast(`🎉 총 ${parsedStudentsFromExcel.length}명의 학생 명단이 새로 적용되었습니다!`, 'success');
    renderView();
  });

  // Modal Open / Close Helpers
  function openModal(modalEl) {
    modalEl.classList.remove('hidden');
  }

  function closeModal(modalEl) {
    modalEl.classList.add('hidden');
  }

  // Close modals on overlay backdrop click or close button click
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay') || e.target.dataset.close) {
        const modalId = e.target.dataset.close || modal.id;
        document.getElementById(modalId).classList.add('hidden');
      }
    });
  });

  // Initial Boot
  initNavbar();
  renderView();
});
