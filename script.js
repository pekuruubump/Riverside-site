const cachedElements = {
    mobileMenuToggle: document.getElementById('mobile-menu-toggle'),
    navLinks: document.querySelector('.nav-links'),
    navLinkItems: document.querySelectorAll('.nav-link'),
    themeToggle: document.getElementById('theme-toggle'),
    themeIcon: document.querySelector('.theme-icon'),
    loginModal: document.getElementById('login-modal'),
    closeLoginBtn: document.getElementById('close-login'),
    loginForm: document.getElementById('login-form'),
    loginError: document.getElementById('login-error'),
    loginDashboardBtn: document.getElementById('login-dashboard-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    downloadsHeroBtn: document.getElementById('downloads-hero-btn'),
    downloadsLoginBtn: document.getElementById('downloads-login-btn')
};


let isLoggedIn = false;
let currentUsername = '';
let activeTimeouts = new Set();
let activeIntervals = new Set();


function cleanupTimeoutsAndIntervals() {
    activeTimeouts.forEach(timeout => clearTimeout(timeout));
    activeIntervals.forEach(interval => clearInterval(interval));
    activeTimeouts.clear();
    activeIntervals.clear();
}


function safeSetTimeout(func, delay) {
    const timeoutId = setTimeout(() => {
        try {
            func();
        } catch (error) {
            console.error('Timeout error:', error);

            throw error;
        } finally {

            activeTimeouts.delete(timeoutId);
        }
    }, delay);


    activeTimeouts.add(timeoutId);
    return timeoutId;
}

function safeSetInterval(func, delay) {
    const intervalId = setInterval(() => {
        try {
            func();
        } catch (error) {
            console.error('Interval function error:', error);
            clearInterval(intervalId);
            activeIntervals.delete(intervalId);
        }
    }, delay);
    activeIntervals.add(intervalId);
    return intervalId;
}


function initializeTheme() {
    const savedTheme = localStorage.getItem('Riverside-theme') || 'dark';

    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        if (cachedElements.themeIcon) {
            cachedElements.themeIcon.textContent = '☀️';
        }
    } else {
        document.body.classList.remove('light-theme');
        if (cachedElements.themeIcon) {
            cachedElements.themeIcon.textContent = '🌙';
        }
    }

    if (cachedElements.themeToggle) {
        cachedElements.themeToggle.addEventListener('click', () => {
            if (document.body.classList.contains('light-theme')) {
                document.body.classList.remove('light-theme');
                if (cachedElements.themeIcon) {
                    cachedElements.themeIcon.textContent = '🌙';
                }
                localStorage.setItem('Riverside-theme', 'dark');
            } else {
                document.body.classList.add('light-theme');
                if (cachedElements.themeIcon) {
                    cachedElements.themeIcon.textContent = '☀️';
                }
                localStorage.setItem('Riverside-theme', 'light');
            }
        });
    }
}


function animateCounter(element, target) {
    if (!element) return;

    let current = 0;
    const increment = target / 50;
    const timer = safeSetInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = Math.round(target).toLocaleString();
            clearInterval(timer);
            activeIntervals.delete(timer);

            
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 30);
}


function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const toggle = item.querySelector('.faq-toggle');

        if (question) {
            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');

                faqItems.forEach(faqItem => {
                    faqItem.classList.remove('active');
                    const faqToggle = faqItem.querySelector('.faq-toggle');
                    if (faqToggle) faqToggle.textContent = '+';
                });

                if (!isActive) {
                    item.classList.add('active');
                    if (toggle) toggle.textContent = '−';
                }
            });

            question.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    question.click();
                }
            });
        }
    });
}

function initializeDashboardStats() {
    const onlineUsers = Math.floor(Math.random() * 2000) + 1000;
    const loadsToday = Math.floor(Math.random() * 1000) + 500;

    animateCounter(document.getElementById('online-users'), onlineUsers);
    animateCounter(document.getElementById('loads-today'), loadsToday);

    const lastUpdate = document.getElementById('last-update');
    if (lastUpdate) {
        const now = new Date();
        lastUpdate.textContent = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
    }
}

