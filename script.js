// Set initial tasks from settings or load from storage
let tasks = [...KTC_SETTINGS.defaultTasks];

// Function to sort tasks by startHour directly in the tasks array
function sortTasks() {
    tasks.sort((a, b) => a.startHour - b.startHour);
}

// Load tasks from localStorage if they exist
function loadTasksFromStorage() {
    const storedTasks = localStorage.getItem(KTC_SETTINGS.storage.tasksKey);
    if (storedTasks) {
        try {
            tasks = JSON.parse(storedTasks);
            sortTasks(); // Sort tasks when loaded
            console.log('Tasks loaded from localStorage');
        } catch (e) {
            console.error('Error loading tasks from localStorage:', e);
        }
    }
}

// Save tasks to localStorage
function saveTasksToStorage() {
    try {
        sortTasks(); // Ensure tasks are sorted before saving
        localStorage.setItem(KTC_SETTINGS.storage.tasksKey, JSON.stringify(tasks));
        console.log('Tasks saved to localStorage');
    } catch (e) {
        console.error('Error saving tasks to localStorage:', e);
    }
}

// Call loadTasksFromStorage on initialization
loadTasksFromStorage();

// DOM Elements - simplified references
const digitalClockEl = document.getElementById("digitalClock");
const progressContainer = document.querySelector('.progress-container');

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

// Helper function to format time as HH:MM (24-hour format)
function formatTime24(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Helper function to convert HH:MM format to decimal hours
function timeStringToHours(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + (minutes / 60);
}

// Helper function to format full date and time
function formatFullDateTime(date) {
    const options = KTC_SETTINGS.display.dateTimeFormat.options;
    const locale = KTC_SETTINGS.display.dateTimeFormat.locale;
    return date.toLocaleString(locale, options);
}

// Find next task that starts after the given task
function findNextTask(task, sortedTasks) {
    for (let i = 0; i < sortedTasks.length; i++) {
        if (sortedTasks[i].startHour > task.startHour) {
            return sortedTasks[i];
        }
    }
    return null;
}

// Build the status bar segments with labels for each task
function buildStatusBar() {
    const statusBar = document.getElementById("statusBar");
    statusBar.innerHTML = '';
    
    // Tasks are already sorted, no need for getSortedTasks()
    
    // Create segments for each task
    tasks.forEach((task, idx) => {
        // Find the next task that starts later in the day
        const nextSameDayTask = idx < tasks.length - 1 ? tasks[idx + 1] : null;
        
        // Calculate start and end in minutes
        const startMinutes = hourToMinutes(task.startHour);
        let endMinutes;
        
        if (nextSameDayTask) {
            // If there's a next task in the same day, use its start time
            endMinutes = hourToMinutes(nextSameDayTask.startHour);
        } else {
            // If no next task in the same day, this task continues until midnight
            endMinutes = KTC_SETTINGS.time.dayMinutes;
        }
        
        // Calculate segment width as percentage of day
        const width = ((endMinutes - startMinutes) / KTC_SETTINGS.time.dayMinutes) * 100;
        
        // Create the segment
        const segDiv = document.createElement("div");
        segDiv.className = "status-segment";
        segDiv.style.width = `${width}%`;
        segDiv.style.backgroundColor = KTC_SETTINGS.colors.enhanced[idx % KTC_SETTINGS.colors.enhanced.length];
        segDiv.style.height = "100%";
        segDiv.style.float = "left";
        segDiv.style.position = "relative";
        
        // Add label to segment
        const labelDiv = document.createElement("div");
        labelDiv.className = "segment-label";
        labelDiv.innerHTML = `${task.icon}`;
        labelDiv.style.position = "absolute";
        labelDiv.style.top = "50%";
        labelDiv.style.left = "50%";
        labelDiv.style.transform = "translate(-50%, -50%)";
        labelDiv.style.color = KTC_SETTINGS.display.colors.segmentLabel;
        labelDiv.style.fontSize = KTC_SETTINGS.display.fontSize.segmentLabel;
        segDiv.appendChild(labelDiv);
        segDiv.setAttribute("data-task-index", idx); // Use array index since it's sorted
        
        statusBar.appendChild(segDiv);
        
        // If this is the last task of the day, create an additional segment that spans from midnight to the first task
        if (!nextSameDayTask) {
            const firstTaskStartMinutes = hourToMinutes(tasks[0].startHour);
            const midnightToFirstWidth = (firstTaskStartMinutes / KTC_SETTINGS.time.dayMinutes) * 100;
            
            // Only add the overnight segment if there's actually time between midnight and the first task
            if (midnightToFirstWidth > 0) {
                const overnightDiv = document.createElement("div");
                overnightDiv.className = "status-segment";
                overnightDiv.style.width = `${midnightToFirstWidth}%`;
                overnightDiv.style.backgroundColor = KTC_SETTINGS.colors.enhanced[idx % KTC_SETTINGS.colors.enhanced.length];
                overnightDiv.style.height = "100%";
                overnightDiv.style.float = "left";
                overnightDiv.style.position = "relative";
                
                // Add label to overnight segment
                const overnightLabel = document.createElement("div");
                overnightLabel.className = "segment-label";
                overnightLabel.innerHTML = `${task.icon}`;
                overnightLabel.style.position = "absolute";
                overnightLabel.style.top = "50%";
                overnightLabel.style.left = "50%";
                overnightLabel.style.transform = "translate(-50%, -50%)";
                overnightLabel.style.color = KTC_SETTINGS.display.colors.segmentLabel;
                overnightLabel.style.fontSize = KTC_SETTINGS.display.fontSize.segmentLabel;
                overnightDiv.appendChild(overnightLabel);
                overnightDiv.setAttribute("data-task-index", idx); // Use array index since it's sorted
                
                // Insert at beginning (left side) of status bar
                statusBar.prepend(overnightDiv);
            }
        }
    });
}

// Build hour markers along the status bar
function buildHourMarkers() {
    if (!KTC_SETTINGS.display.hourMarkers.show) return;
    
    const hourMarkersContainer = document.getElementById("hourMarkers");
    hourMarkersContainer.innerHTML = '';
    
    // For each hour 0..24, calculate left position in percentage
    for (let h = 0; h <= KTC_SETTINGS.time.hoursInDay; h++) {
        const posPercent = (h * 60 / KTC_SETTINGS.time.dayMinutes) * 100;
        
        // Create marker line
        const marker = document.createElement("div");
        marker.className = "hour-marker";
        marker.style.left = `${posPercent}%`;
        hourMarkersContainer.appendChild(marker);
        
        if (h < KTC_SETTINGS.time.hoursInDay) {
            // Create label for the hour marker
            const label = document.createElement("div");
            label.className = "hour-label";
            label.style.left = `${posPercent}%`;
            label.textContent = h.toString().padStart(2, '0') + ":00";
            hourMarkersContainer.appendChild(label);
        }
    }
}

// Update current time marker position in status bar and center it on screen
function updateCurrentTimeMarker() {
    const now = new Date();
    const minutesNow = now.getHours() * 60 + now.getMinutes();
    const currentTimeMarker = document.getElementById("currentTimeMarker");
    // Left position as percentage
    const positionPercent = (minutesNow / KTC_SETTINGS.time.dayMinutes) * 100;
    currentTimeMarker.style.left = `${positionPercent}%`;
}

// Function to center the time marker on screen
function centerTimeMarkerOnScreen() {
    const progressBarView = document.getElementById("progressBarClockView");
    const currentTimeMarker = document.getElementById("currentTimeMarker");
    const progressContainer = document.querySelector('.progress-container');
    
    if (progressBarView && currentTimeMarker && progressContainer) {
        // Calculate the marker's actual position
        const markerRect = currentTimeMarker.getBoundingClientRect();
        const containerRect = progressContainer.getBoundingClientRect();
        
        // Calculate the scroll position needed to center the marker
        const markerCenterX = markerRect.left - containerRect.left;
        const viewportWidth = progressBarView.clientWidth;
        const scrollLeft = markerCenterX - (viewportWidth / 2);
        
        // Smooth scroll to center the marker
        progressBarView.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
        });
    }
}

