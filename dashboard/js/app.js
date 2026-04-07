/**
 * Kubernetes Cluster Dashboard - Main Application
 * Production-ready dashboard with modular architecture
 * Features: Routing, Search, Animations, Sound Effects, Drag & Drop
 */

// ============================================
// MOCK DATA
// ============================================
const mockClusters = [
    { id: 1, name: 'prod-cluster-01', k8sStatus: 'active', agentStatus: 'active', version: '1.28.3', jira: 'TICKET-123' },
    { id: 2, name: 'dev-cluster-02', k8sStatus: 'active', agentStatus: 'inactive', version: '1.27.5', jira: 'TICKET-456' },
    { id: 3, name: 'staging-ift', k8sStatus: 'active', agentStatus: 'active', version: '1.28.1', jira: 'TICKET-789' },
    { id: 4, name: 'prod-psi', k8sStatus: 'inactive', agentStatus: 'inactive', version: '1.26.8', jira: 'TICKET-321' },
    { id: 5, name: 'prod-cluster-01-dup', k8sStatus: 'active', agentStatus: 'active', version: '1.28.3', jira: 'TICKET-654' },
    { id: 6, name: 'dev-cluster-02-dup', k8sStatus: 'active', agentStatus: 'active', version: '1.27.5', jira: 'TICKET-987' },
    { id: 7, name: 'staging-ift-dup', k8sStatus: 'inactive', agentStatus: 'inactive', version: '1.28.1', jira: 'TICKET-147' },
    { id: 8, name: 'prod-psi-dup', k8sStatus: 'active', agentStatus: 'active', version: '1.26.8', jira: 'TICKET-258' },
    { id: 9, name: 'test-cluster-01', k8sStatus: 'active', agentStatus: 'inactive', version: '1.29.0', jira: 'TICKET-369' },
    { id: 10, name: 'test-cluster-02', k8sStatus: 'active', agentStatus: 'active', version: '1.29.0', jira: 'TICKET-741' }
];

const mockAgentDetails = {
    environments: [
        { name: 'ИФТ', status: 'active', namespace: 'ift-ns' },
        { name: 'ПСИ', status: 'inactive', namespace: 'psi-ns' },
        { name: 'ПРОМ', status: 'active', namespace: 'prom-ns' }
    ],
    expandedData: {
        distributive: 'Ubuntu 22.04',
        kafka: ['topic1', 'topic2', 'topic3'],
        databases: ['postgres-main', 'mysql-replica'],
        securityManager: 'enabled'
    }
};

