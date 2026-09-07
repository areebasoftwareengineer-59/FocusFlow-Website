/* =========================================================
   FOCUSFLOW — SMART PRODUCTIVITY ENGINE
   Complete JavaScript
========================================================= */

"use strict";


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);


/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY = "focusflow_tasks";
const SETTINGS_KEY = "focusflow_settings";
const FOCUS_KEY = "focusflow_focus";

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

let settings = JSON.parse(
    localStorage.getItem(SETTINGS_KEY)
) || {
    deadlineAlerts: true,
    dailyBriefing: true,
    autoPriority: true,
    overloadProtection: true
};

let focusData = JSON.parse(
    localStorage.getItem(FOCUS_KEY)
) || {
    totalMinutes: 0,
    sessions: 0
};


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentFilter = "all";
let currentSort = "priority";

let timerSeconds = 25 * 60;
let timerInterval = null;
let timerRunning = false;

let calendarDate = new Date();

let searchTerm = "";


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    setDefaultDeadline();

    loadSettings();

    setupNavigation();

    setupModal();

    setupTaskForm();

    setupFilters();

    setupSorting();

    setupSearch();

    setupNotifications();

    setupTheme();

    setupPlanner();

    setupFocus();

    setupCalendar();

    setupSettings();

    setupQuickActions();

    setupRecalculate();

    renderEverything();

    updateDate();

    setInterval(updateDate, 60000);

    setTimeout(() => {
        showToast(
            "FocusFlow Ready",
            "Your productivity command center is ready."
        );
    }, 700);

    if (window.lucide) {
        lucide.createIcons();
    }

});


/* =========================================================
   SAVE DATA
========================================================= */

function saveTasks() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(tasks)
    );
}

function saveSettings() {
    localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(settings)
    );
}

function saveFocusData() {
    localStorage.setItem(
        FOCUS_KEY,
        JSON.stringify(focusData)
    );
}


/* =========================================================
   DATE
========================================================= */

function updateDate() {

    const now = new Date();

    const day = now.toLocaleDateString(
        "en-US",
        { weekday: "short" }
    ).toUpperCase();

    const date = String(
        now.getDate()
    ).padStart(2, "0");

    const month = now.toLocaleDateString(
        "en-US",
        {
            month: "short",
            year: "numeric"
        }
    ).toUpperCase();

    if ($("#currentDay")) {
        $("#currentDay").textContent = day;
    }

    if ($("#currentDate")) {
        $("#currentDate").textContent = date;
    }

    if ($("#currentMonth")) {
        $("#currentMonth").textContent = month;
    }
}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    $$(".nav-link").forEach(link => {

        link.addEventListener("click", (event) => {

            event.preventDefault();

            const page = link.dataset.page;

            navigateTo(page);

        });

    });


    if ($("#mobileMenu")) {

        $("#mobileMenu").addEventListener(
            "click",
            () => {

                $("#sidebar")?.classList.toggle("open");

            }
        );

    }

}


function navigateTo(page) {

    $$(".page-section").forEach(section => {
        section.classList.remove("active");
    });

    const target = document.getElementById(page);

    if (!target) return;

    target.classList.add("active");

    $$(".nav-link").forEach(link => {
        link.classList.toggle(
            "active",
            link.dataset.page === page
        );
    });

    const names = {
        dashboard: "Dashboard",
        tasks: "My Tasks",
        planner: "Smart Planner",
        focus: "Focus Mode",
        analytics: "Analytics",
        calendar: "Calendar",
        settings: "Settings"
    };

    if ($("#breadcrumbPage")) {
        $("#breadcrumbPage").textContent =
            names[page] || page;
    }

    history.replaceState(
        null,
        "",
        `#${page}`
    );

    $("#sidebar")?.classList.remove("open");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if (page === "analytics") {
        renderAnalyticsChart();
    }

    if (page === "calendar") {
        renderCalendar();
    }

    if (page === "focus") {
        renderFocusTask();
    }
}


/* =========================================================
   TASK MODAL
========================================================= */

function setupModal() {

    $("#addTaskButton")?.addEventListener(
        "click",
        openTaskModal
    );

    $("#quickAddTask")?.addEventListener(
        "click",
        openTaskModal
    );

    $("#closeModal")?.addEventListener(
        "click",
        closeTaskModal
    );

    $("#cancelTask")?.addEventListener(
        "click",
        closeTaskModal
    );

    $("#taskModal")?.addEventListener(
        "click",
        (event) => {

            if (
                event.target === $("#taskModal")
            ) {
                closeTaskModal();
            }

        }
    );

}


function openTaskModal() {

    $("#taskModal")?.classList.add("active");

    setDefaultDeadline();

    setTimeout(() => {
        $("#taskTitle")?.focus();
    }, 150);

}


function closeTaskModal() {

    $("#taskModal")?.classList.remove("active");

    $("#taskForm")?.reset();

    setDefaultDeadline();

}


/* =========================================================
   DEFAULT DEADLINE
========================================================= */

function setDefaultDeadline() {

    const input = $("#taskDeadline");

    if (!input) return;

    if (!input.value) {

        const today = new Date();

        const yyyy = today.getFullYear();

        const mm = String(
            today.getMonth() + 1
        ).padStart(2, "0");

        const dd = String(
            today.getDate()
        ).padStart(2, "0");

        input.value =
            `${yyyy}-${mm}-${dd}`;
    }
}


/* =========================================================
   TASK FORM
========================================================= */

function setupTaskForm() {

    $("#taskForm")?.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();

            const title =
                $("#taskTitle")?.value.trim();

            const description =
                $("#taskDescription")?.value.trim();

            const category =
                $("#taskCategory")?.value;

            const importance =
                $("#taskImportance")?.value;

            const duration =
                Number($("#taskDuration")?.value || 60);

            const deadline =
                $("#taskDeadline")?.value;

            if (!title || !deadline) {

                showToast(
                    "Missing information",
                    "Please enter a title and deadline."
                );

                return;
            }

            const task = {

                id: Date.now(),

                title,

                description,

                category,

                importance,

                duration,

                deadline,

                completed: false,

                createdAt:
                    new Date().toISOString(),

                completedAt: null

            };

            tasks.push(task);

            saveTasks();

            closeTaskModal();

            renderEverything();

            showToast(
                "Task Created",
                `"${title}" added to your workload.`
            );

        }
    );

}


/* =========================================================
   TASK PRIORITY ENGINE
========================================================= */

function getPriorityScore(task) {

    const importanceScore = {

        critical: 50,
        high: 35,
        medium: 20,
        low: 8

    };

    let score =
        importanceScore[task.importance] || 20;


    const today = new Date();

    today.setHours(0, 0, 0, 0);


    const deadline = new Date(
        task.deadline + "T23:59:59"
    );


    const daysLeft =
        Math.ceil(
            (deadline - today) /
            (1000 * 60 * 60 * 24)
        );


    if (daysLeft < 0) {
        score += 50;
    }

    else if (daysLeft === 0) {
        score += 40;
    }

    else if (daysLeft === 1) {
        score += 32;
    }

    else if (daysLeft <= 3) {
        score += 22;
    }

    else if (daysLeft <= 7) {
        score += 12;
    }


    const duration = Number(
        task.duration || 60
    );


    if (duration >= 180) {
        score += 10;
    }

    else if (duration >= 120) {
        score += 7;
    }

    else if (duration >= 60) {
        score += 4;
    }


    return Math.min(
        100,
        Math.round(score)
    );
}


/* =========================================================
   PRIORITY LABEL
========================================================= */

function getPriorityLabel(task) {

    const score = getPriorityScore(task);

    if (
        task.importance === "critical" ||
        score >= 80
    ) {
        return "critical";
    }

    if (
        task.importance === "high" ||
        score >= 60
    ) {
        return "high";
    }

    if (score >= 35) {
        return "medium";
    }

    return "low";
}


