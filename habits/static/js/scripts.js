function openHabitModal() {
    document.getElementById("habitModal").style.display = "flex";
}

function closeModal() {
    document.getElementById("habitModal").style.display = "none";
}

function openEditModal() {
    document.getElementById("editModal").style.display = "flex";
}

function closeEditModal() {
    document.getElementById("editModal").style.display = "none";
}


// Phone number validation for 10 digits
document.getElementById('phone_number').addEventListener('input', function() {
    const phone_number = this.value;
    const errorMessage = document.getElementById('phone_error');
    const submitButton = document.getElementById('submit_button');

    // Check if the phone number is 10 digits
    if (phone_number.length === 10 && /^[0-9]{10}$/.test(phoneNumber)) {
        errorMessage.style.display = 'none';
        submitButton.disabled = false;
    } else {
        errorMessage.style.display = 'block';
        submitButton.disabled = true;
    }
})

// Fetch habits from the server
async function fetchHabits() {
    const response = await fetch("/habit/habits/");
    const habits = await response.json();
    const list = document.getElementById("habit-list");
    list.innerHTML = "";

    if (habits.length === 0) {
        list.style.border = "none";
        list.style.background = "none"; // Remove borders if no habits
    } else {
        list.style.border = "";
        list.style.background = ""; // Reset border when habits exist
    }

    habits.forEach((habit) => {
        const item = document.createElement("li");
        item.innerHTML = `<strong><a id="${habit.id}" href="#">${habit.name}</a><strong>`;
        list.appendChild(item);

        // delete button
        const deleteButton = document.createElement("button");
        deleteButton.innerHTML = "Delete";
        deleteButton.addEventListener("click", async () => {
            const response = await fetch(`/habit/habits/${habit.id}`, {
                method: "DELETE",
                headers: {
                    "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value,
                },
            });
            if (response.ok) {
                alert("Habit Deleted");
                fetchHabits();
                fetchStreakCount();
                habitProgress();
            } else {
                alert("Failed to delete Habit");
            }
        });
        item.appendChild(deleteButton);

        // Edit button
        const editButton = document.createElement("button");
        editButton.innerText = "Edit";
        editButton.addEventListener("click", () => {
            // Get references to form fields
            const editTitle = document.getElementById("editHabit");
            let habitIdInput = document.getElementById("habitId"); // Check if hidden input already exists

            // If habitId input doesn't exist, create it
            if (!habitIdInput) {
                habitIdInput = document.createElement("input");
                habitIdInput.id = "habitId";
                habitIdInput.type = "hidden"; // Make it hidden
                editTitle.appendChild(habitIdInput); // Append only if it doesn't already exist
            }

            // Set values in the form fields
            habitIdInput.value = habit.id;
            document.getElementById("editTitle").value = habit.name;
            document.getElementById("editFrequency").value = habit.frequency;

            // Open the modal for editing
            openEditModal();
        });
        item.appendChild(editButton);
    });
}

