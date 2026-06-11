/**
 * ==========================================
 * UNIDAILY - MAIN CONTROLLER (app.js)
 * ==========================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // Current application state
    const state = {
        currentTab: 'dashboard',
        selectedScheduleDay: 1, // 1: Senin, ..., 6: Sabtu
        editingClassId: null // store id when editing class
    };

    // DOM Elements
    const elements = {
        // Auth Elements
        authContainer: document.getElementById('auth-container'),
        tabLoginBtn: document.getElementById('tab-login-btn'),
        tabRegisterBtn: document.getElementById('tab-register-btn'),
        formLogin: document.getElementById('form-login'),
        formRegister: document.getElementById('form-register'),
        loginUsername: document.getElementById('login-username'),
        loginPassword: document.getElementById('login-password'),
        registerUsername: document.getElementById('register-username'),
        registerName: document.getElementById('register-name'),
        registerPassword: document.getElementById('register-password'),
        btnLogout: document.getElementById('btn-logout'),

        // Nav items
        navItems: document.querySelectorAll('.nav-item:not(.btn-logout)'),
        tabPanes: document.querySelectorAll('.tab-pane'),
        
        // Header
        welcomeText: document.getElementById('welcome-text'),
        liveDate: document.getElementById('live-date'),
        liveClock: document.getElementById('live-clock'),
        displayUserName: document.getElementById('display-user-name'),
        userAvatar: document.getElementById('user-avatar'),

        // Dashboard Tab Elements
        countdownBadge: document.getElementById('countdown-badge'),
        nextClassContainer: document.getElementById('next-class-container'),
        budgetPercentage: document.getElementById('budget-percentage'),
        budgetProgressCircle: document.getElementById('budget-progress-circle'),
        dashBudgetLimit: document.getElementById('dash-budget-limit'),
        dashBudgetRemaining: document.getElementById('dash-budget-remaining'),
        budgetAdviceCard: document.getElementById('budget-advice-card'),
        adviceIcon: document.getElementById('advice-icon'),
        adviceTitle: document.getElementById('advice-title'),
        adviceText: document.getElementById('advice-text'),
        todayClassesList: document.getElementById('today-classes-list'),
        btnQuickMeal: document.getElementById('btn-quick-meal'),
        btnViewAllSchedule: document.getElementById('btn-view-all-schedule'),

        // Schedule Tab Elements
        scheduleDayPills: document.getElementById('schedule-day-pills'),
        classesListContainer: document.getElementById('classes-list-container'),
        btnAddClass: document.getElementById('btn-add-class'),

        // Meals Tab Elements
        mealSpentBreakfast: document.getElementById('meal-spent-breakfast'),
        mealSpentLunch: document.getElementById('meal-spent-lunch'),
        mealSpentDinner: document.getElementById('meal-spent-dinner'),
        mealSpentSnack: document.getElementById('meal-spent-snack'),
        inputDailyBudget: document.getElementById('input-daily-budget'),
        btnSaveDailyBudget: document.getElementById('btn-save-daily-budget'),
        btnAddMealExpense: document.getElementById('btn-add-meal-expense'),
        btnResetTodayMeals: document.getElementById('btn-reset-today-meals'),
        todayMealsLogs: document.getElementById('today-meals-logs'),
        historyMealsLogs: document.getElementById('history-meals-logs'),

        // Settings Tab Elements
        formSettingsProfile: document.getElementById('form-settings-profile'),
        settingsUserName: document.getElementById('settings-user-name'),
        settingsDailyLimit: document.getElementById('settings-daily-limit'),
        btnLoadDemoData: document.getElementById('btn-load-demo-data'),
        btnResetAll: document.getElementById('btn-reset-all'),

        // Modal Class
        modalClass: document.getElementById('modal-class'),
        modalClassTitle: document.getElementById('modal-class-title'),
        formClass: document.getElementById('form-class'),
        classId: document.getElementById('class-id'),
        className: document.getElementById('class-name'),
        classDay: document.getElementById('class-day'),
        classRoom: document.getElementById('class-room'),
        classStart: document.getElementById('class-start'),
        classEnd: document.getElementById('class-end'),
        classLecturer: document.getElementById('class-lecturer'),
        classNotes: document.getElementById('class-notes'),
        btnCloseClassModal: document.getElementById('btn-close-class-modal'),
        btnCancelClass: document.getElementById('btn-cancel-class'),

        // Modal Meal
        modalMeal: document.getElementById('modal-meal'),
        formMeal: document.getElementById('form-meal'),
        mealTimeType: document.getElementById('meal-time-type'),
        mealName: document.getElementById('meal-name'),
        mealCost: document.getElementById('meal-cost'),
        btnCloseMealModal: document.getElementById('btn-close-meal-modal'),
        btnCancelMeal: document.getElementById('btn-cancel-meal')
    };

    // ==========================================
    // INITIALIZATION & TIMERS
    // ==========================================

    function init() {
        // 1. Check Authentication Gate
        if (!AuthModule.isLoggedIn()) {
            // Display login overlay and hide main workspace
            elements.authContainer.classList.add('active');
            document.querySelector('.app-container').style.display = 'none';
            setupAuthEventListeners();
            return;
        }

        // 2. Hide auth gateway and show main workspace
        elements.authContainer.classList.remove('active');
        document.querySelector('.app-container').style.display = '';

        // 3. Check date and rotate food logs if needed
        MealsModule.checkAndRotateDate();

        // 4. Load User Profile
        loadUserProfile();

        // 5. Set Schedule Day Pill based on Current Day (Senin-Sabtu)
        const todayJS = new Date().getDay(); // 0 is Sunday, 1 is Monday...
        state.selectedScheduleDay = todayJS === 0 ? 1 : todayJS; // default Sunday to Monday
        updateDayPillsUI();

        // 6. Set live clocks and date
        startClock();
        updateDateDisplay();

        // 7. Setup Event Listeners
        setupEventListeners();

        // 8. Initial render of all tabs
        renderApp();
    }

    // Live clock updater
    function startClock() {
        const updateClock = () => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            elements.liveClock.textContent = `${hours}:${minutes}`;
        };
        updateClock();
        setInterval(updateClock, 1000); // update every second
    }

    // Display formatted Indonesian date
    function updateDateDisplay() {
        const now = new Date();
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        elements.liveDate.textContent = now.toLocaleDateString('id-ID', options);
    }

    // Load user configuration
    function loadUserProfile() {
        const currentName = AuthModule.getCurrentUserName();
        elements.displayUserName.textContent = currentName;
        elements.userAvatar.textContent = currentName.charAt(0).toUpperCase();
        
        // Welcome text greeting hourly-based
        const hour = new Date().getHours();
        let greeting = 'Selamat Malam';
        if (hour < 11) greeting = 'Selamat Pagi';
        else if (hour < 15) greeting = 'Selamat Siang';
        else if (hour < 19) greeting = 'Selamat Sore';

        elements.welcomeText.textContent = `Halo ${currentName}, ${greeting}!`;
        
        // Populate settings form
        elements.settingsUserName.value = currentName;
        elements.settingsDailyLimit.value = MealsModule.getDailyLimit();
        elements.inputDailyBudget.value = MealsModule.getDailyLimit();
    }

    // ==========================================
    // RENDERING FUNCTIONS
    // ==========================================

    function renderApp() {
        renderDashboard();
        renderSchedule();
        renderMeals();
    }

    // 1. Dashboard Tab Render
    function renderDashboard() {
        // -- Next Class Section
        const nextClassInfo = ScheduleModule.getNextClassInfo();
        if (nextClassInfo) {
            elements.countdownBadge.style.display = 'inline-block';
            
            // Set style badge based on class type
            if (nextClassInfo.type === 'ongoing') {
                elements.countdownBadge.textContent = 'Sedang Berlangsung';
                elements.countdownBadge.className = 'badge warning';
            } else if (nextClassInfo.type === 'upcoming') {
                elements.countdownBadge.textContent = nextClassInfo.timeRemainingStr;
                elements.countdownBadge.className = 'badge success';
            } else {
                elements.countdownBadge.textContent = 'Mendatang';
                elements.countdownBadge.className = 'badge';
            }

            const c = nextClassInfo.class;
            const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
            const classDayName = dayNames[c.day];
            
            elements.nextClassContainer.innerHTML = `
                <div class="next-class-card">
                    <div class="next-class-subject">${c.name}</div>
                    <div class="next-class-meta">
                        <div class="meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            <span>${classDayName}, ${c.start} - ${c.end}</span>
                        </div>
                        <div class="meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            <span>${c.room}</span>
                        </div>
                        ${c.lecturer ? `
                        <div class="meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            <span>${c.lecturer}</span>
                        </div>` : ''}
                    </div>
                    ${c.notes ? `<div class="next-class-reminders"><strong>Catatan:</strong> ${c.notes}</div>` : ''}
                </div>
            `;
        } else {
            elements.countdownBadge.style.display = 'none';
            elements.nextClassContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎓</div>
                    <h3>Semua Kelas Selesai!</h3>
                    <p>Tidak ada jadwal kuliah terdekat yang terdaftar.</p>
                </div>
            `;
        }

        // -- Meal Budget Progress Circle
        const dailyLimit = MealsModule.getDailyLimit();
        const spent = MealsModule.getTodaySpent();
        const remaining = MealsModule.getTodayRemaining();
        const percent = dailyLimit > 0 ? Math.round((spent / dailyLimit) * 100) : 0;

        elements.dashBudgetLimit.textContent = `Rp ${dailyLimit.toLocaleString('id-ID')}`;
        elements.dashBudgetRemaining.textContent = `Rp ${remaining.toLocaleString('id-ID')}`;

        // Color and wording styles for negative budget
        const statRemainingBox = elements.dashBudgetRemaining.closest('.stat-box');
        if (remaining < 0) {
            statRemainingBox.className = "stat-box danger";
        } else {
            statRemainingBox.className = "stat-box highlight";
        }

        elements.budgetPercentage.textContent = `${percent}%`;

        // Update progress ring SVG
        const radius = elements.budgetProgressCircle.r.baseVal.value;
        const circumference = 2 * Math.PI * radius; // 439.8
        elements.budgetProgressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
        
        // Clamp percentage for graphic rendering, but keep actual text
        const clampedPercent = Math.min(percent, 100);
        const offset = circumference - (clampedPercent / 100) * circumference;
        elements.budgetProgressCircle.style.strokeDashoffset = offset;

        // Change gradient coloring depending on over-spending
        if (percent > 100) {
            elements.budgetProgressCircle.setAttribute('stroke', 'url(#budget-gradient-warning)');
        } else {
            elements.budgetProgressCircle.setAttribute('stroke', 'url(#budget-gradient)');
        }

        // -- Food Suggestion / Advice
        const advice = MealsModule.getMealAdvice();
        elements.budgetAdviceCard.className = `advice-card ${advice.statusClass}`;
        elements.adviceIcon.textContent = advice.icon;
        elements.adviceTitle.textContent = advice.title;
        elements.adviceText.textContent = advice.text;

        // -- Today's Agenda list
        const todayJS = new Date().getDay();
        const todayAcademicDay = todayJS === 0 ? 7 : todayJS; // 1 (Monday) to 7 (Sunday)
        const todayClasses = ScheduleModule.getClassesByDay(todayAcademicDay);
        
        if (todayClasses.length > 0) {
            elements.todayClassesList.innerHTML = todayClasses.map(c => `
                <div class="timeline-item">
                    <div class="timeline-time-col">
                        <span class="timeline-time">${c.start}</span>
                        <span class="timeline-duration">${c.end}</span>
                    </div>
                    <div class="timeline-subject-col">
                        <span class="timeline-subject">${c.name}</span>
                        <div class="timeline-room">${c.room}</div>
                    </div>
                    <div>
                        <span class="badge success">Terdaftar</span>
                    </div>
                </div>
            `).join('');
        } else {
            elements.todayClassesList.innerHTML = `
                <div class="empty-state">
                    <p>Santai sejenak! Tidak ada kelas kuliah terjadwal untuk hari ini.</p>
                </div>
            `;
        }
    }

    // 2. Schedule Tab Render
    function renderSchedule() {
        const classes = ScheduleModule.getClassesByDay(state.selectedScheduleDay);
        
        if (classes.length > 0) {
            elements.classesListContainer.innerHTML = classes.map(c => `
                <div class="class-card">
                    <div class="class-time">
                        <span class="class-time-range">${c.start}</span>
                        <span class="timeline-duration">${c.end}</span>
                    </div>
                    <div class="class-card-details">
                        <h4>${c.name}</h4>
                        <div class="class-card-meta">
                            <span class="meta-item">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                Ruang: ${c.room}
                            </span>
                            ${c.lecturer ? `
                            <span class="meta-item">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                Dosen: ${c.lecturer}
                            </span>` : ''}
                        </div>
                        ${c.notes ? `<div class="next-class-reminders mt-2" style="font-size:0.8rem">${c.notes}</div>` : ''}
                    </div>
                    <div class="class-card-actions">
                        <button class="btn-icon btn-edit-class" data-id="${c.id}" title="Edit Kelas">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn-icon delete btn-delete-class" data-id="${c.id}" title="Hapus Kelas">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>
                </div>
            `).join('');

            // Bind events to generated buttons
            document.querySelectorAll('.btn-edit-class').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    openEditClassModal(id);
                });
            });

            document.querySelectorAll('.btn-delete-class').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    if (confirm('Apakah kamu yakin ingin menghapus kelas ini dari jadwal?')) {
                        ScheduleModule.deleteClass(id);
                        renderApp();
                    }
                });
            });

        } else {
            elements.classesListContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📅</div>
                    <h3>Hari Bebas Kuliah</h3>
                    <p>Tidak ada kelas terdaftar untuk hari ini. Waktunya ngerjain tugas atau istirahat!</p>
                </div>
            `;
        }
    }

    // Helper to get time icons
    function getMealTypeIcon(type) {
        switch(type) {
            case 'breakfast': return '🍳';
            case 'lunch': return '🍚';
            case 'dinner': return '🍜';
            case 'snack': return '🥤';
            default: return '🍔';
        }
    }

    // Helper to translate meal type names
    function getMealTypeName(type) {
        switch(type) {
            case 'breakfast': return 'Sarapan';
            case 'lunch': return 'Makan Siang';
            case 'dinner': return 'Makan Malam';
            case 'snack': return 'Cemilan/Lainnya';
            default: return 'Lainnya';
        }
    }

    // 3. Meals Tab Render
    function renderMeals() {
        // Group breakdown
        const groups = MealsModule.getMealsGroupedByType();
        elements.mealSpentBreakfast.textContent = `Rp ${groups.breakfast.toLocaleString('id-ID')}`;
        elements.mealSpentLunch.textContent = `Rp ${groups.lunch.toLocaleString('id-ID')}`;
        elements.mealSpentDinner.textContent = `Rp ${groups.dinner.toLocaleString('id-ID')}`;
        elements.mealSpentSnack.textContent = `Rp ${groups.snack.toLocaleString('id-ID')}`;

        // Today's logs
        const todayMeals = MealsModule.getTodayMeals();
        if (todayMeals.length > 0) {
            elements.todayMealsLogs.innerHTML = todayMeals.map(m => `
                <div class="meal-log-item">
                    <div class="meal-log-icon">${getMealTypeIcon(m.timeType)}</div>
                    <div class="meal-log-details">
                        <h4>${m.name}</h4>
                        <span class="meal-tag">${getMealTypeName(m.timeType)}</span>
                    </div>
                    <div class="meal-log-cost">Rp ${m.cost.toLocaleString('id-ID')}</div>
                    <button class="btn-icon delete btn-delete-meal" data-id="${m.id}" title="Hapus Catatan">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `).join('');

            // Bind events for delete meal buttons
            document.querySelectorAll('.btn-delete-meal').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    if (confirm('Hapus catatan pengeluaran makan ini?')) {
                        MealsModule.deleteMealLog(id);
                        renderApp();
                    }
                });
            });
        } else {
            elements.todayMealsLogs.innerHTML = `
                <div class="empty-state">
                    <p>Belum ada pengeluaran makan dicatat hari ini.</p>
                </div>
            `;
        }

        // History logs
        const history = MealsModule.getHistoryLogs();
        if (history.length > 0) {
            elements.historyMealsLogs.innerHTML = history.map(day => {
                const limit = day.limit || 50000;
                const isOver = day.spent > limit;
                
                return `
                    <div class="history-day-item">
                        <div class="history-day-header">
                            <span class="history-day-date">${day.date}</span>
                            <span class="history-day-total ${isOver ? 'over-budget' : ''}">
                                Total: Rp ${day.spent.toLocaleString('id-ID')} / Rp ${limit.toLocaleString('id-ID')}
                            </span>
                        </div>
                        <div class="history-day-meals">
                            ${day.meals.map(m => `
                                <div class="history-meal-row">
                                    <span>${getMealTypeIcon(m.timeType)} ${m.name}</span>
                                    <span>Rp ${m.cost.toLocaleString('id-ID')}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            elements.historyMealsLogs.innerHTML = `
                <div class="empty-state">
                    <p>Belum ada data riwayat hari-hari sebelumnya.</p>
                </div>
            `;
        }
    }

    // ==========================================
    // INTERACTION & EVENTS HANDLING
    // ==========================================

    function setupEventListeners() {
        // Tab switching
        elements.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const targetTab = e.currentTarget.getAttribute('data-tab');
                switchTab(targetTab);
            });
        });

        // Logout action
        elements.btnLogout.addEventListener('click', () => {
            if (confirm('Apakah Anda yakin ingin keluar dari akun?')) {
                AuthModule.logout();
                location.reload();
            }
        });

        // Quick action: View schedule from dashboard
        if (elements.btnViewAllSchedule) {
            elements.btnViewAllSchedule.addEventListener('click', () => {
                switchTab('schedule');
            });
        }

        // Quick action: Log meal from dashboard
        if (elements.btnQuickMeal) {
            elements.btnQuickMeal.addEventListener('click', openMealModal);
        }

        // Day Selector Pills (Schedule Tab)
        const pills = elements.scheduleDayPills.querySelectorAll('.day-pill');
        pills.forEach(pill => {
            pill.addEventListener('click', (e) => {
                pills.forEach(p => p.classList.remove('active'));
                e.currentTarget.classList.add('active');
                state.selectedScheduleDay = parseInt(e.currentTarget.getAttribute('data-day'));
                renderSchedule();
            });
        });

        // Add class modal buttons
        elements.btnAddClass.addEventListener('click', openAddClassModal);
        elements.btnCloseClassModal.addEventListener('click', closeClassModal);
        elements.btnCancelClass.addEventListener('click', closeClassModal);

        // Save class form submit
        elements.formClass.addEventListener('submit', handleClassFormSubmit);

        // Budget settings Quick Save (Meals Tab)
        elements.btnSaveDailyBudget.addEventListener('click', () => {
            const val = parseInt(elements.inputDailyBudget.value);
            if (val && val >= 1000) {
                MealsModule.saveDailyLimit(val);
                elements.settingsDailyLimit.value = val;
                alert(`Batas anggaran harian disimpan: Rp ${val.toLocaleString('id-ID')}`);
                renderApp();
            } else {
                alert('Tolong masukkan angka anggaran harian yang valid!');
            }
        });

        // Add meal modal buttons
        elements.btnAddMealExpense.addEventListener('click', openMealModal);
        elements.btnCloseMealModal.addEventListener('click', closeMealModal);
        elements.btnCancelMeal.addEventListener('click', closeMealModal);

        // Save meal form submit
        elements.formMeal.addEventListener('submit', handleMealFormSubmit);

        // Reset today's meals log button
        elements.btnResetTodayMeals.addEventListener('click', () => {
            if (confirm('Apakah kamu yakin ingin mengosongkan seluruh riwayat makan hari ini?')) {
                MealsModule.resetTodayMeals();
                renderApp();
            }
        });

        // Save profile settings form
        elements.formSettingsProfile.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameVal = elements.settingsUserName.value.trim();
            const limitVal = parseInt(elements.settingsDailyLimit.value);

            if (nameVal) {
                // Update in User DB
                const db = JSON.parse(localStorage.getItem('unidaily_users_db') || '{}');
                const currentUser = AuthModule.getCurrentUser();
                if (db[currentUser]) {
                    db[currentUser].name = nameVal;
                    localStorage.setItem('unidaily_users_db', JSON.stringify(db));
                }
            }

            if (limitVal && limitVal >= 1000) {
                MealsModule.saveDailyLimit(limitVal);
                elements.inputDailyBudget.value = limitVal;
            }

            loadUserProfile();
            renderApp();
            alert('Profil mahasiswa berhasil disimpan!');
            switchTab('dashboard');
        });

        // Danger zone: Demo Data Loading
        elements.btnLoadDemoData.addEventListener('click', () => {
            if (confirm('Isi data demo akan menimpa seluruh jadwal kuliah dan jatah makanmu yang sekarang. Lanjutkan?')) {
                // Seed
                ScheduleModule.loadDemoSchedule();
                MealsModule.loadDemoMeals();
                
                // Reload profile and view
                loadUserProfile();
                renderApp();
                
                alert('Jadwal kuliah & simulasi riwayat makan berhasil dimuat!');
                switchTab('dashboard');
            }
        });

        // Danger zone: Reset all data (User-namespace only)
        elements.btnResetAll.addEventListener('click', () => {
            if (confirm('PERINGATAN: Tindakan ini akan menghapus seluruh data jadwal kuliah dan budget makan akun Anda selamanya. Apakah Anda yakin?')) {
                const user = AuthModule.getCurrentUser();
                localStorage.removeItem(`unidaily_schedule_${user}`);
                localStorage.removeItem(`unidaily_initialized_${user}`);
                localStorage.removeItem(`unidaily_meal_limit_${user}`);
                localStorage.removeItem(`unidaily_today_meals_${user}`);
                localStorage.removeItem(`unidaily_today_date_${user}`);
                localStorage.removeItem(`unidaily_meals_history_${user}`);
                location.reload();
            }
        });
    }

    // ==========================================
    // AUTHENTICATION STATE & EVENTS
    // ==========================================

    function setupAuthEventListeners() {
        // Tab switching inside Auth Card
        elements.tabLoginBtn.addEventListener('click', () => {
            elements.tabLoginBtn.classList.add('active');
            elements.tabRegisterBtn.classList.remove('active');
            elements.formLogin.classList.add('active');
            elements.formRegister.classList.remove('active');
        });

        elements.tabRegisterBtn.addEventListener('click', () => {
            elements.tabRegisterBtn.classList.add('active');
            elements.tabLoginBtn.classList.remove('active');
            elements.formRegister.classList.add('active');
            elements.formLogin.classList.remove('active');
        });

        // Handle Login Submission
        elements.formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = elements.loginUsername.value;
            const password = elements.loginPassword.value;

            try {
                AuthModule.login(username, password);
                init(); // Re-trigger initialization
            } catch (err) {
                alert(`Gagal Masuk: ${err.message}`);
            }
        });

        // Handle Register Submission
        elements.formRegister.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = elements.registerUsername.value;
            const name = elements.registerName.value;
            const password = elements.registerPassword.value;

            try {
                AuthModule.register(username, name, password);
                alert('Pendaftaran berhasil! Selamat datang.');
                init(); // Re-trigger initialization
            } catch (err) {
                alert(`Gagal Mendaftar: ${err.message}`);
            }
        });
    }

    // Tab switcher helper
    function switchTab(tabName) {
        state.currentTab = tabName;
        
        // Update nav buttons
        elements.navItems.forEach(item => {
            if (item.getAttribute('data-tab') === tabName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Update tabs visibility
        elements.tabPanes.forEach(pane => {
            if (pane.id === `tab-${tabName}`) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });

        // Render tab specific modifications
        if (tabName === 'dashboard') {
            renderDashboard();
        } else if (tabName === 'schedule') {
            renderSchedule();
        } else if (tabName === 'meals') {
            renderMeals();
        }
    }

    // Select specific day in UI programmatically
    function updateDayPillsUI() {
        const pills = elements.scheduleDayPills.querySelectorAll('.day-pill');
        pills.forEach(pill => {
            if (parseInt(pill.getAttribute('data-day')) === state.selectedScheduleDay) {
                pill.classList.add('active');
            } else {
                pill.classList.remove('active');
            }
        });
    }

    // ==========================================
    // MODAL CONTROL ACTIONS
    // ==========================================

    // Open Modal: Add Class
    function openAddClassModal() {
        state.editingClassId = null;
        elements.modalClassTitle.textContent = 'Tambah Jadwal Kelas';
        elements.formClass.reset();
        elements.classId.value = '';
        elements.classDay.value = state.selectedScheduleDay; // default to currently viewed day
        elements.modalClass.classList.add('open');
    }

    // Open Modal: Edit Class
    function openEditClassModal(id) {
        const classes = ScheduleModule.getClasses();
        const c = classes.find(item => item.id === id);
        
        if (c) {
            state.editingClassId = id;
            elements.modalClassTitle.textContent = 'Edit Jadwal Kelas';
            
            elements.classId.value = c.id;
            elements.className.value = c.name;
            elements.classDay.value = c.day;
            elements.classRoom.value = c.room;
            elements.classStart.value = c.start;
            elements.classEnd.value = c.end;
            elements.classLecturer.value = c.lecturer;
            elements.classNotes.value = c.notes;
            
            elements.modalClass.classList.add('open');
        }
    }

    // Close Class Modal
    function closeClassModal() {
        elements.modalClass.classList.remove('open');
        state.editingClassId = null;
    }

    // Submit Handler: Class Form
    function handleClassFormSubmit(e) {
        e.preventDefault();
        
        const classData = {
            name: elements.className.value.trim(),
            day: elements.classDay.value,
            room: elements.classRoom.value.trim(),
            start: elements.classStart.value,
            end: elements.classEnd.value,
            lecturer: elements.classLecturer.value.trim(),
            notes: elements.classNotes.value.trim()
        };

        // Validate time
        if (classData.start >= classData.end) {
            alert('Jam mulai kelas harus lebih awal dari jam selesai!');
            return;
        }

        if (state.editingClassId) {
            // Update mode
            ScheduleModule.updateClass(state.editingClassId, classData);
        } else {
            // Create mode
            ScheduleModule.addClass(classData);
        }

        closeClassModal();
        
        // Sync viewed schedule day to the added class day
        state.selectedScheduleDay = parseInt(classData.day);
        updateDayPillsUI();
        
        renderApp();
    }

    // Open Modal: Meal Expense
    function openMealModal() {
        elements.formMeal.reset();
        
        // Guess the meal slot based on current local hour
        const hour = new Date().getHours();
        if (hour < 10) {
            elements.mealTimeType.value = 'breakfast';
        } else if (hour < 15) {
            elements.mealTimeType.value = 'lunch';
        } else if (hour < 19) {
            elements.mealTimeType.value = 'dinner';
        } else {
            elements.mealTimeType.value = 'snack';
        }

        elements.modalMeal.classList.add('open');
    }

    // Close Meal Modal
    function closeMealModal() {
        elements.modalMeal.classList.remove('open');
    }

    // Submit Handler: Meal Form
    function handleMealFormSubmit(e) {
        e.preventDefault();
        
        const type = elements.mealTimeType.value;
        const name = elements.mealName.value.trim();
        const cost = parseInt(elements.mealCost.value);

        if (name && cost > 0) {
            MealsModule.addMealLog(type, name, cost);
            closeMealModal();
            renderApp();
        } else {
            alert('Tolong lengkapi nama makanan dan harganya dengan benar.');
        }
    }

    // Start everything
    init();
});
