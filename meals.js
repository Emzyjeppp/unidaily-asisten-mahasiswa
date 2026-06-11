/**
 * ==========================================
 * UNIDAILY - MEAL MODULE (meals.js)
 * ==========================================
 */

const MealsModule = (() => {
    // Helper to get namespaced storage keys
    function getKeys() {
        const user = AuthModule.getCurrentUser() || 'guest';
        return {
            LIMIT_KEY: `unidaily_meal_limit_${user}`,
            TODAY_MEALS_KEY: `unidaily_today_meals_${user}`,
            TODAY_DATE_KEY: `unidaily_today_date_${user}`,
            HISTORY_KEY: `unidaily_meals_history_${user}`
        };
    }

    // Get today's date string in local format YYYY-MM-DD
    function getTodayDateString() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Get daily budget limit
    function getDailyLimit() {
        const keys = getKeys();
        const limit = localStorage.getItem(keys.LIMIT_KEY);
        return limit ? parseInt(limit) : 50000; // default 50k IDR
    }

    // Set daily budget limit
    function saveDailyLimit(amount) {
        const keys = getKeys();
        localStorage.setItem(keys.LIMIT_KEY, amount);
    }

    // Get today's meals
    function getTodayMeals() {
        checkAndRotateDate();
        const keys = getKeys();
        const data = localStorage.getItem(keys.TODAY_MEALS_KEY);
        return data ? JSON.parse(data) : [];
    }

    // Save today's meals list
    function saveTodayMeals(meals) {
        const keys = getKeys();
        localStorage.setItem(keys.TODAY_MEALS_KEY, JSON.stringify(meals));
    }

    // Get historical logs
    function getHistoryLogs() {
        const keys = getKeys();
        const data = localStorage.getItem(keys.HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    }

    // Save history logs
    function saveHistoryLogs(history) {
        const keys = getKeys();
        localStorage.setItem(keys.HISTORY_KEY, JSON.stringify(history));
    }

    // Add a new meal expense
    function addMealLog(timeType, name, cost) {
        checkAndRotateDate();
        const meals = getTodayMeals();
        const newMeal = {
            id: 'meal_' + Date.now(),
            timeType, // 'breakfast', 'lunch', 'dinner', 'snack'
            name,
            cost: parseInt(cost)
        };
        meals.push(newMeal);
        saveTodayMeals(meals);
        return newMeal;
    }

    // Delete a meal expense
    function deleteMealLog(id) {
        const meals = getTodayMeals();
        const filtered = meals.filter(m => m.id !== id);
        saveTodayMeals(filtered);
    }

    // Clear today's meals
    function resetTodayMeals() {
        saveTodayMeals([]);
    }

    // Calculate sum of today's meals
    function getTodaySpent() {
        const meals = getTodayMeals();
        return meals.reduce((sum, item) => sum + item.cost, 0);
    }

    // Get remaining budget today
    function getTodayRemaining() {
        const limit = getDailyLimit();
        const spent = getTodaySpent();
        return limit - spent;
    }

    // Get spent breakdown grouped by time type
    function getMealsGroupedByType() {
        const meals = getTodayMeals();
        const groups = {
            breakfast: 0,
            lunch: 0,
            dinner: 0,
            snack: 0
        };
        meals.forEach(m => {
            if (groups.hasOwnProperty(m.timeType)) {
                groups[m.timeType] += m.cost;
            } else {
                groups.snack += m.cost;
            }
        });
        return groups;
    }

    // Generate dynamic suggestions based on remaining budget
    function getMealAdvice() {
        const limit = getDailyLimit();
        const remaining = getTodayRemaining();
        const percentageLeft = (remaining / limit) * 100;

        if (remaining < 0) {
            return {
                title: "Waduh, Anggaran Jebol!",
                text: `Kamu telah melewati batas budget sebesar Rp ${Math.abs(remaining).toLocaleString('id-ID')}. Untuk sisa hari ini, sebaiknya cari makanan gratis di rapat organisasi, masak mie instan di kos, atau minum air putih yang banyak.`,
                statusClass: "danger-budget",
                icon: "🚨"
            };
        } else if (remaining === 0) {
            return {
                title: "Pas-Pasan!",
                text: "Jatah belanjamu hari ini sudah habis tepat Rp 0. Tahan lapar dulu atau cari cemilan gratis di tempat teman!",
                statusClass: "warning-budget",
                icon: "⚠️"
            };
        } else if (remaining < 10000) {
            return {
                title: "Krisis! Dompet Kritis",
                text: `Sisa anggaran Rp ${remaining.toLocaleString('id-ID')}. Pilihan menu aman: Roti indomaret ekonomis, gorengan 2 biji, atau masak indomie telur sendiri di kos.`,
                statusClass: "danger-budget",
                icon: "📉"
            };
        } else if (remaining <= 20000) {
            return {
                title: "Anggaran Menipis, Hemat-Hemat",
                text: `Sisa anggaran Rp ${remaining.toLocaleString('id-ID')}. Rekomendasi makanan: Warteg porsi standar (nasi + telur + sayur), Nasi Jinggo/Kucing, atau bubur ayam pinggir jalan.`,
                statusClass: "warning-budget",
                icon: "💸"
            };
        } else if (remaining <= 40000) {
            return {
                title: "Anggaran Sedang, Pilihan Menengah",
                text: `Sisa anggaran Rp ${remaining.toLocaleString('id-ID')}. Kamu bisa beli Nasi Padang (lauk ayam), bakso urat, mi ayam pangsit lengkap, atau ayam geprek level ekstra.`,
                statusClass: "success-budget",
                icon: "🍗"
            };
        } else {
            return {
                title: "Anggaran Aman & Makmur!",
                text: `Sisa anggaran Rp ${remaining.toLocaleString('id-ID')}. Bebas memilih makanan kesukaanmu! Kamu bisa makan di cafe, pesan makanan online, atau beli steak ayam porsi lengkap.`,
                statusClass: "success-budget",
                icon: "✨"
            };
        }
    }

    // Shift today's data to history if day has changed
    function checkAndRotateDate() {
        const todayStr = getTodayDateString();
        const keys = getKeys();
        const savedDate = localStorage.getItem(keys.TODAY_DATE_KEY);

        if (!savedDate) {
            localStorage.setItem(keys.TODAY_DATE_KEY, todayStr);
            return;
        }

        if (savedDate !== todayStr) {
            // Day has changed! Shift today's meals to history
            const todayMeals = JSON.parse(localStorage.getItem(keys.TODAY_MEALS_KEY) || '[]');
            
            if (todayMeals.length > 0) {
                const limit = getDailyLimit();
                const spent = todayMeals.reduce((sum, item) => sum + item.cost, 0);
                const history = getHistoryLogs();
                
                // Add to history at the beginning
                history.unshift({
                    date: savedDate,
                    limit: limit,
                    spent: spent,
                    meals: todayMeals
                });

                // Keep only last 14 days of history
                if (history.length > 14) {
                    history.pop();
                }

                saveHistoryLogs(history);
            }

            // Reset today's meals and set current date
            saveTodayMeals([]);
            localStorage.setItem(keys.TODAY_DATE_KEY, todayStr);
        }
    }

    // Seed dummy demo meal data
    function loadDemoMeals() {
        // Today's meals: breakfast + lunch
        const demoToday = [
            {
                id: 'demo_meal_1',
                timeType: 'breakfast',
                name: 'Bubur Ayam Jakarta & Teh Hangat',
                cost: 12000
            },
            {
                id: 'demo_meal_2',
                timeType: 'lunch',
                name: 'Nasi Padang (Lauk Rendang + Perkedel)',
                cost: 23000
            }
        ];
        saveTodayMeals(demoToday);

        // Previous days history
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });

        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const twoDaysAgoStr = twoDaysAgo.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });

        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const threeDaysAgoStr = threeDaysAgo.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });

        const demoHistory = [
            {
                date: yesterdayStr,
                limit: 50000,
                spent: 55000, // Over budget!
                meals: [
                    { name: 'Ketoprak Telur', cost: 13000 },
                    { name: 'Nasi Ayam Geprek Keju', cost: 22000 },
                    { name: 'Kopi Susu Gula Aren Cafe', cost: 20000 }
                ]
            },
            {
                date: twoDaysAgoStr,
                limit: 50000,
                spent: 42000, // Under budget
                meals: [
                    { name: 'Nasi Uduk Komplit', cost: 10000 },
                    { name: 'Mie Ayam Bakso', cost: 17000 },
                    { name: 'Sate Ayam 10 Tusuk', cost: 15000 }
                ]
            },
            {
                date: threeDaysAgoStr,
                limit: 50000,
                spent: 31000, // Safe
                meals: [
                    { name: 'Roti Bakar & Kopi Kos', cost: 8000 },
                    { name: 'Nasi Telur Sayur Warteg', cost: 11000 },
                    { name: 'Warmindo Indomie Rebus', cost: 12000 }
                ]
            }
        ];

        // Store standard history
        const keys = getKeys();
        localStorage.setItem(keys.HISTORY_KEY, JSON.stringify(demoHistory));
    }

    return {
        getDailyLimit,
        saveDailyLimit,
        getTodayMeals,
        addMealLog,
        deleteMealLog,
        resetTodayMeals,
        getTodaySpent,
        getTodayRemaining,
        getMealsGroupedByType,
        getMealAdvice,
        getHistoryLogs,
        checkAndRotateDate,
        loadDemoMeals
    };
})();
