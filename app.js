// Jockamo Chat Application
const CONFIG_KEY = 'jockamo_webhook_url';
const CHATS_KEY = 'jockamo_chats';
const ACTIVE_CHAT_KEY = 'jockamo_active_chat';
const DEFAULT_WEBHOOK = 'https://primary-production-a88ea.up.railway.app/webhook/jockamo-chat';

// DOM Elements
const chatContainer = document.getElementById('chatContainer');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const configModal = document.getElementById('configModal');
const webhookInput = document.getElementById('webhookInput');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const chatList = document.getElementById('chatList');
const deleteModal = document.getElementById('deleteModal');

// State
let webhookUrl = localStorage.getItem(CONFIG_KEY) || DEFAULT_WEBHOOK;
let chats = {}; // { chatId: { id, title, messages: [], createdAt } }
let activeChatId = null;
let isLoading = false;
let chatToDelete = null;

// Initialize
function init() {
    webhookInput.value = webhookUrl;
    loadChats();
    renderChatList();

    // If no chats exist, create a default one
    if (Object.keys(chats).length === 0) {
        createNewChat();
    } else {
        // Load the active chat or the most recent one
        const savedActiveId = localStorage.getItem(ACTIVE_CHAT_KEY);
        if (savedActiveId && chats[savedActiveId]) {
            switchToChat(savedActiveId);
        } else {
            const mostRecent = Object.values(chats).sort((a, b) => b.createdAt - a.createdAt)[0];
            switchToChat(mostRecent.id);
        }
    }

    // Event listeners
    chatForm.addEventListener('submit', handleSubmit);
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatForm.dispatchEvent(new Event('submit'));
        }
    });
}

// Toggle sidebar
function toggleSidebar() {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('open');
}