function checkLoginStatus() {
    try {
        const savedLogin = localStorage.getItem('Riverside-login');
        if (savedLogin) {
            const loginData = JSON.parse(savedLogin);
            if (loginData.username && loginData.timestamp) {
                const loginTime = new Date(loginData.timestamp);
                const now = new Date();
                const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);

                if (hoursSinceLogin < 24) {
                    isLoggedIn = true;
                    currentUsername = loginData.username;
                    updateUIForLoggedInUser();
                    return true;
                } else {
                    localStorage.removeItem('Riverside-login');
                }
            }
        }
    } catch (e) {
        console.error('Error checking login status:', e);
        localStorage.removeItem('Riverside-login');
    }
    return false;
}

function saveLogin(username) {
    try {
        const loginData = {
            username: username,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('Riverside-login', JSON.stringify(loginData));
        return true;
    } catch (e) {
        console.error('Failed to save login:', e);
        return false;
    }
}

function clearLogin() {
    try {
        localStorage.removeItem('Riverside-login');
        return true;
    } catch (e) {
        console.error('Failed to clear login:', e);
        return false;
    }
}

function updateUIForLoggedInUser() {
    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay) {
        usernameDisplay.textContent = currentUsername;
    }

    if (cachedElements.loginDashboardBtn) {
        cachedElements.loginDashboardBtn.textContent = 'Dashboard';
        cachedElements.loginDashboardBtn.setAttribute('aria-label', 'Go to dashboard');
    }
}

function navigationHandler(e) {
    e.preventDefault();
    const page = e.currentTarget.getAttribute('data-page');
    if (page) {
        showPage(page);
    }
}
function setupNavigation() {
    if (cachedElements.navLinkItems) {
        cachedElements.navLinkItems.forEach(link => {
            link.addEventListener('click', navigationHandler);
        });
    }

    document.querySelectorAll('.hero-btns a').forEach(btn => {
        btn.addEventListener('click', navigationHandler);
    });

    document.querySelectorAll('.footer-links a[data-page]').forEach(link => {
        link.addEventListener('click', navigationHandler);
    });

    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            if (isLoggedIn) {
                const version = this.getAttribute('data-version');
                simulateDownload(version, this);
            } else {
                openLoginModal();
            }
        });
    });

    document.querySelectorAll('.support-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const action = this.textContent;
            showSuccessMessage(`Opening ${action}...`);
        });
    });
}

function showPage(pageId) {
    const validPages = ['home', 'features', 'downloads', 'support', 'dashboard'];
    if (!validPages.includes(pageId)) {
        console.warn(`Invalid page id: ${pageId}`);
        pageId = 'home';
    }

    if (cachedElements.navLinkItems) {
        cachedElements.navLinkItems.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageId) {
                link.classList.add('active');
            }
        });
    }

    if (pageId === 'dashboard' && !isLoggedIn) {
        openLoginModal();
        return;
    }

    if (pageId === 'downloads') {
        const downloadsSection = document.getElementById('downloads');
        const restrictedContent = document.getElementById('downloads-restricted');
        const authenticatedContent = document.getElementById('downloads-authenticated');

        if (restrictedContent && authenticatedContent) {
            if (isLoggedIn) {
                restrictedContent.style.display = 'none';
                authenticatedContent.style.display = 'block';
            } else {
                restrictedContent.style.display = 'block';
                authenticatedContent.style.display = 'none';
            }
        }

        if (downloadsSection) {
            transitionToPage(downloadsSection);
        }
    } else {
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            transitionToPage(targetPage);

            if (pageId === 'dashboard' && isLoggedIn) {
                safeSetTimeout(initializeDashboardStats, 500);
            }
        }
    }

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function transitionToPage(targetPage) {
    if (!targetPage) return;

    const currentPage = document.querySelector('.page-content.active');

    if (currentPage && currentPage !== targetPage) {
        currentPage.style.opacity = '0';
        currentPage.style.transform = 'translateY(20px)';

        safeSetTimeout(() => {
            currentPage.style.display = 'none';
            currentPage.classList.remove('active');
            currentPage.style.opacity = '';
            currentPage.style.transform = '';

            targetPage.style.display = 'block';
            targetPage.style.opacity = '0';
            targetPage.style.transform = 'translateY(20px)';

            safeSetTimeout(() => {
                targetPage.classList.add('active');
                targetPage.style.opacity = '1';
                targetPage.style.transform = 'translateY(0)';
            }, 50);
        }, 300);
    } else if (!currentPage) {
        targetPage.style.display = 'block';
        targetPage.classList.add('active');
    }
}

