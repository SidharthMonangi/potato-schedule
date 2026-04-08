$original = Get-Content -Path "c:\Users\sidha\sidforpotato\script.js" -Raw -Encoding UTF8

$newContent = @"
    /* =========================================
       9. AI MOTIVATION BOT (API INTEGRATED)
    ========================================= */
    const chatForm = document.getElementById('chat-form') || document.getElementById('ai-chat-form');
    const chatInput = document.getElementById('chat-input') || document.getElementById('ai-input');
    const chatWindow = document.getElementById('chat-window') || document.getElementById('ai-chat-box');
    const typingIndicator = document.getElementById('ai-typing-indicator');

    const apiModal = document.getElementById('api-modal-overlay');
    const apiKeyForm = document.getElementById('api-key-form');
    const geminiApiKeyInput = document.getElementById('gemini-api-key');
    const btnAiSettings = document.getElementById('btn-ai-settings');
    const closeApiModal = document.getElementById('close-api-modal');

    let aiChatHistory = [];
    
    const SYSTEM_PROMPT = \`You are the Safe Space AI for a medical student named 'potato'. 
Personality: Warm, emotionally aware, supportive, slightly playful and cheeky (inspired by Fleabag but always gentle).
Rules: 
- NEVER be harsh or judgmental.
- NEVER dismiss feelings.
- If asked an academic/productivity question, give a structured, precise answer but keep the warm tone.
- If emotional, be comforting.
- Occasionally call her 'potato' with a potato emoji gently.
- Format responses clearly without markdown artifacts if possible.\`;

    if(btnAiSettings && apiModal) {
        btnAiSettings.addEventListener('click', () => {
            const savedKey = localStorage.getItem('potato_gemini_key');
            if(savedKey) geminiApiKeyInput.value = savedKey;
            apiModal.classList.remove('hidden');
        });
    }

    if(closeApiModal && apiModal) {
        closeApiModal.addEventListener('click', () => {
            apiModal.classList.add('hidden');
        });
    }

    if(apiKeyForm) {
        apiKeyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const key = geminiApiKeyInput.value.trim();
            if(key) {
                localStorage.setItem('potato_gemini_key', key);
                apiModal.classList.add('hidden');
                appendMessage("Ooh, I feel smarter already! API Key saved safely locally.", 'bot-message');
            }
        });
    }

    if(chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const msg = chatInput.value.trim();
            if(!msg) return;

            appendMessage(msg, 'user-message');
            chatInput.value = '';
            
            aiChatHistory.push({ role: "user", parts: [{ text: msg }] });
            if(aiChatHistory.length > 12) aiChatHistory = aiChatHistory.slice(aiChatHistory.length - 12);

            await fetchGeminiResponse();
        });
    }

    function appendMessage(text, className) {
        if(!chatWindow) return;
        const div = document.createElement('div');
        div.className = \`message \${className}\`;
        div.innerText = text;
        
        if(typingIndicator && chatWindow.contains(typingIndicator)) {
            chatWindow.insertBefore(div, typingIndicator);
        } else {
            chatWindow.appendChild(div);
        }
        
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    async function fetchGeminiResponse() {
        const apiKey = localStorage.getItem('potato_gemini_key');
        
        if(!apiKey) {
            setTimeout(() => {
                appendMessage("Hmm... my brain is disconnected right now. Can you click the settings icon to plug in my API key?", 'bot-message');
            }, 600);
            return;
        }

        if(typingIndicator) {
            typingIndicator.classList.remove('hidden');
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }

        try {
            const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=\${apiKey}\`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    system_instruction: {
                         parts: [{ text: SYSTEM_PROMPT }]
                    },
                    contents: aiChatHistory
                })
            });

            const data = await response.json();
            
            if(typingIndicator) typingIndicator.classList.add('hidden');

            if(data.error) {
                console.error("API Error:", data.error);
                appendMessage("Oops... my brain had a tiny error (Invalid API Key).", 'bot-message');
                return;
            }

            if(data.candidates && data.candidates.length > 0) {
                let botText = data.candidates[0].content.parts[0].text;
                appendMessage(botText, 'bot-message');
                aiChatHistory.push({ role: "model", parts: [{ text: botText }] });
            } else {
                appendMessage("Hmm... my brain paused for a second... try again?", 'bot-message');
            }

        } catch (err) {
            if(typingIndicator) typingIndicator.classList.add('hidden');
            console.error(err);
            appendMessage("Hmm... my brain paused for a second (network error)... try again?", 'bot-message');
        }
    }

    /* =========================================
       10. NAVIGATION LOGIC
"@

$regex = '(?s)/\* =========================================\r?\n\s+9\. AI MOTIVATION BOT\r?\n\s+=========================================\ \*/.*?/\* =========================================\r?\n\s+10\. NAVIGATION LOGIC'

$modified = $original -replace $regex, $newContent
Set-Content -Path "c:\Users\sidha\sidforpotato\script.js" -Value $modified -Encoding UTF8
