/**
 * K8s Agent Dashboard - Application Logic
 * Production-ready JavaScript with modular architecture
 */

// ============================================
// MOCK DATA
// ============================================
const CLUSTERS_DATA = [
    { id: 1, name: 'prod-cluster-01', agent: 'agent-alpha', k8sStatus: 'active', agentStatus: 'active', version: 'v1.28.2' },
    { id: 2, name: 'prod-cluster-02', agent: 'agent-alpha', k8sStatus: 'active', agentStatus: 'active', version: 'v1.28.2' },
    { id: 3, name: 'staging-ift', agent: 'agent-beta', k8sStatus: 'active', agentStatus: 'warning', version: 'v1.27.5' },
    { id: 4, name: 'dev-cluster-01', agent: 'agent-gamma', k8sStatus: 'inactive', agentStatus: 'inactive', version: 'v1.28.0' },
    { id: 5, name: 'prod-cluster-03', agent: 'agent-alpha', k8sStatus: 'active', agentStatus: 'active', version: 'v1.28.2' },
    { id: 6, name: 'psi-cluster-01', agent: 'agent-delta', k8sStatus: 'active', agentStatus: 'active', version: 'v1.28.1' },
    { id: 7, name: 'prod-cluster-04', agent: 'agent-alpha', k8sStatus: 'warning', agentStatus: 'active', version: 'v1.28.2' },
    { id: 8, name: 'dev-cluster-02', agent: 'agent-gamma', k8sStatus: 'active', agentStatus: 'inactive', version: 'v1.27.8' },
    { id: 9, name: 'staging-psi', agent: 'agent-beta', k8sStatus: 'active', agentStatus: 'active', version: 'v1.28.0' },
    { id: 10, name: 'prod-cluster-05', agent: 'agent-epsilon', k8sStatus: 'active', agentStatus: 'active', version: 'v1.28.2' }
];