// Update digital clock display and other time displays
function updateTimeDisplay() {
    const now = new Date();
    digitalClockEl.textContent = formatFullDateTime(now);
    updateCurrentTimeMarker();
    updateCurrentSegmentHighlight();
    updateCurrentTaskLabel(); // update current task label
}

// Update the current task label
function updateCurrentTaskLabel() {
    const currentTask = getCurrentTask();
    const currentTaskLabelEl = document.getElementById("currentTaskLabel");
    currentTaskLabelEl.textContent = currentTask 
        ? `${currentTask.icon} ${currentTask.name}` 
        : KTC_SETTINGS.ui.noTaskMessage;
}

// Determine which task is current using start hours
function getCurrentTask() {
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    
    // Use sorted tasks array directly
    
    // Find the task that is currently active
    for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const nextIdx = (i + 1) % tasks.length;
        const nextTask = tasks[nextIdx];
        const taskStartHour = task.startHour;
        
        // If this is not the last task
        if (i < tasks.length - 1) {
            const nextTaskStartHour = nextTask.startHour;
            if (currentHour >= taskStartHour && currentHour < nextTaskStartHour) {
                return task;
            }
        } 
        // If this is the last task, it continues until the first task of the next day
        else if (currentHour >= taskStartHour || currentHour < tasks[0].startHour) {
            return task;
        }
    }
    
    return null; // Should never reach here if tasks cover the full day
}

// Highlight current task segment on each update
function updateCurrentSegmentHighlight() {
    const currentTask = getCurrentTask();
    
    // Clear previous highlighting
    document.querySelectorAll(".status-segment[data-task-index]").forEach(el => {
        el.classList.remove("current-segment");
    });
    
    if (currentTask) {
        // Find the segment with matching data-task-index
        const currentIdx = tasks.indexOf(currentTask);
        const segments = document.querySelectorAll(`.status-segment[data-task-index="${currentIdx}"]`);
        segments.forEach(seg => seg.classList.add("current-segment"));
    }
}

