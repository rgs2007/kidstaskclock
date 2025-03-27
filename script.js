// Default tasks - now using startHour instead of duration
let tasks = [
	{ name: "Sleep", startHour: 21, icon: "😴" },    // 9:00 PM
	{ name: "Dress", startHour: 7, icon: "👚" },     // 7:00 AM
	{ name: "Brush", startHour: 7.25, icon: "🪥" },  // 7:15 AM
	{ name: "Comb Hair", startHour: 7.5, icon: "💇" }, // 7:30 AM
	{ name: "Breakfast", startHour: 7.75, icon: "🥞" }, // 7:45 AM
	{ name: "School", startHour: 8, icon: "🏫" },    // 8:00 AM
	{ name: "Play Time", startHour: 15, icon: "🎮" }, // 3:00 PM
	{ name: "Dinner", startHour: 18, icon: "🍽️" },   // 6:00 PM
	{ name: "Quiet Time", startHour: 19, icon: "😌" }, // 7:00 PM
	{ name: "Shower", startHour: 20, icon: "🚿" },   // 8:00 PM
	{ name: "Book", startHour: 20.5, icon: "📚" }    // 8:30 PM
];

// Load tasks from localStorage if they exist
function loadTasksFromStorage() {
    const storedTasks = localStorage.getItem('kidsTasks');
    if (storedTasks) {
        try {
            tasks = JSON.parse(storedTasks);
            console.log('Tasks loaded from localStorage');
        } catch (e) {
            console.error('Error loading tasks from localStorage:', e);
        }
    }
}

// Save tasks to localStorage
function saveTasksToStorage() {
    try {
        localStorage.setItem('kidsTasks', JSON.stringify(tasks));
        console.log('Tasks saved to localStorage');
    } catch (e) {
        console.error('Error saving tasks to localStorage:', e);
    }
}

// Call loadTasksFromStorage on initialization
loadTasksFromStorage();

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
const progressContainer = document.querySelector('.progress-container');

// Use total day minutes
const dayMinutes = 1440; 

// Helper function to convert startHour to minutes
function hourToMinutes(hour) {
    return Math.floor(hour) * 60 + Math.round((hour % 1) * 60);
}

