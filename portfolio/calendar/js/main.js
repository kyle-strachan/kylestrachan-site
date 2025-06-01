// Define variables
const numberOfMonthsToPopulate = 9; // Defines how many months to show on calendar
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();
const calendarStartDate = new Date(`${currentYear}-${currentMonth}-01`); // Forces calendar to start on user's current month
let eventsList = []; // Will populate from JSON file
const lastDate = new Date(
            currentYear,
            currentMonth + numberOfMonthsToPopulate,
            1
            ).setHours(0, 0, 0, 0);

// Link HTML
// Calendar elements
const calendarArea = document.getElementById("calendar");
const calendarHeaders = document.getElementById("calendar-headers");
// Toolbar elements
const btnDisplayByMonth = document.getElementById("btn-display-by-month");
const btnDisplayByDay = document.getElementById("btn-display-by-day");
const btnAddNewCalendarEvent = document.getElementById(
"btn-add-new-calendar-event"
);
// Overlay input elements
const eventForm = document.getElementById("event-form");
const inputEventTitle = document.getElementById("input-event-title");
const inputEventDate = document.getElementById("input-event-date");
const inputEventType = document.getElementById("input-event-type");
const formErrorMessage = document.getElementById("overlay-error-message");


// Functions

function getDaysInMonth(date) {
    // Calculates how many day tiles to create per month in the grid layout
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return new Date(year, month, 0).getDate();
}

function initCalendar() {
    // Builds the calendar. Loops through each month and inserts day tiles in the correct column
    for (let i = 1; i <= numberOfMonthsToPopulate; i++) {
        // Set the month based on the start date of the calendar and the iteration number
        let calendarMonth = new Date(calendarStartDate);
        calendarMonth.setMonth(calendarStartDate.getMonth() + i);
        
        // Create a text version to insert in headers
        const monthAsText = calendarMonth.toLocaleString("en-CA", {
            month: "long",
            year: "numeric",
        });

        // Format month as two-character string to form part of the tile id to later add events
        const monthAsInt = (calendarMonth.getMonth() + 1)
            .toString()
            .padStart(2, "0");

        // Insert a grid for the month. Target offset is for the 'Jump To' list.
        const monthGridToInsert = `<div class="calendar-month">
            <h2 class="target-offset">${monthAsText}</h2>
            </div><div id="grid-month-${i}" class="calendar-grid target-offset"></div>`;
        calendarArea.insertAdjacentHTML("beforeend", monthGridToInsert);

        // In the grid, add blank spacer tiles at the start of the grid to align
        // the 1st of the month with the day of week headers
        const monthGrid = document.getElementById(`grid-month-${i}`);
        let calendarStartDayOfWeek = calendarMonth.getDay();
        for (let j = 1; j <= calendarStartDayOfWeek; j++) {
            monthGrid.insertAdjacentHTML("beforeend", `<div></div>`);
        }

        // Insert the calendar day tiles, get number of tiles to create
        const daysInMonth = getDaysInMonth(calendarMonth);
        
        // Insert each day tile and add eventDateId in YYYYMMDD format so events can been attached
        let count = 1;
        while (count <= daysInMonth) {
            const newCalendarTile = `<div class="calendar-tile">
                        <div class="calendar-day"><p>${count}</p></div>
                        <div id="eventDateId${calendarMonth.getFullYear()}${monthAsInt}${count
            .toString()
            .padStart(2, "0")}" class="calendar-activity-grid"></div>
                    </div>`;
            monthGrid.insertAdjacentHTML("beforeend", newCalendarTile);
            count++;
        }
    }
}