// Main update function - update time display and schedule next frame
function update() {
    updateTimeDisplay();
    requestAnimationFrame(update);
}

// Build task start time input fields
function setupInputs() {
    const tasksInputs = document.getElementById("tasksInputs");
    tasksInputs.innerHTML = "";
    
    // Update the header text in the modal
    document.querySelector('.modalHeader h3').textContent = KTC_SETTINGS.ui.modalTitle;
    document.querySelector('.modalBody p').textContent = KTC_SETTINGS.ui.modalDescription;
    
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
            <button class="remove-task" data-index="${idx}">${KTC_SETTINGS.ui.removeTaskButton}</button>
        `;
        tasksInputs.appendChild(div);
    });

    // Add Task button
    const addBtn = document.createElement("button");
    addBtn.id = "addTaskBtn";
    addBtn.textContent = KTC_SETTINGS.ui.addTaskButton;
    tasksInputs.appendChild(addBtn);

    // Listen for changes on inputs
    tasksInputs.addEventListener("change", (e) => {
        if(e.target && e.target.classList.contains("start-time-input")){
            const index = parseInt(e.target.getAttribute("data-index"));
            const timeValue = e.target.value; // Format: HH:MM
            
            if(timeValue) {
                // Convert HH:MM to decimal hours
                const startHour = timeStringToHours(timeValue);
                
                // Validate that no other task has the same start time
                const isDuplicate = tasks.some((task, idx) => 
                    idx !== index && Math.abs(task.startHour - startHour) < KTC_SETTINGS.time.startHourPrecision
                );
                
                if (isDuplicate) {
                    alert(KTC_SETTINGS.ui.prompts.errors.duplicateTime);
                    // Reset to previous value
                    const previousTime = formatTime24(hourToMinutes(tasks[index].startHour));
                    e.target.value = previousTime;
                    return;
                }
                
                tasks[index].startHour = startHour;
                
                // Sort tasks after updating
                sortTasks();
                
                // Re-render the entire input section to reflect the new order
                setupInputs();
                buildStatusBar();
                saveTasksToStorage();
                return; // Exit early since we've re-rendered the inputs
            }
        }
    });

    // Listen for remove clicks
    tasksInputs.addEventListener("click", (e) => {
        if(e.target && e.target.classList.contains("remove-task")){
            const index = parseInt(e.target.getAttribute("data-index"));
            if(tasks.length > KTC_SETTINGS.tasks.minimumTasksCount) {
                tasks.splice(index, 1);
                sortTasks(); // Ensure tasks remain sorted
                setupInputs();
                buildStatusBar();
                buildHourMarkers();
                saveTasksToStorage();
            }
        }
    });

    // Listen for add task button click
    addBtn.addEventListener("click", () => {
        const prompts = KTC_SETTINGS.ui.prompts;
        
        const name = prompt(prompts.taskName.title, prompts.taskName.default);
        if(!name) return;
        
        // Prompt for time in HH:MM format
        const timeStr = prompt(prompts.taskTime.title, prompts.taskTime.default);
        
        // Validate time format
        if(!timeStr || !timeStr.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
            alert(prompts.taskTime.invalidFormat);
            return;
        }
        
        // Convert HH:MM to decimal hours
        const startHour = timeStringToHours(timeStr);
        
        // Validate that no other task has the same start time
        const isDuplicate = tasks.some(task => 
            Math.abs(task.startHour - startHour) = 0
        );
        
        if (isDuplicate) {
            alert(prompts.errors.duplicateTime);
            return;
        }
        
        const icon = prompt(prompts.taskIcon.title, prompts.taskIcon.default) || 
                    KTC_SETTINGS.tasks.defaultIcon;
        
        tasks.push({ name, startHour, icon });
        sortTasks(); // Sort tasks after adding new task
        setupInputs();
        buildStatusBar();
        buildHourMarkers();
        saveTasksToStorage();
    });
}

// Function to toggle visibility of the digital clock and current task label
function toggleVisibility(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = element.style.display === 'none' ? 'block' : 'none';
    }
}

// Add event listeners for toggling visibility
const toggleClockButton = document.getElementById('toggleClockButton');
const toggleTaskButton = document.getElementById('toggleTaskButton');

if (toggleClockButton) {
    toggleClockButton.addEventListener('click', () => toggleVisibility('digitalClock'));
}

if (toggleTaskButton) {
    toggleTaskButton.addEventListener('click', () => toggleVisibility('currentTaskLabel'));
}

// Sort tasks initially
sortTasks();

// Initialize the app
setupInputs();
buildStatusBar();
buildHourMarkers();
update();

// Set up automatic centering of the time marker every 30 seconds
setInterval(centerTimeMarkerOnScreen, 30000);

// Save tasks when page loads (to ensure initial state is saved)
window.addEventListener('load', () => {
    saveTasksToStorage();
    
    // Center the time marker on initial load
    // Small delay to ensure all elements are properly rendered
    setTimeout(() => {
        centerTimeMarkerOnScreen();
    }, 500);
});
