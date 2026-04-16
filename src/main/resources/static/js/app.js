/* ==========================================================================
   MedFlow MVP - Core Application Logic
   ========================================================================== */

const API_URL = '/api/patients';
const METRICS_URL = '/api/patients/metrics';
const SEARCH_URL = '/api/patients/search';
const UNLOCK_CODE = 'medflow123';
let patientsData = [];
let dashboardMetrics = null;
let currentFilter = 'all';
let currentWard = '';
let searchTerm = '';
let currentPage = 0;
const PAGE_SIZE = 8;
let totalPages = 1;

document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupFilters();
    setupDirectoryControls();
    setupSystemLock();
    
    // Bind the admission form
    document.getElementById('patientForm').addEventListener('submit', handleAdmit);
    
    // Initial fetch from Java backend
    fetchPatients();
    
    console.log('[MedFlow OS] System Initialized successfully.');
});

// ==========================================================================
// 1. ROUTING & NAVIGATION
// ==========================================================================

function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const pages = document.querySelectorAll('.page');

    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active states
            navButtons.forEach(b => b.classList.remove('active'));
            pages.forEach(p => p.classList.remove('active'));

            // Set new active state
            const targetId = e.currentTarget.getAttribute('data-target');
            e.currentTarget.classList.add('active');
            document.getElementById(targetId).classList.add('active');
            
            // Refresh views if necessary
            if (targetId === 'view-dashboard') renderDashboard();
            if (targetId === 'view-directory') renderTable();
        });
    });
}

// ==========================================================================
// 2. API INTEGRATION
// ==========================================================================

async function fetchPatients() {
    try {
        const query = new URLSearchParams({
            page: String(currentPage),
            size: String(PAGE_SIZE)
        });
        if (currentFilter !== 'all') query.append('status', currentFilter);
        if (currentWard) query.append('ward', currentWard);
        if (searchTerm) query.append('search', searchTerm);

        const response = await fetch(`${SEARCH_URL}?${query.toString()}`);
        if (!response.ok) throw new Error('API connection failed');
        
        const pagePayload = await response.json();
        patientsData = pagePayload.content || [];
        totalPages = Math.max(pagePayload.totalPages || 1, 1);
        currentPage = Math.min(pagePayload.page || 0, totalPages - 1);
        await fetchDashboardMetrics();
        
        renderDashboard();
        renderTable();
        renderPagination();
    } catch (error) {
        console.error('Data Fetch Error:', error);
        showToast('Server disconnected. Unable to load data.', 'error');
    }
}

async function dischargePatient(id) {
    try {
        const response = await fetch(`${API_URL}/${id}/discharge`, { method: 'PATCH' });
        if (!response.ok) throw new Error('Unable to discharge patient');
        showToast(`Patient PAT-${id} discharged.`, 'success');
        await fetchPatients();
    } catch (error) {
        console.error('Discharge Error:', error);
        showToast(error.message || 'Discharge failed.', 'error');
    }
}

async function fetchDashboardMetrics() {
    try {
        const response = await fetch(METRICS_URL);
        if (!response.ok) throw new Error('Metrics endpoint unavailable');
        dashboardMetrics = await response.json();
    } catch (error) {
        console.error('Metrics Fetch Error:', error);
        dashboardMetrics = null;
    }
}

async function handleAdmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
    
    const newPatient = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        age: parseInt(document.getElementById('age').value),
        gender: document.getElementById('gender').value,
        ward: document.getElementById('ward').value,
        reason: document.getElementById('reason').value.trim() || null
    };
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPatient)
        });
        
        if (!response.ok) {
            const errorPayload = await response.json().catch(() => null);
            const firstValidationError = errorPayload?.validationErrors
                ? Object.values(errorPayload.validationErrors)[0]
                : null;
            throw new Error(firstValidationError || errorPayload?.message || 'Failed to persist to database');
        }
        
        showToast(`${escapeHTML(newPatient.firstName)} admitted successfully.`, 'success');
        document.getElementById('patientForm').reset();
        
        // Refresh data and jump to directory
        await fetchPatients();
        document.querySelector('[data-target="view-directory"]').click();
        
    } catch (error) {
        console.error('Admission Error:', error);
        showToast(error.message || 'Admission failed. Verify server status.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Process Admission';
    }
}

// ==========================================================================
// 3. UI RENDERING & DATA BINDING
// ==========================================================================

function renderDashboard() {
    const total = dashboardMetrics?.totalPatients ?? patientsData.length;
    const admitted = dashboardMetrics?.admittedPatients ?? patientsData.filter(p => p.status === 'ADMITTED').length;
    const discharged = dashboardMetrics?.dischargedPatients ?? patientsData.filter(p => p.status === 'DISCHARGED').length;
    
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-admitted').textContent = admitted;
    document.getElementById('stat-discharged').textContent = discharged;
    renderWardMetrics();
}