function insertEvent(eventTitle, eventDate, iconType, fromOverlay) {
    // Function used to load initial event from JSON and manually added events.
    // 'fromOverlay' determines whether to toggle overlay if event was added manually.
    // Events in the JSON file have dates as an integer from the first calendar date
    // so content will appear 'current' whenever the project is viewed.

    // Create date string to match YYYYMMDD eventDateId format
    const eventYear = eventDate.getFullYear();
    const eventMonth = (eventDate.getMonth() + 1)
        .toString()
        .padStart(2, "0");
    const eventDay = eventDate.getDate().toString().padStart(2, "0");
    const calendarActivity = document.getElementById(
        `eventDateId${eventYear}${eventMonth}${eventDay}`
    );

    // Insert into the calendar
    const newEvent = `<div class="calendar-activity calendar-activity-${iconType}">
                        <div class="calendar-activity-icon"></div>
                        <div class="calendar-activity-label">
                            <p>${eventTitle}</p>
                        </div>
                        </div>`;
    try {
        calendarActivity.insertAdjacentHTML("beforeend", newEvent);
    } catch (error) {
        // If numberOfMonthsToPopulate is reduced, JSON will include events beyond
        // the end of the calendar. The final event in JSON has been left to fail
        // to ensure this is working.
        console.log(`${eventTitle} is outside of the calendar start or end date`);
    }

    // If event was added from overlay, clear form and toggle overlay
    if (fromOverlay) {
        eventForm.reset();
        formErrorMessage.innerHTML = "";
        toggleOverlay();
    }
}

function toggleOverlay() {
    // Toggles overlay on and off
    const overlay = document.getElementById("event-overlay");
    overlay.classList.toggle("hidden");
}

// Create the calendar on page load, defined above listeners as JSON fetch requires calendar to exist
initCalendar();

// Load JSON events
fetch("./data/events.json") //
    .then((response) => {
        if (!response.ok) {
        throw new Error(`Status: ${response.status}`);
        }
        return response.json();
    })
    .then((events) => {
        events.forEach((event) => {
        // False argument prevents the overlay window toggling for initial events from JSON file
        insertEvent(
            event.title,
            new Date(currentYear, currentMonth, event.date),
            event.category,
            false
        );
        });
    })
    .catch((error) => {
        console.error("Error fetching or processing event:", error);
    });


// Define listeners

// Toolbar 'New Event' button
btnAddNewCalendarEvent.addEventListener("click", toggleOverlay);
// Overlay buttons
document
    .getElementById("btn-close-new-event")
    .addEventListener("click", function (e) {
        e.preventDefault();
        eventForm.reset();
        formErrorMessage.innerHTML = "";
        toggleOverlay();
    });
document
    .getElementById("btn-add-event-from-overlay")
    .addEventListener("click", (event) => {
        // Prevents new event submission from moving to top of page
        event.preventDefault();

        // Reject input if event title is blank
        if (inputEventTitle.value === "") {
            formErrorMessage.textContent = "An event name is required.";
            return;
        }

        // Reject input if event date is blank
        if (inputEventDate.value === "") {
            formErrorMessage.textContent = "An event date is required.";
            return;
        }

        // Define event and current date to compare
        const eventDate = new Date(
            inputEventDate.value.slice(0, 4),
            inputEventDate.value.slice(5, 7) - 1,
            inputEventDate.value.slice(8, 10)
            );
        const eventDateTime = eventDate.setHours(0, 0, 0, 0);
        const currentDate = new Date().setHours(0, 0, 0, 0);

        // Reject if event is in the past
        if (eventDate < currentDate) {
            formErrorMessage.textContent = "New events cannot be in the past.";
        return;
        }

        // Reject if event is beyond the last day of the calendar
        if (eventDate >= lastDate) {
            const errorMsg = `A new event must be within the next ${numberOfMonthsToPopulate} months.`;
            formErrorMessage.innerHTML = errorMsg;
            return;
        }
        
        // Insert the event
        if (inputEventDate.value)
            insertEvent(
            inputEventTitle.value,
            eventDate,
            inputEventType.value,
            true
        );
    });
// Toolbar display as month button
btnDisplayByMonth.addEventListener("click", function () {
    document.querySelectorAll(".calendar-grid").forEach((el) => {
    el.style.gridTemplateColumns = "repeat(7, minmax(95px, 1fr))";
    // Show the day of week headers in 7-column layout
    calendarHeaders.classList.remove("hidden");
    });
});
// Toolbar display as day button
btnDisplayByDay.addEventListener("click", function () {
    document.querySelectorAll(".calendar-grid").forEach((element) => {
    element.style.gridTemplateColumns = "repeat(1, minmax(95px, 1fr))";
    // Hide the day of week headers in single-column layout
    calendarHeaders.classList.add("hidden");
    });
});