const AGENT_DETAILS = {
    'agent-alpha': {
        name: 'Agent Alpha',
        id: 'AGT-001',
        version: 'v2.3.2',
        jiraTicket: 'K8S-2472',
        environments: {
            ift: {
                active: true,
                version: 'v2.3.1',
                jira: 'K8S-2471',
                config: {
                    distro: 'Ubuntu 22.04 LTS',
                    kafka: 'topic1, topic2, topic3',
                    databases: 'postgres-main, mysql-replica',
                    securityManager: 'enabled'
                }
            },
            psi: {
                active: false,
                version: 'v2.3.0',
                jira: 'K8S-2468',
                config: {
                    distro: 'CentOS 8.5',
                    kafka: 'psi-kafka-cluster',
                    databases: 'psi-postgres-ha',
                    securityManager: 'disabled'
                }
            },
            prod: {
                active: true,
                version: 'v2.3.2',
                jira: 'K8S-2472',
                config: {
                    distro: 'RHEL 9.0',
                    kafka: 'prod-kafka-01, prod-kafka-02, prod-kafka-03',
                    databases: 'prod-pg-cluster, prod-mysql-cluster',
                    securityManager: 'enabled'
                }
            }
        }
    },
    'agent-beta': {
        name: 'Agent Beta',
        id: 'AGT-002',
        version: 'v2.2.8',
        jiraTicket: 'K8S-2455',
        environments: {
            ift: {
                active: true,
                version: 'v2.2.8',
                jira: 'K8S-2455',
                config: {
                    distro: 'Ubuntu 20.04 LTS',
                    kafka: 'beta-topic-a, beta-topic-b',
                    databases: 'beta-mysql-main',
                    securityManager: 'enabled'
                }
            },
            psi: {
                active: true,
                version: 'v2.2.7',
                jira: 'K8S-2450',
                config: {
                    distro: 'Ubuntu 20.04 LTS',
                    kafka: 'beta-psi-kafka',
                    databases: 'beta-psi-postgres',
                    securityManager: 'enabled'
                }
            },
            prod: {
                active: false,
                version: 'v2.2.5',
                jira: 'K8S-2440',
                config: {
                    distro: 'Ubuntu 20.04 LTS',
                    kafka: 'beta-prod-kafka',
                    databases: 'beta-prod-mysql',
                    securityManager: 'disabled'
                }
            }
        }
    },
    'agent-gamma': {
        name: 'Agent Gamma',
        id: 'AGT-003',
        version: 'v2.1.5',
        jiraTicket: 'K8S-2430',
        environments: {
            ift: {
                active: false,
                version: 'v2.1.5',
                jira: 'K8S-2430',
                config: {
                    distro: 'Debian 11',
                    kafka: 'gamma-dev-topics',
                    databases: 'gamma-dev-db',
                    securityManager: 'disabled'
                }
            },
            psi: {
                active: false,
                version: 'v2.1.4',
                jira: 'K8S-2425',
                config: {
                    distro: 'Debian 11',
                    kafka: 'gamma-psi-kafka',
                    databases: 'gamma-psi-db',
                    securityManager: 'disabled'
                }
            },
            prod: {
                active: false,
                version: 'v2.1.0',
                jira: 'K8S-2400',
                config: {
                    distro: 'Debian 11',
                    kafka: 'gamma-prod-kafka',
                    databases: 'gamma-prod-db',
                    securityManager: 'disabled'
                }
            }
        }
    },
    'agent-delta': {
        name: 'Agent Delta',
        id: 'AGT-004',
        version: 'v2.3.0',
        jiraTicket: 'K8S-2460',
        environments: {
            ift: {
                active: true,
                version: 'v2.3.0',
                jira: 'K8S-2460',
                config: {
                    distro: 'Rocky Linux 9',
                    kafka: 'delta-ift-kafka-01',
                    databases: 'delta-ift-postgres-ha',
                    securityManager: 'enabled'
                }
            },
            psi: {
                active: true,
                version: 'v2.2.9',
                jira: 'K8S-2458',
                config: {
                    distro: 'Rocky Linux 9',
                    kafka: 'delta-psi-kafka-01',
                    databases: 'delta-psi-mysql-cluster',
                    securityManager: 'enabled'
                }
            },
            prod: {
                active: true,
                version: 'v2.3.0',
                jira: 'K8S-2462',
                config: {
                    distro: 'Rocky Linux 9',
                    kafka: 'delta-prod-kafka-01, delta-prod-kafka-02',
                    databases: 'delta-prod-postgres, delta-prod-mysql',
                    securityManager: 'enabled'
                }
            }
        }
    },
    'agent-epsilon': {
        name: 'Agent Epsilon',
        id: 'AGT-005',
        version: 'v2.4.0-beta',
        jiraTicket: 'K8S-2480',
        environments: {
            ift: {
                active: true,
                version: 'v2.4.0-beta',
                jira: 'K8S-2480',
                config: {
                    distro: 'AlmaLinux 9',
                    kafka: 'epsilon-next-gen-kafka',
                    databases: 'epsilon-new-db-cluster',
                    securityManager: 'enabled'
                }
            },
            psi: {
                active: false,
                version: 'v2.3.5',
                jira: 'K8S-2475',
                config: {
                    distro: 'AlmaLinux 9',
                    kafka: 'epsilon-psi-kafka',
                    databases: 'epsilon-psi-db',
                    securityManager: 'testing'
                }
            },
            prod: {
                active: false,
                version: 'v2.3.2',
                jira: 'K8S-2470',
                config: {
                    distro: 'AlmaLinux 9',
                    kafka: 'epsilon-prod-kafka',
                    databases: 'epsilon-prod-db',
                    securityManager: 'pending'
                }
            }
        }
    }
};

