/**
 * ==========================================
 * UNIDAILY - AUTH MODULE (auth.js)
 * ==========================================
 */

const AuthModule = (() => {
    const USERS_DB_KEY = 'unidaily_users_db';
    const SESSION_KEY = 'unidaily_current_user';

    // Simple hashing function for local security simulation
    function hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(16);
    }

    // Get all registered accounts
    function getUsersDB() {
        const data = localStorage.getItem(USERS_DB_KEY);
        return data ? JSON.parse(data) : {};
    }

    // Save users DB
    function saveUsersDB(db) {
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(db));
    }

    // Register a new user
    function register(username, name, password) {
        const db = getUsersDB();
        const cleanUsername = username.trim().toLowerCase();
        
        if (!cleanUsername) {
            throw new Error('Username tidak boleh kosong!');
        }
        if (cleanUsername.length < 3) {
            throw new Error('Username minimal 3 karakter!');
        }
        if (db[cleanUsername]) {
            throw new Error('Username sudah terdaftar!');
        }
        if (password.length < 3) {
            throw new Error('Password minimal 3 karakter!');
        }

        // Save new user profile
        db[cleanUsername] = {
            username: cleanUsername,
            name: name.trim() || username.trim(),
            passwordHash: hashPassword(password)
        };
        saveUsersDB(db);

        // Auto login
        setCurrentUser(cleanUsername);
        return db[cleanUsername];
    }

    // Verify credentials and log in
    function login(username, password) {
        const db = getUsersDB();
        const cleanUsername = username.trim().toLowerCase();

        if (!cleanUsername || !password) {
            throw new Error('Username dan password harus diisi!');
        }

        const user = db[cleanUsername];
        if (!user) {
            throw new Error('Username tidak ditemukan!');
        }

        const inputHash = hashPassword(password);
        if (user.passwordHash !== inputHash) {
            throw new Error('Password salah!');
        }

        // Set session
        setCurrentUser(cleanUsername);
        return user;
    }

    // Set active logged-in user
    function setCurrentUser(username) {
        localStorage.setItem(SESSION_KEY, username);
    }

    // Get active logged-in user username
    function getCurrentUser() {
        return localStorage.getItem(SESSION_KEY);
    }

    // Get active logged-in user display name
    function getCurrentUserName() {
        const username = getCurrentUser();
        if (!username) return 'Mahasiswa';
        
        const db = getUsersDB();
        const user = db[username];
        return user ? user.name : username;
    }

    // Check if user is logged in
    function isLoggedIn() {
        return getCurrentUser() !== null;
    }

    // Sign out
    function logout() {
        localStorage.removeItem(SESSION_KEY);
    }

    return {
        register,
        login,
        logout,
        isLoggedIn,
        getCurrentUser,
        getCurrentUserName
    };
})();