async function fetchStreakCount() {
    const progressResponse = await fetch("/habit/progress/");
    const progress = await progressResponse.json();
    const habitsResponse = await fetch("/habit/habits/");
    const habits = await habitsResponse.json();

    const body = document.getElementById("streak-list");
    body.innerHTML = "";
    habits.forEach((habit) => {
        let count = 0;
        let streak = 0;
        const date = new Date();
        const newDate = date.toISOString().split("T")[0]; // Today's date
        // Count completed progress
        for (let i = 0; i < progress.length; i++) {
            if (habit.progress[i] && habit.progress[i].completed) {
                count++;
            }
        }

        // Calculate streak
        let previousDate = new Date(date);
        previousDate.setDate(previousDate.getDate() - 1);

        for (let i = 0; i < habit.progress.length; i++) {
            const progressDate = new Date(habit.progress[i].date);
            if (habit.progress[i] && habit.progress[i].completed) {
                if (progressDate.toISOString().split("T")[0] === newDate) {
                    streak++;
                } else if (previousDate.toISOString().split("T")[0] === progressDate.toISOString().split("T")[0]) {
                    streak++;
                    previousDate.setDate(previousDate.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        countDiv = document.createElement("tr");
        countDiv.id = `count-${habit.id}`;
        countDiv.innerHTML = `<td>${count}</td><td>${streak}</td>`;
        body.appendChild(countDiv);
    });
}

document.getElementById("habitForm").addEventListener("submit", async function (e) {
    e.preventDefault(); // Prevent page reload on form submission

    const habitsResponse = await fetch("/habit/habits/");
    const habits = await habitsResponse.json();
    if (habits.length >= 5) {
        alert("You can only have up to 5 habits at a time.");
        return; // Stop execution if 5 habits already exist
    }

    const title = document.getElementById("title").value;
    const frequency = document.getElementById("frequency").value;
    const response = await fetch("/habit/habits/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value,
        },
        body: JSON.stringify({ name: title, frequency }),
    });

    // Checking if response if valid or not
    if (response.ok) {
        fetchHabits();
        fetchStreakCount();
        habitProgress();
        setTimeout(() => {
            closeModal();
        }, 300);
    } else {
        alert("Failed to add Habit");
    }
});

// Edit function for habit
document.getElementById("editHabitForm").addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent default form submission

    const title = document.getElementById("editTitle").value;
    const frequency = document.getElementById("editFrequency").value;
    const habitId = document.getElementById("habitId").value;

    try {
        const response = await fetch(`/habit/habits/${habitId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value,
            },
            body: JSON.stringify({ name: title, frequency }),
        });

        if (response.ok) {
            fetchHabits(); // Refresh the habits list
            fetchStreakCount();
            habitProgress();
            setTimeout(() => {
                closeEditModal();
            }, 300);
            
        } else {
            alert("Failed to update Habit");
        }
    } catch (error) {
        console.error("Error during fetch:", error);
        alert("An error occurred. Please try again.");
    }
});

// Variables to keep track of state
let currentOffset = 0;
let visibleDays = 7; // Adjusted to show 7 days initially

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const calendar = document.getElementById("calendar");
// creating variable to store habit id
let currentHabitId = null;
const maxOffset = 365;

function adjustVisibleDays() {
    const screenWidth = window.innerWidth;

    // Adjust the number of visible days based on screen width
    if (screenWidth <= 600) {
        visibleDays = 3;
        currentOffset = 3;
    } else if (screenWidth <= 900) {
        visibleDays = 5;
        currentOffset = 5;
    } else {
        visibleDays = 7;
        currentOffset = 7;
    }

    createCalendar();
    habitProgress();
}

// Create the calendar
function createCalendar() {
    const currentDate = new Date();
    let startDate = new Date();
    startDate.setDate(currentDate.getDate() - currentOffset); // Adjust start date based on offset
    let calendarContent = "";

    for (let i = 0; i <= visibleDays; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);

        if (date > currentDate) {
            break;
        }

        const day = date.getDate();
        const month = date.toLocaleString("en-US", { month: "short" });
        const weekday = date.toLocaleString("en-US", { weekday: "short" });

        const isToday = date.toDateString() === currentDate.toDateString();
        const habitCompleted = checkHabitStatus(date);

        calendarContent += `
                        <div class="calendar-date ${isToday ? "today" : "weekend"} ${
            habitCompleted ? "habit-checked" : "habit-not-checked"
        }">
                                <div class="month">${month}</div>
                                <div class="day">${day}</div>
                                <div class="weekday">${weekday}</div>
                        </div>`;
    }

    calendar.innerHTML = calendarContent;

    // Disable the "next" button if current date is visible
    const lastDisplayedDate = new Date(startDate);
    lastDisplayedDate.setDate(lastDisplayedDate.getDate() + visibleDays - 1);
    if (lastDisplayedDate.toDateString() === currentDate.toDateString()) {
        nextBtn.disabled = true;
    } else {
        nextBtn.disabled = false;
    }

    if (currentOffset >= maxOffset) {
        prevBtn.disabled = true;
    } else {
        prevBtn.disabled = false;
    }
}

async function habitProgress() {
    const progresDiv = document.getElementById("habits-container");
    const currentDate = new Date();
    let startDate = new Date();
    startDate.setDate(currentDate.getDate() - currentOffset);

    progresDiv.innerHTML = ``;

    const response = await fetch(`/habit/habits/`);
    const habits = await response.json();

    habits.forEach((habit) => {
        const currentHabitId = habit.id;
        const habitDiv = document.createElement("div");
        habitDiv.id = `habit-${habit.id}`;
        habitDiv.classList.add("habit-progress");
        progresDiv.appendChild(habitDiv);

        for (let i = 0; i <= visibleDays; i++) {
            const div = document.createElement("div");
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            if (date > currentDate) {
                break;
            }

            const day = date.getDate().toString().padStart(2, "0");
            const month = (date.getMonth() + 1).toString().padStart(2, "0");
            const year = date.getFullYear();
            const isToday = date.toDateString() === currentDate.toDateString();

            div.id = `${year}-${month}-${day}-${currentHabitId}`;
            divId = `${year}-${month}-${day}-${currentHabitId}`;
            if (isToday) {
                div.classList.add("today");
                div.addEventListener("click", () => {
                    markHabitComplete(currentHabitId, div);
                    //update(div);
                });
            }
            habitDiv.appendChild(div);
        }
        fetchProgress(currentHabitId);
    });
    // Populate the habit div with the calendar days
}

// Fetch habit progress
async function fetchProgress(currentHabitId) {
    const response = await fetch(`/habit/habits/${currentHabitId}`);
    const habitProgress = await response.json();
    const prog = habitProgress.progress;
    prog.forEach((progress) => {
        if (progress.completed) {
            const date = progress.date;
            const divId = `${date}-${currentHabitId}`;
            const div = document.getElementById(divId);
            if (div) {
                div.classList.add("completed"); // Mark as completed
            }
        }
    });
}

// Check habit status (mock behavior)
function checkHabitStatus(date) {
    return date.getDate() % 2 !== 0; // Mock: Habit completed on odd days
}

// Resize handling
window.addEventListener("resize", adjustVisibleDays);

// Button functionality
prevBtn.addEventListener("click", () => {
    const currentDate = new Date();
    const lastDisplayedDate = new Date();
    lastDisplayedDate.setDate(currentDate.getDate() - (365 - currentOffset + visibleDays));

    if (lastDisplayedDate.toDateString() !== currentDate.toDateString()) {
        currentOffset += visibleDays;
        createCalendar();
        habitProgress();
    }
});

nextBtn.addEventListener("click", () => {
    if (currentOffset > 0) {
        currentOffset -= visibleDays;
        createCalendar();
        habitProgress();
    }
});

async function markHabitComplete(habitId, div) {
    try {
        const fetchResponse = await fetch(`/habit/habits/${habitId}`);
        const fetched = await fetchResponse.json();

        const date = new Date();
        const newDate = date.toISOString().split("T")[0]; // Today's date

        let useMethod, url, completed;

        if (fetched.progress.length > 0 && fetched.progress[0].date === newDate) {
            // Check if progress for today already exists
            useMethod = "PUT";
            url = `habit/progress/${fetched.progress[0].id}`;
            completed = !fetched.progress[0].completed;
        } else {
            useMethod = "POST";
            url = `habit/progress/`;
            completed = true;
        }

        const csrfToken = document.querySelector("[name=csrfmiddlewaretoken]").value;
        const requestBody = {
            habit: habitId,
            date: newDate, // Today's date
            completed: completed,
        };

        const response = await fetch(url, {
            method: useMethod,
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken,
            },
            body: JSON.stringify(requestBody),
        });

        if (response.ok) {
            // Toggle the completed state visually
            if (completed) {
                div.classList.add("completed");
            } else {
                div.classList.remove("completed");
            }
            fetchStreakCount();
        } else {
            const errorText = await response.text();
            console.error("Failed to update Habit Progress:", errorText);
            alert("Failed to update Habit Progress. Please try after some time.");
        }
    } catch (error) {
        console.error("Error updating habit progress:", error);
        alert("An error occurred. Please try again later.");
    }
}

// Initial setup
adjustVisibleDays();

fetchHabits();

fetchStreakCount();