const JIRA_TICKETS = {
    'K8S-2471': {
        title: 'Update IFT Environment Configuration',
        status: 'In Progress',
        assignee: 'John Doe',
        priority: 'High',
        description: 'Update Kafka topics and database connections for IFT environment'
    },
    'K8S-2468': {
        title: 'PSI Environment Security Patch',
        status: 'To Do',
        assignee: 'Jane Smith',
        priority: 'Medium',
        description: 'Apply security patches to PSI environment components'
    },
    'K8S-2472': {
        title: 'Production Release v2.3.2',
        status: 'Done',
        assignee: 'DevOps Team',
        priority: 'Critical',
        description: 'Deploy latest agent version to production clusters'
    },
    'K8S-2455': {
        title: 'Agent Beta IFT Deployment',
        status: 'Done',
        assignee: 'Beta Team',
        priority: 'High',
        description: 'Deploy Agent Beta to IFT environment with new Kafka configuration'
    },
    'K8S-2450': {
        title: 'Agent Beta PSI Upgrade',
        status: 'In Progress',
        assignee: 'Beta Team',
        priority: 'Medium',
        description: 'Upgrade Agent Beta in PSI environment'
    },
    'K8S-2440': {
        title: 'Agent Beta PROD Rollback',
        status: 'To Do',
        assignee: 'Beta Team',
        priority: 'Low',
        description: 'Rollback Agent Beta in PROD due to compatibility issues'
    },
    'K8S-2430': {
        title: 'Agent Gamma Initial Setup',
        status: 'Blocked',
        assignee: 'Gamma Team',
        priority: 'Medium',
        description: 'Initial setup of Agent Gamma in development environment'
    },
    'K8S-2425': {
        title: 'Agent Gamma PSI Configuration',
        status: 'To Do',
        assignee: 'Gamma Team',
        priority: 'Low',
        description: 'Configure Agent Gamma for PSI testing'
    },
    'K8S-2400': {
        title: 'Agent Gamma PROD Planning',
        status: 'To Do',
        assignee: 'Gamma Team',
        priority: 'Low',
        description: 'Plan production deployment strategy for Agent Gamma'
    },
    'K8S-2460': {
        title: 'Agent Delta IFT Release',
        status: 'Done',
        assignee: 'Delta Team',
        priority: 'High',
        description: 'Release Agent Delta to IFT with Rocky Linux support'
    },
    'K8S-2458': {
        title: 'Agent Delta PSI Migration',
        status: 'Done',
        assignee: 'Delta Team',
        priority: 'High',
        description: 'Migrate Agent Delta to PSI environment'
    },
    'K8S-2462': {
        title: 'Agent Delta Production Launch',
        status: 'In Progress',
        assignee: 'Delta Team',
        priority: 'Critical',
        description: 'Launch Agent Delta in production with full HA configuration'
    },
    'K8S-2480': {
        title: 'Agent Epsilon Beta Testing',
        status: 'In Progress',
        assignee: 'Epsilon Team',
        priority: 'High',
        description: 'Beta testing of next-generation Agent Epsilon'
    },
    'K8S-2475': {
        title: 'Agent Epsilon PSI Preparation',
        status: 'To Do',
        assignee: 'Epsilon Team',
        priority: 'Medium',
        description: 'Prepare PSI environment for Agent Epsilon deployment'
    },
    'K8S-2470': {
        title: 'Agent Epsilon PROD Roadmap',
        status: 'To Do',
        assignee: 'Epsilon Team',
        priority: 'Low',
        description: 'Define production roadmap for Agent Epsilon'
    }
};

// ============================================
// STATE MANAGEMENT
// ============================================
const AppState = {
    currentPage: 'home',
    currentAgent: null,
    currentEnv: 'ift',
    clusters: [...CLUSTERS_DATA],
    searchQuery: '',
    sidebarCollapsed: false,
    
    // Getters
    getActiveClusters() {
        return this.clusters.filter(c => c.k8sStatus === 'active').length;
    },
    
    getWarningClusters() {
        return this.clusters.filter(c => c.k8sStatus === 'warning').length;
    },
    
    getInactiveClusters() {
        return this.clusters.filter(c => c.k8sStatus === 'inactive').length;
    }
};