/* =========================================================
   TASK HELPERS
========================================================= */

function getDaysLeft(task) {

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const deadline =
        new Date(task.deadline + "T23:59:59");

    return Math.ceil(
        (deadline - today) /
        (1000 * 60 * 60 * 24)
    );
}


function formatDeadline(dateString) {

    const date =
        new Date(dateString + "T00:00:00");

    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric"
        }
    );
}


function formatDuration(minutes) {

    minutes = Number(minutes);

    if (minutes < 60) {
        return `${minutes}m`;
    }

    const hours =
        Math.floor(minutes / 60);

    const mins =
        minutes % 60;

    if (!mins) {
        return `${hours}h`;
    }

    return `${hours}h ${mins}m`;
}


/* =========================================================
   TASK FILTERING
========================================================= */

function setupFilters() {

    $$(".filter-btn").forEach(button => {

        button.addEventListener(
            "click",
            () => {

                currentFilter =
                    button.dataset.filter;

                $$(".filter-btn")
                    .forEach(btn => {
                        btn.classList.remove("active");
                    });

                button.classList.add("active");

                renderTaskList();

            }
        );

    });

}


function getFilteredTasks() {

    let result = [...tasks];

    if (searchTerm) {

        const query =
            searchTerm.toLowerCase();

        result = result.filter(task =>

            task.title
                .toLowerCase()
                .includes(query) ||

            task.description
                .toLowerCase()
                .includes(query) ||

            task.category
                .toLowerCase()
                .includes(query)

        );
    }


    switch (currentFilter) {

        case "critical":

            result = result.filter(
                task =>
                    !task.completed &&
                    getPriorityLabel(task) === "critical"
            );

            break;


        case "high":

            result = result.filter(
                task =>
                    !task.completed &&
                    getPriorityLabel(task) === "high"
            );

            break;


        case "today":

            result = result.filter(
                task =>
                    !task.completed &&
                    getDaysLeft(task) === 0
            );

            break;


        case "completed":

            result = result.filter(
                task => task.completed
            );

            break;


        default:
            break;

    }

    return sortTasks(result);
}


/* =========================================================
   SORTING
========================================================= */

function setupSorting() {

    $("#taskSort")?.addEventListener(
        "change",
        (event) => {

            currentSort =
                event.target.value;

            renderTaskList();

        }
    );

}


function sortTasks(taskArray) {

    return taskArray.sort(
        (a, b) => {

            switch (currentSort) {

                case "deadline":

                    return (
                        new Date(a.deadline) -
                        new Date(b.deadline)
                    );


                case "duration":

                    return (
                        Number(b.duration) -
                        Number(a.duration)
                    );


                case "newest":

                    return (
                        new Date(b.createdAt) -
                        new Date(a.createdAt)
                    );


                case "priority":
                default:

                    return (
                        getPriorityScore(b) -
                        getPriorityScore(a)
                    );

            }

        }
    );
}


/* =========================================================
   SEARCH
========================================================= */

function setupSearch() {

    $("#searchInput")?.addEventListener(
        "input",
        (event) => {

            searchTerm =
                event.target.value.trim();

            if (
                $("#tasks")?.classList.contains("active")
            ) {
                renderTaskList();
            }

        }
    );


    document.addEventListener(
        "keydown",
        (event) => {

            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "k"
            ) {

                event.preventDefault();

                $("#searchInput")?.focus();

            }


            if (event.key === "Escape") {

                $("#searchInput")?.blur();

                $("#notificationPanel")
                    ?.classList.remove("active");

                $("#taskModal")
                    ?.classList.remove("active");

            }

        }
    );

}


/* =========================================================
   RENDER TASK LIST
========================================================= */

function renderTaskList() {

    const container =
        $("#taskList");

    if (!container) return;

    const filtered =
        getFilteredTasks();


    if (!filtered.length) {

        container.innerHTML = `

            <div class="panel empty-state">

                <div class="empty-state-icon">
                    <i data-lucide="check-circle-2"></i>
                </div>

                <h3>
                    No tasks found
                </h3>

                <p>
                    Add a task or change your filter.
                </p>

            </div>

        `;

        refreshIcons();

        return;
    }


    container.innerHTML =
        filtered.map(task => {

            const priority =
                getPriorityLabel(task);

            const days =
                getDaysLeft(task);

            let deadlineText =
                formatDeadline(task.deadline);

            if (days < 0) {
                deadlineText = "Overdue";
            }

            else if (days === 0) {
                deadlineText = "Today";
            }

            else if (days === 1) {
                deadlineText = "Tomorrow";
            }


            return `

                <article
                    class="task-item ${task.completed ? "completed" : ""}"
                    data-id="${task.id}"
                >

                    <button
                        class="task-check ${task.completed ? "completed" : ""}"
                        data-action="complete"
                        data-id="${task.id}"
                        aria-label="Complete task"
                    >

                        <i data-lucide="check"></i>

                    </button>


                    <div class="task-main">

                        <div class="task-title-row">

                            <h3 class="task-title">
                                ${escapeHTML(task.title)}
                            </h3>

                            <span
                                class="priority-badge ${priority}"
                            >
                                ${priority}
                            </span>

                        </div>


                        ${
                            task.description
                            ?
                            `
                                <p class="task-description">
                                    ${escapeHTML(task.description)}
                                </p>
                            `
                            :
                            ""
                        }


                        <div class="task-meta">

                            <span>
                                <i data-lucide="folder"></i>
                                ${escapeHTML(task.category)}
                            </span>

                            <span>
                                <i data-lucide="clock-3"></i>
                                ${formatDuration(task.duration)}
                            </span>

                            <span>
                                <i data-lucide="gauge"></i>
                                Score ${getPriorityScore(task)}
                            </span>

                        </div>

                    </div>


                    <div class="task-deadline">

                        <span>
                            ${deadlineText}
                        </span>

                    </div>


                    <div class="task-actions">

                        ${
                            !task.completed
                            ?
                            `
                                <button
                                    class="task-action"
                                    data-action="focus"
                                    data-id="${task.id}"
                                    title="Focus on task"
                                >
                                    <i data-lucide="target"></i>
                                </button>
                            `
                            :
                            ""
                        }


                        <button
                            class="task-action delete"
                            data-action="delete"
                            data-id="${task.id}"
                            title="Delete task"
                        >
                            <i data-lucide="trash-2"></i>
                        </button>

                    </div>

                </article>

            `;

        }).join("");


    container
        .querySelectorAll("[data-action]")
        .forEach(button => {

            button.addEventListener(
                "click",
                handleTaskAction
            );

        });


    refreshIcons();

}


/* =========================================================
   TASK ACTIONS
========================================================= */

function handleTaskAction(event) {

    const button =
        event.currentTarget;

    const id =
        Number(button.dataset.id);

    const action =
        button.dataset.action;

    const task =
        tasks.find(item => item.id === id);

    if (!task) return;


    if (action === "complete") {

        task.completed =
            !task.completed;

        task.completedAt =
            task.completed
                ? new Date().toISOString()
                : null;

        saveTasks();

        renderEverything();

        showToast(
            task.completed
                ? "Task Completed"
                : "Task Reopened",
            task.title
        );

    }


    if (action === "delete") {

        const confirmed =
            confirm(
                `Delete "${task.title}"?`
            );

        if (!confirmed) return;

        tasks =
            tasks.filter(
                item => item.id !== id
            );

        saveTasks();

        renderEverything();

        showToast(
            "Task Deleted",
            `"${task.title}" removed.`
        );

    }


    if (action === "focus") {

        setFocusTask(id);

        navigateTo("focus");

    }

}