let lastFocusedElement = null;

function openLoginModal() {
    lastFocusedElement = document.activeElement;
    if (cachedElements.loginModal) {
        cachedElements.loginModal.style.display = 'flex';
        cachedElements.loginModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        safeSetTimeout(() => {
            const usernameInput = document.getElementById('username');
            if (usernameInput) usernameInput.focus();
        }, 100);

        document.addEventListener('keydown', trapTabKey);
        document.addEventListener('keydown', handleEscapeKey);
    }
}

function closeLoginModal() {
    if (cachedElements.loginModal) {
        cachedElements.loginModal.style.display = 'none';
        cachedElements.loginModal.setAttribute('aria-hidden', 'true');
    }

    if (cachedElements.loginError) {
        cachedElements.loginError.style.display = 'none';
    }

    document.body.style.overflow = '';

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';

    if (lastFocusedElement) {
        lastFocusedElement.focus();
    }

    document.removeEventListener('keydown', trapTabKey);
    document.removeEventListener('keydown', handleEscapeKey);
}

function trapTabKey(e) {
    if (e.key === 'Tab' && cachedElements.loginModal) {
        const focusableElements = cachedElements.loginModal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    }
}

function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        closeLoginModal();
    }
}

function setupEventListeners() {
    if (cachedElements.loginDashboardBtn) {
        cachedElements.loginDashboardBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (isLoggedIn) {
                showPage('dashboard');
            } else {
                openLoginModal();
            }
        });
    }

    if (cachedElements.closeLoginBtn) {
        cachedElements.closeLoginBtn.addEventListener('click', closeLoginModal);
    }

    window.addEventListener('click', (e) => {
        if (e.target === cachedElements.loginModal) {
            closeLoginModal();
        }
    });

    if (cachedElements.downloadsHeroBtn) {
        cachedElements.downloadsHeroBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (isLoggedIn) {
                showPage('downloads');
            } else {
                openLoginModal();
            }
        });
    }

    if (cachedElements.downloadsLoginBtn) {
        cachedElements.downloadsLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openLoginModal();
        });
    }

    if (cachedElements.loginForm) {
        cachedElements.loginForm.addEventListener('submit', handleLoginSubmit);
    }

    if (cachedElements.logoutBtn) {
        cachedElements.logoutBtn.addEventListener('click', handleLogout);
    }

    const launchLoaderBtn = document.getElementById('launch-loader-btn');
    if (launchLoaderBtn) {
        launchLoaderBtn.addEventListener('click', handleLaunchLoader);
    }

    const checkUpdatesBtn = document.getElementById('check-updates-btn');
    if (checkUpdatesBtn) {
        checkUpdatesBtn.addEventListener('click', handleCheckUpdates);
    }
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    if (!usernameInput || !passwordInput) return;

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const submitBtn = cachedElements.loginForm.querySelector('.submit-btn');

    if (!submitBtn) return;

    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;
    if (cachedElements.loginError) {
        cachedElements.loginError.style.display = 'none';
    }

    if (!validateLoginForm(username, password)) {
        submitBtn.textContent = 'Login';
        submitBtn.disabled = false;
        return;
    }

    await simulateAsyncOperation(800);

    if (username === 'admin' && password === 'admin') {
        isLoggedIn = true;
        currentUsername = username;
        if (saveLogin(username)) {
            updateUIForLoggedInUser();
            closeLoginModal();
            showSuccessMessage('Login successful! Welcome back, ' + username);
            safeSetTimeout(() => showPage('dashboard'), 500);
        } else {
            showError('Error saving login session. Please try again.');
        }
    } else {
        showError('Invalid username or password');
        usernameInput.value = '';
        passwordInput.value = '';
        passwordInput.focus();
    }

    submitBtn.textContent = 'Login';
    submitBtn.disabled = false;
}