// ============================================
// AUDIO MANAGER (Sound Effects)
// ============================================
const AudioManager = {
    audioContext: null,
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    },
    
    playClick() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    },
    
    playSuccess() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = 600;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
        
        // Second tone
        setTimeout(() => {
            const osc2 = this.audioContext.createOscillator();
            const gain2 = this.audioContext.createGain();
            
            osc2.connect(gain2);
            gain2.connect(this.audioContext.destination);
            
            osc2.frequency.value = 900;
            osc2.type = 'sine';
            
            gain2.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            
            osc2.start(this.audioContext.currentTime);
            osc2.stop(this.audioContext.currentTime + 0.2);
        }, 100);
    },
    
    playError() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = 300;
        oscillator.type = 'sawtooth';
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
};

// ============================================
// PARTICLE SYSTEM
// ============================================
const ParticleSystem = {
    canvas: null,
    ctx: null,
    particles: [],
    animationId: null,
    
    init() {
        this.canvas = document.getElementById('particle-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.createParticles();
        this.animate();
        
        window.addEventListener('resize', () => this.resize());
    },
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },
    
    createParticles() {
        this.particles = [];
        const particleCount = Math.floor((this.canvas.width * this.canvas.height) / 15000);
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    },
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            
            // Wrap around edges
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;
            
            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(0, 255, 136, ${p.opacity})`;
            this.ctx.fill();
        });
        
        // Draw connections
        this.particles.forEach((p1, i) => {
            this.particles.slice(i + 1).forEach(p2 => {
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 100) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.strokeStyle = `rgba(0, 255, 136, ${0.1 * (1 - dist / 100)})`;
                    this.ctx.stroke();
                }
            });
        });
        
        this.animationId = requestAnimationFrame(() => this.animate());
    },
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
};

// ============================================
// UI MANAGER
// ============================================
const UIManager = {
    // Show toast notification
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    
    // Update stats display
    updateStats() {
        document.getElementById('totalClusters').textContent = AppState.clusters.length;
        document.getElementById('activeClusters').textContent = AppState.getActiveClusters();
        document.getElementById('warningClusters').textContent = AppState.getWarningClusters();
        document.getElementById('inactiveClusters').textContent = AppState.getInactiveClusters();
    },
    
    // Render cluster cards
    renderClusters(filter = '') {
        const grid = document.getElementById('clusterGrid');
        const filtered = AppState.clusters.filter(c => 
            c.name.toLowerCase().includes(filter.toLowerCase()) ||
            c.agent.toLowerCase().includes(filter.toLowerCase())
        );
        
        grid.innerHTML = '';
        
        filtered.forEach((cluster, index) => {
            const card = document.createElement('div');
            card.className = 'cluster-card stagger-delay';
            card.style.animationDelay = `${index * 0.05}s`;
            card.draggable = true;
            card.dataset.id = cluster.id;
            
            const statusClass = cluster.k8sStatus === 'active' ? 'active' : 
                               cluster.k8sStatus === 'warning' ? 'warning' : 'inactive';
            const statusText = cluster.k8sStatus === 'active' ? '🟢 Active' :
                              cluster.k8sStatus === 'warning' ? '🟡 Warning' : '🔴 Inactive';
            
            card.innerHTML = `
                <div class="cluster-header">
                    <div>
                        <div class="cluster-name">${cluster.name}</div>
                        <div class="cluster-meta">Agent: ${cluster.agent}</div>
                        <div class="cluster-meta">Version: ${cluster.version}</div>
                    </div>
                    <span class="status-badge ${statusClass}">
                        <span class="status-dot"></span>
                        ${statusText}
                    </span>
                </div>
            `;
            
            card.addEventListener('click', () => Navigation.showAgentPage(cluster.agent));
            grid.appendChild(card);
        });
        
        this.setupDragAndDrop();
    },
    
    // Setup drag and drop for cluster cards
    setupDragAndDrop() {
        const cards = document.querySelectorAll('.cluster-card');
        let draggedCard = null;
        
        cards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                draggedCard = card;
                card.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });
            
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                draggedCard = null;
            });
            
            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });
            
            card.addEventListener('drop', (e) => {
                e.preventDefault();
                if (draggedCard && draggedCard !== card) {
                    const grid = document.getElementById('clusterGrid');
                    const cards = Array.from(grid.querySelectorAll('.cluster-card'));
                    const draggedIndex = cards.indexOf(draggedCard);
                    const droppedIndex = cards.indexOf(card);
                    
                    if (draggedIndex < droppedIndex) {
                        grid.insertBefore(draggedCard, card.nextSibling);
                    } else {
                        grid.insertBefore(draggedCard, card);
                    }
                    
                    // Update state
                    const temp = AppState.clusters[draggedIndex];
                    AppState.clusters[draggedIndex] = AppState.clusters[droppedIndex];
                    AppState.clusters[droppedIndex] = temp;
                }
            });
        });
    }
};

// ============================================
// NAVIGATION MANAGER
// ============================================
const Navigation = {
    // Navigate to a page using History API
    navigate(page, params = {}) {
        const url = new URL(window.location);
        url.searchParams.set('page', page);
        Object.keys(params).forEach(key => url.searchParams.set(key, params[key]));
        
        window.history.pushState({ page, params }, '', url);
        this.handleNavigation(page, params);
    },
    
    // Handle navigation
    handleNavigation(page, params = {}) {
        AudioManager.playClick();
        
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        // Show target page
        const targetPage = document.getElementById(`page-${page}`);
        if (targetPage) {
            targetPage.classList.add('active');
            AppState.currentPage = page;
        }
        
        // Update menu active state
        document.querySelectorAll('.menu-item, .submenu-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page || item.dataset.menu === page) {
                item.classList.add('active');
            }
        });
        
        // Page-specific initialization
        if (page === 'home') {
            UIManager.renderClusters(AppState.searchQuery);
            UIManager.updateStats();
        } else if (page === 'agent' && params.agent) {
            this.initAgentPage(params.agent);
        }
    },
    
    // Show agent details page
    showAgentPage(agentId) {
        this.navigate('agent', { agent: agentId });
    },
    
    // Initialize agent page
    initAgentPage(agentId) {
        const agent = AGENT_DETAILS[agentId] || AGENT_DETAILS['agent-alpha'];
        AppState.currentAgent = agentId;
        
        document.getElementById('agentName').textContent = agent.name;
        document.getElementById('agentId').textContent = `ID: ${agent.id}`;
        document.getElementById('agentVersion').textContent = agent.version;
        document.getElementById('jiraLink').textContent = `JIRA #${agent.jiraTicket}`;
        document.getElementById('jiraLink').href = `#ticket-${agent.jiraTicket}`;
        
        // Update environment tabs
        this.updateEnvTabs(agent);
    },
    
    // Update environment tabs
    updateEnvTabs(agent) {
        Object.keys(agent.environments).forEach(env => {
            const envConfig = agent.environments[env];
            const tab = document.querySelector(`.env-tab[data-env="${env}"]`);
            if (!tab) return;
            
            const statusEl = tab.querySelector('.tab-status');
            const badgeEl = tab.querySelector('.tab-badge');
            
            if (envConfig.active) {
                statusEl.className = 'tab-status status-active';
                badgeEl.textContent = 'Active';
            } else {
                statusEl.className = 'tab-status status-inactive';
                badgeEl.textContent = 'Inactive';
            }
            
            // Update version and jira in release card
            const versionEl = document.getElementById(`version${env.toUpperCase()}`);
            if (versionEl) versionEl.textContent = envConfig.version;
            
            const jiraEl = document.querySelector(`[data-tab="${env}"] .jira-ticket`);
            if (jiraEl) {
                jiraEl.textContent = envConfig.jira;
                jiraEl.href = `#ticket-${envConfig.jira}`;
            }
            
            // Update config values in release details
            const tabContent = document.querySelector(`[data-tab="${env}"]`);
            if (tabContent && envConfig.config) {
                const configItems = tabContent.querySelectorAll('.config-item');
                configItems.forEach(item => {
                    const label = item.querySelector('.config-label')?.textContent;
                    const valueEl = item.querySelector('.config-value');
                    if (!label || !valueEl) return;
                    
                    let configKey;
                    if (label.includes('Дистрибутив')) configKey = 'distro';
                    else if (label.includes('Kafka')) configKey = 'kafka';
                    else if (label.includes('Базы данных')) configKey = 'databases';
                    else if (label.includes('Security')) configKey = 'securityManager';
                    
                    if (configKey && envConfig.config[configKey]) {
                        valueEl.textContent = envConfig.config[configKey];
                        valueEl.className = 'config-value';
                        if (configKey === 'securityManager') {
                            const val = envConfig.config[configKey];
                            if (val === 'enabled' || val === 'testing') {
                                valueEl.classList.add('enabled');
                            } else if (val === 'disabled') {
                                valueEl.classList.add('disabled');
                            }
                        }
                    }
                });
            }
        });
    },
    
    // Handle browser back/forward
    handlePopState(event) {
        const params = new URLSearchParams(window.location.search);
        const page = params.get('page') || 'home';
        const agent = params.get('agent');
        
        this.handleNavigation(page, agent ? { agent } : {});
    }
};

