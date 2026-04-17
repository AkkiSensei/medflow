/* ==========================================================================
   MedFlow OS - Enterprise Client Logic
   ========================================================================== */

   class MedFlowApp {
    constructor() {
        // --- Configuration ---
        this.API = {
            BASE: '/api',
            LOGIN: '/api/auth/login',
            ME: '/api/auth/me',
            PATIENTS: '/api/patients',
            METRICS: '/api/patients/metrics',
            SEARCH: '/api/patients/search',
            APPOINTMENTS: '/api/appointments',
            SCHEDULE: '/api/appointments/schedule'
        };
        this.UNLOCK_CODE = 'medflow123';
        this.PAGE_SIZE = 8;
        this.STORAGE_KEYS = {
            authToken: 'medflow_auth_token'
        };

        // --- Application State ---
        this.state = {
            auth: {
                token: null,
                user: null
            },
            data: {
                patients: [],
                appointments: [],
                metrics: null
            },
            filters: {
                status: 'all',
                ward: '',
                search: '',
                currentPage: 0,
                totalPages: 1
            }
        };

        // --- DOM Cache ---
        this.dom = {};
        this.debounceTimer = null;

        // --- Initialize ---
        document.addEventListener('DOMContentLoaded', () => this.init());
    }

    /* ======================================================================
       1. INITIALIZATION & EVENT BINDING
       ====================================================================== */
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.restoreSession();
        console.log('[MedFlow OS] Core modules initialized successfully.');
    }

    cacheDOM() {
        this.dom = {
            // Views
            loginScreen: document.getElementById('login-screen'),
            appShell: document.getElementById('app-view'),
            navButtons: document.querySelectorAll('.nav-btn'),
            pages: document.querySelectorAll('.page'),
            
            // Auth
            loginForm: document.getElementById('loginForm'),
            togglePasswordBtn: document.getElementById('togglePasswordBtn'),
            passwordInput: document.getElementById('password'),
            loginFlag: document.getElementById('loginAttemptFlag'),
            loginBtn: document.getElementById('loginBtn'),
            
            // Navigation & Profile
            userProfileChip: document.getElementById('userProfileChip'),
            systemLockBtn: document.getElementById('systemLockBtn'),
            notificationsBtn: document.getElementById('notificationsBtn'),
            logoutProfileBtn: document.getElementById('logoutProfileBtn'),
            
            // Dialog
            lockModal: document.getElementById('lock-screen'),
            unlockBtn: document.getElementById('unlockBtn'),
            unlockInput: document.getElementById('unlockCodeInput'),
            
            // Forms & Inputs
            patientForm: document.getElementById('patientForm'),
            searchInput: document.getElementById('searchInput'),
            wardFilter: document.getElementById('wardFilter'),
            statusFilters: document.querySelectorAll('.filter-btn[data-filter]'),
            
            // Pagination
            prevBtn: document.getElementById('prevPageBtn'),
            nextBtn: document.getElementById('nextPageBtn'),
            pageLabel: document.getElementById('pageLabel')
        };
    }

    bindEvents() {
        // Routing
        this.dom.navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Authentication
        this.dom.togglePasswordBtn.addEventListener('click', () => this.togglePasswordVisibility());
        this.dom.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        
        // System Lock
        this.dom.systemLockBtn.addEventListener('click', () => this.openLockModal());
        this.dom.unlockBtn.addEventListener('click', () => this.attemptUnlock());
        this.dom.lockModal.addEventListener('close', () => this.dom.lockModal.classList.add('hidden'));
        this.dom.unlockInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.attemptUnlock();
        });

        // Notifications
        if (this.dom.notificationsBtn) {
            this.dom.notificationsBtn.addEventListener('click', () => {
                this.showToast('No new alerts at the moment.', 'success');
            });
        }

        if (this.dom.logoutProfileBtn) {
            this.dom.logoutProfileBtn.addEventListener('click', () => this.logout());
        }

        // Data Manipulation
        this.dom.patientForm.addEventListener('submit', (e) => this.handleAdmit(e));
        
        // Directory Filtering & Pagination
        this.dom.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.dom.wardFilter.addEventListener('change', (e) => this.handleWardFilter(e.target.value));
        this.dom.statusFilters.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleStatusFilter(e));
        });
        
        this.dom.prevBtn.addEventListener('click', () => this.changePage(-1));
        this.dom.nextBtn.addEventListener('click', () => this.changePage(1));
    }

    /* ======================================================================
       2. AUTHENTICATION & SECURITY
       ====================================================================== */
    togglePasswordVisibility() {
        const isPassword = this.dom.passwordInput.type === 'password';
        this.dom.passwordInput.type = isPassword ? 'text' : 'password';
        this.dom.togglePasswordBtn.innerHTML = isPassword ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
    }

    setLoginError(message) {
        if (!message) {
            this.dom.loginFlag.textContent = '';
            this.dom.loginFlag.classList.add('hidden');
            return;
        }
        this.dom.loginFlag.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${message}`;
        this.dom.loginFlag.classList.remove('hidden');
    }

    async handleLogin(e) {
        e.preventDefault();
        this.setLoginError('');
        
        const credentials = {
            name: document.getElementById('name').value.trim(),
            employeeId: document.getElementById('employeeId').value.trim().toUpperCase(),
            password: this.dom.passwordInput.value
        };

        if (credentials.name.length < 3 || credentials.employeeId.length < 4 || credentials.password.length < 8) {
            return this.setLoginError('Invalid parameters. Ensure all fields meet length requirements.');
        }

        this.toggleButtonLoading(this.dom.loginBtn, true, 'Authenticating...');

        try {
            const response = await fetch(this.API.LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });
            const payload = await this.parseResponse(response, 'Authentication rejected by server.');

            // Set Application State
            this.state.auth.token = payload.token;
            this.persistToken(payload.token);
            await this.refreshSession();
            
            // Transition UI
            this.dom.loginScreen.classList.add('hidden');
            this.dom.appShell.classList.remove('hidden');
            
            this.applyRolePermissions();
            this.renderProfile();
            
            // Fetch initial data payload
            await Promise.all([this.fetchPatients(), this.fetchAppointments()]);
            
            this.showToast(`Welcome back, ${this.state.auth.user.displayName}.`, 'success');

        } catch (error) {
            this.clearPersistedToken();
            this.state.auth.token = null;
            this.state.auth.user = null;
            this.setLoginError(error.message);
        } finally {
            this.dom.passwordInput.type = 'password';
            this.toggleButtonLoading(this.dom.loginBtn, false, '<i class="fa-solid fa-right-to-bracket"></i> Secure Sign In');
        }
    }

    attemptUnlock() {
        if (this.dom.unlockInput.value === this.UNLOCK_CODE) {
            if (this.dom.lockModal.open) {
                this.dom.lockModal.close();
            } else {
                this.dom.lockModal.classList.add('hidden');
            }
            this.dom.unlockInput.value = '';
            this.showToast('Terminal unlocked.', 'success');
            return;
        }
        this.showToast('Invalid security pin.', 'error');
        this.dom.unlockInput.select();
    }

    openLockModal() {
        this.dom.lockModal.classList.remove('hidden');
        this.dom.lockModal.showModal();
    }

    applyRolePermissions() {
        const { role, displayName } = this.state.auth.user;
        const roleLabel = role === 'STAFF' ? 'Staff' : 'Doctor';
        this.dom.userProfileChip.textContent = `${displayName} (${roleLabel})`;
        
        const admissionsBtn = document.querySelector('[data-target="view-admissions"]');
        const admissionsSection = document.getElementById('view-admissions');
        if (role === 'DOCTOR') {
            admissionsBtn.classList.add('hidden');
            admissionsSection.classList.add('hidden');
            const activePage = document.querySelector('.page.active');
            if (activePage?.id === 'view-admissions') {
                document.querySelector('[data-target="view-dashboard"]')?.click();
            }
        } else {
            admissionsBtn.classList.remove('hidden');
            admissionsSection.classList.remove('hidden');
        }
    }

    /* ======================================================================
       3. DATA FETCHING (API SERVICE LAYER)
       ====================================================================== */
    getAuthHeaders(extraHeaders = {}) {
        return { 
            ...extraHeaders, 
            'Authorization': `Bearer ${this.state.auth.token}` 
        };
    }

    async parseResponse(response, fallbackMessage) {
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
            const fieldErrors = payload.fieldErrors || payload.validationErrors;
            const validationMessage = fieldErrors ? Object.values(fieldErrors)[0] : '';
            const message = validationMessage || payload.message || fallbackMessage;
            const error = new Error(message);
            error.status = response.status;
            throw error;
        }

        return payload;
    }

    handleAuthFailure(error) {
        if (error?.status === 401 || error?.status === 403) {
            this.showToast('Session expired or unauthorized. Please sign in again.', 'error');
            this.resetSession();
            return true;
        }
        return false;
    }

    resetSession() {
        this.state.auth.token = null;
        this.state.auth.user = null;
        this.state.data.patients = [];
        this.state.data.appointments = [];
        this.state.data.metrics = null;
        this.state.filters.currentPage = 0;
        this.state.filters.totalPages = 1;
        this.clearPersistedToken();

        this.dom.appShell.classList.add('hidden');
        this.dom.loginScreen.classList.remove('hidden');
    }

    logout() {
        this.resetSession();
        this.setLoginError('');
        this.dom.loginForm.reset();
        this.dom.passwordInput.type = 'password';
        this.dom.unlockInput.value = '';
        if (this.dom.lockModal.open) {
            this.dom.lockModal.close();
        }
        this.dom.navButtons.forEach(btn => btn.classList.remove('active'));
        this.dom.pages.forEach(page => page.classList.remove('active'));
        document.querySelector('[data-target="view-dashboard"]')?.classList.add('active');
        document.getElementById('view-dashboard')?.classList.add('active');
        this.showToast('Logged out successfully.', 'success');
    }

    async refreshSession() {
        const response = await fetch(this.API.ME, { headers: this.getAuthHeaders() });
        const payload = await this.parseResponse(response, 'Unable to validate session.');
        this.state.auth.user = payload;
    }

    persistToken(token) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.authToken, token);
        } catch (error) {
            console.warn('Unable to persist auth token.', error);
        }
    }

    getPersistedToken() {
        try {
            return localStorage.getItem(this.STORAGE_KEYS.authToken);
        } catch (error) {
            return null;
        }
    }

    clearPersistedToken() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.authToken);
        } catch (error) {
            console.warn('Unable to clear persisted auth token.', error);
        }
    }

    async restoreSession() {
        const token = this.getPersistedToken();
        if (!token) return;

        this.state.auth.token = token;

        try {
            await this.refreshSession();
            this.dom.loginScreen.classList.add('hidden');
            this.dom.appShell.classList.remove('hidden');
            this.applyRolePermissions();
            this.renderProfile();
            await Promise.all([this.fetchPatients(), this.fetchAppointments()]);
        } catch (error) {
            this.resetSession();
        }
    }

    async fetchPatients() {
        try {
            const { currentPage, status, ward, search } = this.state.filters;
            const query = new URLSearchParams({ 
                page: String(currentPage), 
                size: String(this.PAGE_SIZE) 
            });
            
            if (status !== 'all') query.append('status', status);
            if (ward) query.append('ward', ward);
            if (search) query.append('search', search);

            const response = await fetch(`${this.API.SEARCH}?${query.toString()}`, { 
                headers: this.getAuthHeaders() 
            });
            const payload = await this.parseResponse(response, 'Failed to load patient directory.');
            
            // Update State
            this.state.data.patients = payload.content || [];
            this.state.filters.totalPages = Math.max(payload.totalPages || 1, 1);
            this.state.filters.currentPage = Math.min(payload.page || 0, this.state.filters.totalPages - 1);
            
            await this.fetchDashboardMetrics();
            
            // Trigger Renders
            this.renderDashboard();
            this.renderTable();
            this.renderPagination();
            
        } catch (error) {
            if (this.handleAuthFailure(error)) return;
            console.error('Fetch Patients Error:', error);
            this.showToast('Failed to sync patient data with server.', 'error');
        }
    }

    async fetchDashboardMetrics() {
        try {
            const response = await fetch(this.API.METRICS, { headers: this.getAuthHeaders() });
            const payload = await this.parseResponse(response, 'Failed to load dashboard metrics.');
            this.state.data.metrics = payload;
        } catch (error) {
            if (this.handleAuthFailure(error)) return;
            this.state.data.metrics = null;
        }
    }

    async fetchAppointments() {
        try {
            const endpoint = this.state.auth.user?.role === 'DOCTOR'
                ? this.API.SCHEDULE
                : this.API.APPOINTMENTS;
            const response = await fetch(endpoint, { headers: this.getAuthHeaders() });
            const payload = await this.parseResponse(response, 'Failed to load schedule.');
            this.state.data.appointments = payload;
            this.renderAppointments();
        } catch (error) {
            if (this.handleAuthFailure(error)) return;
            console.error(error);
            this.showToast(error.message || 'Unable to fetch appointments.', 'error');
        }
    }

    /* ======================================================================
       4. TRANSACTIONS
       ====================================================================== */
    async handleAdmit(e) {
        e.preventDefault();
        
        if (this.state.auth.user.role !== 'STAFF') {
            return this.showToast('Access Denied: Only Staff may process admissions.', 'error');
        }

        const submitBtn = document.getElementById('submitBtn');
        this.toggleButtonLoading(submitBtn, true, 'Processing...');

        const newPatient = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            age: parseInt(document.getElementById('age').value, 10),
            gender: document.getElementById('gender').value,
            ward: document.getElementById('ward').value,
            reason: document.getElementById('reason').value.trim() || null
        };

        try {
            const response = await fetch(this.API.PATIENTS, {
                method: 'POST',
                headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(newPatient)
            });
            await this.parseResponse(response, 'Admission failed due to server error.');

            this.showToast(`${this.escapeHTML(newPatient.firstName)} admitted to registry.`, 'success');
            this.dom.patientForm.reset();
            
            // Jump to directory to see new patient
            document.querySelector('[data-target="view-directory"]').click();
            await this.fetchPatients();

        } catch (error) {
            if (this.handleAuthFailure(error)) return;
            this.showToast(error.message, 'error');
        } finally {
            this.toggleButtonLoading(submitBtn, false, '<i class="fa-solid fa-user-plus"></i> Process Official Admission');
        }
    }

    async handleDischarge(patientId) {
        if (this.state.auth.user.role !== 'STAFF') {
            return this.showToast('Access Denied: Only Staff may process discharges.', 'error');
        }

        try {
            const response = await fetch(`${this.API.PATIENTS}/${patientId}/discharge`, { 
                method: 'PATCH', 
                headers: this.getAuthHeaders() 
            });
            await this.parseResponse(response, 'Unable to update patient status.');
            
            this.showToast(`Registry ID PAT-${patientId} successfully discharged.`, 'success');
            await this.fetchPatients();
        } catch (error) {
            if (this.handleAuthFailure(error)) return;
            this.showToast(error.message, 'error');
        }
    }

    /* ======================================================================
       5. UI CONTROLLERS & RENDERING
       ====================================================================== */
    handleNavigation(e) {
        const targetBtn = e.currentTarget;
        const targetId = targetBtn.getAttribute('data-target');
        const isDoctor = this.state.auth.user?.role === 'DOCTOR';

        if (isDoctor && targetId === 'view-admissions') {
            this.showToast('Doctors do not have admission permissions.', 'error');
            return;
        }

        this.dom.navButtons.forEach(btn => btn.classList.remove('active'));
        this.dom.pages.forEach(page => page.classList.remove('active'));

        targetBtn.classList.add('active');
        document.getElementById(targetId).classList.add('active');

        // Dynamic re-renders based on view
        if (targetId === 'view-dashboard') this.renderDashboard();
        if (targetId === 'view-directory') this.renderTable();
        if (targetId === 'view-appointments') this.renderAppointments();
    }

    handleSearch(query) {
        this.state.filters.search = query.trim();
        this.state.filters.currentPage = 0;
        
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.fetchPatients(), 300);
    }

    handleWardFilter(ward) {
        this.state.filters.ward = ward;
        this.state.filters.currentPage = 0;
        this.fetchPatients();
    }

    handleStatusFilter(e) {
        const targetBtn = e.currentTarget;
        this.dom.statusFilters.forEach(btn => btn.classList.remove('active'));
        targetBtn.classList.add('active');
        
        this.state.filters.status = targetBtn.getAttribute('data-filter');
        this.state.filters.currentPage = 0;
        this.fetchPatients();
    }

    changePage(delta) {
        const newPage = this.state.filters.currentPage + delta;
        if (newPage >= 0 && newPage < this.state.filters.totalPages) {
            this.state.filters.currentPage = newPage;
            this.fetchPatients();
        }
    }

    renderDashboard() {
        const metrics = this.state.data.metrics;
        const fallbackCount = this.state.data.patients.length;

        document.getElementById('stat-total').textContent = metrics?.totalPatients ?? fallbackCount;
        document.getElementById('stat-admitted').textContent = metrics?.admittedPatients ?? 0;
        document.getElementById('stat-discharged').textContent = metrics?.dischargedPatients ?? 0;
        
        // Ward Distribution
        const occupancy = metrics?.occupancyRate ?? 0;
        const distribution = metrics?.wardDistribution || {};
        const maxCount = Math.max(...Object.values(distribution), 1);
        
        document.getElementById('occupancy-rate').textContent = `${occupancy.toFixed(1)}% occupancy`;
        
        const container = document.getElementById('ward-metrics');
        if (Object.keys(distribution).length === 0) {
            container.innerHTML = '<div class="ward-label">Awaiting telemetry data...</div>';
            return;
        }

        container.innerHTML = Object.entries(distribution).map(([ward, count]) => `
            <div class="ward-row">
                <div class="ward-label">${this.toTitleCase(ward)}</div>
                <div class="ward-track"><div class="ward-fill" style="width:${(count / maxCount) * 100}%"></div></div>
                <div class="ward-count">${count}</div>
            </div>
        `).join('');
    }

    renderTable() {
        const tbody = document.getElementById('patientTableBody');
        const { patients } = this.state.data;
        const { status } = this.state.filters;
        
        // Client-side fallback filtering if API doesn't handle it
        const filtered = status === 'all' ? patients : patients.filter(p => p.status === status);

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--text-tertiary);">No records match current criteria.</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(patient => {
            const isAdmitted = patient.status === 'ADMITTED';
            const showDischarge = isAdmitted && this.state.auth.user.role === 'STAFF';
            
            return `
            <tr>
                <td style="font-family: monospace; color: var(--text-tertiary);">PAT-${patient.id}</td>
                <td>
                    <strong>${this.escapeHTML(patient.firstName)} ${this.escapeHTML(patient.lastName)}</strong>
                    <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-top: 4px;">
                        ${patient.reason ? `Reason: ${this.escapeHTML(patient.reason)}` : 'Standard Intake'}
                    </div>
                </td>
                <td>${patient.age} yrs • ${this.toTitleCase(patient.gender)}</td>
                <td><strong>${this.toTitleCase(patient.ward)}</strong></td>
                <td><span class="badge ${isAdmitted ? 'badge-admitted' : 'badge-discharged'}">${this.toTitleCase(patient.status)}</span></td>
                <td class="text-right">
                    <span style="font-size: 0.85rem; color: var(--text-tertiary); margin-right: 8px;">
                        ${patient.admissionDate || 'N/A'}
                    </span>
                    ${showDischarge ? `<button class="btn-icon discharge-btn" data-id="${patient.id}" title="Process Discharge"><i class="fa-solid fa-bed-pulse"></i></button>` : ''}
                </td>
            </tr>`;
        }).join('');

        // Bind dynamic buttons
        document.querySelectorAll('.discharge-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleDischarge(e.currentTarget.getAttribute('data-id')));
        });
    }

    renderAppointments() {
        const tbody = document.getElementById('appointmentsTableBody');
        const { appointments } = this.state.data;

        if (!appointments.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:40px; color:var(--text-tertiary);">No scheduled appointments found.</td></tr>';
            return;
        }

        tbody.innerHTML = appointments.map(item => `
            <tr>
                <td style="font-family: monospace;">APT-${item.id}</td>
                <td><strong>${this.escapeHTML(item.doctorName)}</strong></td>
                <td>${this.escapeHTML(item.patientName)}</td>
                <td>${item.appointmentDate}</td>
                <td>${item.appointmentTime}</td>
                <td><span class="badge badge-discharged">${this.escapeHTML(item.department)}</span></td>
                <td style="color: var(--text-secondary); font-size: 0.9rem;">${this.escapeHTML(item.notes || '-')}</td>
            </tr>
        `).join('');
    }

    renderProfile() {
        const { displayName, role } = this.state.auth.user;
        document.getElementById('profileName').textContent = displayName;
        document.getElementById('profileRole').textContent = `System Role: ${this.toTitleCase(role)}`;
        
        const permissions = role === 'STAFF'
            ? ['View Telemetry Data', 'Manage Appointments', 'Process Admissions', 'Authorize Discharges']
            : ['View Telemetry Data', 'Manage Appointments', 'Read Patient Records'];
            
        document.getElementById('profilePermissions').innerHTML = permissions
            .map(item => `<div class="permission-item"><i class="fa-solid fa-check text-primary"></i> ${item}</div>`)
            .join('');
    }

    renderPagination() {
        this.dom.prevBtn.disabled = this.state.filters.currentPage === 0;
        this.dom.nextBtn.disabled = this.state.filters.currentPage >= (this.state.filters.totalPages - 1);
        this.dom.pageLabel.textContent = `Page ${this.state.filters.currentPage + 1} of ${Math.max(this.state.filters.totalPages, 1)}`;
    }

    /* ======================================================================
       6. UTILITIES
       ====================================================================== */
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        
        const icon = type === 'success' 
            ? '<i class="fa-solid fa-circle-check"></i>' 
            : '<i class="fa-solid fa-triangle-exclamation"></i>';
            
        toast.className = `toast ${type}`;
        toast.innerHTML = `${icon} <span>${message}</span>`;
        toast.setAttribute('role', 'alert');
        
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    toggleButtonLoading(buttonElement, isLoading, originalText) {
        buttonElement.disabled = isLoading;
        buttonElement.innerHTML = isLoading 
            ? '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...' 
            : originalText;
    }

    escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    toTitleCase(str) {
        if (!str) return '';
        return str.toString().toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    }
}

// Instantiate the application
const app = new MedFlowApp();