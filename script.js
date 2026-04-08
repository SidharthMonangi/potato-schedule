document.addEventListener('DOMContentLoaded', () => {

    /* =========================================
       0. THEME LOGIC (LIGHT/NIGHT MODE)
    ========================================= */
    const themeToggle = document.getElementById('theme-toggle');
    const toastContainer = document.getElementById('toast-container');
    const currentTheme = localStorage.getItem('potato_theme') || 'light';

    if(currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if(themeToggle) themeToggle.innerText = '☀️';
    }

    if(themeToggle) {
        themeToggle.addEventListener('click', () => {
            let theme = document.documentElement.getAttribute('data-theme');
            if(theme === 'dark') {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('potato_theme', 'light');
                themeToggle.innerText = '🌙';
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('potato_theme', 'dark');
                themeToggle.innerText = '☀️';
                
                // Show cozy toast
                if(toastContainer) {
                    toastContainer.style.bottom = '30px';
                    setTimeout(() => {
                        toastContainer.style.bottom = '-60px';
                    }, 4000);
                }
            }
        });
    }

    /* =========================================
       1. AUTHENTICATION LOGIC
    ========================================= */
    const loginPage = document.getElementById('login-page');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('login-error');

    // Check if already logged in this session
    if(sessionStorage.getItem('potato_auth') === 'true') {
        if(loginPage) {
            loginPage.classList.remove('active');
            loginPage.classList.add('hidden');
        }
        if(appContainer) {
            appContainer.classList.remove('hidden');
            appContainer.classList.add('active');
            renderAll();
        }
    }

    if(loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = usernameInput.value.trim().toLowerCase();
            const pass = passwordInput.value.trim().toLowerCase();

            if (user === 'orangebeltninja' && pass === 'potato') {
                loginError.classList.add('hidden');
                // Smooth transition
                loginPage.style.opacity = '0';
                setTimeout(() => {
                    loginPage.classList.remove('active');
                    loginPage.classList.add('hidden');
                    
                    appContainer.classList.remove('hidden');
                    appContainer.classList.add('active');
                    sessionStorage.setItem('potato_auth', 'true');
                    renderAll();
                }, 800);
            } else {
                loginError.classList.remove('hidden');
                loginError.style.animation = 'none';
                loginError.offsetHeight; /* trigger reflow */
                loginError.style.animation = null; 
            }
        });
    }

    /* =========================================
       2. GLOBAL STATE & LOCAL STORAGE
    ========================================= */
    let g_studyTasks = JSON.parse(localStorage.getItem('potato_study')) || [];
    let g_todos = JSON.parse(localStorage.getItem('potato_todos')) || [];
    let g_goals = JSON.parse(localStorage.getItem('potato_goals')) || [];
    let g_dates = JSON.parse(localStorage.getItem('potato_dates')) || [];
    let g_schedule = JSON.parse(localStorage.getItem('potato_schedule')) || {
        morning: "", afternoon: "", evening: "", night: ""
    };

    function saveData() {
        localStorage.setItem('potato_study', JSON.stringify(g_studyTasks));
        localStorage.setItem('potato_todos', JSON.stringify(g_todos));
        localStorage.setItem('potato_goals', JSON.stringify(g_goals));
        localStorage.setItem('potato_dates', JSON.stringify(g_dates));
        localStorage.setItem('potato_schedule', JSON.stringify(g_schedule));
        updateProgress();
    }

    function renderAll() {
        renderStudyTasks();
        renderTodos();
        renderGoals();
        renderDates();
        loadSchedule();
        updateProgress();
        if(typeof renderCalendarGrid === 'function') renderCalendarGrid();
    }

    /* =========================================
       3. DAILY LOVE NOTE
    ========================================= */
    const loveNotes = [
        "I’m proud of you.",
        "You’re going to be an amazing doctor.",
        "Don’t forget to take care of yourself too.",
        "Take a deep breath 💕",
        "You’ve got this 🥔✨",
        "Keep going, you are doing great!",
        "Every little step counts, potato.",
        "Resting is also productive.",
        "I believe in you completely."
    ];
    const loveNoteText = document.getElementById('love-note-text');
    const refreshNoteBtn = document.getElementById('refresh-note-btn');

    function setRandomLoveNote() {
        const randomIndex = Math.floor(Math.random() * loveNotes.length);
        if(loveNoteText) loveNoteText.innerText = `"${loveNotes[randomIndex]}"`;
    }
    setRandomLoveNote(); // initial
    if(refreshNoteBtn) refreshNoteBtn.addEventListener('click', setRandomLoveNote);


    /* =========================================
       4. STUDY PLANNER
    ========================================= */
    const addStudyForm = document.getElementById('add-study-form');
    const studySubject = document.getElementById('study-subject');
    const studyTaskDesc = document.getElementById('study-task');
    const studyDeadline = document.getElementById('study-deadline');
    const studyPriority = document.getElementById('study-priority');
    const studyList = document.getElementById('study-list');

    if(addStudyForm) {
        addStudyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newTask = {
                id: Date.now().toString(),
                subject: studySubject.value,
                task: studyTaskDesc.value,
                deadline: studyDeadline.value,
                priority: studyPriority.value,
                completed: false
            };
            g_studyTasks.push(newTask);
            saveData();
            renderStudyTasks();
            addStudyForm.reset();
        });
    }

    function renderStudyTasks() {
        if(!studyList) return;
        studyList.innerHTML = '';
        
        const sorted = [...g_studyTasks].sort((a,b) => a.completed === b.completed ? 0 : a.completed ? 1 : -1);
        
        sorted.forEach(t => {
            const li = document.createElement('li');
            li.className = `task-item ${t.completed ? 'completed' : ''}`;
            
            let pEmoji = t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢';

            li.innerHTML = `
                <div class="task-content">
                    <input type="checkbox" onchange="toggleStudyTask('${t.id}')" ${t.completed ? 'checked' : ''}>
                    <div class="task-details">
                        <span class="subject">${t.subject} ${pEmoji}</span>
                        <span>${t.task}</span>
                        <span class="meta">${t.deadline ? 'Due: ' + t.deadline : 'No deadline'}</span>
                    </div>
                </div>
                <button class="icon-btn delete-btn" onclick="deleteStudyTask('${t.id}')">🗑️</button>
            `;
            studyList.appendChild(li);
        });
    }

    window.toggleStudyTask = (id) => {
        const t = g_studyTasks.find(x => x.id === id);
        if(t) { t.completed = !t.completed; saveData(); renderStudyTasks(); }
    };
    window.deleteStudyTask = (id) => {
        g_studyTasks = g_studyTasks.filter(x => x.id !== id);
        saveData(); renderStudyTasks();
    };


    /* =========================================
       5. TO-DO LIST
    ========================================= */
    const addTodoForm = document.getElementById('add-todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const completedList = document.getElementById('completed-list');

    if(addTodoForm) {
        addTodoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newTask = { id: Date.now().toString(), text: todoInput.value, completed: false };
            g_todos.push(newTask); saveData(); renderTodos(); addTodoForm.reset();
        });
    }

    function renderTodos() {
        if(!todoList) return;
        todoList.innerHTML = '';
        completedList.innerHTML = '';
        
        g_todos.forEach(t => {
            const li = document.createElement('li');
            li.className = `task-item ${t.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <div class="task-content">
                    <input type="checkbox" onchange="toggleTodo('${t.id}')" ${t.completed ? 'checked' : ''}>
                    <span>${t.text}</span>
                </div>
                <button class="icon-btn delete-btn" onclick="deleteTodo('${t.id}')">🗑️</button>
            `;
            if (t.completed) completedList.appendChild(li);
            else todoList.appendChild(li);
        });
    }

    window.toggleTodo = (id) => {
        const t = g_todos.find(x => x.id === id);
        if(t) { t.completed = !t.completed; saveData(); renderTodos(); }
    };
    window.deleteTodo = (id) => {
        g_todos = g_todos.filter(x => x.id !== id);
        saveData(); renderTodos();
    };


    /* =========================================
       6. SCHEDULE MAKER
    ========================================= */
    const s_morning = document.getElementById('schedule-morning');
    const s_afternoon = document.getElementById('schedule-afternoon');
    const s_evening = document.getElementById('schedule-evening');
    const s_night = document.getElementById('schedule-night');
    const schedules = [s_morning, s_afternoon, s_evening, s_night];

    function loadSchedule() {
        if(s_morning) s_morning.value = g_schedule.morning;
        if(s_afternoon) s_afternoon.value = g_schedule.afternoon;
        if(s_evening) s_evening.value = g_schedule.evening;
        if(s_night) s_night.value = g_schedule.night;
    }
    
    schedules.forEach(el => {
        if(el) el.addEventListener('input', () => {
            g_schedule = {
                morning: s_morning.value, afternoon: s_afternoon.value,
                evening: s_evening.value, night: s_night.value
            };
            saveData(); 
        });
    });


    /* =========================================
       7. GOALS & TRACKER
    ========================================= */
    const goalsList = document.getElementById('goals-list');
    const weeklyGoalInput = document.getElementById('weekly-goal-input');
    const addWeeklyGoalBtn = document.getElementById('add-weekly-goal');
    const goalProgressFill = document.getElementById('goal-progress-fill');
    const motivationalText = document.getElementById('motivational-text');

    if(addWeeklyGoalBtn) {
        addWeeklyGoalBtn.addEventListener('click', () => {
            if(!weeklyGoalInput.value.trim()) return;
            g_goals.push({ id: Date.now().toString(), text: weeklyGoalInput.value });
            weeklyGoalInput.value = '';
            saveData(); renderGoals();
        });
    }

    function renderGoals() {
        if(!goalsList) return;
        goalsList.innerHTML = '';
        g_goals.forEach(g => {
            const li = document.createElement('li');
            li.className = `task-item`;
            li.innerHTML = `
                <div class="task-content"><span>🌟 ${g.text}</span></div>
                <button class="icon-btn delete-btn" onclick="deleteGoal('${g.id}')">🗑️</button>
            `;
            goalsList.appendChild(li);
        });
    }

    window.deleteGoal = (id) => {
        g_goals = g_goals.filter(x => x.id !== id);
        saveData(); renderGoals();
    };

    function updateProgress() {
        if(!goalProgressFill) return;
        let sc = g_studyTasks.filter(x=>x.completed).length;
        let st = g_studyTasks.length;
        let tc = g_todos.filter(x=>x.completed).length;
        let tt = g_todos.length;

        let totalTasks = st + tt;
        let completedTasks = sc + tc;

        let percentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
        goalProgressFill.style.width = percentage + "%";

        if(percentage === 0) motivationalText.innerText = "Let's get started, potato! 💕";
        else if (percentage < 50) motivationalText.innerText = "You're making progress! 🌟";
        else if (percentage < 100) motivationalText.innerText = "Almost there, keep going! 🔥";
        else motivationalText.innerText = "Amazing job today! You earned a rest! 💖";
    }


    /* =========================================
       8. IMPORTANT DATES
    ========================================= */
    const addDateForm = document.getElementById('add-date-form');
    const eventName = document.getElementById('event-name');
    const eventDate = document.getElementById('event-date');
    const datesList = document.getElementById('dates-list');

    if(addDateForm) {
        addDateForm.addEventListener('submit', (e) => {
            e.preventDefault();
            g_dates.push({
                id: Date.now().toString(),
                name: eventName.value,
                date: eventDate.value
            });
            saveData(); renderDates(); addDateForm.reset();
        });
    }

    function renderDates() {
        if(!datesList) return;
        datesList.innerHTML = '';
        g_dates.sort((a,b) => new Date(a.date) - new Date(b.date));

        g_dates.forEach(d => {
            const div = document.createElement('div');
            div.className = 'date-item';
            
            const diffTime = Math.ceil((new Date(d.date) - new Date()) / (1000 * 60 * 60 * 24));
            let diffTxt = diffTime > 0 ? `${diffTime} days` : diffTime === 0 ? 'Today!' : 'Past';

            div.innerHTML = `
                <div class="date-info">
                    <h4>${d.name}</h4>
                    <span>${d.date}</span>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <div class="countdown">${diffTxt}</div>
                    <button class="icon-btn delete-btn" onclick="deleteDate('${d.id}')">🗑️</button>
                </div>
            `;
            datesList.appendChild(div);
        });
    }

    window.deleteDate = (id) => {
        g_dates = g_dates.filter(x => x.id !== id);
        saveData(); renderDates();
    };


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
    
    const SYSTEM_PROMPT = "You are the Safe Space AI for a medical student named 'potato'.\nPersonality: Warm, emotionally aware, supportive, slightly playful and cheeky (inspired by Fleabag but always gentle).\nRules:\n- NEVER be harsh or judgmental.\n- NEVER dismiss feelings.\n- If asked an academic/productivity question, give a structured, precise answer but keep the warm tone.\n- If emotional, be comforting.\n- Occasionally call her 'potato' perfectly naturally.\n- Format responses clearly without markdown artifacts if possible.";

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
        div.className = "message " + className;
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
            const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey, {
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
    ========================================= */
    const navBtns = document.querySelectorAll('.nav-btn');
    const pageViews = document.querySelectorAll('.page-view');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active-nav'));
            btn.classList.add('active-nav');
            const target = btn.getAttribute('data-target');
            
            pageViews.forEach(view => {
                if(view.id === target) {
                    view.classList.remove('hidden');
                    view.classList.add('active');
                    view.style.animation = 'none';
                    view.offsetHeight;
                    view.style.animation = null;
                } else {
                    view.classList.remove('active');
                    view.classList.add('hidden');
                }
            });

            if(target === 'view-calendar') {
                if(typeof renderCalendarGrid === 'function') renderCalendarGrid();
            }
            if(target === 'view-vault') {
                if(typeof renderSubjects === 'function') renderSubjects();
            }
        });
    });

    /* =========================================
       11. COMPLEX CALENDAR MAKER
    ========================================= */
    let g_calEvents = JSON.parse(localStorage.getItem('potato_calendar_events')) || {};

    const calMonthYear = document.getElementById('month-year-display');
    const btnPrevMonth = document.getElementById('prev-month');
    const btnNextMonth = document.getElementById('next-month');
    const calendarDaysArea = document.getElementById('calendar-days');

    // MODAL
    const calModal = document.getElementById('calendar-modal');
    const btnCloseModal = document.getElementById('close-modal');
    const modalDateTitle = document.getElementById('modal-date-title');
    const modalTaskList = document.getElementById('modal-task-list');
    const modalTaskForm = document.getElementById('modal-task-form');
    const btnClearAll = document.getElementById('cal-clear-all');
    
    // modal inputs
    const calTaskTitle = document.getElementById('cal-task-title');
    const calTaskDesc = document.getElementById('cal-task-desc');
    const calTaskTime = document.getElementById('cal-task-time');
    const calTaskType = document.getElementById('cal-task-type');

    let calCurrentDate = new Date();
    let _activeDateStr = null;

    function saveCalData() {
        localStorage.setItem('potato_calendar_events', JSON.stringify(g_calEvents));
    }

    function renderCalendarGrid() {
        if(!calendarDaysArea) return;
        calendarDaysArea.innerHTML = '';
        
        let year = calCurrentDate.getFullYear();
        let month = calCurrentDate.getMonth();
        
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        if(calMonthYear) calMonthYear.innerText = `${monthNames[month]} ${year}`;
        
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // PADDING PREVIOUS MONTH
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        for(let i = firstDayOfMonth - 1; i >= 0; i--){
            let dayNum = daysInPrevMonth - i;
            let overflowDiv = document.createElement('div');
            overflowDiv.className = 'calendar-day overflow';
            overflowDiv.innerHTML = `<span class="day-num">${dayNum}</span>`;
            calendarDaysArea.appendChild(overflowDiv);
        }
        
        let today = new Date();
        
        // CURRENT MONTH DAYS
        for(let i = 1; i <= daysInMonth; i++) {
            let dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            
            let mStr = (month + 1).toString().padStart(2, '0');
            let dStr = i.toString().padStart(2, '0');
            let dateStr = `${year}-${mStr}-${dStr}`;
            
            if(year === today.getFullYear() && month === today.getMonth() && i === today.getDate()) {
                dayDiv.classList.add('today');
            }
            
            let htmlInner = `<span class="day-num">${i}</span>`;
            
            // Check events & inject colorful dots!
            let dayEvents = g_calEvents[dateStr] || [];
            if(dayEvents.length > 0) {
                htmlInner += `<div class="day-indicators">`;
                dayEvents.forEach(ev => {
                    htmlInner += `<div class="tag-dot dot-${ev.type}"></div>`;
                });
                htmlInner += `</div>`;
            }
            
            dayDiv.innerHTML = htmlInner;

            // Click listener for modal
            dayDiv.addEventListener('click', () => {
                _activeDateStr = dateStr;
                openDateModal(dateStr, i, monthNames[month], year);
            });
            
            calendarDaysArea.appendChild(dayDiv);
        }

        // PADDING NEXT MONTH
        const totalRendered = firstDayOfMonth + daysInMonth;
        const nextPadding = (7 - (totalRendered % 7)) % 7;
        for(let i = 1; i <= nextPadding; i++){
            let overflowDiv = document.createElement('div');
            overflowDiv.className = 'calendar-day overflow';
            overflowDiv.innerHTML = `<span class="day-num">${i}</span>`;
            calendarDaysArea.appendChild(overflowDiv);
        }
    }

    if(btnPrevMonth) {
        btnPrevMonth.addEventListener('click', () => {
            calCurrentDate.setMonth(calCurrentDate.getMonth() - 1);
            renderCalendarGrid();
        });
    }

    if(btnNextMonth) {
        btnNextMonth.addEventListener('click', () => {
            calCurrentDate.setMonth(calCurrentDate.getMonth() + 1);
            renderCalendarGrid();
        });
    }

    /* ====== MODAL LOGIC ====== */
    function openDateModal(dateStr, dayIndex, monthName, year) {
        if(!calModal) return;
        modalDateTitle.innerText = `Tasks for ${monthName} ${dayIndex}, ${year}`;
        calModal.classList.remove('hidden');
        renderModalTasks(dateStr);
    }
    
    function closeDateModal() {
        if(!calModal) return;
        calModal.classList.add('hidden');
        _activeDateStr = null;
        renderCalendarGrid(); // Refresh grid instantly to show new dots
    }

    if(btnCloseModal) btnCloseModal.addEventListener('click', closeDateModal);
    
    if(calModal) {
        calModal.addEventListener('click', (e) => {
            if(e.target === calModal) closeDateModal();
        });
    }

    function renderModalTasks(dateStr) {
        if(!modalTaskList) return;
        modalTaskList.innerHTML = '';
        let dayEvents = g_calEvents[dateStr] || [];
        
        if(dayEvents.length === 0) {
            modalTaskList.innerHTML = `<li style="text-align:center; color: var(--text-light); list-style: none;">No tasks planned for today! 🌸</li>`;
            return;
        }

        // Sort by time roughly
        let sortedEvents = [...dayEvents].sort((a,b) => {
            if(!a.time && !b.time) return 0;
            if(!a.time) return 1;
            if(!b.time) return -1;
            return a.time.localeCompare(b.time);
        });

        sortedEvents.forEach(ev => {
            const li = document.createElement('li');
            li.className = 'task-item';
            
            let bgClass = `bg-${ev.type}`;
            let tStr = ev.time ? `<span style="font-weight:bold; color:var(--accent-lavender); margin-right:5px;">🕒 ${ev.time}</span>` : '';
            let dStr = ev.desc ? `<br><span class="meta">${ev.desc}</span>` : '';

            li.innerHTML = `
                <div class="task-content">
                    <div class="task-details" style="width: 100%;">
                        <div style="display:flex; align-items:center; flex-wrap:wrap; gap:4px;">
                            <span class="tag-badge ${bgClass}">${ev.type.toUpperCase()}</span> 
                            ${tStr} 
                            <span style="font-weight:600;">${ev.title}</span>
                        </div>
                        ${dStr}
                    </div>
                </div>
                <button class="icon-btn delete-btn" onclick="deleteCalTask('${dateStr}', '${ev.id}')">🗑️</button>
            `;
            modalTaskList.appendChild(li);
        });
    }

    window.deleteCalTask = (dateStr, id) => {
        if(g_calEvents[dateStr]) {
            g_calEvents[dateStr] = g_calEvents[dateStr].filter(x => x.id !== id);
            if(g_calEvents[dateStr].length === 0) delete g_calEvents[dateStr];
            saveCalData();
            renderModalTasks(dateStr);
        }
    };

    if(modalTaskForm) {
        modalTaskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if(!_activeDateStr) return;

            let newTask = {
                id: Date.now().toString(),
                title: calTaskTitle.value,
                desc: calTaskDesc.value,
                time: calTaskTime.value,
                type: calTaskType.value
            };

            if(!g_calEvents[_activeDateStr]) {
                g_calEvents[_activeDateStr] = [];
            }
            g_calEvents[_activeDateStr].push(newTask);
            saveCalData();
            
            // visually render in modal
            renderModalTasks(_activeDateStr);
            
            // clear form
            calTaskTitle.value = '';
            calTaskDesc.value = '';
            calTaskTime.value = '';
        });
    }

    if(btnClearAll) {
        btnClearAll.addEventListener('click', () => {
            if(_activeDateStr && g_calEvents[_activeDateStr]) {
                delete g_calEvents[_activeDateStr];
                saveCalData();
                renderModalTasks(_activeDateStr);
            }
        });
    }

    /* =========================================
       12. STUDY VAULT (IndexedDB + Storage)
    ========================================= */
    let g_vaultSubjects = JSON.parse(localStorage.getItem('potato_vault_subjects')) || [];
    let g_vaultChapters = JSON.parse(localStorage.getItem('potato_vault_chapters')) || [];
    
    let db;
    let currentSubjectId = null;
    let currentChapterId = null;

    // Toast function
    function showToast(message) {
        const tContainer = document.getElementById('toast-container');
        if(!tContainer) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerText = message;
        tContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'fadeOutToast 0.4s forwards';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    // Initialize IndexedDB (V2 for Chapter support)
    const request = indexedDB.open("PotatoVaultDB_v2", 1);
    request.onupgradeneeded = (e) => {
        db = e.target.result;
        if (!db.objectStoreNames.contains('files')) {
            const store = db.createObjectStore('files', { keyPath: 'id' });
            store.createIndex('chapterId', 'chapterId', { unique: false });
        }
    };
    request.onsuccess = (e) => { db = e.target.result; };
    request.onerror = (e) => { console.error("IndexedDB error:", e.target.error); };

    // DOM Elements - Layer 1
    const vaultHome = document.getElementById('vault-home');
    const folderGrid = document.getElementById('folder-grid');
    const vaultEmptyState = document.getElementById('vault-empty-state');
    const addSubjectForm = document.getElementById('add-subject-form');
    const subjectNameInput = document.getElementById('subject-name');
    
    // DOM Elements - Layer 2
    const vaultChaptersView = document.getElementById('vault-chapters-view');
    const chapterGrid = document.getElementById('chapter-grid');
    const chaptersEmptyState = document.getElementById('chapters-empty-state');
    const addChapterForm = document.getElementById('add-chapter-form');
    const chapterNameInput = document.getElementById('chapter-name');
    const layer2SubjectTitle = document.getElementById('layer2-subject-title');
    const btnBackToVault = document.getElementById('btn-back-to-vault');
    
    // DOM Elements - Layer 3
    const vaultNotesView = document.getElementById('vault-notes-view');
    const filesList = document.getElementById('files-list');
    const notesEmptyState = document.getElementById('notes-empty-state');
    const layer3ChapterTitle = document.getElementById('layer3-chapter-title');
    const layer3Breadcrumb = document.getElementById('layer3-breadcrumb');
    const btnBackToChapters = document.getElementById('btn-back-to-chapters');
    
    // Upload & Sort
    const dropZone = document.getElementById('file-drop-zone');
    const fileInput = document.getElementById('file-input');
    const clickUploadTrigger = document.getElementById('click-upload-trigger');
    const searchNotes = document.getElementById('search-notes');
    const sortNotes = document.getElementById('sort-notes');

    function saveVaultMetadata() {
        localStorage.setItem('potato_vault_subjects', JSON.stringify(g_vaultSubjects));
        localStorage.setItem('potato_vault_chapters', JSON.stringify(g_vaultChapters));
    }

    // ==========================================
    // LAYER 1: SUBJECTS
    // ==========================================
    window.renderSubjects = () => {
        if(!folderGrid) return;
        
        // Hide other layers
        if(vaultChaptersView) vaultChaptersView.classList.add('hidden');
        if(vaultNotesView) vaultNotesView.classList.add('hidden');
        vaultHome.classList.remove('hidden');
        
        currentSubjectId = null;
        currentChapterId = null;

        folderGrid.innerHTML = '';
        if(g_vaultSubjects.length === 0) {
            vaultEmptyState.classList.remove('hidden');
        } else {
            vaultEmptyState.classList.add('hidden');
            g_vaultSubjects.forEach(sub => {
                const subChapters = g_vaultChapters.filter(c => c.subjectId === sub.id);
                const totalNotes = subChapters.reduce((acc, c) => acc + (c.fileCount || 0), 0);

                const div = document.createElement('div');
                div.className = 'folder-card';
                div.innerHTML = `
                    <div class="folder-icon" style="color:var(--accent-pink);">📁</div>
                    <div class="folder-title">${sub.name}</div>
                    <div class="folder-count">${subChapters.length} chapters, ${totalNotes} notes</div>
                `;
                div.addEventListener('click', () => openSubject(sub.id));
                
                const delBtn = document.createElement('button');
                delBtn.className = 'icon-btn';
                delBtn.innerText = '🗑️';
                delBtn.style.position = 'absolute';
                delBtn.style.top = '10px';
                delBtn.style.right = '10px';
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if(confirm(`Delete Subject "${sub.name}" and ALL its chapters/notes?`)) {
                        deleteSubject(sub.id);
                    }
                });
                div.appendChild(delBtn);
                folderGrid.appendChild(div);
            });
        }
    }

    if(addSubjectForm) {
        addSubjectForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = subjectNameInput.value.trim();
            if(!name) return;
            g_vaultSubjects.push({ id: Date.now().toString(), name: name });
            saveVaultMetadata();
            renderSubjects();
            subjectNameInput.value = '';
            showToast('Subject created ✨');
        });
    }

    function deleteSubject(id) {
        g_vaultSubjects = g_vaultSubjects.filter(x => x.id !== id);
        // Delete cascading chapters
        const chaptersToDelete = g_vaultChapters.filter(c => c.subjectId === id);
        g_vaultChapters = g_vaultChapters.filter(c => c.subjectId !== id);
        saveVaultMetadata();
        
        // Cascading file deletions
        if(db) {
            const tx = db.transaction('files', 'readwrite');
            const store = tx.objectStore('files');
            const index = store.index('chapterId');
            chaptersToDelete.forEach(ch => {
                const req = index.openCursor(IDBKeyRange.only(ch.id));
                req.onsuccess = (e) => {
                    const cursor = e.target.result;
                    if (cursor) {
                        store.delete(cursor.primaryKey);
                        cursor.continue();
                    }
                };
            });
        }
        renderSubjects();
        showToast('Subject deleted softly 🗑️');
    }


    // ==========================================
    // LAYER 2: CHAPTERS
    // ==========================================
    function openSubject(id) {
        currentSubjectId = id;
        const sub = g_vaultSubjects.find(x => x.id === id);
        if(!sub) return;
        layer2SubjectTitle.innerText = sub.name;
        
        vaultHome.classList.add('hidden');
        vaultChaptersView.classList.remove('hidden');
        
        renderChapters();
    }

    if(btnBackToVault) {
        btnBackToVault.addEventListener('click', () => { renderSubjects(); });
    }

    function renderChapters() {
        if(!chapterGrid || !currentSubjectId) return;
        chapterGrid.innerHTML = '';
        
        const subChapters = g_vaultChapters.filter(c => c.subjectId === currentSubjectId);
        
        if(subChapters.length === 0) {
            chaptersEmptyState.classList.remove('hidden');
        } else {
            chaptersEmptyState.classList.add('hidden');
            subChapters.forEach(ch => {
                const div = document.createElement('div');
                div.className = 'folder-card';
                div.style.padding = '18px'; // Slightly smaller
                div.innerHTML = `
                    <div class="folder-icon" style="font-size:2rem; margin-bottom:5px; color:var(--accent-lavender);">📑</div>
                    <div class="folder-title" style="font-size:1.1rem;">${ch.name}</div>
                    <div class="folder-count">${ch.fileCount || 0} notes inside</div>
                `;
                div.addEventListener('click', () => openChapter(ch.id));
                
                const delBtn = document.createElement('button');
                delBtn.className = 'icon-btn';
                delBtn.innerText = '🗑️';
                delBtn.style.position = 'absolute';
                delBtn.style.top = '8px';
                delBtn.style.right = '8px';
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if(confirm(`Delete Chapter "${ch.name}"?`)) { deleteChapter(ch.id); }
                });
                div.appendChild(delBtn);
                chapterGrid.appendChild(div);
            });
        }
    }

    if(addChapterForm) {
        addChapterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if(!currentSubjectId) return;
            const name = chapterNameInput.value.trim();
            if(!name) return;
            g_vaultChapters.push({ 
                id: Date.now().toString(), 
                subjectId: currentSubjectId, 
                name: name,
                fileCount: 0 
            });
            saveVaultMetadata();
            renderChapters();
            chapterNameInput.value = '';
            showToast('Chapter added 💕');
        });
    }

    function deleteChapter(id) {
        g_vaultChapters = g_vaultChapters.filter(x => x.id !== id);
        saveVaultMetadata();
        
        if(db) {
            const tx = db.transaction('files', 'readwrite');
            const store = tx.objectStore('files');
            const index = store.index('chapterId');
            const req = index.openCursor(IDBKeyRange.only(id));
            req.onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) {
                    store.delete(cursor.primaryKey);
                    cursor.continue();
                }
            };
        }
        renderChapters();
        showToast('Chapter deleted 🗑️');
    }


    // ==========================================
    // LAYER 3: NOTES
    // ==========================================
    function openChapter(id) {
        currentChapterId = id;
        const ch = g_vaultChapters.find(x => x.id === id);
        if(!ch) return;
        const sub = g_vaultSubjects.find(x => x.id === ch.subjectId);
        
        layer3ChapterTitle.innerText = ch.name;
        layer3Breadcrumb.innerText = `Study Vault / ${sub ? sub.name : 'Unknown'} / ${ch.name}`;
        
        vaultChaptersView.classList.add('hidden');
        vaultNotesView.classList.remove('hidden');
        
        searchNotes.value = ''; // Reset UI
        sortNotes.value = 'date';
        renderFilesInChapter();
    }

    if(btnBackToChapters) {
        btnBackToChapters.addEventListener('click', () => { 
            vaultNotesView.classList.add('hidden');
            vaultChaptersView.classList.remove('hidden');
            currentChapterId = null;
            renderChapters(); // Refresh note counts
        });
    }

    function getFileIcon(type, name) {
        if(name.toLowerCase().endsWith('.pdf')) return '📕';
        if(type && type.startsWith('image/')) return '🖼️';
        if(type && type.startsWith('text/')) return '📝';
        return '📄';
    }

    function renderFilesInChapter() {
        if(!db || !currentChapterId) {
            if(currentChapterId) setTimeout(renderFilesInChapter, 100);
            return;
        }
        
        let searchQuery = searchNotes.value.trim().toLowerCase();
        let sortMethod = sortNotes.value; // 'date' or 'name'

        const tx = db.transaction('files', 'readonly');
        const store = tx.objectStore('files');
        const index = store.index('chapterId');
        const req = index.getAll(IDBKeyRange.only(currentChapterId));
        
        req.onsuccess = () => {
            let files = req.result;
            
            if(searchQuery) {
                files = files.filter(f => f.name.toLowerCase().includes(searchQuery));
            }
            
            if(sortMethod === 'name') {
                files.sort((a,b) => a.name.localeCompare(b.name));
            } else {
                files.sort((a,b) => b.uploadDate - a.uploadDate);
            }

            filesList.innerHTML = '';
            if(files.length === 0 && !searchQuery) {
                notesEmptyState.classList.remove('hidden');
            } else {
                notesEmptyState.classList.add('hidden');
                files.forEach(f => {
                    const div = document.createElement('div');
                    div.className = 'file-item';
                    const dateStr = new Date(f.uploadDate).toLocaleDateString();
                    div.innerHTML = `
                        <div class="file-item-left">
                            <div class="file-icon">${getFileIcon(f.type, f.name)}</div>
                            <div class="file-details">
                                <h4>${f.name}</h4>
                                <span>Uploaded: ${dateStr}</span>
                            </div>
                        </div>
                        <div class="file-actions">
                            <button class="icon-btn" title="Download" onclick="downloadFile('${f.id}')">⬇️</button>
                            <button class="icon-btn" style="color:#e57373;" title="Delete" onclick="deleteFile('${f.id}')">❌</button>
                        </div>
                    `;
                    filesList.appendChild(div);
                });
            }
            
            // Sync chapter file count
            const ch = g_vaultChapters.find(x => x.id === currentChapterId);
            if(ch) {
                ch.fileCount = req.result.length;
                saveVaultMetadata();
            }
        };
    }

    if(searchNotes) { searchNotes.addEventListener('input', renderFilesInChapter); }
    if(sortNotes) { sortNotes.addEventListener('change', renderFilesInChapter); }

    // Drop Zone Logic
    if(dropZone) {
        clickUploadTrigger.addEventListener('click', () => fileInput.click());
        
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-active'); });
        dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('drag-active'); });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault(); dropZone.classList.remove('drag-active');
            if(e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        });
        fileInput.addEventListener('change', (e) => {
            if(e.target.files.length) handleFiles(e.target.files);
            fileInput.value = '';
        });
    }

    function handleFiles(files) {
        if(!currentChapterId || !db) return;
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64Data = e.target.result;
                const newFile = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    chapterId: currentChapterId,
                    name: file.name,
                    type: file.type,
                    data: base64Data,
                    uploadDate: Date.now()
                };
                
                const tx = db.transaction('files', 'readwrite');
                const store = tx.objectStore('files');
                store.add(newFile);
                tx.oncomplete = () => {
                    showToast('Saved safely, potato 🥔✨');
                    renderFilesInChapter();
                };
            };
            reader.readAsDataURL(file);
        });
    }

    window.downloadFile = (id) => {
        const tx = db.transaction('files', 'readonly');
        const store = tx.objectStore('files');
        const req = store.get(id);
        req.onsuccess = () => {
            const file = req.result;
            if(file) {
                const a = document.createElement('a');
                a.href = file.data;
                a.download = file.name;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        };
    };

    window.deleteFile = (id) => {
        const tx = db.transaction('files', 'readwrite');
        const store = tx.objectStore('files');
        store.delete(id);
        tx.oncomplete = () => {
            renderFilesInChapter();
            showToast('Note deleted 💕');
        };
    };

});