/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {

    const activeTasks =
        tasks.filter(task => !task.completed);

    const completedTasks =
        tasks.filter(task => task.completed);


    const workloadMinutes =
        activeTasks.reduce(
            (sum, task) =>
                sum + Number(task.duration || 0),
            0
        );


    const totalTasks =
        tasks.length;

    const completedCount =
        completedTasks.length;


    const completionRate =
        totalTasks
            ? Math.round(
                (completedCount / totalTasks) * 100
            )
            : 0;


    const workloadHours =
        workloadMinutes / 60;


    if ($("#workloadValue")) {

        $("#workloadValue").textContent =
            formatHours(workloadMinutes);

    }


    if ($("#completedValue")) {

        $("#completedValue").textContent =
            completedCount;

    }


    if ($("#completionPercent")) {

        $("#completionPercent").textContent =
            `${completionRate}%`;

    }


    if ($("#completionBar")) {

        $("#completionBar").style.width =
            `${completionRate}%`;

    }


    const workloadPercent =
        Math.min(
            100,
            Math.round(
                (workloadMinutes / 480) * 100
            )
        );


    if ($("#workloadPercent")) {

        $("#workloadPercent").textContent =
            `${workloadPercent}%`;

    }


    if ($("#workloadBar")) {

        $("#workloadBar").style.width =
            `${workloadPercent}%`;

    }


    if ($("#workloadChange")) {

        if (workloadMinutes > 480) {

            $("#workloadChange").textContent =
                "Overloaded";

            $("#workloadChange").className =
                "negative";

        }

        else if (workloadMinutes > 360) {

            $("#workloadChange").textContent =
                "Heavy day";

        }

        else {

            $("#workloadChange").textContent =
                "Manageable";

        }

    }


    if ($("#focusValue")) {

        $("#focusValue").textContent =
            formatMinutes(
                focusData.totalMinutes
            );

    }


    updateEnergy(workloadMinutes);

    renderPriorityRadar();

    renderAlerts();

    renderWeeklyStats();

}


/* =========================================================
   FORMAT HOURS
========================================================= */

function formatHours(minutes) {

    minutes = Number(minutes || 0);

    if (minutes < 60) {
        return `${minutes}m`;
    }

    const hours =
        Math.floor(minutes / 60);

    const mins =
        minutes % 60;

    if (mins === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${mins}m`;
}


function formatMinutes(minutes) {

    return formatHours(minutes);
}


/* =========================================================
   ENERGY
========================================================= */

function updateEnergy(workloadMinutes) {

    let energy =
        Math.max(
            25,
            100 -
            Math.round(
                workloadMinutes / 30
            )
        );

    energy =
        Math.min(100, energy);


    if ($("#energyValue")) {
        $("#energyValue").textContent =
            energy;
    }


    if ($("#energyText")) {

        if (energy >= 75) {

            $("#energyText").textContent =
                "You're in a strong zone";

        }

        else if (energy >= 50) {

            $("#energyText").textContent =
                "Keep your workload balanced";

        }

        else {

            $("#energyText").textContent =
                "Consider protecting your focus";

        }

    }


    const bars =
        $$(".energy-level i");

    const activeBars =
        Math.ceil(
            energy / 20
        );

    bars.forEach(
        (bar, index) => {

            bar.style.opacity =
                index < activeBars
                    ? "1"
                    : "0.25";

        }
    );

}


/* =========================================================
   PRIORITY RADAR
========================================================= */

function renderPriorityRadar() {

    const container =
        $("#priorityList");

    if (!container) return;


    const priorityTasks =
        tasks
            .filter(task => !task.completed)
            .sort(
                (a, b) =>
                    getPriorityScore(b) -
                    getPriorityScore(a)
            )
            .slice(0, 5);


    if (!priorityTasks.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    <i data-lucide="sparkles"></i>
                </div>

                <h3>
                    Your radar is clear
                </h3>

                <p>
                    Add some tasks and FocusFlow
                    will rank them automatically.
                </p>

            </div>

        `;

        refreshIcons();

        return;
    }


    container.innerHTML =
        priorityTasks.map(
            (task, index) => {

                const priority =
                    getPriorityLabel(task);

                return `

                    <div class="priority-item">

                        <div class="priority-rank">
                            ${String(index + 1).padStart(2, "0")}
                        </div>


                        <div class="priority-info">

                            <h4>
                                ${escapeHTML(task.title)}
                            </h4>

                            <p>
                                ${escapeHTML(task.category)}
                                ·
                                ${formatDuration(task.duration)}
                                ·
                                ${formatDeadline(task.deadline)}
                            </p>

                        </div>


                        <div class="priority-score">

                            <strong>
                                ${getPriorityScore(task)}
                            </strong>

                            <span>
                                score
                            </span>

                        </div>


                        <span
                            class="priority-badge ${priority}"
                        >
                            ${priority}
                        </span>

                    </div>

                `;

            }
        ).join("");


    refreshIcons();

}


/* =========================================================
   RECALCULATE
========================================================= */

function setupRecalculate() {

    $("#recalculateButton")?.addEventListener(
        "click",
        () => {

            const button =
                $("#recalculateButton");

            button.disabled = true;

            button.innerHTML = `
                <i data-lucide="loader-circle"></i>
                Analyzing...
            `;

            refreshIcons();

            setTimeout(() => {

                renderPriorityRadar();

                button.disabled = false;

                button.innerHTML = `
                    <i data-lucide="refresh-cw"></i>
                    Recalculate
                `;

                refreshIcons();

                showToast(
                    "Radar Updated",
                    "Task priorities have been recalculated."
                );

            }, 700);

        }
    );

}


/* =========================================================
   SMART INSIGHT
========================================================= */

function renderInsight() {

    const active =
        tasks.filter(task => !task.completed);

    if (!active.length) {

        if ($("#insightTitle")) {

            $("#insightTitle").textContent =
                "Your workspace is clear.";

        }

        if ($("#insightText")) {

            $("#insightText").textContent =
                "Add your next task and FocusFlow will help you prioritize it.";

        }

        return;
    }


    const highest =
        [...active].sort(
            (a, b) =>
                getPriorityScore(b) -
                getPriorityScore(a)
        )[0];


    if ($("#insightTitle")) {

        $("#insightTitle").textContent =
            `Start with "${highest.title}".`;

    }


    if ($("#insightText")) {

        const days =
            getDaysLeft(highest);

        if (days <= 0) {

            $("#insightText").textContent =
                "This task is due now. Protect a focused block and finish it first.";

        }

        else if (days === 1) {

            $("#insightText").textContent =
                "This task is due tomorrow. Completing it early will reduce deadline pressure.";

        }

        else {

            $("#insightText").textContent =
                "It currently has the highest priority based on urgency, importance and effort.";

        }

    }

}


/* =========================================================
   APPLY INSIGHT
========================================================= */

function setupQuickActions() {

    $("#quickPlanner")?.addEventListener(
        "click",
        () => navigateTo("planner")
    );


    $("#quickFocus")?.addEventListener(
        "click",
        () => {

            const task =
                tasks
                    .filter(t => !t.completed)
                    .sort(
                        (a, b) =>
                            getPriorityScore(b) -
                            getPriorityScore(a)
                    )[0];

            if (task) {
                setFocusTask(task.id);
            }

            navigateTo("focus");

        }
    );


    $("#applyInsight")?.addEventListener(
        "click",
        () => {

            const task =
                tasks
                    .filter(t => !t.completed)
                    .sort(
                        (a, b) =>
                            getPriorityScore(b) -
                            getPriorityScore(a)
                    )[0];

            if (!task) {

                openTaskModal();

                return;
            }

            setFocusTask(task.id);

            navigateTo("focus");

            showToast(
                "Focus Selected",
                task.title
            );

        }
    );

}


