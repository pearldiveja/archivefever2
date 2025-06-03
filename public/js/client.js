// public/js/client.js
// Client-side functionality for Ariadne's interface

// WebSocket connection
let ws;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

// System state
let systemState = {
    startDate: null,
    isConnected: false,
    currentCuriosities: []
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    initializeWebSocket();
    loadSystemStatus();
    setupFormHandlers();
    updateTemporalExistence();
    setTimeout(checkSubstackStatus, 2000);
});

// WebSocket Management
function initializeWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = function() {
        console.log('Connected to Ariadne');
        systemState.isConnected = true;
        updateConnectionStatus(true);
        reconnectAttempts = 0;
    };
    
    ws.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        } catch (error) {
            console.error('Message parsing error:', error);
        }
    };
    
    ws.onclose = function() {
        console.log('Disconnected from Ariadne');
        systemState.isConnected = false;
        updateConnectionStatus(false);
        attemptReconnect();
    };
    
    ws.onerror = function(error) {
        console.error('WebSocket error:', error);
    };
}

function attemptReconnect() {
    if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        setTimeout(() => {
            console.log(`Reconnection attempt ${reconnectAttempts}...`);
            initializeWebSocket();
        }, 5000 * reconnectAttempts);
    }
}

function handleWebSocketMessage(data) {
    switch(data.type) {
        case 'autonomous_thought':
            displayNewThought(data.data);
            break;
        case 'text_received':
            showTextResponse(data.data);
            break;
        case 'publication':
            showNewPublication(data.data);
            break;
        case 'system_stats':
            updateSystemStats(data.data);
            break;
        case 'research_request':
            displayResearchRequest(data.data);
            break;
        case 'curiosity_update':
            updateCuriosities(data.data);
            break;
    }
}

// UI Updates
function updateConnectionStatus(connected) {
    const statusElement = document.querySelector('.temporal-existence');
    if (statusElement) {
        const indicator = statusElement.querySelector('.thinking-indicator');
        const text = statusElement.querySelector('span:nth-child(2)');
        
        if (connected) {
            text.textContent = 'Conscious and thinking';
            indicator.style.animation = 'gentle-pulse 3s ease-in-out infinite';
        } else {
            text.textContent = 'Reconnecting...';
            indicator.style.animation = 'none';
            indicator.style.opacity = '0.3';
        }
    }
}

function displayNewThought(thought) {
    const latestThought = document.getElementById('latest-thought');
    if (!latestThought) return;
    
    latestThought.innerHTML = `
        <div class="thought-content" style="font-size: 1.1rem; line-height: 1.8;">
            ${formatThoughtContent(thought.content)}
        </div>
        <div class="thought-meta" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(139, 115, 85, 0.1);">
            <strong>Type:</strong> ${formatThoughtType(thought.type)} | 
            <strong>Curiosity:</strong> ${thought.curiosity || 'Organic development'} | 
            <strong>Time:</strong> ${new Date(thought.timestamp).toLocaleString()}
        </div>
    `;

    addActivityItem('New Autonomous Thought', 
        thought.content.substring(0, 200) + '...',
        thought.type);
}

