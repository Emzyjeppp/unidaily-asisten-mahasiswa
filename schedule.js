/**
 * ==========================================
 * UNIDAILY - SCHEDULE MODULE (schedule.js)
 * ==========================================
 */

const ScheduleModule = (() => {
    function getStorageKey() {
        const user = AuthModule.getCurrentUser() || 'guest';
        return `unidaily_schedule_${user}`;
    }

    function getInitKey() {
        const user = AuthModule.getCurrentUser() || 'guest';
        return `unidaily_initialized_${user}`;
    }

    // Default classes list from user's schedule sheet
    const defaultClasses = [
        {
            id: 'real_1',
            name: 'Interaksi Manusia dan Komputer',
            day: 1, // Senin
            start: '10:00',
            end: '12:30',
            room: 'U.2.3',
            lecturer: 'Pius Dian Widi Anggoro, S.Si., M.Cs.',
            notes: 'Mata Kuliah Wajib'
        },
        {
            id: 'real_2',
            name: 'Praktikum Keamanan Sistem dan Kriptografi',
            day: 2, // Selasa
            start: '10:00',
            end: '12:00',
            room: 'LAB. SI',
            lecturer: 'Yudhi Kusnanto, S.T., M.T.',
            notes: 'Praktikum'
        },
        {
            id: 'real_3',
            name: 'Jaringan Nirkabel',
            day: 2, // Selasa
            start: '13:00',
            end: '14:40',
            room: 'T.3.3',
            lecturer: 'Danny Kriestanto, S.Kom, M.Eng.',
            notes: 'Mata Kuliah Wajib'
        },
        {
            id: 'real_4',
            name: 'Matematika Komputasi',
            day: 3, // Rabu
            start: '08:00',
            end: '09:40',
            room: 'T.3.3',
            lecturer: 'Ilham Rais Arvianto, S.Pd., M.Pd.',
            notes: 'Mata Kuliah Wajib'
        },
        {
            id: 'real_5',
            name: 'Praktikum Statistika',
            day: 3, // Rabu
            start: '13:00',
            end: '15:00',
            room: 'LAB. MR',
            lecturer: 'Erna Hudianti P., S.Si., M.Si.',
            notes: 'Praktikum'
        },
        {
            id: 'real_6',
            name: 'Metode Numerik',
            day: 4, // Kamis
            start: '08:00',
            end: '09:40',
            room: 'T.3.2',
            lecturer: 'Erna Hudianti P., S.Si., M.Si.',
            notes: 'Mata Kuliah Wajib'
        },
        {
            id: 'real_7',
            name: 'Teori Bahasa dan Otomata',
            day: 4, // Kamis
            start: '10:00',
            end: '12:30',
            room: 'S.2.2',
            lecturer: 'Febri Nova Lenti, S.Si., M.T.',
            notes: 'Mata Kuliah Wajib'
        },
        {
            id: 'real_8',
            name: 'Praktikum Visualisasi Data',
            day: 4, // Kamis
            start: '17:00',
            end: '18:30',
            room: 'LAB. MR',
            lecturer: 'Bagas Triaji, S.Kom., M.Kom.',
            notes: 'Praktikum'
        }
    ];

    // Fetch all classes from localStorage
    function getClasses() {
        const data = localStorage.getItem(getStorageKey());
        const initialized = localStorage.getItem(getInitKey());
        const currentUser = AuthModule.getCurrentUser() || 'guest';
        
        if (!data && !initialized) {
            // Seed defaultClasses only for username 'jeppp'
            if (currentUser === 'jeppp') {
                saveClasses(defaultClasses);
                localStorage.setItem(getInitKey(), 'true');
                return defaultClasses;
            } else {
                saveClasses([]);
                localStorage.setItem(getInitKey(), 'true');
                return [];
            }
        }
        return data ? JSON.parse(data) : [];
    }

    // Save classes list to localStorage
    function saveClasses(classes) {
        localStorage.setItem(getStorageKey(), JSON.stringify(classes));
    }

    // Helper to sort classes by start time
    function sortClasses(classesList) {
        return classesList.sort((a, b) => {
            return a.start.localeCompare(b.start);
        });
    }

    // Add a new class schedule
    function addClass(classData) {
        const classes = getClasses();
        const newClass = {
            id: 'class_' + Date.now(),
            name: classData.name,
            day: parseInt(classData.day), // 1-6 (Monday-Saturday)
            start: classData.start,       // "HH:MM"
            end: classData.end,           // "HH:MM"
            room: classData.room,
            lecturer: classData.lecturer || '',
            notes: classData.notes || ''
        };
        classes.push(newClass);
        saveClasses(classes);
        return newClass;
    }

    // Update an existing class schedule
    function updateClass(id, updatedData) {
        let classes = getClasses();
        const index = classes.findIndex(c => c.id === id);
        if (index !== -1) {
            classes[index] = {
                ...classes[index],
                name: updatedData.name,
                day: parseInt(updatedData.day),
                start: updatedData.start,
                end: updatedData.end,
                room: updatedData.room,
                lecturer: updatedData.lecturer || '',
                notes: updatedData.notes || ''
            };
            saveClasses(classes);
            return classes[index];
        }
        return null;
    }

    // Delete a class schedule
    function deleteClass(id) {
        let classes = getClasses();
        classes = classes.filter(c => c.id !== id);
        saveClasses(classes);
    }

    // Get classes for a specific day (1-6)
    function getClassesByDay(dayNum) {
        const classes = getClasses();
        const filtered = classes.filter(c => c.day === parseInt(dayNum));
        return sortClasses(filtered);
    }

    // Convert HH:MM to minutes from midnight
    function timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // Find the next class countdown information
    function getNextClassInfo() {
        const now = new Date();
        // JavaScript Date: Sunday = 0, Monday = 1, ..., Saturday = 6
        let currentDayJS = now.getDay();
        
        // Map JS Sunday(0) to 7, but college classes are Monday(1)-Saturday(6)
        // If Sunday, next classes are on Monday (day 1)
        let dayToCheck = currentDayJS === 0 ? 1 : currentDayJS;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        const classes = getClasses();
        if (classes.length === 0) return null;

        // Try to find a class today that hasn't started yet, or is currently ongoing
        let todayClasses = classes.filter(c => c.day === dayToCheck);
        
        // Sort today's classes
        todayClasses = sortClasses(todayClasses);
        
        // 1. Check for upcoming class today
        const upcomingToday = todayClasses.find(c => timeToMinutes(c.start) > currentMinutes);
        if (upcomingToday) {
            const diffMin = timeToMinutes(upcomingToday.start) - currentMinutes;
            return {
                class: upcomingToday,
                type: 'upcoming',
                timeRemainingStr: formatTimeRemaining(diffMin),
                diffMinutes: diffMin,
                isToday: true
            };
        }

        // 2. Check if a class is currently ONGOING
        const ongoingToday = todayClasses.find(c => {
            const startMin = timeToMinutes(c.start);
            const endMin = timeToMinutes(c.end);
            return currentMinutes >= startMin && currentMinutes <= endMin;
        });
        if (ongoingToday) {
            return {
                class: ongoingToday,
                type: 'ongoing',
                timeRemainingStr: 'Sedang Berlangsung',
                diffMinutes: 0,
                isToday: true
            };
        }

        // 3. Find next class on subsequent days (loop through days 1 to 6)
        let nextDay = dayToCheck === 6 ? 1 : dayToCheck + 1;
        let dayCounter = 1;
        
        while (dayCounter <= 7) {
            let nextDayClasses = classes.filter(c => c.day === nextDay);
            if (nextDayClasses.length > 0) {
                nextDayClasses = sortClasses(nextDayClasses);
                const nextClass = nextDayClasses[0];
                
                // Calculate days difference
                let daysDiff = nextDay - dayToCheck;
                if (daysDiff <= 0) daysDiff += 7; // wrap around week
                
                // Calculate time difference
                const targetTimeMin = timeToMinutes(nextClass.start);
                const totalMinutesDiff = (daysDiff * 24 * 60) + targetTimeMin - currentMinutes;

                const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
                const targetDayName = dayNames[nextClass.day === 7 ? 0 : nextClass.day];

                return {
                    class: nextClass,
                    type: 'later',
                    timeRemainingStr: `${targetDayName}, pukul ${nextClass.start}`,
                    diffMinutes: totalMinutesDiff,
                    isToday: false
                };
            }
            nextDay = nextDay === 6 ? 1 : nextDay + 1;
            dayCounter++;
        }

        return null;
    }

    // Helper to format remaining minutes into human readable text
    function formatTimeRemaining(totalMin) {
        if (totalMin < 60) {
            return `${totalMin} menit lagi`;
        }
        const hours = Math.floor(totalMin / 60);
        const minutes = totalMin % 60;
        if (minutes === 0) {
            return `${hours} jam lagi`;
        }
        return `${hours} jam ${minutes} menit lagi`;
    }

    // Seed real schedule data
    function loadDemoSchedule() {
        saveClasses(defaultClasses);
    }

    return {
        getClasses,
        addClass,
        updateClass,
        deleteClass,
        getClassesByDay,
        getNextClassInfo,
        loadDemoSchedule
    };
})();