// ============================================
// SEARCH MANAGER
// ============================================
const SearchManager = {
    init() {
        const input = document.getElementById('clusterSearch');
        const dropdown = document.getElementById('searchDropdown');
        
        input.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            AppState.searchQuery = query;
            
            if (query.length > 0) {
                this.showResults(query);
                UIManager.renderClusters(query);
            } else {
                dropdown.classList.remove('active');
                UIManager.renderClusters();
            }
        });
        
        // Close dropdown on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-wrapper')) {
                dropdown.classList.remove('active');
            }
        });
    },
    
    showResults(query) {
        const dropdown = document.getElementById('searchDropdown');
        const results = AppState.clusters.filter(c => 
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.agent.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
        
        if (results.length === 0) {
            dropdown.innerHTML = '<div class="search-result-item">No results found</div>';
        } else {
            dropdown.innerHTML = results.map(r => `
                <div class="search-result-item" data-agent="${r.agent}">
                    <strong>${r.name}</strong>
                    <span>${r.agent}</span>
                </div>
            `).join('');
            
            // Add click handlers
            dropdown.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const agent = item.dataset.agent;
                    Navigation.showAgentPage(agent);
                    dropdown.classList.remove('active');
                    document.getElementById('clusterSearch').value = '';
                });
            });
        }
        
        dropdown.classList.add('active');
    }
};