function validateLoginForm(username, password) {
    const sanitizedUsername = username.replace(/[<>"'&\/\\]/g, '');
    const sanitizedPassword = password.replace(/[<>"'&\/\\]/g, '');

    const dangerousPatterns = [
        /<script/i, /javascript:/i, /on\w+=/i, /data:/i, /vbscript:/i
    ];

    for (let pattern of dangerousPatterns) {
        if (pattern.test(sanitizedUsername) || pattern.test(sanitizedPassword)) {
            showError('Invalid characters in input');
            return false;
        }
    }

    if (!sanitizedUsername.trim() || !sanitizedPassword) {
        showError('Please fill in all fields');
        return false;
    }

    if (sanitizedUsername.trim().length < 3) {
        showError('Username must be at least 3 characters');
        return false;
    }

    if (sanitizedPassword.length < 3) {
        showError('Password must be at least 3 characters');
        return false;
    }

    return true;
}

function showError(message) {
    if (!cachedElements.loginError) return;

    cachedElements.loginError.textContent = message;
    cachedElements.loginError.style.display = 'block';
    cachedElements.loginError.style.animation = 'shake 0.5s';

    safeSetTimeout(() => {
        cachedElements.loginError.style.animation = '';
    }, 500);
}

function showSuccessMessage(message) {
    const existingNotifications = document.querySelectorAll('.success-notification');
    existingNotifications.forEach(notification => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    });

    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');
    notification.textContent = message;

    document.body.appendChild(notification);

    const timeoutId = safeSetTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        safeSetTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);

    return timeoutId;
}

function simulateAsyncOperation(ms) {
    return new Promise(resolve => {
        const timeoutId = setTimeout(() => {
            activeTimeouts.delete(timeoutId);
            resolve();
        }, ms);
        activeTimeouts.add(timeoutId);
    });
}

function handleLogout() {
    isLoggedIn = false;
    currentUsername = '';

    if (clearLogin()) {
        cleanupTimeoutsAndIntervals();

        if (cachedElements.loginDashboardBtn) {
            cachedElements.loginDashboardBtn.textContent = 'Login';
            cachedElements.loginDashboardBtn.setAttribute('aria-label', 'Login to Riverside');
        }

        showPage('home');

        showSuccessMessage('Logged out successfully');
    }
}

async function handleLaunchLoader() {
    const btn = document.getElementById('launch-loader-btn');
    if (!btn) return;

    const originalText = btn.textContent;

    btn.textContent = 'Launching...';
    btn.disabled = true;

    await simulateAsyncOperation(2000);

    btn.textContent = 'Loader Active';
    btn.classList.add('success');

    showSuccessMessage('Riverside loader launched successfully!');

    safeSetTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
        btn.classList.remove('success');
    }, 3000);
}

async function handleCheckUpdates() {
    const btn = document.getElementById('check-updates-btn');
    if (!btn) return;

    const originalText = btn.textContent;

    btn.textContent = 'Checking...';
    btn.disabled = true;

    await simulateAsyncOperation(1500);

    const updateAvailable = Math.random() > 0.5;

    if (updateAvailable) {
        showSuccessMessage('Update v2.2.0 is available! Download from the Downloads page.');
        btn.textContent = 'Update Available';
        btn.classList.add('update-available');
    } else {
        showSuccessMessage('You are using the latest version of Riverside.');
        btn.textContent = 'Up to Date';
        btn.classList.add('up-to-date');
    }

    safeSetTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
        btn.classList.remove('update-available', 'up-to-date');
    }, 3000);
}

