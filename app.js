// Jockamo Chat Application
const CONFIG_KEY = 'jockamo_webhook_url';
const HISTORY_KEY = 'jockamo_chat_history';
const DEFAULT_WEBHOOK = 'https://primary-production-a88ea.up.railway.app/webhook/jockamo-chat';

// DOM Elements
const chatContainer = document.getElementById('chatContainer');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const configModal = document.getElementById('configModal');
const webhookInput = document.getElementById('webhookInput');

// State
let webhookUrl = localStorage.getItem(CONFIG_KEY) || DEFAULT_WEBHOOK;
let conversationHistory = [];
let isLoading = false;

// Initialize
function init() {
    // Load saved webhook URL (default is pre-configured)
    webhookInput.value = webhookUrl;

    // Load conversation history
    loadHistory();

    // Event listeners
    chatForm.addEventListener('submit', handleSubmit);
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatForm.dispatchEvent(new Event('submit'));
        }
    });
}

// Show config modal
function showConfig() {
    configModal.classList.remove('hidden');
    webhookInput.focus();
}

// Save config
function saveConfig() {
    const url = webhookInput.value.trim();
    if (url) {
        webhookUrl = url;
        localStorage.setItem(CONFIG_KEY, url);
        configModal.classList.add('hidden');
        messageInput.focus();
    }
}

// Load chat history
function loadHistory() {
    try {
        const saved = localStorage.getItem(HISTORY_KEY);
        if (saved) {
            conversationHistory = JSON.parse(saved);
            // Render saved messages (skip if just the welcome message)
            if (conversationHistory.length > 0) {
                conversationHistory.forEach(msg => {
                    addMessageToUI(msg.role, msg.content, false);
                });
            }
        }
    } catch (e) {
        console.error('Failed to load history:', e);
    }
}

// Save chat history
function saveHistory() {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(conversationHistory));
    } catch (e) {
        console.error('Failed to save history:', e);
    }
}

// Handle form submit
async function handleSubmit(e) {
    e.preventDefault();

    const message = messageInput.value.trim();
    if (!message || isLoading) return;

    if (!webhookUrl) {
        showConfig();
        return;
    }

    // Clear input
    messageInput.value = '';

    // Add user message
    addMessageToUI('user', message);
    conversationHistory.push({ role: 'user', content: message });
    saveHistory();

    // Show typing indicator
    showTypingIndicator();
    setLoading(true);

    try {
        const response = await sendToWebhook(message);
        hideTypingIndicator();

        // Add assistant response (handle different response formats)
        const assistantMessage = response.message || response.output || response.response || response.text || response;
        addMessageToUI('assistant', assistantMessage);
        conversationHistory.push({ role: 'assistant', content: assistantMessage });
        saveHistory();
    } catch (error) {
        hideTypingIndicator();
        console.error('Error:', error);
        addMessageToUI('assistant', "Something went wrong on my end. Give it another shot, brother.", true);
    } finally {
        setLoading(false);
    }
}

// Send message to webhook
async function sendToWebhook(message) {
    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: message,
            history: conversationHistory.slice(-20), // Last 20 messages for context
            timestamp: new Date().toISOString()
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
}

// Add message to UI
function addMessageToUI(role, content, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex gap-3 message-enter';

    if (role === 'user') {
        messageDiv.innerHTML = `
            <div class="ml-auto bg-brand-accent/20 border border-brand-accent/30 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]">
                <p class="text-gray-200">${escapeHtml(content)}</p>
            </div>
            <div class="w-8 h-8 bg-brand-muted rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold">
                U
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="w-8 h-8 bg-gradient-to-br from-brand-accent to-orange-700 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold">
                J
            </div>
            <div class="bg-brand-dark border ${isError ? 'border-red-500/50' : 'border-brand-muted'} rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                <p class="text-gray-200 whitespace-pre-wrap">${escapeHtml(content)}</p>
            </div>
        `;
    }

    chatContainer.appendChild(messageDiv);
    scrollToBottom();
}

// Show typing indicator
function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'typingIndicator';
    indicator.className = 'flex gap-3 message-enter';
    indicator.innerHTML = `
        <div class="w-8 h-8 bg-gradient-to-br from-brand-accent to-orange-700 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold">
            J
        </div>
        <div class="bg-brand-dark border border-brand-muted rounded-2xl rounded-tl-sm px-4 py-3">
            <div class="typing-indicator flex gap-1">
                <span class="w-2 h-2 bg-gray-400 rounded-full"></span>
                <span class="w-2 h-2 bg-gray-400 rounded-full"></span>
                <span class="w-2 h-2 bg-gray-400 rounded-full"></span>
            </div>
        </div>
    `;
    chatContainer.appendChild(indicator);
    scrollToBottom();
}

// Hide typing indicator
function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// Set loading state
function setLoading(loading) {
    isLoading = loading;
    sendButton.disabled = loading;
    messageInput.disabled = loading;
}

// Scroll to bottom
function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Clear chat history
function clearHistory() {
    conversationHistory = [];
    localStorage.removeItem(HISTORY_KEY);
    // Remove all messages except the welcome
    chatContainer.innerHTML = `
        <div class="flex gap-3 message-enter">
            <div class="w-8 h-8 bg-gradient-to-br from-brand-accent to-orange-700 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold">
                J
            </div>
            <div class="bg-brand-dark border border-brand-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                <p class="text-gray-200">Hey brother. I'm Jockamo—your coach, not your therapist. I'm here to help you show up better in your relationship. No judgment, no BS, just real talk.</p>
                <p class="text-gray-200 mt-2">What's on your mind?</p>
            </div>
        </div>
    `;
}

// Expose functions globally for HTML onclick
window.showConfig = showConfig;
window.saveConfig = saveConfig;
window.clearHistory = clearHistory;

// Initialize on load
init();