// ============================================
// TAB MANAGER
// ============================================
const TabManager = {
    init() {
        const tabs = document.querySelectorAll('.env-tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const env = tab.dataset.env;
                this.switchTab(env);
            });
        });
    },
    
    switchTab(env) {
        AudioManager.playClick();
        AppState.currentEnv = env;
        
        // Update tab buttons
        document.querySelectorAll('.env-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.env === env);
        });
        
        // Update tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.tab === env);
        });
    }
};

// ============================================
// RELEASE CARD MANAGER
// ============================================
const ReleaseManager = {
    toggleExpand(env) {
        AudioManager.playClick();
        const card = document.getElementById(`releaseCard${env.charAt(0).toUpperCase() + env.slice(1)}`);
        card.classList.toggle('expanded');
        
        const btn = card.querySelector('.toggle-expand-btn');
        btn.style.transform = card.classList.contains('expanded') ? 'rotate(180deg)' : 'none';
    }
};

// Make toggleReleaseExpand globally available
window.toggleReleaseExpand = (env) => ReleaseManager.toggleExpand(env);

// ============================================
// JIRA MODAL MANAGER
// ============================================
const JiraModalManager = {
    modal: null,
    
    init() {
        this.modal = document.getElementById('jiraModal');
        
        // Close handlers
        document.getElementById('closeJiraModal').addEventListener('click', () => this.close());
        document.getElementById('closeJiraBtn').addEventListener('click', () => this.close());
        
        // JIRA link handlers
        document.querySelectorAll('.jira-ticket, .jira-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const ticket = link.textContent.replace('Jira: ', '').replace('JIRA #', '');
                this.show(ticket);
            });
        });
        
        // Close on overlay click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
        
        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.close();
            }
        });
    },
    
    show(ticketId) {
        AudioManager.playClick();
        const ticket = JIRA_TICKETS[ticketId];
        
        if (!ticket) return;
        
        document.getElementById('jiraModalTitle').textContent = ticketId;
        document.getElementById('jiraModalBody').innerHTML = `
            <p><strong>Title:</strong> ${ticket.title}</p>
            <p><strong>Status:</strong> ${ticket.status}</p>
            <p><strong>Assignee:</strong> ${ticket.assignee}</p>
            <p><strong>Priority:</strong> ${ticket.priority}</p>
            <p><strong>Description:</strong> ${ticket.description}</p>
        `;
        
        this.modal.classList.add('active');
    },
    
    close() {
        this.modal.classList.remove('active');
    }
};