async function simulateDownload(version, btn) {
    const originalText = btn.textContent;


    btn.textContent = 'Downloading...';
    btn.disabled = true;

    await simulateAsyncOperation(2000);

    btn.textContent = 'Downloaded!';
    btn.classList.add('success');

    showSuccessMessage(`${version} downloaded successfully!`);

    safeSetTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
        btn.classList.remove('success');
    }, 3000);
}

function initializeMobileMenu() {
    if (!cachedElements.mobileMenuToggle || !cachedElements.navLinks) return;

    let isMenuOpen = false;

    cachedElements.mobileMenuToggle.addEventListener('click', () => {
        isMenuOpen = !isMenuOpen;

        cachedElements.mobileMenuToggle.setAttribute('aria-expanded', isMenuOpen);
        cachedElements.navLinks.setAttribute('aria-hidden', !isMenuOpen);

        if (isMenuOpen) {
            cachedElements.navLinks.style.maxHeight = cachedElements.navLinks.scrollHeight + 'px';
            cachedElements.mobileMenuToggle.classList.add('active');
        } else {
            cachedElements.navLinks.style.maxHeight = '0';
            cachedElements.mobileMenuToggle.classList.remove('active');
        }
    });

    const navLinksItems = cachedElements.navLinks.querySelectorAll('a');
    navLinksItems.forEach(link => {
        link.addEventListener('click', () => {
            if (isMenuOpen) {
                isMenuOpen = false;
                cachedElements.navLinks.style.maxHeight = '0';
                cachedElements.mobileMenuToggle.classList.remove('active');
                cachedElements.mobileMenuToggle.setAttribute('aria-expanded', false);
                cachedElements.navLinks.setAttribute('aria-hidden', true);
            }
        });
    });
}

function handleResize() {
    if (window.innerWidth > 768 && cachedElements.navLinks) {
        cachedElements.navLinks.style.maxHeight = '';
        cachedElements.mobileMenuToggle.classList.remove('active');
        cachedElements.mobileMenuToggle.setAttribute('aria-expanded', false);
        cachedElements.navLinks.setAttribute('aria-hidden', false);
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            activeTimeouts.delete(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = safeSetTimeout(later, wait);
    };
}

function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' ||
            e.target.tagName === 'TEXTAREA' ||
            e.target.isContentEditable) {
            return;
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (isLoggedIn) {
                showPage('dashboard');
            } else {
                openLoginModal();
            }
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            if (isLoggedIn) {
                showPage('downloads');
            } else {
                openLoginModal();
            }
        }


        if (e.altKey && e.key === 't') {
            e.preventDefault();
            if (cachedElements.themeToggle) {
                cachedElements.themeToggle.click();
            }
        }

        if (e.key >= '1' && e.key <= '5') {
            const pages = ['home', 'features', 'downloads', 'support', 'dashboard'];
            const pageIndex = parseInt(e.key) - 1;

            if (pages[pageIndex] === 'dashboard' && !isLoggedIn) {
                openLoginModal();
            } else {
                showPage(pages[pageIndex]);
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeFAQ();
    initializeTheme();
    initializeMobileMenu();
    initializeKeyboardShortcuts();
    setupNavigation();
    setupEventListeners();

    const debouncedResize = debounce(handleResize, 250);
    window.addEventListener('resize', debouncedResize);
    handleResize();

    if (checkLoginStatus()) {
        showPage('dashboard');
    } else {
        showPage('home');
    }

    safeSetTimeout(() => {
        console.log('Riverside client initialized successfully');
    }, 100);
});

window.addEventListener('pagehide', cleanupTimeoutsAndIntervals);
window.addEventListener('beforeunload', () => {
    cleanupTimeoutsAndIntervals();
});
window.addEventListener('error', (e) => {
    console.error('Unhandled error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    e.preventDefault();
});