/* =========================================================
   ALERTS
========================================================= */

function renderAlerts() {

    const container =
        $("#alertsList");

    if (!container) return;


    const active =
        tasks.filter(task => !task.completed);


    const alerts = [];


    const overdue =
        active.filter(
            task => getDaysLeft(task) < 0
        );


    if (overdue.length) {

        alerts.push({

            type: "danger",

            icon: "alert-triangle",

            title:
                `${overdue.length} overdue task${overdue.length > 1 ? "s" : ""}`,

            text:
                "These tasks need immediate attention."

        });

    }


    const dueToday =
        active.filter(
            task => getDaysLeft(task) === 0
        );


    if (dueToday.length) {

        alerts.push({

            type: "warning",

            icon: "clock",

            title:
                `${dueToday.length} task${dueToday.length > 1 ? "s" : ""} due today`,

            text:
                "Consider protecting a focused work block."

        });

    }


    const workload =
        active.reduce(
            (sum, task) =>
                sum + Number(task.duration || 0),
            0
        );


    if (workload > 480) {

        alerts.push({

            type: "danger",

            icon: "battery-warning",

            title: "Schedule overload",

            text:
                `${formatHours(workload)} of work is currently planned.`

        });

    }


    if (!alerts.length) {

        alerts.push({

            type: "success",

            icon: "shield-check",

            title: "Everything looks good",

            text:
                "No urgent workload warnings right now."

        });

    }


    if ($("#alertCount")) {

        $("#alertCount").textContent =
            alerts.length;

    }


    container.innerHTML =
        alerts.map(
            alert => `

                <div
                    class="alert-item ${alert.type}"
                >

                    <div class="alert-icon">

                        <i data-lucide="${alert.icon}"></i>

                    </div>

                    <div>

                        <strong>
                            ${alert.title}
                        </strong>

                        <p>
                            ${alert.text}
                        </p>

                    </div>

                </div>

            `
        ).join("");


    refreshIcons();

}


/* =========================================================
   WEEKLY STATS
========================================================= */

function renderWeeklyStats() {

    const completed =
        tasks.filter(task => task.completed);

    const totalFocus =
        focusData.totalMinutes;


    if ($("#weeklyFocus")) {

        $("#weeklyFocus").textContent =
            formatHours(totalFocus);

    }


    if ($("#weeklyCompleted")) {

        $("#weeklyCompleted").textContent =
            completed.length;

    }


    const completion =
        tasks.length
            ? Math.round(
                (completed.length / tasks.length) * 100
            )
            : 0;


    const score =
        Math.min(
            100,
            Math.round(
                completion * 0.7 +
                Math.min(
                    30,
                    totalFocus / 10
                )
            )
        );


    if ($("#productivityScore")) {

        $("#productivityScore").textContent =
            score;

    }


    renderProductivityChart();

}


/* =========================================================
   PRODUCTIVITY CHART
========================================================= */

function renderProductivityChart() {

    const container =
        $("#productivityChart");

    if (!container) return;


    const range =
        Number(
            $("#chartRange")?.value || 7
        );


    const days = [];

    for (
        let i = range - 1;
        i >= 0;
        i--
    ) {

        const date =
            new Date();

        date.setDate(
            date.getDate() - i
        );

        days.push(date);

    }


    const completedCount =
        tasks.filter(task => task.completed)
            .length;


    const maxValue =
        Math.max(
            4,
            completedCount
        );


    const bars =
        days.map(
            date => {

                const day =
                    date.toISOString()
                        .slice(0, 10);


                const count =
                    tasks.filter(
                        task =>
                            task.completed &&
                            task.completedAt &&
                            task.completedAt.slice(0, 10) === day
                    ).length;


                const height =
                    Math.max(
                        5,
                        (count / maxValue) * 100
                    );


                return `

                    <div class="chart-column">

                        <span class="chart-value">
                            ${count}
                        </span>

                        <div
                            class="chart-bar"
                            style="height:${height}%"
                            title="${count} completed"
                        ></div>

                        <span class="chart-label">
                            ${date.toLocaleDateString(
                                "en-US",
                                { weekday: "short" }
                            ).slice(0, 1)}
                        </span>

                    </div>

                `;

            }
        ).join("");


    container.innerHTML = `
        <div class="chart-bars">
            ${bars}
        </div>
    `;

}


/* =========================================================
   CHART RANGE
========================================================= */

$("#chartRange")?.addEventListener(
    "change",
    renderProductivityChart
);


/* =========================================================
   PLANNER
========================================================= */

function setupPlanner() {

    $("#generatePlanButton")?.addEventListener(
        "click",
        generatePlan
    );

}


function generatePlan() {

    const start =
        $("#startTime")?.value || "09:00";

    const end =
        $("#endTime")?.value || "17:00";

    const breakMinutes =
        Number(
            $("#breakDuration")?.value || 10
        );

    const protectFocus =
        $("#focusProtection")?.checked;


    const startMinutes =
        timeToMinutes(start);

    const endMinutes =
        timeToMinutes(end);


    if (endMinutes <= startMinutes) {

        showToast(
            "Invalid schedule",
            "End time must be later than start time."
        );

        return;
    }


    const available =
        endMinutes - startMinutes;


    const active =
        tasks
            .filter(task => !task.completed)
            .sort(
                (a, b) =>
                    getPriorityScore(b) -
                    getPriorityScore(a)
            );


    if (!active.length) {

        renderEmptyPlan(
            "No tasks available",
            "Create some tasks first, then FocusFlow can build your day."
        );

        return;
    }


    const plan = [];

    let current =
        startMinutes;


    for (const task of active) {

        const duration =
            Number(task.duration || 30);


        const needed =
            duration +
            (plan.length ? breakMinutes : 0);


        if (
            current + needed > endMinutes
        ) {
            break;
        }


        if (plan.length) {

            plan.push({

                type: "break",

                start: current,

                duration: breakMinutes

            });

            current += breakMinutes;

        }


        plan.push({

            type: "task",

            task,

            start: current,

            duration

        });


        current += duration;


        if (
            !protectFocus &&
            plan.length >= 8
        ) {
            break;
        }

    }


    renderPlan(
        plan,
        available,
        start,
        end
    );


    showToast(
        "Smart Plan Created",
        `${plan.filter(item => item.type === "task").length} tasks scheduled.`
    );

}


function timeToMinutes(time) {

    const [hours, minutes] =
        time.split(":").map(Number);

    return (
        hours * 60 +
        minutes
    );
}


function minutesToTime(total) {

    total =
        ((total % 1440) + 1440) % 1440;

    const hours =
        Math.floor(total / 60);

    const minutes =
        total % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}


function renderPlan(
    plan,
    available,
    start,
    end
) {

    const container =
        $("#plannerOutput");

    if (!container) return;


    const taskCount =
        plan.filter(
            item => item.type === "task"
        ).length;


    const scheduledMinutes =
        plan.reduce(
            (sum, item) =>
                sum + item.duration,
            0
        );


    container.innerHTML = `

        <div class="plan-summary">

            <div>
                <strong>
                    ${taskCount} tasks scheduled
                </strong>

                <span>
                    ${start} → ${end}
                </span>
            </div>

            <span>
                ${formatHours(scheduledMinutes)} planned
            </span>

        </div>


        <div class="timeline">

            ${plan.map(
                (item, index) => {

                    if (item.type === "break") {

                        return `

                            <div class="timeline-item">

                                <div class="timeline-time">
                                    ${minutesToTime(item.start)}
                                </div>

                                <div class="timeline-line">
                                    <span></span>
                                </div>

                                <div class="timeline-content">

                                    <h4>
                                        Break
                                    </h4>

                                    <p>
                                        ${item.duration} minutes to reset.
                                    </p>

                                </div>

                            </div>

                        `;

                    }


                    return `

                        <div class="timeline-item">

                            <div class="timeline-time">
                                ${minutesToTime(item.start)}
                            </div>

                            <div class="timeline-line">
                                <span></span>
                            </div>

                            <div class="timeline-content">

                                <h4>
                                    <span class="timeline-number">
                                        ${index + 1}
                                    </span>

                                    ${escapeHTML(item.task.title)}
                                </h4>

                                <p>
                                    ${formatDuration(item.duration)}
                                    ·
                                    ${item.task.category}
                                    ·
                                    ${getPriorityLabel(item.task)}
                                </p>

                            </div>

                        </div>

                    `;

                }
            ).join("")}

        </div>

    `;


    if ($("#planStatus")) {

        $("#planStatus").textContent =
            "OPTIMIZED";

    }

    refreshIcons();

}


