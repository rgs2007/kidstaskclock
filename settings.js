// settings.js - Configuration file for Kids Task Clock

// App settings
const KTC_SETTINGS = {
    // Storage configuration
    storage: {
        tasksKey: 'kidsTasks',
    },
    
    // Display settings
    display: {
        fontSize: {
            segmentLabel: '40px',
        },
        colors: {
            segmentLabel: '#fff',
        },
        dateTimeFormat: {
            options: { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit', 
                hour12: true 
            },
            locale: 'en-US',
        },
        hourMarkers: {
            show: true,
            format: '00:00', // Format for the hour labels
        },
    },
    
    // Task display settings
    tasks: {
        defaultIcon: '⭐',
        continuesText: '(continues)',
        minimumTasksCount: 1,
    },
    
    // Time constants
    time: {
        dayMinutes: 1440, // 24 hours * 60 minutes
        hoursInDay: 24,
        startHourPrecision: 0.001, // For comparing decimal hours
    },
    
    // UI Text
    ui: {
        modalTitle: "Set Task Start Times",
        modalDescription: "Set the starting time for each task (format: HH:MM, 24-hour)",
        addTaskButton: "Add Task",
        removeTaskButton: "Remove",
        noTaskMessage: "No Task",
        
        prompts: {
            taskName: {
                title: "Enter task name:",
                default: "New Task"
            },
            taskTime: {
                title: "Enter start time (format: HH:MM, 24-hour):",
                default: "08:00",
                invalidFormat: "Invalid time format. Please use HH:MM (24-hour format)."
            },
            taskIcon: {
                title: "Enter an emoji for the task:",
                default: "⭐"
            },
            errors: {
                duplicateTime: "Another task already starts at this time. Please choose a different time."
            }
        }
    },
    
    // Default tasks
    defaultTasks: [
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
    ],
    
    // Color palettes
    colors: {
        pastel: [
            "#FFB3BA", "#FFDFBA", "#FFFFBA", "#BAFFC9", "#BAE1FF",
            "#C9C9FF", "#FCD1D1", "#FCE1D1", "#D1FCD6", "#D1F0FC",
            "#E1D1FC"
        ],
        enhanced: [
            "#FF9AA2", "#FFB7B2", "#FFDAC1", "#E2F0CB", "#B5EAD7", 
            "#C7CEEA", "#F2D4D7", "#D4F2D2", "#D4F2EA", "#D4E2F2",
            "#E2D4F2", "#F2D4F0"
        ]
    }
};