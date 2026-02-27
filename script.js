(function() {
    'use strict';

    const CONFIG = {
        animationDurations: {
            pageTransition: 300,
            counterInterval: 30,
            notificationDuration: 3000,
            loginDelay: 800,
            loaderLaunchDelay: 2000,
            updateCheckDelay: 1500,
            downloadDelay: 2000
        },
        loginSessionDuration: 24, // hours
        minUsernameLength: 3,
        minPasswordLength: 3,
        localStorageKeys: {
            theme: 'Riverside-theme',
            login: 'Riverside-login'
        },
        breakpoints: {
            mobile: 768
        },
        dashboard: {
            activityUpdateInterval: 30000, // 30 seconds
            maxActivityItems: 10
        }
    };

    // Keep track of everything
    const state = {
        isLoggedIn: false,
        currentUsername: '',
        activeTimeouts: new Set(),
        activeIntervals: new Set(),
        dashboardIntervals: new Set(),
        currentPage: 'home',
        isMobileMenuOpen: false,
        lastFocusedElement: null
    };

    // Grab all the important elements from the page
    const elements = {
        // Navigation
        mobileMenuToggle: document
            .getElementById(
                'mobile-menu-toggle'
            ),
        navLinks: document
            .getElementById(
                'nav-links'),
        navLinkItems: document
            .querySelectorAll(
                '.nav-link'),

        // Theme
        themeToggle: document
            .getElementById(
                'theme-toggle'),
        themeIcon: document
            .querySelector(
                '.theme-icon'),

        // Modals
        loginModal: document
            .getElementById(
                'login-modal'),
        closeLoginBtn: document
            .getElementById(
                'close-login'),

        // Forms
        loginForm: document
            .getElementById(
                'login-form'),
        loginError: document
            .getElementById(
                'login-error'),
        usernameInput: document
            .getElementById(
                'login-username'
            ),
        passwordInput: document
            .getElementById(
                'login-password'
            ),

        // Buttons
        loginDashboardBtn: document
            .getElementById(
                'login-dashboard-btn'
            ),
        logoutBtn: document
            .getElementById(
                'logout-btn'),
        downloadsHeroBtn: document
            .getElementById(
                'downloads-hero-btn'
            ),
        downloadsLoginBtn: document
            .getElementById(
                'downloads-login-btn'
            ),
        launchLoaderBtn: document
            .getElementById(
                'launch-loader-btn'
            ),
        checkUpdatesBtn: document
            .getElementById(
                'check-updates-btn'
            ),

        // Dashboard elements
        usernameDisplay: document
            .getElementById(
                'username-display'
            ),
        onlineUsers: document
            .getElementById(
                'online-users'),
        loadsToday: document
            .getElementById(
                'loads-today'),
        totalDownloads: document
            .getElementById(
                'total-downloads'
            ),
        lastUpdate: document
            .getElementById(
                'last-update'),
        recentActivity: document
            .getElementById(
                'recent-activity'
            ),
        activityList: document
            .querySelector(
                '.activity-list'
            ),

        // Page sections
        downloadsSection: document
            .getElementById(
                'downloads'),
        downloadsRestricted: document
            .getElementById(
                'downloads-restricted'
            ),
        downloadsAuthenticated: document
            .getElementById(
                'downloads-authenticated'
            ),

        // FAQ
        faqItems: document
            .querySelectorAll(
                '.faq-item')
    };

    // Helper functions
    const utils = {
        safeSetTimeout(func,
            delay) {
            const timeoutId =
                setTimeout(
                    () => {
                        try {
                            func
                                ();
                        } catch (
                            error
                        ) {
                            console
                                .error(
                                    'Timeout error:',
                                    error
                                );
                        } finally {
                            state
                                .activeTimeouts
                                .delete(
                                    timeoutId
                                );
                        }
                    }, delay);

            state.activeTimeouts
                .add(timeoutId);
            return timeoutId;
        },

        safeSetInterval(func,
            delay) {
            const intervalId =
                setInterval(
                    () => {
                        try {
                            func
                                ();
                        } catch (
                            error
                        ) {
                            console
                                .error(
                                    'Interval error:',
                                    error
                                );
                            this.clearSafeInterval(
                                intervalId
                            );
                        }
                    }, delay);

            state
                .activeIntervals
                .add(
                    intervalId);
            return intervalId;
        },

        clearSafeInterval(
            intervalId) {
            clearInterval(
                intervalId);
            state
                .activeIntervals
                .delete(
                    intervalId);
            state
                .dashboardIntervals
                .delete(
                    intervalId);
        },

        cleanupAll() {
            state.activeTimeouts
                .forEach(
                    timeout =>
                    clearTimeout(
                        timeout)
                );
            state
                .activeIntervals
                .forEach(
                    interval =>
                    clearInterval(
                        interval
                    ));
            state
                .dashboardIntervals
                .forEach(
                    interval =>
                    clearInterval(
                        interval
                    ));

            state.activeTimeouts
                .clear();
            state
                .activeIntervals
                .clear();
            state
                .dashboardIntervals
                .clear();
        },

        debounce(func, wait) {
            let timeoutId;
            return (...
                args) => {
                if (
                    timeoutId
                ) {
                    clearTimeout
                        (
                            timeoutId
                        );
                    state
                        .activeTimeouts
                        .delete(
                            timeoutId
                        );
                }
                timeoutId =
                    this
                    .safeSetTimeout(
                        () => {
                            func.apply(
                                this,
                                args
                            );
                            state
                                .activeTimeouts
                                .delete(
                                    timeoutId
                                );
                        },
                        wait
                    );
            };
        },

        simulateAsyncOperation(
            ms) {
            return new Promise(
                resolve => {
                    this.safeSetTimeout(
                        resolve,
                        ms
                    );
                });
        },

        sanitizeInput(input) {
            if (!input)
                return '';
            const div = document
                .createElement(
                    'div');
            div.textContent =
                input;
            return div
                .textContent;
        },

        hasDangerousPatterns(
            input) {
            const
                dangerousPatterns = [
                    /<script/i,
                    /javascript:/i,
                    /on\w+=/i,
                    /data:/i,
                    /vbscript:/i
                ];
            return dangerousPatterns
                .some(pattern =>
                    pattern
                    .test(input)
                );
        },

        formatNumber(num) {
            return Math.round(
                    num)
                .toLocaleString();
        },

        // Safe localStorage set with quota handling
        safeLocalStorageSet(key,
            value) {
            try {
                const
                    stringValue =
                    typeof value ===
                    'string' ?
                    value : JSON
                    .stringify(
                        value);
                localStorage
                    .setItem(
                        key,
                        stringValue
                    );
                return true;
            } catch (e) {
                if (e.name ===
                    'QuotaExceededError'
                ) {
                    this
                        .clearOldStorageData();
                    try {
                        localStorage
                            .setItem(
                                key,
                                stringValue
                            );
                        return true;
                    } catch (
                        retryError
                    ) {
                        console
                            .error(
                                'Still unable to save to localStorage:',
                                retryError
                            );
                        notificationManager
                            .showError(
                                'Unable to save session data'
                            );
                        return false;
                    }
                }
                console.error(
                    'localStorage error:',
                    e);
                return false;
            }
        },

        clearOldStorageData() {
            const
                keysToRemove = [
                    CONFIG
                    .localStorageKeys
                    .theme, // optional keep
                    'temporary-data',
                    'cached-stats'
                ];
            keysToRemove
                .forEach(
                    key => {
                        try {
                            if (key !==
                                CONFIG
                                .localStorageKeys
                                .login
                            ) {
                                localStorage
                                    .removeItem(
                                        key
                                    );
                            }
                        } catch (
                            e
                        ) {}
                    });
        }
    };

    // Dark/light mode stuff
    const themeManager = {
        init() {
            const savedTheme =
                localStorage
                .getItem(CONFIG
                    .localStorageKeys
                    .theme) ||
                'dark';
            this.applyTheme(
                savedTheme);
            this
                .setupEventListeners();
        },

        applyTheme(theme) {
            if (theme ===
                'light') {
                document.body
                    .classList
                    .add(
                        'light-theme'
                    );
                if (elements
                    .themeIcon)
                    elements
                    .themeIcon
                    .textContent =
                    '☀️';
            } else {
                document.body
                    .classList
                    .remove(
                        'light-theme'
                    );
                if (elements
                    .themeIcon)
                    elements
                    .themeIcon
                    .textContent =
                    '🌙';
            }
        },

        toggleTheme() {
            const isLight =
                document.body
                .classList
                .contains(
                    'light-theme'
                );
            const newTheme =
                isLight ?
                'dark' :
                'light';
            this.applyTheme(
                newTheme);
            localStorage
                .setItem(CONFIG
                    .localStorageKeys
                    .theme,
                    newTheme);
        },

        setupEventListeners() {
            if (elements
                .themeToggle) {
                elements
                    .themeToggle
                    .addEventListener(
                        'click',
                        () =>
                        this
                        .toggleTheme()
                    );
            }
        }
    };

    // Login/logout handling
    const authManager = {
        init() {
            this
                .checkLoginStatus();
        },

        checkLoginStatus() {
            try {
                const
                    savedLogin =
                    localStorage
                    .getItem(
                        CONFIG
                        .localStorageKeys
                        .login);
                if (!savedLogin)
                    return false;

                const
                    loginData =
                    JSON.parse(
                        savedLogin
                    );
                if (!loginData
                    .username ||
                    !loginData
                    .timestamp)
                    return false;

                const
                    loginTime =
                    new Date(
                        loginData
                        .timestamp
                    );
                const now =
                    new Date();
                const
                    hoursSinceLogin =
                    (now -
                        loginTime
                    ) / (
                        1000 *
                        60 * 60
                    );

                if (hoursSinceLogin <
                    CONFIG
                    .loginSessionDuration
                ) {
                    state
                        .isLoggedIn =
                        true;
                    state
                        .currentUsername =
                        loginData
                        .username;
                    this
                        .updateUIForLoggedInUser();
                    return true;
                } else {
                    this
                        .clearLogin();
                }
            } catch (e) {
                console.error(
                    'Error checking login status:',
                    e);
                this
                    .clearLogin();
            }
            return false;
        },

        saveLogin(username) {
            try {
                const
                    loginData = {
                        username: username,
                        timestamp: new Date()
                            .toISOString()
                    };
                return utils
                    .safeLocalStorageSet(
                        CONFIG
                        .localStorageKeys
                        .login,
                        JSON
                        .stringify(
                            loginData
                        )
                    );
            } catch (e) {
                console.error(
                    'Failed to save login:',
                    e);
                return false;
            }
        },

        clearLogin() {
            try {
                localStorage
                    .removeItem(
                        CONFIG
                        .localStorageKeys
                        .login);
                return true;
            } catch (e) {
                console.error(
                    'Failed to clear login:',
                    e);
                return false;
            }
        },

        updateUIForLoggedInUser() {
            if (elements
                .usernameDisplay
            ) {
                elements
                    .usernameDisplay
                    .textContent =
                    state
                    .currentUsername;
            }

            if (elements
                .loginDashboardBtn
            ) {
                elements
                    .loginDashboardBtn
                    .textContent =
                    'Dashboard';
                elements
                    .loginDashboardBtn
                    .setAttribute(
                        'aria-label',
                        'Go to dashboard'
                    );
            }
        },

        resetUIForLoggedOutUser() {
            if (elements
                .loginDashboardBtn
            ) {
                elements
                    .loginDashboardBtn
                    .textContent =
                    'Login';
                elements
                    .loginDashboardBtn
                    .setAttribute(
                        'aria-label',
                        'Login to Riverside'
                    );
            }
        },

        validateLogin(username,
            password) {
            const
                sanitizedUsername =
                utils
                .sanitizeInput(
                    username);
            const
                sanitizedPassword =
                utils
                .sanitizeInput(
                    password);

            if (utils
                .hasDangerousPatterns(
                    sanitizedUsername
                ) || utils
                .hasDangerousPatterns(
                    sanitizedPassword
                )) {
                notificationManager
                    .showError(
                        'Invalid characters in input'
                    );
                return false;
            }

            if (!
                sanitizedUsername
                .trim() || !
                sanitizedPassword
            ) {
                notificationManager
                    .showError(
                        'Please fill in all fields'
                    );
                return false;
            }

            if (sanitizedUsername
                .trim().length <
                CONFIG
                .minUsernameLength
            ) {
                notificationManager
                    .showError(
                        `Username must be at least ${CONFIG.minUsernameLength} characters`
                    );
                return false;
            }

            if (sanitizedPassword
                .length < CONFIG
                .minPasswordLength
            ) {
                notificationManager
                    .showError(
                        `Password must be at least ${CONFIG.minPasswordLength} characters`
                    );
                return false;
            }

            return true;
        },

        async handleLogin(
            username,
            password) {
            if (!this
                .validateLogin(
                    username,
                    password
                )) {
                return false;
            }

            const
                submitBtn =
                elements
                .loginForm
                ?.querySelector(
                    '.submit-btn'
                );

            try {
                await utils
                    .simulateAsyncOperation(
                        CONFIG
                        .animationDurations
                        .loginDelay
                    );

                if (username ===
                    'admin' &&
                    password ===
                    'admin'
                ) {
                    state
                        .isLoggedIn =
                        true;
                    state
                        .currentUsername =
                        username;

                    if (this
                        .saveLogin(
                            username
                        )
                    ) {
                        this
                            .updateUIForLoggedInUser();
                        modalManager
                            .closeLoginModal();
                        notificationManager
                            .showSuccess(
                                'Login successful! Welcome back, ' +
                                username
                            );

                        utils
                            .safeSetTimeout(
                                () => {
                                    pageManager
                                        .showPage(
                                            'dashboard'
                                        );
                                },
                                500
                            );

                        return true;
                    } else {
                        throw new Error(
                            'Failed to save login session'
                        );
                    }
                } else {
                    notificationManager
                        .showError(
                            'Invalid username or password'
                        );
                    if (elements
                        .passwordInput
                    ) {
                        elements
                            .passwordInput
                            .value =
                            '';
                        elements
                            .passwordInput
                            .focus();
                    }
                }
            } catch (
                error) {
                console
                    .error(
                        'Login error:',
                        error
                    );
                notificationManager
                    .showError(
                        'An error occurred during login. Please try again.'
                    );

                if (
                    submitBtn
                ) {
                    submitBtn
                        .textContent =
                        'Login';
                    submitBtn
                        .disabled =
                        false;
                }
            }
            return false;
        },

        handleLogout() {
            state.isLoggedIn =
                false;
            state
                .currentUsername =
                '';

            if (this
                .clearLogin()) {
                utils
                    .cleanupAll();
                this
                    .resetUIForLoggedOutUser();
                pageManager
                    .showPage(
                        'home');
                notificationManager
                    .showSuccess(
                        'Logged out successfully'
                    );
            }
        }
    };

    // Page navigation
    const pageManager = {
        validPages: ['home',
            'features',
            'downloads',
            'support',
            'dashboard'
        ],

        init() {
            this
                .setupNavigation();

            const isLoggedIn =
                authManager
                .checkLoginStatus();
            const hash = window
                .location.hash
                .substring(1);
            const validHash =
                this.validPages
                .includes(hash);

            if (validHash) {
                this.showPage(
                    hash);
            } else {
                this.showPage(
                    'home');
            }
        },

        setupNavigation() {
            if (elements
                .navLinkItems) {
                elements
                    .navLinkItems
                    .forEach(
                        link => {
                            link.addEventListener(
                                'click',
                                (
                                    e
                                ) =>
                                this
                                .handleNavigation(
                                    e
                                )
                            );
                        });
            }

            document
                .querySelectorAll(
                    '.hero-btns a'
                ).forEach(
                    btn => {
                        btn.addEventListener(
                            'click',
                            (
                                e
                            ) =>
                            this
                            .handleNavigation(
                                e
                            )
                        );
                    });

            document
                .querySelectorAll(
                    '.footer-links a[data-page]'
                ).forEach(
                    link => {
                        link.addEventListener(
                            'click',
                            (
                                e
                            ) =>
                            this
                            .handleNavigation(
                                e
                            )
                        );
                    });

            document
                .querySelectorAll(
                    '.download-btn'
                ).forEach(
                    btn => {
                        btn.addEventListener(
                            'click',
                            (
                                e
                            ) =>
                            this
                            .handleDownloadClick(
                                e
                            )
                        );
                    });

            document
                .querySelectorAll(
                    '.support-btn'
                ).forEach(
                    btn => {
                        btn.addEventListener(
                            'click',
                            (
                                e
                            ) =>
                            this
                            .handleSupportClick(
                                e
                            )
                        );
                    });
        },

        handleNavigation(e) {
            e.preventDefault();
            const page = e
                .currentTarget
                .getAttribute(
                    'data-page'
                );
            if (page) {
                this.showPage(
                    page);
            }
        },

        handleDownloadClick(e) {
            e.preventDefault();
            if (state
                .isLoggedIn) {
                const version =
                    e
                    .currentTarget
                    .getAttribute(
                        'data-version'
                    );
                downloadManager
                    .simulateDownload(
                        version,
                        e
                        .currentTarget
                    );
            } else {
                modalManager
                    .openLoginModal();
            }
        },

        handleSupportClick(e) {
            e.preventDefault();
            const action = e
                .currentTarget
                .textContent;
            notificationManager
                .showSuccess(
                    `Opening ${action}...`
                );
        },

        showPage(pageId) {
            if (!this.validPages
                .includes(
                    pageId)) {
                console.warn(
                    `Invalid page id: ${pageId}`
                );
                pageId = 'home';
            }

            if (elements
                .navLinkItems) {
                elements
                    .navLinkItems
                    .forEach(
                        link => {
                            link.classList
                                .remove(
                                    'active'
                                );
                            if (link
                                .getAttribute(
                                    'data-page'
                                ) ===
                                pageId
                            ) {
                                link.classList
                                    .add(
                                        'active'
                                    );
                            }
                        });
            }

            if (pageId ===
                'dashboard' && !
                state.isLoggedIn
            ) {
                modalManager
                    .openLoginModal();
                return;
            }

            if (pageId ===
                'downloads') {
                this
                    .handleDownloadsPage();
            }

            const targetPage =
                document
                .getElementById(
                    pageId);
            if (targetPage) {
                this.transitionToPage(
                    targetPage
                );
                state
                    .currentPage =
                    pageId;

                if (pageId ===
                    'dashboard' &&
                    state
                    .isLoggedIn
                ) {
                    dashboardManager
                        .cleanupIntervals();
                    utils
                        .safeSetTimeout(
                            () => {
                                dashboardManager
                                    .initialize();
                            },
                            500
                        );
                }
            }

            // Update URL hash
            window.location
                .hash = pageId;

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });

            mobileMenuManager
                .closeMenu();
        },

        handleDownloadsPage() {
            if (elements
                .downloadsRestricted &&
                elements
                .downloadsAuthenticated
            ) {
                if (state
                    .isLoggedIn
                ) {
                    elements
                        .downloadsRestricted
                        .style
                        .display =
                        'none';
                    elements
                        .downloadsAuthenticated
                        .style
                        .display =
                        'block';
                } else {
                    elements
                        .downloadsRestricted
                        .style
                        .display =
                        'block';
                    elements
                        .downloadsAuthenticated
                        .style
                        .display =
                        'none';
                }
            }
        },

        transitionToPage(
            targetPage) {
            const currentPage =
                document
                .querySelector(
                    '.page-content.active'
                );

            if (currentPage &&
                currentPage !==
                targetPage) {
                currentPage
                    .style
                    .opacity =
                    '0';
                currentPage
                    .style
                    .transform =
                    'translateY(20px)';

                utils
                    .safeSetTimeout(
                        () => {
                            currentPage
                                .style
                                .display =
                                'none';
                            currentPage
                                .classList
                                .remove(
                                    'active'
                                );
                            currentPage
                                .style
                                .opacity =
                                '';
                            currentPage
                                .style
                                .transform =
                                '';

                            targetPage
                                .style
                                .display =
                                'block';
                            targetPage
                                .style
                                .opacity =
                                '0';
                            targetPage
                                .style
                                .transform =
                                'translateY(20px)';

                            utils
                                .safeSetTimeout(
                                    () => {
                                        targetPage
                                            .classList
                                            .add(
                                                'active'
                                            );
                                        targetPage
                                            .style
                                            .opacity =
                                            '1';
                                        targetPage
                                            .style
                                            .transform =
                                            'translateY(0)';
                                    },
                                    50
                                );
                        },
                        CONFIG
                        .animationDurations
                        .pageTransition
                    );
            } else if (!
                currentPage) {
                targetPage.style
                    .display =
                    'block';
                targetPage
                    .classList
                    .add(
                        'active'
                    );
            }
        }
    };

    // Modal popup handling
    const modalManager = {
        init() {
            this
                .setupEventListeners();
        },

        setupEventListeners() {
            if (elements
                .loginDashboardBtn
            ) {
                elements
                    .loginDashboardBtn
                    .addEventListener(
                        'click',
                        (e) => {
                            e
                                .preventDefault();
                            if (state
                                .isLoggedIn
                            ) {
                                pageManager
                                    .showPage(
                                        'dashboard'
                                    );
                            } else {
                                this
                                    .openLoginModal();
                            }
                        });
            }

            if (elements
                .closeLoginBtn
            ) {
                elements
                    .closeLoginBtn
                    .addEventListener(
                        'click',
                        () =>
                        this
                        .closeLoginModal()
                    );
            }

            window
                .addEventListener(
                    'click', (
                        e) => {
                        if (e
                            .target ===
                            elements
                            .loginModal
                        ) {
                            this
                                .closeLoginModal();
                        }
                    });

            if (elements
                .downloadsLoginBtn
            ) {
                elements
                    .downloadsLoginBtn
                    .addEventListener(
                        'click',
                        (e) => {
                            e
                                .preventDefault();
                            this
                                .openLoginModal();
                        });
            }

            if (elements
                .loginForm) {
                elements
                    .loginForm
                    .addEventListener(
                        'submit',
                        (e) =>
                        this
                        .handleLoginSubmit(
                            e));
            }
        },

        openLoginModal() {
            state
                .lastFocusedElement =
                document
                .activeElement;

            if (elements
                .loginModal) {
                // Close mobile menu if open
                if (mobileMenuManager &&
                    state
                    .isMobileMenuOpen
                ) {
                    mobileMenuManager
                        .closeMenu();
                }

                elements
                    .loginModal
                    .style
                    .display =
                    'flex';
                elements
                    .loginModal
                    .setAttribute(
                        'aria-hidden',
                        'false'
                    );
                document.body
                    .style
                    .overflow =
                    'hidden';

                const
                    focusableElements =
                    elements
                    .loginModal
                    .querySelectorAll(
                        'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
                    );

                if (focusableElements
                    .length > 0
                ) {
                    const
                        firstElement =
                        focusableElements[
                            0];
                    const
                        lastElement =
                        focusableElements[
                            focusableElements
                            .length -
                            1];

                    utils
                        .safeSetTimeout(
                            () => {
                                if (elements
                                    .usernameInput
                                )
                                    elements
                                    .usernameInput
                                    .focus();
                            },
                            100
                        );

                    // Remove existing listeners and add improved trap
                    document
                        .removeEventListener(
                            'keydown',
                            this
                            .handleEscapeKey
                            .bind(
                                this
                            )
                        );
                    document
                        .removeEventListener(
                            'keydown',
                            this
                            .trapTabKey
                            .bind(
                                this
                            )
                        );

                    this.boundHandleEscape =
                        this
                        .handleEscapeKey
                        .bind(
                            this
                        );
                    this.boundTrapTab =
                        (e) =>
                        this
                        .improvedTrapTabKey(
                            e,
                            firstElement,
                            lastElement
                        );

                    document
                        .addEventListener(
                            'keydown',
                            this
                            .boundHandleEscape
                        );
                    document
                        .addEventListener(
                            'keydown',
                            this
                            .boundTrapTab
                        );
                }
            }
        },

        closeLoginModal() {
            if (elements
                .loginModal) {
                elements
                    .loginModal
                    .style
                    .display =
                    'none';
                elements
                    .loginModal
                    .setAttribute(
                        'aria-hidden',
                        'true');
            }

            if (elements
                .loginError) {
                elements
                    .loginError
                    .style
                    .display =
                    'none';
            }

            document.body.style
                .overflow = '';

            if (elements
                .usernameInput)
                elements
                .usernameInput
                .value = '';
            if (elements
                .passwordInput)
                elements
                .passwordInput
                .value = '';

            if (state
                .lastFocusedElement &&
                state
                .lastFocusedElement
                .focus) {
                utils
                    .safeSetTimeout(
                        () => {
                            state
                                .lastFocusedElement
                                .focus();
                        }, 50);
            }

            document
                .removeEventListener(
                    'keydown',
                    this
                    .boundHandleEscape
                );
            document
                .removeEventListener(
                    'keydown',
                    this
                    .boundTrapTab
                );
        },

        handleEscapeKey(e) {
            if (e.key ===
                'Escape') {
                this
                    .closeLoginModal();
            }
        },

        trapTabKey(e) {
            // Kept for compatibility but not used directly
        },

        improvedTrapTabKey(e,
            firstElement,
            lastElement) {
            if (e.key !== 'Tab')
                return;

            if (e.shiftKey &&
                document
                .activeElement ===
                firstElement) {
                e
                    .preventDefault();
                lastElement
                    .focus();
            } else if (!e
                .shiftKey &&
                document
                .activeElement ===
                lastElement) {
                e
                    .preventDefault();
                firstElement
                    .focus();
            }
        },

        async handleLoginSubmit(
            e) {
            e
                .preventDefault();

            const username =
                elements
                .usernameInput
                ?.value
                .trim() ||
                '';
            const password =
                elements
                .passwordInput
                ?.value ||
                '';
            const
                submitBtn =
                elements
                .loginForm
                ?.querySelector(
                    '.submit-btn'
                );

            if (!submitBtn)
                return;

            submitBtn
                .textContent =
                'Logging in...';
            submitBtn
                .disabled =
                true;

            if (elements
                .loginError
            ) {
                elements
                    .loginError
                    .style
                    .display =
                    'none';
            }

            await authManager
                .handleLogin(
                    username,
                    password
                );

            submitBtn
                .textContent =
                'Login';
            submitBtn
                .disabled =
                false;
        }
    };

    // Dashboard stats and stuff
    const dashboardManager = {
        activityTemplates: [{
                action: 'downloaded',
                version: 'v2.1.4',
                user: 'Player_{0}'
            },
            {
                action: 'launched',
                version: 'v2.0.9',
                user: 'Creeper_{0}'
            },
            {
                action: 'updated to',
                version: 'v2.1.4',
                user: 'Steve_{0}'
            },
            {
                action: 'logged in from',
                location: 'US',
                user: 'Alex_{0}'
            },
            {
                action: 'reported bug #',
                bugId: '{0}',
                user: 'Herobrine_{0}'
            }
        ],

        cleanupIntervals() {
            state
                .dashboardIntervals
                .forEach(
                    interval => {
                        utils
                            .clearSafeInterval(
                                interval
                            );
                    });
            state
                .dashboardIntervals
                .clear();
        },

        initialize() {
            this
                .cleanupIntervals();
            this
                .initializeStats();
            this
                .updateLastUpdateTime();
            this
                .updateRecentActivity();

            // Set up periodic activity updates
            const intervalId =
                utils
                .safeSetInterval(
                    () => {
                        this
                            .addRandomActivity();
                    }, CONFIG
                    .dashboard
                    .activityUpdateInterval
                );

            state
                .dashboardIntervals
                .add(
                    intervalId);
        },

        initializeStats() {
            const onlineUsers =
                Math.floor(Math
                    .random() *
                    2000) +
                1000;
            const loadsToday =
                Math.floor(Math
                    .random() *
                    1000) + 500;
            const
                totalDownloads =
                Math.floor(Math
                    .random() *
                    50000) +
                10000;

            this.animateCounter(
                elements
                .onlineUsers,
                onlineUsers);
            this.animateCounter(
                elements
                .loadsToday,
                loadsToday);
            this.animateCounter(
                elements
                .totalDownloads,
                totalDownloads
            );
        },

        animateCounter(element,
            target) {
            if (!element)
                return;

            let current = 0;
            const increment =
                target / 50;

            const intervalId =
                utils
                .safeSetInterval(
                    () => {
                        current
                            +=
                            increment;
                        if (current >=
                            target
                        ) {
                            element
                                .textContent =
                                utils
                                .formatNumber(
                                    target
                                );
                            utils
                                .clearSafeInterval(
                                    intervalId
                                );
                        } else {
                            element
                                .textContent =
                                utils
                                .formatNumber(
                                    Math
                                    .floor(
                                        current
                                    )
                                );
                        }
                    }, CONFIG
                    .animationDurations
                    .counterInterval
                );

            state
                .dashboardIntervals
                .add(
                    intervalId);
        },

        updateLastUpdateTime() {
            if (elements
                .lastUpdate) {
                const now =
                    new Date();
                elements
                    .lastUpdate
                    .textContent =
                    now
                    .toLocaleDateString() +
                    ' ' + now
                    .toLocaleTimeString();
            }
        },

        updateRecentActivity() {
            if (!elements
                .activityList)
                return;

            // Initial static activities
            const activities = [
                'Added Setting ("Wait Time", "Ticks it should wait before starting to break") to "Nuker"',
                'Added Priority modes "Health & Absorption", "Health & Hurt Time" to Aim Assist',
                'New release published: nightly',
                'Added wait time before attacking on aura to get less flags',
                'Updated Killaura'
            ];

            elements
                .activityList
                .innerHTML =
                activities.map(
                    activity =>
                    `<div class="activity-item">${activity}</div>`
                ).join('');
        },

        addRandomActivity() {
            if (!elements
                .activityList)
                return;

            const template =
                this
                .activityTemplates[
                    Math.floor(
                        Math
                        .random() *
                        this
                        .activityTemplates
                        .length)
                ];
            const randomNum =
                Math.floor(Math
                    .random() *
                    1000);
            const randomUser =
                template.user
                .replace('{0}',
                    randomNum);

            let activityText;
            if (template
                .version) {
                activityText =
                    `${randomUser} ${template.action} ${template.version}`;
            } else if (template
                .location) {
                activityText =
                    `${randomUser} ${template.action} ${template.location}`;
            } else if (template
                .bugId) {
                const bugId =
                    Math.floor(
                        Math
                        .random() *
                        100);
                activityText =
                    `${randomUser} ${template.action}${bugId}`;
            } else {
                activityText =
                    `${randomUser} performed an action`;
            }

            const now =
                new Date();
            const timeStr = now
                .toLocaleTimeString(
                    [], {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
            activityText =
                `[${timeStr}] ${activityText}`;

            const
                activityElement =
                document
                .createElement(
                    'div');
            activityElement
                .className =
                'activity-item';
            activityElement
                .textContent =
                activityText;
            activityElement
                .style
                .animation =
                'slideIn 0.3s ease-out';

            elements
                .activityList
                .insertBefore(
                    activityElement,
                    elements
                    .activityList
                    .firstChild
                );

            const items =
                elements
                .activityList
                .children;
            if (items.length >
                CONFIG.dashboard
                .maxActivityItems
            ) {
                elements
                    .activityList
                    .removeChild(
                        items[
                            items
                            .length -
                            1]);
            }
        }
    };

    // Download simulation
    const downloadManager = {
        async simulateDownload(
            version, button
        ) {
            const
                originalText =
                button
                .textContent;
            const
                originalDisabled =
                button
                .disabled;

            try {
                button
                    .textContent =
                    'Downloading...';
                button
                    .disabled =
                    true;

                await utils
                    .simulateAsyncOperation(
                        CONFIG
                        .animationDurations
                        .downloadDelay
                    );

                if (Math
                    .random() >
                    0.95) {
                    throw new Error(
                        'Download failed - server timeout'
                    );
                }

                button
                    .textContent =
                    'Downloaded!';
                button
                    .classList
                    .add(
                        'success'
                    );

                notificationManager
                    .showSuccess(
                        `${version} downloaded successfully!`
                    );

                utils
                    .safeSetTimeout(
                        () => {
                            button
                                .textContent =
                                originalText;
                            button
                                .disabled =
                                false;
                            button
                                .classList
                                .remove(
                                    'success'
                                );
                        },
                        3000
                    );

            } catch (
                error) {
                console
                    .error(
                        'Download error:',
                        error
                    );
                notificationManager
                    .showError(
                        `Download failed: ${error.message}`
                    );

                button
                    .textContent =
                    'Failed';
                button
                    .classList
                    .add(
                        'error'
                    );

                utils
                    .safeSetTimeout(
                        () => {
                            button
                                .textContent =
                                originalText;
                            button
                                .disabled =
                                originalDisabled;
                            button
                                .classList
                                .remove(
                                    'error'
                                );
                        },
                        3000
                    );
            }
        }
    };

    // Loader stuff
    const loaderManager = {
        init() {
            this
                .setupEventListeners();
        },

        setupEventListeners() {
            if (elements
                .launchLoaderBtn
            ) {
                elements
                    .launchLoaderBtn
                    .addEventListener(
                        'click',
                        () =>
                        this
                        .handleLaunchLoader()
                    );
            }

            if (elements
                .checkUpdatesBtn
            ) {
                elements
                    .checkUpdatesBtn
                    .addEventListener(
                        'click',
                        () =>
                        this
                        .handleCheckUpdates()
                    );
            }

            if (elements
                .logoutBtn) {
                elements
                    .logoutBtn
                    .addEventListener(
                        'click',
                        () =>
                        authManager
                        .handleLogout()
                    );
            }
        },

        async handleLaunchLoader() {
            const btn =
                elements
                .launchLoaderBtn;
            if (!btn)
                return;

            const
                originalText =
                btn
                .textContent;

            btn.textContent =
                'Launching...';
            btn.disabled =
                true;

            await utils
                .simulateAsyncOperation(
                    CONFIG
                    .animationDurations
                    .loaderLaunchDelay
                );

            btn.textContent =
                'Loader Active';
            btn.classList
                .add(
                    'success'
                );

            notificationManager
                .showSuccess(
                    'Riverside loader launched successfully!'
                );

            utils
                .safeSetTimeout(
                    () => {
                        btn.textContent =
                            originalText;
                        btn.disabled =
                            false;
                        btn.classList
                            .remove(
                                'success'
                            );
                    }, 3000
                );
        },

        async handleCheckUpdates() {
            const btn =
                elements
                .checkUpdatesBtn;
            if (!btn)
                return;

            const
                originalText =
                btn
                .textContent;

            btn.textContent =
                'Checking...';
            btn.disabled =
                true;

            await utils
                .simulateAsyncOperation(
                    CONFIG
                    .animationDurations
                    .updateCheckDelay
                );

            const
                updateAvailable =
                Math
                .random() >
                0.5;

            if (
                updateAvailable
            ) {
                notificationManager
                    .showSuccess(
                        'Update v2.2.0 is available! Download from the Downloads page.'
                    );
                btn.textContent =
                    'Update Available';
                btn.classList
                    .add(
                        'update-available'
                    );
            } else {
                notificationManager
                    .showSuccess(
                        'You are using the latest version of Riverside.'
                    );
                btn.textContent =
                    'Up to Date';
                btn.classList
                    .add(
                        'up-to-date'
                    );
            }

            utils
                .safeSetTimeout(
                    () => {
                        btn.textContent =
                            originalText;
                        btn.disabled =
                            false;
                        btn.classList
                            .remove(
                                'update-available',
                                'up-to-date'
                            );
                    }, 3000
                );
        }
    };

    // FAQ accordion
    const faqManager = {
        init() {
            if (!elements
                .faqItems.length
            ) return;

            elements.faqItems
                .forEach(
                    item => {
                        const
                            question =
                            item
                            .querySelector(
                                '.faq-question'
                            );
                        if (!
                            question
                        )
                            return;

                        question
                            .setAttribute(
                                'role',
                                'button'
                            );
                        question
                            .setAttribute(
                                'tabindex',
                                '0'
                            );
                        question
                            .setAttribute(
                                'aria-expanded',
                                'false'
                            );

                        const
                            answer =
                            item
                            .querySelector(
                                '.faq-answer'
                            );
                        if (
                            answer
                        ) {
                            const
                                answerId =
                                `faq-answer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                            answer
                                .id =
                                answerId;
                            question
                                .setAttribute(
                                    'aria-controls',
                                    answerId
                                );
                        }

                        question
                            .addEventListener(
                                'click',
                                () =>
                                this
                                .toggleFAQ(
                                    item
                                )
                            );
                        question
                            .addEventListener(
                                'keydown',
                                (
                                    e
                                ) => {
                                    if (e
                                        .key ===
                                        'Enter' ||
                                        e
                                        .key ===
                                        ' '
                                    ) {
                                        e
                                            .preventDefault();
                                        this.toggleFAQ(
                                            item
                                        );
                                    }
                                }
                            );
                    });
        },

        toggleFAQ(item) {
            const isActive =
                item.classList
                .contains(
                    'active');
            const question =
                item
                .querySelector(
                    '.faq-question'
                );
            const toggle = item
                .querySelector(
                    '.faq-toggle'
                );

            elements.faqItems
                .forEach(
                    faqItem => {
                        if (faqItem !==
                            item
                        ) {
                            faqItem
                                .classList
                                .remove(
                                    'active'
                                );
                            const
                                faqToggle =
                                faqItem
                                .querySelector(
                                    '.faq-toggle'
                                );
                            const
                                faqQuestion =
                                faqItem
                                .querySelector(
                                    '.faq-question'
                                );
                            if (
                                faqToggle
                            )
                                faqToggle
                                .textContent =
                                '+';
                            if (
                                faqQuestion
                            )
                                faqQuestion
                                .setAttribute(
                                    'aria-expanded',
                                    'false'
                                );
                        }
                    });

            if (!isActive) {
                item.classList
                    .add(
                        'active'
                    );
                if (toggle)
                    toggle
                    .textContent =
                    '−';
                if (question)
                    question
                    .setAttribute(
                        'aria-expanded',
                        'true');
            } else {
                item.classList
                    .remove(
                        'active'
                    );
                if (toggle)
                    toggle
                    .textContent =
                    '+';
                if (question)
                    question
                    .setAttribute(
                        'aria-expanded',
                        'false'
                    );
            }
        }
    };

    // Mobile menu
    const mobileMenuManager = {
        init() {
            if (!elements
                .mobileMenuToggle ||
                !elements
                .navLinks)
                return;

            elements
                .mobileMenuToggle
                .addEventListener(
                    'click',
                    () => this
                    .toggleMenu()
                );

            const
                navLinksItems =
                elements
                .navLinks
                .querySelectorAll(
                    'a');
            navLinksItems
                .forEach(
                    link => {
                        link.addEventListener(
                            'click',
                            () =>
                            this
                            .closeMenu()
                        );
                    });

            const
                debouncedResize =
                utils.debounce(
                    () => this
                    .handleResize(),
                    250);
            window
                .addEventListener(
                    'resize',
                    debouncedResize
                );
            this.handleResize();
        },

        toggleMenu() {
            state
                .isMobileMenuOpen = !
                state
                .isMobileMenuOpen;

            if (elements
                .mobileMenuToggle
            ) {
                elements
                    .mobileMenuToggle
                    .setAttribute(
                        'aria-expanded',
                        state
                        .isMobileMenuOpen
                    );
            }

            if (elements
                .navLinks) {
                elements
                    .navLinks
                    .setAttribute(
                        'aria-hidden',
                        !state
                        .isMobileMenuOpen
                    );

                if (state
                    .isMobileMenuOpen
                ) {
                    elements
                        .navLinks
                        .style
                        .maxHeight =
                        elements
                        .navLinks
                        .scrollHeight +
                        'px';
                    elements
                        .mobileMenuToggle
                        .classList
                        .add(
                            'active'
                        );
                } else {
                    elements
                        .navLinks
                        .style
                        .maxHeight =
                        '0';
                    elements
                        .mobileMenuToggle
                        .classList
                        .remove(
                            'active'
                        );
                }
            }
        },

        closeMenu() {
            if (state
                .isMobileMenuOpen
            ) {
                state
                    .isMobileMenuOpen =
                    false;

                if (elements
                    .mobileMenuToggle
                ) {
                    elements
                        .mobileMenuToggle
                        .setAttribute(
                            'aria-expanded',
                            false
                        );
                    elements
                        .mobileMenuToggle
                        .classList
                        .remove(
                            'active'
                        );
                }

                if (elements
                    .navLinks) {
                    elements
                        .navLinks
                        .style
                        .maxHeight =
                        '0';
                    elements
                        .navLinks
                        .setAttribute(
                            'aria-hidden',
                            true
                        );
                }
            }
        },

        handleResize() {
            if (window
                .innerWidth >
                CONFIG
                .breakpoints
                .mobile &&
                elements
                .navLinks) {
                elements
                    .navLinks
                    .style
                    .maxHeight =
                    '';
                if (elements
                    .mobileMenuToggle
                ) {
                    elements
                        .mobileMenuToggle
                        .classList
                        .remove(
                            'active'
                        );
                    elements
                        .mobileMenuToggle
                        .setAttribute(
                            'aria-expanded',
                            false
                        );
                }
                if (elements
                    .navLinks) {
                    elements
                        .navLinks
                        .setAttribute(
                            'aria-hidden',
                            false
                        );
                }
                state
                    .isMobileMenuOpen =
                    false;
            }
        }
    };

    // Notifications
    const notificationManager = {
        _displayToast(message,
            type) {
            const
                existingNotifications =
                document
                .querySelectorAll(
                    '.notification'
                );
            existingNotifications
                .forEach(
                    notification => {
                        if (notification
                            .parentNode
                        ) {
                            notification
                                .parentNode
                                .removeChild(
                                    notification
                                );
                        }
                    });

            const notification =
                document
                .createElement(
                    'div');
            notification
                .className =
                `notification notification-${type}`;
            notification
                .setAttribute(
                    'role',
                    'alert');
            notification
                .setAttribute(
                    'aria-live',
                    'polite');
            notification
                .textContent =
                message;

            document.body
                .appendChild(
                    notification
                );

            utils
                .safeSetTimeout(
                    () => {
                        notification
                            .style
                            .animation =
                            'slideOut 0.3s ease-out forwards';
                        utils
                            .safeSetTimeout(
                                () => {
                                    if (notification
                                        .parentNode
                                    ) {
                                        document
                                            .body
                                            .removeChild(
                                                notification
                                            );
                                    }
                                },
                                300
                            );
                    }, CONFIG
                    .animationDurations
                    .notificationDuration
                );
        },

        showSuccess(message) {
            this._displayToast(
                message,
                'success');
        },

        showError(message) {
            if (elements
                .loginError &&
                elements
                .loginModal &&
                elements
                .loginModal
                .style
                .display ===
                'flex') {

                elements
                    .loginError
                    .textContent =
                    message;
                elements
                    .loginError
                    .style
                    .display =
                    'block';
                elements
                    .loginError
                    .style
                    .animation =
                    'shake 0.5s';

                utils
                    .safeSetTimeout(
                        () => {
                            if (elements
                                .loginError
                            ) {
                                elements
                                    .loginError
                                    .style
                                    .animation =
                                    '';
                            }
                        }, 500);
            } else {
                this._displayToast(
                    message,
                    'error');
            }
        },

        showWarning(message) {
            this._displayToast(
                message,
                'warning');
        },

        showInfo(message) {
            this._displayToast(
                message,
                'info');
        }
    };

    // Keyboard shortcuts
    const keyboardManager = {
        init() {
            document
                .addEventListener(
                    'keydown', (
                        e) =>
                    this
                    .handleKeydown(
                        e));
        },

        handleKeydown(e) {
            if (e.target
                .tagName ===
                'INPUT' ||
                e.target
                .tagName ===
                'TEXTAREA' ||
                e.target
                .isContentEditable
            ) {
                return;
            }

            if ((e.ctrlKey || e
                    .metaKey) &&
                e.key === 'k') {
                e
                    .preventDefault();
                if (state
                    .isLoggedIn
                ) {
                    pageManager
                        .showPage(
                            'dashboard'
                        );
                } else {
                    modalManager
                        .openLoginModal();
                }
            }

            if ((e.ctrlKey || e
                    .metaKey) &&
                e.key === 'd') {
                e
                    .preventDefault();
                if (state
                    .isLoggedIn
                ) {
                    pageManager
                        .showPage(
                            'downloads'
                        );
                } else {
                    modalManager
                        .openLoginModal();
                }
            }

            if (e.altKey && e
                .key === 't') {
                e
                    .preventDefault();
                themeManager
                    .toggleTheme();
            }

            if (e.key >= '1' &&
                e.key <= '5') {
                e
                    .preventDefault();
                const pages = [
                    'home',
                    'features',
                    'downloads',
                    'support',
                    'dashboard'
                ];
                const
                    pageIndex =
                    parseInt(e
                        .key) -
                    1;

                if (pages[
                        pageIndex
                    ] ===
                    'dashboard' &&
                    !state
                    .isLoggedIn
                ) {
                    modalManager
                        .openLoginModal();
                } else {
                    pageManager
                        .showPage(
                            pages[
                                pageIndex
                            ]
                        );
                }
            }
        }
    };

    // Let's get this party started
    function init() {
        console.log(
            'Riverside client initializing...'
        );

        themeManager.init();
        faqManager.init();
        mobileMenuManager.init();
        keyboardManager.init();
        modalManager.init();
        loaderManager.init();
        authManager.init();
        pageManager.init();

        utils.safeSetTimeout(() => {
            console.log(
                'Riverside client initialized successfully'
            );
        }, 100);
    }

    document.addEventListener(
        'DOMContentLoaded', init
    );

    window.addEventListener(
        'pagehide', () => utils
        .cleanupAll());
    window.addEventListener(
        'beforeunload', () =>
        utils.cleanupAll());

    window.addEventListener('error',
        (e) => {
            console.error(
                'Unhandled error:',
                e.error);
        });

    window.addEventListener(
        'unhandledrejection', (
            e) => {
            console.error(
                'Unhandled promise rejection:',
                e.reason);
            e.preventDefault();
        });

})();
