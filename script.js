// Default tasks
let tasks = [
	{ name: "Sleep", duration: 200, icon: "😴" },
	{ name: "Dress", duration: 30, icon: "👚" },
	{ name: "Brush", duration: 15, icon: "🪥" },
	{ name: "Comb Hair", duration: 15, icon: "💇" },
	{ name: "Breakfast", duration: 30, icon: "🥞" },
	{ name: "School", duration: 360, icon: "🏫" },
	{ name: "Play Time", duration: 60, icon: "🎮" },
	{ name: "Dinner", duration: 30, icon: "🍽️" },
	{ name: "Quiet Time", duration: 60, icon: "😌" },
	{ name: "Shower", duration: 15, icon: "🚿" },
	{ name: "Book", duration: 45, icon: "📚" },
	{ name: "Sleep", duration: 280, icon: "😴" }
];

const pastelColors = [
	"#FFB3BA", "#FFDFBA", "#FFFFBA", "#BAFFC9", "#BAE1FF",
	"#C9C9FF", "#FCD1D1", "#FCE1D1", "#D1FCD6", "#D1F0FC",
	"#E1D1FC"
];

// Enhanced colors - softer, complementary palette
const enhancedColors = [
    "#FF9AA2", "#FFB7B2", "#FFDAC1", "#E2F0CB", "#B5EAD7", 
    "#C7CEEA", "#F2D4D7", "#D4F2D2", "#D4F2EA", "#D4E2F2",
    "#E2D4F2", "#F2D4F0"
];

// DOM Elements - simplified references
const digitalClockEl = document.getElementById("digitalClock");
// Remove references to the removed current task element
const progressContainer = document.querySelector('.progress-container');

// Use total day minutes
const dayMinutes = 1440; 

// Helper: calculate total task minutes
function getTotalTaskMinutes() {
	return tasks.reduce((acc, t) => acc + Number(t.duration), 0);
}

// Configure school start time in HH:MM format (e.g., "07:50")
let schoolStartTime = "07:50";

// Calculate time offset to align tasks schedule (modified)
function calculateTimeOffset() {
    const [startHour, startMinute] = schoolStartTime.split(':').map(Number);
    let schoolStartMin = startHour * 60 + startMinute;
    let offset = 0;
    const schoolIndex = tasks.findIndex(t => t.name === "School");
    if (schoolIndex !== -1) {
        let timeBeforeSchool = 0;
        for (let i = 0; i < schoolIndex; i++) {
            timeBeforeSchool += tasks[i].duration;
        }
        offset = schoolStartMin - timeBeforeSchool;
    }
    return offset;
}

// Add helper function to format full date and time
function formatFullDateTime(date) {
    const options = { 
        year: 'numeric', month: '2-digit', day: '2-digit', 
        hour: '2-digit', minute: '2-digit', second: '2-digit', 
        hour12: true 
    };
    return date.toLocaleString('en-US', options);
}

// Build the status bar segments with labels for each task; free segments get no label.
function buildStatusBar() {
    const statusBar = document.getElementById("statusBar");
    statusBar.innerHTML = '';
    
    const totalTaskMinutes = getTotalTaskMinutes();
    const offset = calculateTimeOffset();
    // Allocate free time (offset if positive, plus any remaining minutes) to the sleep task (index 0)
    const extra = dayMinutes - ((offset > 0 ? offset : 0) + totalTaskMinutes);
    
    let segments = [];
    // Build segments; for sleep (index 0) add offset and extra minutes if available
    tasks.forEach((task, idx) => {
         let duration = task.duration;
         if(idx === 0) {
             duration += (offset > 0 ? offset : 0) + (extra > 0 ? extra : 0);
         }
         segments.push({
             label: task.icon + " " + task.name,
             duration: duration,
             color: enhancedColors[idx % enhancedColors.length],
             taskIndex: idx
         });
    });
    
    // Create status bar segments without adding a separate free segment
    segments.forEach(seg => {
        const segDiv = document.createElement("div");
        segDiv.className = "status-segment";
        segDiv.style.width = `${(seg.duration / dayMinutes) * 100}%`;
        segDiv.style.backgroundColor = seg.color;
        segDiv.style.height = "100%";
        segDiv.style.float = "left";
        segDiv.style.position = "relative";
        // ...existing code...
        if (seg.label) {
            const labelDiv = document.createElement("div");
            labelDiv.className = "segment-label";
            labelDiv.innerHTML = seg.label;
            labelDiv.style.position = "absolute";
            labelDiv.style.top = "50%";
            labelDiv.style.left = "50%";
            labelDiv.style.transform = "translate(-50%, -50%)";
            labelDiv.style.color = "#fff";
            labelDiv.style.fontSize = "18px";
            segDiv.appendChild(labelDiv);
            segDiv.setAttribute("data-task-index", seg.taskIndex);
        }
        statusBar.appendChild(segDiv);
    });
}

// Build hour markers along the status bar
function buildHourMarkers() {
    const hourMarkersContainer = document.getElementById("hourMarkers");
    hourMarkersContainer.innerHTML = '';
    // For each hour 0..24, calculate left position in percentage
    for (let h = 0; h <= 24; h++) {
        const posPercent = (h * 60 / dayMinutes) * 100;
        // Create marker line
        const marker = document.createElement("div");
        marker.className = "hour-marker";
        marker.style.left = `${posPercent}%`;
        hourMarkersContainer.appendChild(marker);
        
        if (h < 24) {
            // Create label for the hour marker
            const label = document.createElement("div");
            label.className = "hour-label";
            label.style.left = `${posPercent}%`;
            label.textContent = h.toString().padStart(2, '0') + ":00";
            hourMarkersContainer.appendChild(label);
        }
    }
}