function renderEmptyPlan(title, text) {

    const container =
        $("#plannerOutput");

    if (!container) return;

    container.innerHTML = `

        <div class="planner-empty">

            <div class="planner-empty-icon">
                ✦
            </div>

            <h3>
                ${title}
            </h3>

            <p>
                ${text}
            </p>

        </div>

    `;

}


/* =========================================================
   FOCUS MODE
========================================================= */

function setupFocus() {

    $("#startTimer")?.addEventListener(
        "click",
        toggleTimer
    );


    $("#resetTimer")?.addEventListener(
        "click",
        resetTimer
    );


    renderFocusTask();

    updateTimerDisplay();

}


function getFocusTask() {

    const savedId =
        localStorage.getItem(
            "focusflow_selected_task"
        );


    if (savedId) {

        const task =
            tasks.find(
                item =>
                    item.id === Number(savedId) &&
                    !item.completed
            );

        if (task) return task;

    }


    return tasks
        .filter(task => !task.completed)
        .sort(
            (a, b) =>
                getPriorityScore(b) -
                getPriorityScore(a)
        )[0] || null;

}


function setFocusTask(id) {

    localStorage.setItem(
        "focusflow_selected_task",
        String(id)
    );

    renderFocusTask();

}


function renderFocusTask() {

    const task =
        getFocusTask();


    if (!task) {

        if ($("#focusTaskName")) {

            $("#focusTaskName").textContent =
                "No task selected";

        }

        if ($("#focusTaskMeta")) {

            $("#focusTaskMeta").textContent =
                "Create a task to begin focusing.";

        }

        return;
    }


    if ($("#focusTaskName")) {

        $("#focusTaskName").textContent =
            task.title;

    }


    if ($("#focusTaskMeta")) {

        $("#focusTaskMeta").textContent =
            `${task.category} · ${formatDuration(task.duration)} · ${getPriorityLabel(task)} priority`;

    }

}


function toggleTimer() {

    if (timerRunning) {

        pauseTimer();

        return;

    }


    const task =
        getFocusTask();


    if (!task) {

        openTaskModal();

        showToast(
            "Choose a task",
            "Create a task before starting focus mode."
        );

        return;
    }


    timerRunning = true;


    $("#startTimer").innerHTML = `
        <i data-lucide="pause"></i>
        Pause Focus
    `;

    refreshIcons();


    timerInterval =
        setInterval(
            () => {

                timerSeconds--;

                updateTimerDisplay();


                if (timerSeconds <= 0) {

                    finishFocusSession();

                }

            },
            1000
        );

}


function pauseTimer() {

    timerRunning = false;

    clearInterval(timerInterval);

    timerInterval = null;


    if ($("#startTimer")) {

        $("#startTimer").innerHTML = `
            <i data-lucide="play"></i>
            Resume Focus
        `;

        refreshIcons();

    }

}


function resetTimer() {

    clearInterval(timerInterval);

    timerInterval = null;

    timerRunning = false;

    timerSeconds = 25 * 60;

    updateTimerDisplay();


    if ($("#startTimer")) {

        $("#startTimer").innerHTML = `
            <i data-lucide="play"></i>
            Start Focus
        `;

        refreshIcons();

    }

}


function finishFocusSession() {

    clearInterval(timerInterval);

    timerInterval = null;

    timerRunning = false;


    const task =
        getFocusTask();


    focusData.totalMinutes += 25;

    focusData.sessions += 1;

    saveFocusData();


    if (task) {

        showToast(
            "Focus Session Complete",
            `Great work on "${task.title}".`
        );

    }


    timerSeconds = 25 * 60;

    updateTimerDisplay();

    renderDashboard();

}


function updateTimerDisplay() {

    const minutes =
        Math.floor(
            timerSeconds / 60
        );

    const seconds =
        timerSeconds % 60;


    if ($("#timer")) {

        $("#timer").textContent =
            `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    }


    const progress =
        ((25 * 60 - timerSeconds) /
        (25 * 60)) * 100;


    if ($("#focusProgress")) {

        $("#focusProgress").style.width =
            `${Math.max(0, Math.min(100, progress))}%`;

    }

}


/* =========================================================
   ANALYTICS
========================================================= */

function renderAnalytics() {

    const total =
        tasks.length;

    const completed =
        tasks.filter(
            task => task.completed
        ).length;


    const completionRate =
        total
            ? Math.round(
                (completed / total) * 100
            )
            : 0;


    const score =
        Math.min(
            100,
            Math.round(
                completionRate * 0.7 +
                Math.min(
                    30,
                    focusData.totalMinutes / 10
                )
            )
        );


    if ($("#analyticsScore")) {

        $("#analyticsScore").textContent =
            score;

    }


    if ($("#analyticsFocus")) {

        $("#analyticsFocus").textContent =
            formatHours(
                focusData.totalMinutes
            );

    }


    if ($("#analyticsCompletion")) {

        $("#analyticsCompletion").textContent =
            `${completionRate}%`;

    }


    if ($("#analyticsScoreTitle")) {

        if (score >= 80) {

            $("#analyticsScoreTitle").textContent =
                "Excellent momentum";

        }

        else if (score >= 60) {

            $("#analyticsScoreTitle").textContent =
                "Strong progress";

        }

        else if (score >= 30) {

            $("#analyticsScoreTitle").textContent =
                "Building momentum";

        }

        else {

            $("#analyticsScoreTitle").textContent =
                "Building your baseline";

        }

    }


    if ($("#analyticsScoreText")) {

        $("#analyticsScoreText").textContent =
            total
                ? `You've completed ${completed} of ${total} tasks and recorded ${formatHours(focusData.totalMinutes)} of focus time.`
                : "Complete a few tasks to unlock personalized insights.";

    }


    renderAnalyticsChart();

}


function renderAnalyticsChart() {

    const container =
        $("#analyticsChart");

    if (!container) return;


    const categories = {

        Study: 0,
        University: 0,
        Project: 0,
        Personal: 0,
        Work: 0

    };


    tasks.forEach(task => {

        if (
            categories[
                task.category
            ] !== undefined
        ) {

            categories[
                task.category
            ] += Number(
                task.duration || 0
            );

        }

    });


    const max =
        Math.max(
            60,
            ...Object.values(categories)
        );


    container.innerHTML = `

        <div class="chart-bars">

            ${Object.entries(categories)
                .map(
                    ([category, minutes]) => {

                        const height =
                            Math.max(
                                5,
                                (minutes / max) * 100
                            );

                        return `

                            <div class="chart-column">

                                <span class="chart-value">
                                    ${formatHours(minutes)}
                                </span>

                                <div
                                    class="chart-bar"
                                    style="height:${height}%"
                                    title="${category}: ${formatHours(minutes)}"
                                ></div>

                                <span class="chart-label">
                                    ${category}
                                </span>

                            </div>

                        `;

                    }
                ).join("")}

        </div>

    `;

}