// Helper function to convert a time in minutes to a formatted time string (e.g., "07:30 AM")
function formatTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// New helper function to format time as HH:MM (24-hour format)
function formatTime24(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// New helper function to convert HH:MM format to decimal hours
function timeStringToHours(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + (minutes / 60);
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

// Build the status bar segments with labels for each task
function buildStatusBar() {
    const statusBar = document.getElementById("statusBar");
    statusBar.innerHTML = '';
    
    // Sort tasks by startHour for proper display
    const sortedTasks = [...tasks].sort((a, b) => a.startHour - b.startHour);
    
    // Create segments for each task
    sortedTasks.forEach((task, idx) => {
        // Find the next task that starts later in the day
        let nextSameDayTask = null;
        for (let i = 0; i < sortedTasks.length; i++) {
            if (sortedTasks[i].startHour > task.startHour) {
                nextSameDayTask = sortedTasks[i];
                break;
            }
        }
        
        // If no task follows in the same day, the next task is the first task of the next day
        const nextTask = nextSameDayTask || sortedTasks[0];
        
        // Calculate start and end in minutes
        const startMinutes = hourToMinutes(task.startHour);
        let endMinutes;
        
        if (nextSameDayTask) {
            // If there's a next task in the same day, use its start time
            endMinutes = hourToMinutes(nextSameDayTask.startHour);
        } else {
            // If no next task in the same day, this task continues until midnight (24:00)
            // Then wraps around to the first task of the next day
            endMinutes = dayMinutes; // Goes until end of day
        }
        
        // Handle case where task spans midnight
        let width;
        if (nextSameDayTask) {
            // Normal case: task duration within same day
            width = (endMinutes - startMinutes) / dayMinutes * 100;
        } else {
            // Task spans from its start time to midnight
            width = (dayMinutes - startMinutes) / dayMinutes * 100;
        }
        
        // Create the segment
        const segDiv = document.createElement("div");
        segDiv.className = "status-segment";
        segDiv.style.width = `${width}%`;
        segDiv.style.backgroundColor = enhancedColors[idx % enhancedColors.length];
        segDiv.style.height = "100%";
        segDiv.style.float = "left";
        segDiv.style.position = "relative";
        
        // Add label to segment
        const labelDiv = document.createElement("div");
        labelDiv.className = "segment-label";
        labelDiv.innerHTML = `${task.icon} ${task.name}`;
        labelDiv.style.position = "absolute";
        labelDiv.style.top = "50%";
        labelDiv.style.left = "50%";
        labelDiv.style.transform = "translate(-50%, -50%)";
        labelDiv.style.color = "#fff";
        labelDiv.style.fontSize = "18px";
        segDiv.appendChild(labelDiv);
        segDiv.setAttribute("data-task-index", tasks.indexOf(task)); // Use original index for reference
        
        statusBar.appendChild(segDiv);
        
        // If this is the last task of the day, create an additional segment that spans from midnight to the first task
        if (!nextSameDayTask) {
            const firstTaskStartMinutes = hourToMinutes(sortedTasks[0].startHour);
            const midnightToFirstWidth = firstTaskStartMinutes / dayMinutes * 100;
            
            // Only add the overnight segment if there's actually time between midnight and the first task
            if (midnightToFirstWidth > 0) {
                const overnightDiv = document.createElement("div");
                overnightDiv.className = "status-segment";
                overnightDiv.style.width = `${midnightToFirstWidth}%`;
                overnightDiv.style.backgroundColor = enhancedColors[idx % enhancedColors.length]; // Same color as parent task
                overnightDiv.style.height = "100%";
                overnightDiv.style.float = "left";
                overnightDiv.style.position = "relative";
                
                // Add label to overnight segment (use same task, but indicate it continues overnight)
                const overnightLabel = document.createElement("div");
                overnightLabel.className = "segment-label";
                overnightLabel.innerHTML = `${task.icon} ${task.name} (continues)`;
                overnightLabel.style.position = "absolute";
                overnightLabel.style.top = "50%";
                overnightLabel.style.left = "50%";
                overnightLabel.style.transform = "translate(-50%, -50%)";
                overnightLabel.style.color = "#fff";
                overnightLabel.style.fontSize = "18px";
                overnightDiv.appendChild(overnightLabel);
                overnightDiv.setAttribute("data-task-index", tasks.indexOf(task)); // Same index as parent task
                
                // Insert at beginning (left side) of status bar
                statusBar.prepend(overnightDiv);
            }
        }
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
    // Update label text depending on current task - removed date/time
    currentTaskLabelEl.textContent = currentTask ? currentTask.icon + " " + currentTask.name : "No Task";
}

// Determine which task is current using start hours
function getCurrentTask() {
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    
    // Sort tasks by startHour
    const sortedTasks = [...tasks].sort((a, b) => a.startHour - b.startHour);
    
    // Find the task that is currently active
    for (let i = 0; i < sortedTasks.length; i++) {
        const task = sortedTasks[i];
        
        // Find the next task that starts later in the day
        let nextSameDayTask = null;
        for (let j = 0; j < sortedTasks.length; j++) {
            if (j !== i && sortedTasks[j].startHour > task.startHour) {
                nextSameDayTask = sortedTasks[j];
                break;
            }
        }
        
        const taskStartHour = task.startHour;
        
        // If there's a next task in the same day
        if (nextSameDayTask) {
            const nextTaskStartHour = nextSameDayTask.startHour;
            if (currentHour >= taskStartHour && currentHour < nextTaskStartHour) {
                return task;
            }
        } 
        // If there's no next task in the same day, this task continues until midnight
        // Then it wraps around and continues from 00:00 until its own start time
        else {
            // Tasks with no successor in the same day wrap around midnight
            if (currentHour >= taskStartHour || currentHour < sortedTasks[0].startHour) {
                return task;
            }
        }
    }
    
    return null; // Should never reach here if tasks cover the full day
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

// Build task start time input fields
function setupInputs() {
    const tasksInputs = document.getElementById("tasksInputs");
    tasksInputs.innerHTML = "";
    
    // Update the header text in the modal
    document.querySelector('.modalHeader h3').textContent = "Set Task Start Times";
    document.querySelector('.modalBody p').textContent = "Set the starting time for each task (format: HH:MM, 24-hour)";
    
    tasks.forEach((task, idx) => {
        const div = document.createElement("div");
        div.className = "task-input";
        div.setAttribute("data-index", idx);
        
        // Convert decimal hour to HH:MM format
        const timeInMinutes = hourToMinutes(task.startHour);
        const time24Format = formatTime24(timeInMinutes);
        const timeFormatted = formatTime(timeInMinutes); // 12-hour format for display
        
        div.innerHTML = `
            <label><span>${task.icon}</span> ${task.name}: </label>
            <input type="time" value="${time24Format}" data-index="${idx}" class="start-time-input">
            <span class="time-display">(${timeFormatted})</span>
            <button class="remove-task" data-index="${idx}">Remove</button>
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
        if(e.target && e.target.classList.contains("start-time-input")){
            const index = e.target.getAttribute("data-index");
            const timeValue = e.target.value; // Format: HH:MM
            
            if(timeValue) {
                // Convert HH:MM to decimal hours
                const startHour = timeStringToHours(timeValue);
                
                // Validate that no other task has the same start time
                const isDuplicate = tasks.some((task, idx) => 
                    idx !== parseInt(index) && Math.abs(task.startHour - startHour) < 0.001
                );
                
                if (isDuplicate) {
                    alert("Another task already starts at this time. Please choose a different time.");
                    // Reset to previous value
                    const previousTime = formatTime24(hourToMinutes(tasks[index].startHour));
                    e.target.value = previousTime;
                    return;
                }
                
                tasks[index].startHour = startHour;
                
                // Update the displayed time next to the input
                const timeFormatted = formatTime(hourToMinutes(startHour));
                const timeDisplay = e.target.nextElementSibling;
                if(timeDisplay && timeDisplay.classList.contains("time-display")) {
                    timeDisplay.textContent = `(${timeFormatted})`;
                }
                
                buildStatusBar();
                saveTasksToStorage(); // Save tasks to localStorage
            }
        }
    });

    // Listen for remove clicks
    tasksInputs.addEventListener("click", (e) => {
        if(e.target && e.target.classList.contains("remove-task")){
            const index = parseInt(e.target.getAttribute("data-index"));
            if(tasks.length > 1) {
                tasks.splice(index, 1);
                setupInputs();
                buildStatusBar();
                buildHourMarkers();
                saveTasksToStorage(); // Save tasks to localStorage
            }
        }
    });

    // Listen for add task button click
    addBtn.addEventListener("click", () => {
        const name = prompt("Enter task name:", "New Task");
        if(!name) return;
        
        // Prompt for time in HH:MM format
        const timeStr = prompt("Enter start time (format: HH:MM, 24-hour):", "08:00");
        
        // Validate time format
        if(!timeStr || !timeStr.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
            alert("Invalid time format. Please use HH:MM (24-hour format).");
            return;
        }
        
        // Convert HH:MM to decimal hours
        const startHour = timeStringToHours(timeStr);
        
        // Validate that no other task has the same start time
        const isDuplicate = tasks.some(task => Math.abs(task.startHour - startHour) < 0.001);
        if (isDuplicate) {
            alert("Another task already starts at this time. Please choose a different time.");
            return;
        }
        
        const icon = prompt("Enter an emoji for the task:", "⭐") || "⭐";
        tasks.push({ name, startHour, icon });
        setupInputs();
        buildStatusBar();
        buildHourMarkers();
        saveTasksToStorage(); // Save tasks to localStorage
    });
}

setupInputs();
buildStatusBar();
buildHourMarkers();
update();

window.addEventListener('load', () => {
    saveTasksToStorage(); // Save tasks to localStorage
});