// ============================================
// ACTION BUTTON HANDLERS
// ============================================
const ActionHandler = {
    init() {
        // Install button
        document.querySelectorAll('[data-action="install"]').forEach(btn => {
            btn.addEventListener('click', () => this.handleInstall(btn));
        });
        
        // Check button
        document.querySelectorAll('[data-action="check"]').forEach(btn => {
            btn.addEventListener('click', () => this.handleCheck(btn));
        });
        
        // Namespace button
        document.querySelectorAll('[data-action="namespace"]').forEach(btn => {
            btn.addEventListener('click', () => this.handleNamespace(btn));
        });
    },
    
    async handleInstall(btn) {
        AudioManager.playClick();
        btn.classList.add('loading');
        
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        btn.classList.remove('loading');
        AudioManager.playSuccess();
        UIManager.showToast('Installation completed successfully!', 'success');
    },
    
    async handleCheck(btn) {
        AudioManager.playClick();
        btn.classList.add('loading');
        
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        btn.classList.remove('loading');
        AudioManager.playSuccess();
        UIManager.showToast('Health check passed!', 'success');
    },
    
    handleNamespace(btn) {
        AudioManager.playClick();
        UIManager.showToast('Opening namespace viewer...', 'info');
    }
};

// ============================================
// SIDEBAR TOGGLE
// ============================================
const SidebarToggle = {
    init() {
        const toggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        
        toggle.addEventListener('click', () => {
            AudioManager.playClick();
            sidebar.classList.toggle('collapsed');
            AppState.sidebarCollapsed = !AppState.sidebarCollapsed;
        });
    }
};

// ============================================
// BACK BUTTON HANDLER
// ============================================
const BackButtonHandler = {
    init() {
        // Main back button (agent page)
        const backBtn = document.getElementById('backToHome');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                Navigation.navigate('home');
            });
        }
        
        // Settings page back button
        const backSettings = document.getElementById('backToHomeSettings');
        if (backSettings) {
            backSettings.addEventListener('click', () => {
                Navigation.navigate('home');
            });
        }
        
        // GitOps page back button
        const backGitops = document.getElementById('backToHomeGitops');
        if (backGitops) {
            backGitops.addEventListener('click', () => {
                Navigation.navigate('home');
            });
        }
        
        // Jenkins page back button
        const backJenkins = document.getElementById('backToHomeJenkins');
        if (backJenkins) {
            backJenkins.addEventListener('click', () => {
                Navigation.navigate('home');
            });
        }
        
        // Monitoring page back button
        const backMonitoring = document.getElementById('backToHomeMonitoring');
        if (backMonitoring) {
            backMonitoring.addEventListener('click', () => {
                Navigation.navigate('home');
            });
        }
    }
};