// Show config modal
function showConfig() {
    configModal.classList.remove('hidden');
    webhookInput.focus();
    toggleSidebar();
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

// Parse markdown to HTML
function parseMarkdown(text) {
    let html = escapeHtml(text);

    // Bold: **text** or __text__
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong class="font-semibold text-white">$1</strong>');

    // Italic: *text* or _text_
    html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
    html = html.replace(/_(.+?)_/g, '<em class="italic">$1</em>');

    // Convert line breaks
    html = html.replace(/\n/g, '<br>');

    // Bullet lists: lines starting with - or *
    html = html.replace(/^[-*]\s+(.+)$/gm, '<li class="ml-4">$1</li>');
    html = html.replace(/(<li.*<\/li>)/s, '<ul class="list-disc pl-4 my-2">$1</ul>');

    // Numbered lists: lines starting with 1. 2. etc
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4">$1</li>');

    return html;
}

// Load all chats from localStorage
function loadChats() {
    try {
        const saved = localStorage.getItem(CHATS_KEY);
        if (saved) {
            chats = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Failed to load chats:', e);
        chats = {};
    }
}

// Save all chats to localStorage
function saveChats() {
    try {
        localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
    } catch (e) {
        console.error('Failed to save chats:', e);
    }
}

// Save active chat ID
function saveActiveChat() {
    localStorage.setItem(ACTIVE_CHAT_KEY, activeChatId);
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Create new chat
function createNewChat() {
    const id = generateId();
    const chat = {
        id,
        title: 'New Chat',
        messages: [],
        createdAt: Date.now()
    };
    chats[id] = chat;
    saveChats();
    switchToChat(id);
    renderChatList();
    toggleSidebar();
}

// Switch to a chat
function switchToChat(chatId) {
    if (!chats[chatId]) return;

    activeChatId = chatId;
    saveActiveChat();
    renderChat();
    renderChatList();

    // Close sidebar on mobile
    if (window.innerWidth < 768) {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('open');
    }
}

// Render the chat list in sidebar
function renderChatList() {
    const sortedChats = Object.values(chats).sort((a, b) => b.createdAt - a.createdAt);

    chatList.innerHTML = sortedChats.map(chat => `
        <div class="group flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-colors ${chat.id === activeChatId ? 'bg-brand-accent/20 border border-brand-accent/30' : 'hover:bg-brand-muted/50'}"
             onclick="switchToChat('${chat.id}')">
            <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            <span class="flex-1 truncate text-sm ${chat.id === activeChatId ? 'text-white' : 'text-gray-300'}">${escapeHtml(chat.title)}</span>
            <button onclick="event.stopPropagation(); promptDelete('${chat.id}')"
                    class="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                    title="Delete chat">
                <svg class="w-4 h-4 text-gray-400 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
            </button>
        </div>
    `).join('');
}

// Render the active chat
function renderChat() {
    const chat = chats[activeChatId];
    if (!chat) return;

    // Reset to welcome message
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

    // Render all messages
    chat.messages.forEach(msg => {
        addMessageToUI(msg.role, msg.content, false, false);
    });

    scrollToBottom();
}

// Prompt delete confirmation
function promptDelete(chatId) {
    chatToDelete = chatId;
    deleteModal.classList.remove('hidden');
}

// Cancel delete
function cancelDelete() {
    chatToDelete = null;
    deleteModal.classList.add('hidden');
}

// Confirm delete
function confirmDelete() {
    if (!chatToDelete) return;

    delete chats[chatToDelete];
    saveChats();

    // If we deleted the active chat, switch to another or create new
    if (chatToDelete === activeChatId) {
        const remaining = Object.values(chats).sort((a, b) => b.createdAt - a.createdAt);
        if (remaining.length > 0) {
            switchToChat(remaining[0].id);
        } else {
            createNewChat();
        }
    }

    renderChatList();
    chatToDelete = null;
    deleteModal.classList.add('hidden');
}

// Handle form submit
async function handleSubmit(e) {
    e.preventDefault();

    const message = messageInput.value.trim();
    if (!message || isLoading || !activeChatId) return;

    if (!webhookUrl) {
        showConfig();
        return;
    }

    // Clear input
    messageInput.value = '';

    // Add user message
    addMessageToUI('user', message, false, false);
    chats[activeChatId].messages.push({ role: 'user', content: message });

    // Update chat title if it's the first message
    if (chats[activeChatId].messages.length === 1) {
        chats[activeChatId].title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
        renderChatList();
    }

    saveChats();

    // Show typing indicator
    showTypingIndicator();
    setLoading(true);

    try {
        const response = await sendToWebhook(message);
        hideTypingIndicator();

        // Add assistant response with typing effect
        const assistantMessage = response.message || response.output || response.response || response.text || response;
        await addMessageToUI('assistant', assistantMessage, false, true);
        chats[activeChatId].messages.push({ role: 'assistant', content: assistantMessage });
        saveChats();
    } catch (error) {
        hideTypingIndicator();
        console.error('Error:', error);
        addMessageToUI('assistant', "Something went wrong on my end. Give it another shot, brother.", true, false);
    } finally {
        setLoading(false);
    }
}

// Send message to webhook
async function sendToWebhook(message) {
    const chat = chats[activeChatId];
    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: message,
            history: chat.messages.slice(-20), // Last 20 messages for context
            timestamp: new Date().toISOString()
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
}

// Add message to UI
async function addMessageToUI(role, content, isError = false, withTypingEffect = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex gap-3 message-enter';

    if (role === 'user') {
        messageDiv.innerHTML = `
            <div class="ml-auto bg-brand-accent/20 border border-brand-accent/30 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]">
                <div class="text-gray-200">${escapeHtml(content)}</div>
            </div>
            <div class="w-8 h-8 bg-brand-muted rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold">
                U
            </div>
        `;
        chatContainer.appendChild(messageDiv);
        scrollToBottom();
    } else {
        // Create elements directly instead of innerHTML for reliable reference
        const avatar = document.createElement('div');
        avatar.className = 'w-8 h-8 bg-gradient-to-br from-brand-accent to-orange-700 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold';
        avatar.textContent = 'J';

        const bubble = document.createElement('div');
        bubble.className = `bg-brand-dark border ${isError ? 'border-red-500/50' : 'border-brand-muted'} rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]`;

        const contentEl = document.createElement('div');
        contentEl.className = 'text-gray-200 leading-relaxed';

        bubble.appendChild(contentEl);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);
        chatContainer.appendChild(messageDiv);
        scrollToBottom();

        if (withTypingEffect) {
            await typeText(contentEl, content);
        } else {
            contentEl.innerHTML = parseMarkdown(content);
        }
    }
}

// Typing effect
async function typeText(element, text) {
    const words = text.split(' ');
    let currentText = '';

    for (let i = 0; i < words.length; i++) {
        currentText += (i === 0 ? '' : ' ') + words[i];
        element.innerHTML = parseMarkdown(currentText);
        scrollToBottom();

        // Variable delay for more natural feel (40-80ms per word)
        const delay = Math.random() * 40 + 40;
        await new Promise(resolve => setTimeout(resolve, delay));
    }
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

// Expose functions globally for HTML onclick
window.showConfig = showConfig;
window.saveConfig = saveConfig;
window.toggleSidebar = toggleSidebar;
window.createNewChat = createNewChat;
window.switchToChat = switchToChat;
window.promptDelete = promptDelete;
window.cancelDelete = cancelDelete;
window.confirmDelete = confirmDelete;

// Initialize on load
init();