// ============================================
// SOUND EFFECTS MANAGER
// ============================================
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playClick() {
        if (!this.enabled || !this.audioContext) return;
        
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
    }

    playSuccess() {
        if (!this.enabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = 1000;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }

    playError() {
        if (!this.enabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = 400;
        oscillator.type = 'sawtooth';
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }
}

// ============================================
// PARTICLE SYSTEM
// ============================================
class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.resize();
        this.init();
        this.animate();
        
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        const particleCount = Math.floor((this.canvas.width * this.canvas.height) / 15000);
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1,
                alpha: Math.random() * 0.5 + 0.2
            });
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 51, 51, ${particle.alpha})`;
            this.ctx.fill();
        });
        
        // Draw connections
        this.particles.forEach((p1, i) => {
            this.particles.slice(i + 1).forEach(p2 => {
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.strokeStyle = `rgba(255, 51, 51, ${0.1 * (1 - distance / 100)})`;
                    this.ctx.stroke();
                }
            });
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

// ============================================
// ROUTER
// ============================================
class Router {
    constructor(app) {
        this.app = app;
        this.routes = {
            '/': () => this.app.renderHome(),
            '/cluster/:id': (params) => this.app.renderClusterDetail(params.id),
            '/settings': () => this.app.renderSettings(),
            '/settings/gitops': () => this.app.renderGitOps(),
            '/settings/jenkins': () => this.app.renderJenkins(),
            '/monitoring': () => this.app.renderMonitoring()
        };
        
        window.addEventListener('popstate', () => this.handleRoute());
        window.addEventListener('hashchange', () => this.handleRoute());
    }

    handleRoute() {
        const hash = window.location.hash.slice(1) || '/';
        const route = this.matchRoute(hash);
        
        if (route) {
            route.handler(route.params);
        } else {
            this.app.renderHome();
        }
    }

    matchRoute(path) {
        for (const [pattern, handler] of Object.entries(this.routes)) {
            const regex = pattern.replace(/:id/g, '(\\d+)');
            const match = path.match(new RegExp(`^${regex}$`));
            
            if (match) {
                return {
                    handler,
                    params: { id: match[1] }
                };
            }
        }
        return null;
    }

    navigate(path) {
        window.location.hash = path;
    }
}

// ============================================
// SEARCH MANAGER
// ============================================
class SearchManager {
    constructor(app) {
        this.app = app;
        this.input = document.getElementById('searchInput');
        this.results = document.getElementById('searchResults');
        this.debounceTimer = null;
        
        this.init();
    }

    init() {
        this.input.addEventListener('input', (e) => this.handleInput(e));
        this.input.addEventListener('focus', () => this.showResults());
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideResults();
            }
        });
    }

    handleInput(e) {
        clearTimeout(this.debounceTimer);
        const query = e.target.value.trim().toLowerCase();
        
        this.debounceTimer = setTimeout(() => {
            if (query.length > 0) {
                this.search(query);
            } else {
                this.hideResults();
            }
        }, 300);
    }

    search(query) {
        const results = mockClusters.filter(cluster => 
            cluster.name.toLowerCase().includes(query) ||
            cluster.version.includes(query)
        );
        
        this.renderResults(results);
    }

    renderResults(results) {
        if (results.length === 0) {
            this.results.innerHTML = '<div class="search-result-item">Ничего не найдено</div>';
        } else {
            this.results.innerHTML = results.map(cluster => `
                <div class="search-result-item" data-cluster-id="${cluster.id}">
                    ${cluster.name} <span class="text-muted">v${cluster.version}</span>
                </div>
            `).join('');
            
            this.results.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const clusterId = item.dataset.clusterId;
                    this.app.router.navigate(`/cluster/${clusterId}`);
                    this.hideResults();
                    this.input.value = '';
                });
            });
        }
        
        this.showResults();
    }

    showResults() {
        if (this.results.innerHTML.trim()) {
            this.results.classList.add('active');
        }
    }

    hideResults() {
        this.results.classList.remove('active');
    }
}

// ============================================
// MODAL MANAGER
// ============================================
class ModalManager {
    constructor() {
        this.overlay = document.getElementById('modalOverlay');
        this.modal = document.getElementById('modal');
        this.title = document.getElementById('modalTitle');
        this.body = document.getElementById('modalBody');
        this.cancelBtn = document.getElementById('modalCancel');
        this.actionBtn = document.getElementById('modalAction');
        
        this.init();
    }

    init() {
        this.cancelBtn.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
                this.close();
            }
        });
    }

    open(title, content, actionText = 'Действие', onAction = null) {
        this.title.textContent = title;
        this.body.innerHTML = content;
        this.actionBtn.textContent = actionText;
        
        if (onAction) {
            this.actionBtn.onclick = () => {
                onAction();
                this.close();
            };
            this.actionBtn.style.display = 'block';
        } else {
            this.actionBtn.style.display = 'none';
        }
        
        this.overlay.classList.add('active');
    }

    close() {
        this.overlay.classList.remove('active');
    }
}

// ============================================
// MAIN APPLICATION
// ============================================
class App {
    constructor() {
        this.soundManager = new SoundManager();
        this.modalManager = new ModalManager();
        this.pageContainer = document.getElementById('pageContainer');
        this.sidebar = document.getElementById('sidebar');
        
        this.init();
    }

    init() {
        // Initialize particle system
        new ParticleSystem('particle-canvas');
        
        // Initialize router
        this.router = new Router(this);
        this.router.handleRoute();
        
        // Initialize search
        new SearchManager(this);
        
        // Initialize sidebar toggle
        this.initSidebar();
        
        // Initialize refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.soundManager.playClick();
            this.router.handleRoute();
        });
        
        // Initialize notifications
        document.getElementById('notificationsBtn').addEventListener('click', () => {
            this.soundManager.playClick();
            this.modalManager.open(
                'Уведомления',
                '<ul style="list-style: none; line-height: 2;"><li>🔴 Кластер prod-psi требует внимания</li><li>🟡 Обновление доступно для dev-cluster-02</li><li>🟢 Все системы в норме</li></ul>'
            );
        });
        
        // Initialize submenu toggles
        this.initSubmenus();
        
        // Initialize sound on first interaction
        document.addEventListener('click', () => this.soundManager.init(), { once: true });
    }

    initSidebar() {
        const toggleBtn = document.getElementById('toggleSidebar');
        toggleBtn.addEventListener('click', () => {
            this.soundManager.playClick();
            this.sidebar.classList.toggle('collapsed');
        });
    }

    initSubmenus() {
        document.querySelectorAll('.submenu-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                this.soundManager.playClick();
                toggle.classList.toggle('active');
                const submenu = toggle.nextElementSibling;
                submenu.classList.toggle('open');
            });
        });
    }

    // ============================================
    // PAGE RENDERERS
    // ============================================
    
    renderHome() {
        this.updateActiveNav('home');
        
        const clustersHTML = mockClusters.map(cluster => `
            <div class="cluster-card ${cluster.k8sStatus === 'active' ? 'active' : 'inactive'}" 
                 data-cluster-id="${cluster.id}"
                 draggable="true">
                <div class="cluster-header">
                    <h3 class="cluster-name">${cluster.name}</h3>
                    <div class="cluster-status">
                        <span class="status-indicator ${cluster.k8sStatus}"></span>
                        <span>${cluster.k8sStatus === 'active' ? '🟢' : '🔴'}</span>
                    </div>
                </div>
                <div class="cluster-info">
                    <div class="info-row">
                        <span class="info-label">Agent:</span>
                        <span class="agent-status ${cluster.agentStatus}">
                            ${cluster.agentStatus === 'active' ? 'Активен' : 'Неактивен'}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Версия:</span>
                        <span class="info-value">${cluster.version}</span>
                    </div>
                </div>
                <div class="cluster-version">
                    JIRA: <span class="text-accent jira-link" data-jira="${cluster.jira}">${cluster.jira}</span>
                </div>
            </div>
        `).join('');
        
        this.pageContainer.innerHTML = `
            <div class="clusters-grid">
                ${clustersHTML}
            </div>
        `;
        
        // Add click handlers
        this.pageContainer.querySelectorAll('.cluster-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('jira-link')) {
                    this.soundManager.playClick();
                    const clusterId = card.dataset.clusterId;
                    this.router.navigate(`/cluster/${clusterId}`);
                }
            });
            
            // Drag and drop
            this.initDragAndDrop(card);
        });
        
        // JIRA links
        this.pageContainer.querySelectorAll('.jira-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.stopPropagation();
                this.soundManager.playClick();
                this.showJiraModal(link.dataset.jira);
            });
        });
    }

    renderClusterDetail(clusterId) {
        this.updateActiveNav('home');
        
        const cluster = mockClusters.find(c => c.id == clusterId);
        if (!cluster) {
            this.renderHome();
            return;
        }
        
        const environmentsHTML = mockAgentDetails.environments.map(env => `
            <div class="environment-card">
                <div class="env-header">
                    <h4 class="env-name">${env.name}</h4>
                    <span class="env-status ${env.status}"></span>
                </div>
                <div class="env-actions">
                    <button class="btn btn-primary" data-action="install" data-env="${env.name}">
                        ${env.status === 'active' ? '✓ Установлено' : '▶ Установить'}
                    </button>
                    <button class="btn btn-secondary" data-action="check" data-env="${env.name}">
                        🔍 Проверить
                    </button>
                    ${env.namespace ? `<button class="btn btn-secondary" data-action="namespace" data-env="${env.name}">
                        📁 Namespace
                    </button>` : ''}
                </div>
            </div>
        `).join('');
        
        const expandedData = mockAgentDetails.expandedData;
        const expandedDetailsHTML = `
            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">Дистрибутив</div>
                    <div class="detail-value">${expandedData.distributive}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Kafka Topics</div>
                    <div class="detail-value">${expandedData.kafka.join(', ')}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Базы данных</div>
                    <div class="detail-value">${expandedData.databases.join(', ')}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Security Manager</div>
                    <div class="detail-value">${expandedData.securityManager}</div>
                </div>
            </div>
            <div class="expanded-actions">
                <button class="btn btn-secondary" id="closeExpanded">Закрыть</button>
                <button class="btn btn-primary" id="saveSettings">Сохранить настройки</button>
            </div>
        `;
        
        this.pageContainer.innerHTML = `
            <div class="agent-detail">
                <div class="agent-header">
                    <h2 class="agent-title">${cluster.name}</h2>
                    <div class="agent-meta">
                        <div class="jira-ticket" data-jira="${cluster.jira}">
                            📋 РЕЛИЗ: ${cluster.jira}
                        </div>
                        <button class="btn-expand" id="expandBtn">
                            ▶ Расширить
                        </button>
                    </div>
                </div>
                
                <div class="environments-grid">
                    ${environmentsHTML}
                </div>
                
                <div class="expanded-details" id="expandedDetails">
                    ${expandedDetailsHTML}
                </div>
            </div>
        `;
        
        // Event handlers
        this.attachClusterDetailHandlers(cluster);
    }

    attachClusterDetailHandlers(cluster) {
        // Expand button
        const expandBtn = document.getElementById('expandBtn');
        const expandedDetails = document.getElementById('expandedDetails');
        
        expandBtn.addEventListener('click', () => {
            this.soundManager.playClick();
            expandedDetails.classList.toggle('open');
            expandBtn.innerHTML = expandedDetails.classList.contains('open') 
                ? '▲ Свернуть' 
                : '▶ Расширить';
        });
        
        // Close expanded
        document.getElementById('closeExpanded')?.addEventListener('click', () => {
            this.soundManager.playClick();
            expandedDetails.classList.remove('open');
            expandBtn.innerHTML = '▶ Расширить';
        });
        
        // Save settings
        document.getElementById('saveSettings')?.addEventListener('click', () => {
            this.soundManager.playClick();
            this.soundManager.playSuccess();
            
            const btn = document.getElementById('saveSettings');
            btn.classList.add('loading');
            btn.textContent = 'Сохранение...';
            
            setTimeout(() => {
                btn.classList.remove('loading');
                btn.textContent = '✓ Сохранено';
                setTimeout(() => {
                    btn.textContent = 'Сохранить настройки';
                }, 2000);
            }, 1000);
        });
        
        // Environment action buttons
        this.pageContainer.querySelectorAll('.env-actions .btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                const env = e.currentTarget.dataset.env;
                this.handleEnvAction(action, env, e.currentTarget);
            });
        });
        
        // JIRA ticket
        this.pageContainer.querySelector('.jira-ticket').addEventListener('click', () => {
            this.soundManager.playClick();
            this.showJiraModal(cluster.jira);
        });
    }

    handleEnvAction(action, env, btn) {
        this.soundManager.playClick();
        
        if (action === 'install') {
            btn.classList.add('loading');
            setTimeout(() => {
                btn.classList.remove('loading');
                btn.innerHTML = '✓ Установлено';
                this.soundManager.playSuccess();
            }, 1500);
        } else if (action === 'check') {
            btn.classList.add('loading');
            setTimeout(() => {
                btn.classList.remove('loading');
                this.soundManager.playSuccess();
                this.modalManager.open(
                    `Проверка ${env}`,
                    `<p>Статус окружения: <span class="text-success">OK</span></p>
                     <p>Последняя проверка: ${new Date().toLocaleTimeString()}</p>
                     <p>Версия агента: 2.1.0</p>`
                );
            }, 1000);
        } else if (action === 'namespace') {
            this.soundManager.playClick();
            this.modalManager.open(
                `Namespace для ${env}`,
                `<p>Имя: ${env.toLowerCase()}-ns</p>
                 <p>Статус: Active</p>
                 <p>Ресурсы: 3 pods, 2 services</p>`
            );
        }
    }

    showJiraModal(ticketId) {
        this.modalManager.open(
            ticketId,
            `<div style="line-height: 1.8;">
                <p><strong>Статус:</strong> <span class="text-accent">В работе</span></p>
                <p><strong>Описание:</strong> Обновление конфигурации кластера</p>
                <p><strong>Исполнитель:</strong> DevOps Team</p>
                <p><strong>Приоритет:</strong> Высокий</p>
                <p><strong>Дата создания:</strong> ${new Date().toLocaleDateString()}</p>
            </div>`,
            'Перейти в JIRA',
            () => window.open(`https://jira.example.com/browse/${ticketId}`, '_blank')
        );
    }

    renderSettings() {
        this.updateActiveNav('settings');
        this.pageContainer.innerHTML = `
            <div class="agent-detail">
                <h2>Настройки</h2>
                <p class="mt-md">Страница настроек системы</p>
            </div>
        `;
    }

    renderGitOps() {
        this.updateActiveNav('gitops');
        this.pageContainer.innerHTML = `
            <div class="agent-detail">
                <h2>GitOps Настройки</h2>
                <p class="mt-md">Управление GitOps конфигурацией</p>
            </div>
        `;
    }

    renderJenkins() {
        this.updateActiveNav('jenkins');
        this.pageContainer.innerHTML = `
            <div class="agent-detail">
                <h2>Jenkins Настройки</h2>
                <p class="mt-md">Интеграция с Jenkins CI/CD</p>
            </div>
        `;
    }

    renderMonitoring() {
        this.updateActiveNav('monitoring');
        this.pageContainer.innerHTML = `
            <div class="agent-detail">
                <h2>Мониторинг</h2>
                <p class="mt-md">Панель мониторинга кластеров</p>
            </div>
        `;
    }

    updateActiveNav(pageName) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === pageName) {
                link.classList.add('active');
            }
        });
    }

    initDragAndDrop(card) {
        card.addEventListener('dragstart', (e) => {
            card.classList.add('dragging');
            e.dataTransfer.setData('text/plain', card.dataset.clusterId);
        });
        
        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
        });
        
        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            card.classList.add('drag-over');
        });
        
        card.addEventListener('dragleave', () => {
            card.classList.remove('drag-over');
        });
        
        card.addEventListener('drop', (e) => {
            e.preventDefault();
            card.classList.remove('drag-over');
            const draggedId = e.dataTransfer.getData('text/plain');
            const currentId = card.dataset.clusterId;
            
            if (draggedId !== currentId) {
                this.soundManager.playClick();
                // Here you would implement actual reordering logic
                console.log(`Swap cluster ${draggedId} with ${currentId}`);
            }
        });
    }
}

// ============================================
// INITIALIZE APPLICATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