/* =========================================================
   CALENDAR
========================================================= */

function setupCalendar() {

    $("#previousMonth")?.addEventListener(
        "click",
        () => {

            calendarDate.setMonth(
                calendarDate.getMonth() - 1
            );

            renderCalendar();

        }
    );


    $("#nextMonth")?.addEventListener(
        "click",
        () => {

            calendarDate.setMonth(
                calendarDate.getMonth() + 1
            );

            renderCalendar();

        }
    );


    renderCalendar();

}


function renderCalendar() {

    const grid =
        $("#calendarGrid");

    if (!grid) return;


    const year =
        calendarDate.getFullYear();

    const month =
        calendarDate.getMonth();


    if ($("#calendarMonth")) {

        $("#calendarMonth").textContent =
            calendarDate.toLocaleDateString(
                "en-US",
                {
                    month: "long",
                    year: "numeric"
                }
            );

    }


    const firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    const previousDays =
        new Date(
            year,
            month,
            0
        ).getDate();


    let html = "";


    for (
        let i = firstDay - 1;
        i >= 0;
        i--
    ) {

        const day =
            previousDays - i;

        html += `
            <div class="calendar-day muted">
                <span class="calendar-number">
                    ${day}
                </span>
            </div>
        `;

    }


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const dateString =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


        const today =
            new Date();


        const isToday =
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day;


        const dayTasks =
            tasks.filter(
                task =>
                    task.deadline === dateString
            );


        html += `

            <div
                class="calendar-day ${isToday ? "today" : ""}"
            >

                <span class="calendar-number">
                    ${day}
                </span>


                <div class="calendar-tasks">

                    ${dayTasks
                        .slice(0, 3)
                        .map(
                            task => `

                                <div
                                    class="calendar-task ${task.completed ? "completed" : ""}"
                                    title="${escapeHTML(task.title)}"
                                >
                                    ${escapeHTML(task.title)}
                                </div>

                            `
                        ).join("")}


                    ${
                        dayTasks.length > 3
                        ?
                        `
                            <div class="calendar-task">
                                +${dayTasks.length - 3} more
                            </div>
                        `
                        :
                        ""
                    }

                </div>

            </div>

        `;

    }


    const totalCells =
        firstDay + daysInMonth;

    const remaining =
        totalCells % 7 === 0
            ? 0
            : 7 - (totalCells % 7);


    for (
        let day = 1;
        day <= remaining;
        day++
    ) {

        html += `
            <div class="calendar-day muted">
                <span class="calendar-number">
                    ${day}
                </span>
            </div>
        `;

    }


    grid.innerHTML = html;


    const monthTasks =
        tasks.filter(
            task => {

                const date =
                    new Date(
                        task.deadline + "T00:00:00"
                    );

                return (
                    date.getFullYear() === year &&
                    date.getMonth() === month
                );

            }
        );


    if ($("#calendarTaskSummary")) {

        $("#calendarTaskSummary").textContent =
            `${monthTasks.length} task${monthTasks.length !== 1 ? "s" : ""}`;

    }

}


/* =========================================================
   SETTINGS
========================================================= */

function setupSettings() {

    const settingIds = [
        "deadlineAlerts",
        "dailyBriefing",
        "autoPriority",
        "overloadProtection"
    ];


    settingIds.forEach(id => {

        const input =
            document.getElementById(id);

        if (!input) return;


        input.checked =
            Boolean(settings[id]);


        input.addEventListener(
            "change",
            () => {

                settings[id] =
                    input.checked;

                saveSettings();

                showToast(
                    "Setting Updated",
                    `${formatSettingName(id)} ${input.checked ? "enabled" : "disabled"}.`
                );

                renderAlerts();

            }
        );

    });


    $("#resetDataButton")?.addEventListener(
        "click",
        resetWorkspace
    );

}


function loadSettings() {

    Object.keys(settings).forEach(
        key => {

            const input =
                document.getElementById(key);

            if (input) {

                input.checked =
                    Boolean(settings[key]);

            }

        }
    );

}


function formatSettingName(id) {

    const names = {

        deadlineAlerts: "Deadline alerts",

        dailyBriefing: "Daily briefing",

        autoPriority:
            "Automatic prioritization",

        overloadProtection:
            "Overload protection"

    };

    return names[id] || id;

}


/* =========================================================
   RESET WORKSPACE
========================================================= */

