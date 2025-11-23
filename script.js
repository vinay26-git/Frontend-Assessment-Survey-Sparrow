// ==========================================================
// FULL script.js: Dynamic Calendar with Event Management
// (Includes Multi-Level Conflict Detection)
// ==========================================================

// --- 1. Data and Initial Setup ---

// Static Event Data (acting as the loaded JSON file)
let staticEvents = [
    { title: "Project Kickoff", date: "2025-11-25", time: "10:00", duration: "1h" },
    { title: "Team Review", date: "2025-11-25", time: "11:00", duration: "30m" }, // Conflict Level 2 Example
    { title: "Client Presentation", date: "2025-11-25", time: "14:00", duration: "2h" }, // Conflict Level 3+ Example
    { title: "Quarterly Planning", date: "2025-12-05", time: "09:30", duration: "2h" },
    { title: "Holiday Party", date: "2025-12-24", time: "18:00", duration: "4h" },
    { title: "Bug Bash", date: "2025-11-01", time: "09:00", duration: "3h" },
];

// Calendar DOM Elements
const calendarGrid = document.getElementById('calendar-grid');
const currentMonthYearDisplay = document.getElementById('current-month-year');
const prevMonthBtn = document.getElementById('prev-month-btn');
const nextMonthBtn = document.getElementById('next-month-btn');

// Modal Elements
const modal = document.getElementById('event-modal');
const closeBtn = document.querySelector('.close-btn');
const addEventForm = document.getElementById('add-event-form');
const eventDateInput = document.getElementById('event-date');

// Current Date State
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0-11 for Jan-Dec
const today = new Date(); // Used for highlighting the current day


// --- 2. Helper Functions ---

/**
 * Formats year, month, and day into the YYYY-MM-DD string format for event matching.
 * @param {number} year 
 * @param {number} month (0-indexed)
 * @param {number} day 
 * @returns {string} The formatted date string.
 */
const formatDate = (year, month, day) => {
    const m = (month + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    return `${year}-${m}-${d}`;
};

/**
 * Returns the number of events on a specific day for conflict detection.
 * @param {Array<Object>} dayEvents 
 * @returns {number} The count of events on that day.
 */
const hasConflict = (dayEvents) => {
    return dayEvents.length;
};


// --- 3. Date Cell Creation and Event Display ---

/**
 * Creates and appends a single date cell to the calendar grid.
 */
const createDateCell = (day, isInactive = false, isPrevMonth = false, isToday = false, events = []) => {
    const cell = document.createElement('div');
    cell.classList.add('date-cell');

    if (isInactive) {
        cell.classList.add('inactive-month');
    }
    if (isToday) {
        cell.classList.add('current-day');
    }

    // Day Number
    const dayNumberSpan = document.createElement('span');
    dayNumberSpan.classList.add('date-number');
    dayNumberSpan.textContent = day;
    cell.appendChild(dayNumberSpan);

    // Add click listener for adding events on ACTIVE cells
    if (!isInactive) {
        const dateString = formatDate(currentYear, currentMonth, day);
        cell.dataset.date = dateString; // Store the date

        cell.addEventListener('click', () => {
            // Pre-fill the date and show the modal
            eventDateInput.value = dateString;
            modal.style.display = 'block'; 
        });
    }

    // Display Events
    if (events.length > 0 && !isInactive) {
        // Get the number of events to determine conflict level
        const conflictCount = hasConflict(events);

        events.forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.classList.add('event');
            
            // --- NEW MULTI-LEVEL CONFLICT LOGIC ---
            if (conflictCount === 2) {
                eventDiv.classList.add('conflict-level-2'); // Orange
            } else if (conflictCount >= 3) {
                eventDiv.classList.add('conflict-level-3'); // Red
            }
            // --- END NEW LOGIC ---
            
            eventDiv.textContent = `${event.time} - ${event.title}`;
            eventDiv.title = `${event.title} (${event.time}, ${event.duration})`;
            
            cell.appendChild(eventDiv);
        });
    }

    calendarGrid.appendChild(cell);
};


// --- 4. Main Calendar Rendering Function ---

const renderCalendar = () => {
    // 1. Clear the existing grid content
    calendarGrid.innerHTML = '';

    // 2. Set the display header
    const dateTitle = new Date(currentYear, currentMonth);
    currentMonthYearDisplay.textContent = dateTitle.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });

    // 3. Calculate crucial month data
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // Day of week (0-6)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); // Total days
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    // 4. Inactive cells from the previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
        const prevMonthDay = daysInPrevMonth - firstDayOfMonth + i + 1;
        // Inactive and isPrevMonth are true
        createDateCell(prevMonthDay, true, true); 
    }

    // 5. Cells for the current month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateString = formatDate(currentYear, currentMonth, day);
        const dayEvents = staticEvents.filter(e => e.date === dateString);
        
        // Check if the current date is "today"
        const isToday = day === today.getDate() && 
                        currentMonth === today.getMonth() && 
                        currentYear === today.getFullYear();
        
        createDateCell(day, false, false, isToday, dayEvents);
    }
    
    // 6. Cells for the next month (to fill the grid)
    const totalCells = firstDayOfMonth + daysInMonth;
    // Calculate days needed to fill the final row (or a full 6x7 grid)
    const nextMonthDaysNeeded = (42 - totalCells) % 7; 

    for (let i = 1; i <= nextMonthDaysNeeded; i++) {
        createDateCell(i, true, false); // Inactive, not prev month
    }
};


// --- 5. Navigation Handlers ---

prevMonthBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11; 
        currentYear--;     
    }
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;  
        currentYear++;     
    }
    renderCalendar();
});


// --- 6. Event Modal and Form Handlers ---

// Close modal using the 'X' button
closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Close modal by clicking outside of it
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Handle form submission to add a new event
addEventForm.addEventListener('submit', (e) => {
    e.preventDefault(); 

    // Gather event data from form
    const newEvent = {
        title: document.getElementById('event-title').value,
        date: document.getElementById('event-date').value,
        time: document.getElementById('event-time').value,
        duration: document.getElementById('event-duration').value,
    };

    // Add the new event to the array
    staticEvents.push(newEvent);
    
    // Reset and hide
    addEventForm.reset();
    modal.style.display = 'none';

    // Re-render to show the new event
    renderCalendar();
});


// --- 7. Initialisation ---

// Initial call to render the calendar when the page loads
renderCalendar();