function renderTable() {
    const tbody = document.getElementById('patientTableBody');
    tbody.innerHTML = '';
    
    const filtered = currentFilter === 'all' 
        ? patientsData 
        : patientsData.filter(p => p.status === currentFilter);
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 40px; color: var(--text-light);">No records match current filters.</td></tr>`;
        return;
    }
    
    // Sort array so newest patients appear at the top
    const sortedData = [...filtered].sort((a, b) => b.id - a.id);
    
    sortedData.forEach(patient => {
        const isAdmitted = patient.status === 'ADMITTED';
        const badgeClass = isAdmitted ? 'badge-admitted' : 'badge-discharged';
        
        const row = document.createElement('tr');
        row.style.opacity = isAdmitted ? '1' : '0.6';
        
        row.innerHTML = `
            <td style="font-family: monospace; color: var(--text-light);">PAT-${patient.id}</td>
            <td>
                <strong>${escapeHTML(patient.firstName)} ${escapeHTML(patient.lastName)}</strong>
                <div style="font-size: 0.8rem; color: var(--text-light); margin-top: 4px;">Reason: ${escapeHTML(patient.reason)}</div>
            </td>
            <td>${patient.age} yrs • ${toTitleCase(patient.gender)}</td>
            <td><strong>${toTitleCase(patient.ward)}</strong></td>
            <td><span class="badge ${badgeClass}">${toTitleCase(patient.status)}</span></td>
            <td class="text-right">
                <span style="font-size: 0.85rem; color: var(--text-light); margin-right: 8px;">
                    ${patient.admissionDate}
                </span>
                ${isAdmitted ? `<button class="action-btn discharge" data-id="${patient.id}" title="Discharge patient"><i class="fa-solid fa-bed-pulse"></i></button>` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });

    bindDischargeActions();
}

// ==========================================================================
// 4. HELPER UTILITIES
// ==========================================================================

function setupFilters() {
    const filters = document.querySelectorAll('.filter-btn');
    filters.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filters.forEach(f => f.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            currentFilter = e.currentTarget.getAttribute('data-filter');
            currentPage = 0;
            fetchPatients();
        });
    });
}

function setupDirectoryControls() {
    const searchInput = document.getElementById('searchInput');
    const wardFilter = document.getElementById('wardFilter');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value.trim();
        currentPage = 0;
        debounceFetch();
    });

    wardFilter.addEventListener('change', (e) => {
        currentWard = e.target.value;
        currentPage = 0;
        fetchPatients();
    });

    prevBtn.addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage -= 1;
            fetchPatients();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages - 1) {
            currentPage += 1;
            fetchPatients();
        }
    });
}

function setupSystemLock() {
    const lockBtn = document.getElementById('systemLockBtn');
    const lockScreen = document.getElementById('lock-screen');
    const unlockBtn = document.getElementById('unlockBtn');
    const unlockCodeInput = document.getElementById('unlockCodeInput');

    lockBtn.addEventListener('click', () => {
        lockScreen.classList.remove('hidden');
        unlockCodeInput.value = '';
        unlockCodeInput.focus();
        showToast('System locked.', 'success');
    });

    unlockBtn.addEventListener('click', () => attemptUnlock(lockScreen, unlockCodeInput));
    unlockCodeInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            attemptUnlock(lockScreen, unlockCodeInput);
        }
    });
}

function attemptUnlock(lockScreen, unlockCodeInput) {
    if (unlockCodeInput.value === UNLOCK_CODE) {
        lockScreen.classList.add('hidden');
        showToast('System unlocked.', 'success');
        return;
    }
    showToast('Invalid unlock code. Try again.', 'error');
}

let debounceTimer;
function debounceFetch() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fetchPatients(), 250);
}

function renderPagination() {
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const pageLabel = document.getElementById('pageLabel');
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage >= totalPages - 1;
    pageLabel.textContent = `Page ${currentPage + 1} of ${Math.max(totalPages, 1)}`;
}

function bindDischargeActions() {
    document.querySelectorAll('.action-btn.discharge').forEach((button) => {
        button.addEventListener('click', () => {
            const patientId = button.getAttribute('data-id');
            dischargePatient(patientId);
        });
    });
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    const icon = type === 'success' ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-solid fa-triangle-exclamation"></i>';
    
    toast.className = `toast ${type}`;
    toast.innerHTML = `${icon} <span>${message}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => { 
        if(toast.parentElement) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }
    }, 3500);
}

function renderWardMetrics() {
    const occupancyTag = document.getElementById('occupancy-rate');
    const wardMetrics = document.getElementById('ward-metrics');
    const distribution = dashboardMetrics?.wardDistribution || {};
    const maxCount = Math.max(...Object.values(distribution), 1);

    const occupancy = dashboardMetrics?.occupancyRate ?? 0;
    occupancyTag.textContent = `${occupancy.toFixed(1)}% occupancy`;

    if (Object.keys(distribution).length === 0) {
        wardMetrics.innerHTML = '<div class="ward-label">No ward analytics yet.</div>';
        return;
    }

    wardMetrics.innerHTML = Object.entries(distribution)
        .map(([ward, count]) => {
            const width = (count / maxCount) * 100;
            return `
                <div class="ward-row">
                    <div class="ward-label">${toTitleCase(ward)}</div>
                    <div class="ward-track"><div class="ward-fill" style="width:${width}%"></div></div>
                    <div class="ward-count">${count}</div>
                </div>
            `;
        })
        .join('');
}

// Enterprise Security: Prevents XSS (Cross-Site Scripting) attacks
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function toTitleCase(value) {
    if (!value) return '';
    return value.toString().toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}