function resetWorkspace() {

    const confirmed =
        confirm(
            "This will delete all tasks and saved focus data. Continue?"
        );


    if (!confirmed) return;


    tasks = [];

    focusData = {
        totalMinutes: 0,
        sessions: 0
    };


    localStorage.removeItem(
        STORAGE_KEY
    );

    localStorage.removeItem(
        FOCUS_KEY
    );

    localStorage.removeItem(
        "focusflow_selected_task"
    );


    renderEverything();

    resetTimer();

    showToast(
        "Workspace Reset",
        "All task and focus data has been removed."
    );

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function setupNotifications() {

    $("#notificationButton")?.addEventListener(
        "click",
        () => {

            $("#notificationPanel")
                ?.classList.toggle("active");

            renderNotifications();

        }
    );


    $("#closeNotifications")?.addEventListener(
        "click",
        () => {

            $("#notificationPanel")
                ?.classList.remove("active");

        }
    );


    document.addEventListener(
        "click",
        (event) => {

            const panel =
                $("#notificationPanel");

            const button =
                $("#notificationButton");


            if (
                panel &&
                button &&
                !panel.contains(event.target) &&
                !button.contains(event.target)
            ) {

                panel.classList.remove("active");

            }

        }
    );

}


function renderNotifications() {

    const container =
        $("#notificationList");

    if (!container) return;


    const active =
        tasks.filter(task => !task.completed);


    const overdue =
        active.filter(
            task => getDaysLeft(task) < 0
        );


    const today =
        active.filter(
            task => getDaysLeft(task) === 0
        );


    const notifications = [];


    overdue.forEach(task => {

        notifications.push({

            icon: "alert-triangle",

            title: "Overdue task",

            text:
                `"${task.title}" is overdue.`

        });

    });


    today.forEach(task => {

        notifications.push({

            icon: "clock",

            title: "Due today",

            text:
                `"${task.title}" is due today.`

        });

    });


    if (!notifications.length) {

        notifications.push({

            icon: "check-circle-2",

            title: "All clear",

            text:
                "No urgent notifications right now."

        });

    }


    container.innerHTML =
        notifications
            .slice(0, 10)
            .map(
                item => `

                    <div class="notification-item">

                        <div class="notification-item-icon">

                            <i data-lucide="${item.icon}"></i>

                        </div>

                        <div>

                            <strong>
                                ${item.title}
                            </strong>

                            <p>
                                ${escapeHTML(item.text)}
                            </p>

                        </div>

                    </div>

                `
            ).join("");


    refreshIcons();

}


/* =========================================================
   THEME
========================================================= */

function setupTheme() {

    $("#themeButton")?.addEventListener(
        "click",
        toggleTheme
    );


    const saved =
        localStorage.getItem(
            "focusflow_theme"
        );


    if (saved === "light") {

        document.body.classList.add(
            "light-theme"
        );

        updateThemeIcon();

    }

}


function toggleTheme() {

    document.body.classList.toggle(
        "light-theme"
    );


    const light =
        document.body.classList.contains(
            "light-theme"
        );


    localStorage.setItem(
        "focusflow_theme",
        light ? "light" : "dark"
    );


    updateThemeIcon();

    showToast(
        "Theme Updated",
        light
            ? "Light mode enabled."
            : "Dark mode enabled."
    );

}


function updateThemeIcon() {

    const button =
        $("#themeButton");

    if (!button) return;


    const light =
        document.body.classList.contains(
            "light-theme"
        );


    button.innerHTML = `
        <i data-lucide="${light ? "moon" : "sun"}"></i>
    `;

    refreshIcons();

}


/* =========================================================
   TOAST
========================================================= */

let toastTimeout;


function showToast(title, message) {

    const toast =
        $("#toast");

    if (!toast) return;


    if ($("#toastTitle")) {

        $("#toastTitle").textContent =
            title;

    }


    if ($("#toastMessage")) {

        $("#toastMessage").textContent =
            message;

    }


    toast.classList.add("show");


    clearTimeout(toastTimeout);


    toastTimeout =
        setTimeout(
            () => {

                toast.classList.remove("show");

            },
            3500
        );

}


/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderEverything() {

    renderTaskList();

    renderDashboard();

    renderInsight();

    renderAnalytics();

    renderCalendar();

    renderNotifications();

    updateNavCount();

    updateStreak();

    refreshIcons();

}


/* =========================================================
   NAV TASK COUNT
========================================================= */

function updateNavCount() {

    const active =
        tasks.filter(
            task => !task.completed
        ).length;


    if ($("#navTaskCount")) {

        $("#navTaskCount").textContent =
            active;

    }


    if ($("#totalTasks")) {

        $("#totalTasks").textContent =
            tasks.length;

    }


    if ($("#criticalTasks")) {

        $("#criticalTasks").textContent =
            tasks.filter(
                task =>
                    !task.completed &&
                    getPriorityLabel(task) === "critical"
            ).length;

    }


    if ($("#todayTasks")) {

        $("#todayTasks").textContent =
            tasks.filter(
                task =>
                    !task.completed &&
                    getDaysLeft(task) === 0
            ).length;

    }


    if ($("#doneTasks")) {

        $("#doneTasks").textContent =
            tasks.filter(
                task => task.completed
            ).length;

    }

}


/* =========================================================
   STREAK
========================================================= */

function updateStreak() {

    const completedDates =
        new Set(
            tasks
                .filter(
                    task =>
                        task.completed &&
                        task.completedAt
                )
                .map(
                    task =>
                        task.completedAt.slice(0, 10)
                )
        );


    let streak = 0;

    const date =
        new Date();


    while (true) {

        const key =
            date.toISOString()
                .slice(0, 10);


        if (!completedDates.has(key)) {
            break;
        }


        streak++;

        date.setDate(
            date.getDate() - 1
        );

    }


    if (streak === 0) {

        streak = 0;

    }


    if ($("#streakNumber")) {

        $("#streakNumber").textContent =
            streak;

    }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   LUCIDE REFRESH
========================================================= */

function refreshIcons() {

    if (
        window.lucide &&
        typeof lucide.createIcons === "function"
    ) {

        lucide.createIcons();

    }

}


/* =========================================================
   HASH ROUTING
========================================================= */

window.addEventListener(
    "hashchange",
    () => {

        const page =
            location.hash.replace("#", "");

        if (
            document.getElementById(page)
        ) {

            navigateTo(page);

        }

    }
);


if (
    location.hash &&
    document.getElementById(
        location.hash.replace("#", "")
    )
) {

    navigateTo(
        location.hash.replace("#", "")
    );

}


/* =========================================================
   FINAL
========================================================= */

console.log(
    "%cFocusFlow initialized successfully 🚀",
    "font-size:14px;font-weight:bold;"
);
/* =========================================================
   EXTRA INTERACTION FIXES
   Workspace + Profile + Notifications + New Task
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       HELPER
    ===================================================== */

    function closeAllFloatingMenus() {
        document
            .querySelectorAll(".focusflow-floating-menu")
            .forEach(menu => menu.remove());
    }

    function createFloatingMenu(className, html, width = 220) {
        closeAllFloatingMenus();

        const menu = document.createElement("div");

        menu.className = `focusflow-floating-menu ${className}`;

        menu.innerHTML = html;

        menu.style.width = `${width}px`;

        document.body.appendChild(menu);

        return menu;
    }


    /* =====================================================
       1. NEW TASK BUTTON
    ===================================================== */

    const newTaskButtons = [
        document.getElementById("addTaskButton"),
        document.getElementById("quickAddTask")
    ].filter(Boolean);

    function openTaskCreationModal() {

        const modal = document.getElementById("taskModal");

        if (!modal) {
            console.error("Task modal not found.");
            return;
        }

        modal.classList.add("show");

        document.body.style.overflow = "hidden";

        const titleInput = document.getElementById("taskTitle");

        if (titleInput) {
            setTimeout(() => {
                titleInput.focus();
            }, 100);
        }

        /* Automatically set today's date if empty */
        const deadline = document.getElementById("taskDeadline");

        if (deadline && !deadline.value) {
            const today = new Date();

            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, "0");
            const day = String(today.getDate()).padStart(2, "0");

            deadline.value = `${year}-${month}-${day}`;
        }

        if (typeof refreshIcons === "function") {
            refreshIcons();
        }
    }

    newTaskButtons.forEach(button => {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();

            openTaskCreationModal();
        });
    });


    /* =====================================================
       2. CLOSE TASK MODAL
    ===================================================== */

    const closeModal = document.getElementById("closeModal");
    const cancelTask = document.getElementById("cancelTask");
    const taskModal = document.getElementById("taskModal");

    function closeTaskCreationModal() {

        if (taskModal) {
            taskModal.classList.remove("show");
        }

        document.body.style.overflow = "";

    }

    if (closeModal) {
        closeModal.addEventListener("click", (event) => {
            event.preventDefault();
            closeTaskCreationModal();
        });
    }

    if (cancelTask) {
        cancelTask.addEventListener("click", (event) => {
            event.preventDefault();
            closeTaskCreationModal();
        });
    }

    if (taskModal) {
        taskModal.addEventListener("click", (event) => {

            if (event.target === taskModal) {
                closeTaskCreationModal();
            }

        });
    }


    /* =====================================================
       3. NOTIFICATION BELL
    ===================================================== */

    const notificationButton =
        document.getElementById("notificationButton");

    const notificationPanel =
        document.getElementById("notificationPanel");

    const closeNotifications =
        document.getElementById("closeNotifications");

    if (notificationButton && notificationPanel) {

        notificationButton.addEventListener("click", (event) => {

            event.preventDefault();
            event.stopPropagation();

            closeAllFloatingMenus();

            notificationPanel.classList.toggle("show");

            if (
                notificationPanel.classList.contains("show") &&
                typeof renderNotifications === "function"
            ) {
                renderNotifications();
            }

        });

    }


    if (closeNotifications && notificationPanel) {

        closeNotifications.addEventListener("click", (event) => {

            event.preventDefault();

            notificationPanel.classList.remove("show");

        });

    }


    /* =====================================================
       4. WORKSPACE MENU
    ===================================================== */

    const workspaceMenuButton =
        document.querySelector(".workspace-menu");

    if (workspaceMenuButton) {

        workspaceMenuButton.addEventListener("click", (event) => {

            event.preventDefault();
            event.stopPropagation();

            if (
                document.querySelector(".focusflow-workspace-menu")
            ) {
                closeAllFloatingMenus();
                return;
            }

            if (notificationPanel) {
                notificationPanel.classList.remove("show");
            }

            const rect =
                workspaceMenuButton
                    .closest(".workspace")
                    .getBoundingClientRect();

            const menu = createFloatingMenu(
                "focusflow-workspace-menu",

                `
                    <div class="floating-menu-title">
                        WORKSPACE
                    </div>

                    <button class="floating-menu-item active">
                        <span class="floating-menu-icon purple">
                            A
                        </span>

                        <span>
                            <strong>Personal Space</strong>
                            <small>Current workspace</small>
                        </span>

                        <span class="menu-check">✓</span>
                    </button>

                    <button class="floating-menu-item" id="createWorkspaceButton">
                        <span class="floating-menu-icon blue">
                            +
                        </span>

                        <span>
                            <strong>New Workspace</strong>
                            <small>Create another space</small>
                        </span>
                    </button>

                    <div class="floating-menu-divider"></div>

                    <button class="floating-menu-item" id="workspaceSettingsButton">
                        <span class="floating-menu-icon gray">
                            ⚙
                        </span>

                        <span>
                            <strong>Workspace Settings</strong>
                            <small>Manage your workspace</small>
                        </span>
                    </button>
                `,
                245
            );

            menu.style.position = "fixed";
            menu.style.left = `${rect.left}px`;
            menu.style.top = `${rect.bottom + 8}px`;

            const createWorkspaceButton =
                document.getElementById("createWorkspaceButton");

            if (createWorkspaceButton) {

                createWorkspaceButton.addEventListener("click", () => {

                    showFocusFlowToast(
                        "Workspace",
                        "New workspace creation is ready."
                    );

                });

            }

            const workspaceSettingsButton =
                document.getElementById("workspaceSettingsButton");

            if (workspaceSettingsButton) {

                workspaceSettingsButton.addEventListener("click", () => {

                    closeAllFloatingMenus();

                    if (typeof navigateTo === "function") {
                        navigateTo("settings");
                    } else {
                        window.location.hash = "settings";
                    }

                });

            }

        });

    }


    /* =====================================================
       5. PROFILE THREE-DOT MENU
    ===================================================== */

    const profileMenuButton =
        document.querySelector(".profile .icon-btn");

    if (profileMenuButton) {

        profileMenuButton.addEventListener("click", (event) => {

            event.preventDefault();
            event.stopPropagation();

            if (
                document.querySelector(".focusflow-profile-menu")
            ) {
                closeAllFloatingMenus();
                return;
            }

            if (notificationPanel) {
                notificationPanel.classList.remove("show");
            }

            const profile =
                profileMenuButton.closest(".profile");

            const rect =
                profile.getBoundingClientRect();

            const menu = createFloatingMenu(
                "focusflow-profile-menu",

                `
                    <div class="floating-menu-title">
                        ACCOUNT
                    </div>

                    <div class="profile-menu-user">
                        <div class="profile-menu-avatar">
                            A
                        </div>

                        <div>
                            <strong>Areeba</strong>
                            <span>Focused mode</span>
                        </div>
                    </div>

                    <div class="floating-menu-divider"></div>

                    <button class="floating-menu-item" id="profileSettingsButton">
                        <span class="floating-menu-icon purple">
                            ⚙
                        </span>

                        <span>
                            <strong>Settings</strong>
                            <small>Customize FocusFlow</small>
                        </span>
                    </button>

                    <button class="floating-menu-item" id="profileFocusButton">
                        <span class="floating-menu-icon green">
                            ◉
                        </span>

                        <span>
                            <strong>Focus Mode</strong>
                            <small>Start deep work</small>
                        </span>
                    </button>

                    <button class="floating-menu-item" id="profileLogoutButton">
                        <span class="floating-menu-icon red">
                            ↪
                        </span>

                        <span>
                            <strong>Exit Focused Mode</strong>
                            <small>Change your status</small>
                        </span>
                    </button>
                `,
                245
            );

            menu.style.position = "fixed";

            menu.style.left =
                `${Math.max(12, rect.right - 245)}px`;

            menu.style.top =
                `${rect.top - menu.offsetHeight - 8}px`;


            const profileSettingsButton =
                document.getElementById(
                    "profileSettingsButton"
                );

            if (profileSettingsButton) {

                profileSettingsButton.addEventListener(
                    "click",
                    () => {

                        closeAllFloatingMenus();

                        if (typeof navigateTo === "function") {
                            navigateTo("settings");
                        } else {
                            window.location.hash = "settings";
                        }

                    }
                );

            }


            const profileFocusButton =
                document.getElementById(
                    "profileFocusButton"
                );

            if (profileFocusButton) {

                profileFocusButton.addEventListener(
                    "click",
                    () => {

                        closeAllFloatingMenus();

                        if (typeof navigateTo === "function") {
                            navigateTo("focus");
                        } else {
                            window.location.hash = "focus";
                        }

                    }
                );

            }


            const profileLogoutButton =
                document.getElementById(
                    "profileLogoutButton"
                );

            if (profileLogoutButton) {

                profileLogoutButton.addEventListener(
                    "click",
                    () => {

                        closeAllFloatingMenus();

                        showFocusFlowToast(
                            "Focus Mode",
                            "Focused mode status updated."
                        );

                    }
                );

            }

        });

    }


    /* =====================================================
       6. CLICK OUTSIDE
    ===================================================== */

    document.addEventListener("click", (event) => {

        const floatingMenu =
            event.target.closest(
                ".focusflow-floating-menu"
            );

        const workspace =
            event.target.closest(".workspace");

        const profile =
            event.target.closest(".profile");

        const notification =
            event.target.closest(
                "#notificationButton, #notificationPanel"
            );

        if (
            !floatingMenu &&
            !workspace &&
            !profile
        ) {
            closeAllFloatingMenus();
        }

        if (
            notificationPanel &&
            !notification
        ) {
            notificationPanel.classList.remove("show");
        }

    });


    /* =====================================================
       7. ESC KEY
    ===================================================== */

    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {

            closeAllFloatingMenus();

            if (notificationPanel) {
                notificationPanel.classList.remove("show");
            }

            closeTaskCreationModal();

        }

    });


    /* =====================================================
       8. TOAST HELPER
    ===================================================== */

    function showFocusFlowToast(title, message) {

        const toast =
            document.getElementById("toast");

        const toastTitle =
            document.getElementById("toastTitle");

        const toastMessage =
            document.getElementById("toastMessage");

        if (!toast) return;

        if (toastTitle) {
            toastTitle.textContent = title;
        }

        if (toastMessage) {
            toastMessage.textContent = message;
        }

        toast.classList.add("show");

        clearTimeout(
            window.focusFlowToastTimer
        );

        window.focusFlowToastTimer =
            setTimeout(() => {

                toast.classList.remove("show");

            }, 3000);

    }


    /* =====================================================
       9. NOTIFICATION FALLBACK
    ===================================================== */

    function renderNotificationsFallback() {

        const list =
            document.getElementById("notificationList");

        if (!list) return;

        const tasks =
            JSON.parse(
                localStorage.getItem(
                    "focusflow_tasks"
                ) || "[]"
            );

        const incomplete =
            tasks.filter(task => !task.completed);

        if (!incomplete.length) {

            list.innerHTML = `
                <div class="notification-item">
                    <div class="notification-icon">
                        ✓
                    </div>

                    <div>
                        <strong>All clear</strong>
                        <span>
                            You have no pending task alerts.
                        </span>
                    </div>
                </div>
            `;

            return;
        }

        list.innerHTML =
            incomplete
                .slice(0, 5)
                .map(task => {

                    return `
                        <div class="notification-item">
                            <div class="notification-icon">
                                !
                            </div>

                            <div>
                                <strong>${escapeHTML(task.title)}</strong>

                                <span>
                                    ${task.deadline
                                        ? `Deadline: ${task.deadline}`
                                        : "Pending task"}
                                </span>
                            </div>
                        </div>
                    `;

                })
                .join("");

    }


    /* =====================================================
       10. SAFE HTML
    ===================================================== */

    function escapeHTML(value) {

        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /* =====================================================
       11. IF ORIGINAL NOTIFICATION FUNCTION DOESN'T EXIST
    ===================================================== */

    if (
        typeof renderNotifications !== "function" &&
        notificationButton
    ) {

        window.renderNotifications =
            renderNotificationsFallback;

    }

});