// ============================================
// REFRESH BUTTON HANDLER
// ============================================
const RefreshHandler = {
    init() {
        const refreshBtn = document.getElementById('refreshBtn');
        
        refreshBtn.addEventListener('click', async () => {
            AudioManager.playClick();
            refreshBtn.classList.add('loading');
            
            // Simulate data refresh
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            refreshBtn.classList.remove('loading');
            AudioManager.playSuccess();
            UIManager.showToast('Data refreshed successfully!', 'success');
            UIManager.renderClusters(AppState.searchQuery);
            UIManager.updateStats();
        });
    }
};

// ============================================
// ADD CLUSTER BUTTON (Placeholder)
// ============================================
const AddClusterHandler = {
    init() {
        const addBtn = document.getElementById('addClusterBtn');
        
        addBtn.addEventListener('click', () => {
            AudioManager.playClick();
            UIManager.showToast('Add cluster feature coming soon!', 'info');
        });
    }
};

// ============================================
// MENU NAVIGATION
// ============================================
const MenuNavigation = {
    init() {
        // Main menu items
        document.querySelectorAll('.menu-item[data-menu]').forEach(item => {
            item.addEventListener('click', () => {
                const menu = item.dataset.menu;
                
                // Toggle active state
                document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
                item.classList.add('active');
                
                AudioManager.playClick();
            });
        });
        
        // Submenu items
        document.querySelectorAll('.submenu-item[data-page]').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                
                if (page === 'agent-settings') {
                    Navigation.showAgentPage('agent-alpha');
                } else {
                    Navigation.navigate(page);
                }
            });
        });
    }
};

// ============================================
// REAL-TIME STATUS UPDATES
// ============================================
const StatusUpdater = {
    intervalId: null,
    
    start() {
        // Update statuses every 30 seconds
        this.intervalId = setInterval(() => {
            this.updateRandomStatus();
        }, 30000);
    },
    
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    },
    
    updateRandomStatus() {
        // Randomly update one cluster status for demo purposes
        const randomIndex = Math.floor(Math.random() * AppState.clusters.length);
        const cluster = AppState.clusters[randomIndex];
        const statuses = ['active', 'warning', 'inactive'];
        const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        if (cluster.k8sStatus !== newStatus) {
            cluster.k8sStatus = newStatus;
            UIManager.renderClusters(AppState.searchQuery);
            UIManager.updateStats();
            
            const statusMessages = {
                active: `Cluster ${cluster.name} is now online`,
                warning: `Warning: Cluster ${cluster.name} has issues`,
                inactive: `Alert: Cluster ${cluster.name} is offline`
            };
            
            const messageType = newStatus === 'active' ? 'success' : 
                               newStatus === 'warning' ? 'warning' : 'error';
            
            UIManager.showToast(statusMessages[newStatus], messageType);
        }
    }
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    AudioManager.init();
    ParticleSystem.init();
    
    // Initial render
    UIManager.updateStats();
    UIManager.renderClusters();
    
    // Initialize managers
    SearchManager.init();
    TabManager.init();
    JiraModalManager.init();
    ActionHandler.init();
    SidebarToggle.init();
    BackButtonHandler.init();
    RefreshHandler.init();
    AddClusterHandler.init();
    MenuNavigation.init();
    
    // Handle initial navigation from URL
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page') || 'home';
    const agent = params.get('agent');
    
    if (agent) {
        Navigation.handleNavigation('agent', { agent });
    } else {
        Navigation.handleNavigation(page);
    }
    
    // Handle browser navigation
    window.addEventListener('popstate', (e) => {
        Navigation.handlePopState(e);
    });
    
    // Start real-time updates
    StatusUpdater.start();
    
    console.log('K8s Agent Dashboard initialized successfully!');
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    StatusUpdater.stop();
    ParticleSystem.destroy();
});