// Update current time marker position in status bar
function updateCurrentTimeMarker() {
    const now = new Date();
    const minutesNow = now.getHours() * 60 + now.getMinutes();
    const currentTimeMarker = document.getElementById("currentTimeMarker");
    // Left position as percentage
    currentTimeMarker.style.left = `${(minutesNow / dayMinutes) * 100}%`;
}

// Update digital clock display; remove current task indicator update.
function updateTimeDisplay() {
    const now = new Date();
    digitalClockEl.textContent = formatFullDateTime(now);
    updateCurrentTimeMarker();
    updateCurrentSegmentHighlight();
    updateCurrentTaskLabel(); // update current task label
}

// New function to update the current task label
function updateCurrentTaskLabel() {
    const currentTask = getCurrentTask();
    const currentTaskLabelEl = document.getElementById("currentTaskLabel");
    // Update label text depending on current task
    currentTaskLabelEl.textContent = currentTask ? currentTask.icon + " " + currentTask.name : "No Task";
}

// Determine which task is current using the schedule
function getCurrentTask() {
    const now = new Date();
    const minutesNow = now.getHours() * 60 + now.getMinutes();
    const offset = calculateTimeOffset();
    const extra = dayMinutes - ((offset > 0 ? offset : 0) + getTotalTaskMinutes());
    let current = null;
    let cumMinutes = 0;
    tasks.forEach((task, idx) => {
        let duration = task.duration;
        if (idx === 0) {
            duration += (offset > 0 ? offset : 0) + (extra > 0 ? extra : 0);
        }
        if (minutesNow >= cumMinutes && minutesNow < cumMinutes + duration) {
            current = task;
        }
        cumMinutes += duration;
    });
    return current;
}

// Highlight current task segment on each update:
function updateCurrentSegmentHighlight() {
    const currentTask = getCurrentTask();
    // Clear previous highlighting:
    document.querySelectorAll(".status-segment[data-task-index]").forEach(el => {
        el.classList.remove("current-segment");
    });
    if (currentTask) {
        // Find the segment with matching data-task-index:
        const currentIdx = tasks.indexOf(currentTask);
        const seg = document.querySelector(`.status-segment[data-task-index="${currentIdx}"]`);
        if (seg) { seg.classList.add("current-segment"); }
    }
}

// Main update function - now only update status bar view
function update() {
    updateTimeDisplay();
    requestAnimationFrame(update);
}

// Build task duration input fields.
function setupInputs() {
    const tasksInputs = document.getElementById("tasksInputs");
    tasksInputs.innerHTML = "";
    tasks.forEach((task, idx) => {
        const div = document.createElement("div");
        div.className = "task-input";
        div.setAttribute("data-index", idx);
        div.innerHTML = `
            <label><span>${task.icon}</span> ${task.name}: </label>
            <input type="number" value="${task.duration}" data-index="${idx}" min="5" max="1440">
            <button class="remove-task" data-index="${idx}">Remove</button>
            <button class="move-up" data-index="${idx}">Up</button>
            <button class="move-down" data-index="${idx}">Down</button>
        `;
        tasksInputs.appendChild(div);
    });

    // Add Task button
    const addBtn = document.createElement("button");
    addBtn.id = "addTaskBtn";
    addBtn.textContent = "Add Task";
    tasksInputs.appendChild(addBtn);

    // Listen for changes on inputs
    tasksInputs.addEventListener("change", (e) => {
        if(e.target && e.target.tagName === "INPUT"){
            const index = e.target.getAttribute("data-index");
            const newVal = parseFloat(e.target.value);
            if(!isNaN(newVal) && newVal >= 5){
                tasks[index].duration = newVal;
                buildStatusBar();
            }
        }
    });

    // Listen for remove and reorder clicks
    tasksInputs.addEventListener("click", (e) => {
        if(e.target && e.target.classList.contains("remove-task")){
            const index = parseInt(e.target.getAttribute("data-index"));
            if(tasks.length > 1) {
                tasks.splice(index, 1);
                setupInputs();
                buildStatusBar();
                buildHourMarkers();
            }
        }
        if(e.target && e.target.classList.contains("move-up")){
            const index = parseInt(e.target.getAttribute("data-index"));
            if(index > 0) {
                [tasks[index - 1], tasks[index]] = [tasks[index], tasks[index - 1]];
                setupInputs();
                buildStatusBar();
                buildHourMarkers();
            }
        }
        if(e.target && e.target.classList.contains("move-down")){
            const index = parseInt(e.target.getAttribute("data-index"));
            if(index < tasks.length - 1) {
                [tasks[index], tasks[index + 1]] = [tasks[index + 1], tasks[index]];
                setupInputs();
                buildStatusBar();
                buildHourMarkers();
            }
        }
    });

    // Listen for add task button click
    addBtn.addEventListener("click", () => {
        const name = prompt("Enter task name:", "New Task");
        if(!name) return;
        const durationStr = prompt("Enter duration in minutes:", "30");
        const duration = parseInt(durationStr, 10);
        if(isNaN(duration) || duration < 5){
            alert("Invalid duration.");
            return;
        }
        const icon = prompt("Enter an emoji for the task:", "⭐") || "⭐";
        tasks.push({ name, duration, icon });
        setupInputs();
        buildStatusBar();
        buildHourMarkers();
    });
}

setupInputs();
buildStatusBar();
buildHourMarkers();
update();