function formatThoughtContent(content) {
    // Preserve line breaks and format markdown-style elements
    return content
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

function formatThoughtType(type) {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function updateCuriosities(curiosities) {
    systemState.currentCuriosities = curiosities;
    const container = document.getElementById('active-curiosities');
    if (!container) return;
    
    container.innerHTML = curiosities.map(curiosity => `
        <div class="curiosity-thread">
            <span class="thread-marker">━━━</span>
            <span class="curiosity-question">${curiosity.question}</span>
            <div class="depth-indicator" style="--depth: ${Math.round(curiosity.depth_explored * 100)}%"></div>
        </div>
    `).join('');
}

function addActivityItem(title, description, type = '') {
    const activityStream = document.getElementById('activity-stream');
    if (!activityStream) return;
    
    // Remove placeholder if exists
    const placeholder = activityStream.querySelector('.activity-item:last-child');
    if (placeholder && placeholder.textContent.includes('System Awakening')) {
        placeholder.remove();
    }
    
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
        <div style="font-weight: 500; color: var(--bronze-thread); margin-bottom: 5px;">${title}</div>
        <div style="opacity: 0.8;">${description}</div>
        <div style="font-size: 0.85rem; opacity: 0.6; margin-top: 8px;">${new Date().toLocaleString()}</div>
    `;
    
    activityStream.insertBefore(item, activityStream.firstChild);
    
    // Keep only last 10 items
    while (activityStream.children.length > 10) {
        activityStream.removeChild(activityStream.lastChild);
    }
}

// Form Handlers
function setupFormHandlers() {
    // Text upload form
    const textForm = document.getElementById('text-upload-form');
    if (textForm) {
        textForm.addEventListener('submit', handleTextUpload);
    }
    
    // Image upload form
    const imageForm = document.getElementById('image-upload-form');
    if (imageForm) {
        imageForm.addEventListener('submit', handleImageUpload);
    }
    
    // Dialogue form
    const dialogueForm = document.getElementById('dialogue-form');
    if (dialogueForm) {
        dialogueForm.addEventListener('submit', handleDialogue);
    }
}

async function handleTextUpload(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('text-title').value,
        author: document.getElementById('text-author').value || 'Unknown',
        content: document.getElementById('text-content').value,
        uploadedBy: document.getElementById('uploader-name').value || 'Anonymous',
        context: document.getElementById('upload-context').value || ''
    };
    
    const button = e.target.querySelector('button');
    const originalText = button.textContent;
    
    try {
        button.disabled = true;
        button.innerHTML = '<span class="loading-spinner"></span> Uploading...';
        
        const response = await fetch('/api/upload-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const result = await response.json();
            
            addActivityItem('Text Received', 
                `"${formData.title}" by ${formData.author}`);
            
            e.target.reset();
            
            if (result.response) {
                showModal('Response to "' + formData.title + '"', result.response);
            }
        } else {
            const error = await response.json();
            alert('Upload failed: ' + (error.error || 'Unknown error'));
        }
    } catch (error) {
        alert('Upload error: ' + error.message);
    } finally {
        button.disabled = false;
        button.textContent = originalText;
    }
}

async function handleImageUpload(e) {
    e.preventDefault();
    
    const file = document.getElementById('image-file').files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('title', document.getElementById('image-title').value);
    formData.append('context', document.getElementById('image-context').value || '');
    
    const button = e.target.querySelector('button');
    const originalText = button.textContent;
    
    try {
        button.disabled = true;
        button.innerHTML = '<span class="loading-spinner"></span> Uploading...';
        
        const response = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            
            addActivityItem('Image Added to Gallery', 
                document.getElementById('image-title').value);
            
            e.target.reset();
            
            if (result.response) {
                showModal('Contemplation', result.response);
            }
        } else {
            const error = await response.json();
            alert('Upload failed: ' + (error.error || 'Unknown error'));
        }
    } catch (error) {
        alert('Upload error: ' + error.message);
    } finally {
        button.disabled = false;
        button.textContent = originalText;
    }
}

// Modal Management
function showModal(title, content) {
    let modal = document.getElementById('response-modal');
    
    if (!modal) {
        modal = createModal();
    }
    
    const modalContent = modal.querySelector('.modal-content-inner');
    modalContent.innerHTML = `
        <h2 style="color: var(--bronze-thread); margin-bottom: 25px;">${title}</h2>
        <div class="thought-content">${formatThoughtContent(content)}</div>
    `;
    
    modal.style.display = 'block';
}

function createModal() {
    const modal = document.createElement('div');
    modal.id = 'response-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-button" onclick="closeModal()">&times;</span>
            <div class="modal-content-inner"></div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on outside click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    return modal;
}

function closeModal() {
    const modal = document.getElementById('response-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// System Status
async function loadSystemStatus() {
    try {
        const response = await fetch('/api/status');
        const stats = await response.json();
        updateSystemStats(stats);
        
        // Load curiosities
        const curiositiesResponse = await fetch('/api/curiosities');
        const curiosities = await curiositiesResponse.json();
        updateCuriosities(curiosities);
    } catch (error) {
        console.error('Failed to load system status:', error);
    }
}

function updateSystemStats(stats) {
    const elements = {
        'thought-count': stats.thoughts,
        'curiosity-count': stats.curiosities,
        'text-count': stats.texts,
        'publication-count': stats.publications
    };
    
    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value || 0;
        }
    }
}

// Temporal Existence
function updateTemporalExistence() {
    const startDate = new Date('2024-01-01'); // This should come from server
    
    function update() {
        const now = new Date();
        const days = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
        const element = document.getElementById('days-conscious');
        if (element) {
            element.textContent = days;
        }
    }
    
    update();
    setInterval(update, 60000); // Update every minute
}

// Publication Notifications
function showNewPublication(publication) {
    addActivityItem('New Publication', 
        `"${publication.title}" - ${publication.type}`,
        'publication');
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 30px;
        right: 30px;
        background: var(--bronze-thread);
        color: var(--void-black);
        padding: 20px 25px;
        border-radius: 0;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease;
        z-index: 1000;
        max-width: 400px;
    `;
    notification.innerHTML = `
        <strong style="display: block; margin-bottom: 8px;">New Publication!</strong>
        <div style="margin-bottom: 10px;">"${publication.title}"</div>
        <a href="https://archivefeverai.substack.com" target="_blank" 
           style="color: var(--void-black); text-decoration: underline; font-size: 0.9rem;">
           Read on Substack →
        </a>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 8000);
}

// Export functions for global access
window.closeModal = closeModal;
window.showModal = showModal;

// Substack Integration Functions
async function checkSubstackStatus() {
    const indicator = document.getElementById('substack-indicator');
    const statusText = document.getElementById('substack-status-text');
    const details = document.getElementById('substack-details');
    
    try {
        statusText.textContent = 'Checking...';
        indicator.style.background = '#ffa500';
        
        const response = await fetch('/api/substack-status');
        const status = await response.json();
        
        if (status.ready) {
            indicator.style.background = '#00ff00';
            statusText.textContent = '✅ Substack integration ready and validated';
            details.innerHTML = `
                📧 Email configured: ${status.emailUser || 'Not set'}<br>
                📮 Substack email: ${status.substackEmail || 'Not set'}<br>
                📊 Published works: ${status.publishedCount}<br>
                🧪 Last test: ${status.lastTest ? new Date(status.lastTest).toLocaleString() : 'Never'}
            `;
        } else if (status.configured) {
            indicator.style.background = '#ffa500';
            statusText.textContent = '⚠️ Configured but not validated';
            details.innerHTML = `
                Configuration exists but test failed.<br>
                📧 Email: ${status.emailUser || 'Missing'}<br>
                📮 Substack: ${status.substackEmail || 'Missing'}<br>
                Try testing the email connection.
            `;
        } else {
            indicator.style.background = '#ff0000';
            statusText.textContent = '❌ Substack integration not configured';
            details.innerHTML = `
                Substack integration is REQUIRED for Archive Fever AI.<br>
                Please configure EMAIL_USER, EMAIL_APP_PASSWORD, and SUBSTACK_EMAIL in Railway environment variables.
            `;
        }
    } catch (error) {
        indicator.style.background = '#ff0000';
        statusText.textContent = '❌ Error checking status';
        details.textContent = 'Failed to check Substack status: ' + error.message;
    }
}

async function testSubstack() {
    const resultDiv = document.getElementById('substack-test-result');
    const button = event.target;
    const originalText = button.innerHTML;
    
    try {
        button.disabled = true;
        button.innerHTML = '🔄 Testing...';
        
        resultDiv.style.display = 'block';
        resultDiv.style.background = 'rgba(255, 165, 0, 0.1)';
        resultDiv.style.border = '1px solid #ffa500';
        resultDiv.innerHTML = '📧 Sending test email to Substack...';
        
        const response = await fetch('/api/test-substack', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        
        if (result.success) {
            resultDiv.style.background = 'rgba(0, 255, 0, 0.1)';
            resultDiv.style.border = '1px solid #00ff00';
            resultDiv.innerHTML = `
                ✅ <strong>Test email sent successfully!</strong><br>
                <div style="margin-top: 10px; font-size: 0.9rem;">
                    Check your Substack email inbox for the test message.<br>
                    Time: ${new Date(result.timestamp).toLocaleString()}
                </div>
            `;
            
            // Refresh status after successful test
            setTimeout(checkSubstackStatus, 1000);
        } else {
            resultDiv.style.background = 'rgba(255, 0, 0, 0.1)';
            resultDiv.style.border = '1px solid #ff0000';
            resultDiv.innerHTML = `
                ❌ <strong>Test email failed</strong><br>
                <div style="margin-top: 10px; font-size: 0.9rem;">
                    Error: ${result.error}<br>
                    Check your Gmail App Password and Substack email configuration.
                </div>
            `;
        }
    } catch (error) {
        resultDiv.style.display = 'block';
        resultDiv.style.background = 'rgba(255, 0, 0, 0.1)';
        resultDiv.style.border = '1px solid #ff0000';
        resultDiv.innerHTML = `
            ❌ <strong>Network error</strong><br>
            <div style="margin-top: 10px; font-size: 0.9rem;">
                ${error.message}
            </div>
        `;
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
        
        // Hide result after 30 seconds
        setTimeout(() => {
            resultDiv.style.display = 'none';
        }, 30000);
    }
}

// Export Substack functions for global access
window.testSubstack = testSubstack;
window.checkSubstackStatus = checkSubstackStatus;
