// ------------------ ↓ GLOBAL VARIABLES (ALLOWED TO BE USED IN EVERY FUNCTION ONWARDS) ↓ ------------------

const URL = "https://to-do-app-25-4-1c3p.onrender.com";
const taskForm = document.getElementById("taskForm");
const toDoList = document.getElementById("toDoList");
const completedList = document.getElementById("completedList");



// ----------------------------------------- ↓ GENERAL FUNCTIONS ↓ -----------------------------------------

function resetForm() {
  taskForm.reset();
}


// ----------------------------- ↓ GENERAL EVENT LISTENERS (TRIGGERS) ↓ ------------------------------------

const sortButton = document.getElementById("sortSelect");

window.addEventListener("DOMContentLoaded", () => {
  sortButton.value = "default";
});

sortButton.addEventListener("change", () => {
  displayTasks();
})

window.addEventListener("DOMContentLoaded", () => {
  displayTasks();
});



// ----------------------------- ↓ EVENT LISTENERS (TRIGGERS) FOR TASKS ↓ ----------------------------------

// To create a task
taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  createNewTask();
});


// To complete the task
toDoList.addEventListener("click", (event) => {
  if (event.target.classList.contains("done")) {

    const taskId = event.target.getAttribute("data-id");
    completeTask(taskId);
  }
});


// To make the task NOT complete
completedList.addEventListener("click", (event) => {
  if (event.target.classList.contains("notDone")) {

    const taskId = event.target.getAttribute("data-id");
    taskNotCompleted(taskId);
  }
});


// To delete a task
[toDoList, completedList].forEach(list => {
  list.addEventListener("click", (event) => {
    if (event.target.classList.contains("delete")) {

      const taskId = event.target.getAttribute("data-id");
      deleteTask(taskId);
    }
  })
});


// To edit the task
toDoList.addEventListener("click", (event) => {
  if (event.target.classList.contains("edit")) {

    const taskId = event.target.getAttribute("data-id");
    const taskTitle = event.target.getAttribute("data-title");
    const taskDescription = event.target.getAttribute("data-description");
    const taskDueDate = new Date(event.target.getAttribute("data-due-date"));

    const editTaskName = document.getElementById("editTaskName");
    const editTaskDescription = document.getElementById("editTaskDescription");
    const editDueDate = document.getElementById("editDueDate");
    const saveChangesButton = document.getElementById("saveChangesButton");

    editTaskName.value = taskTitle;
    editTaskDescription.value = taskDescription;

    // This is to convert the date format back to the ISO 8601 standard so that is able to be read by <input type="date">
    const formattedDueDate = taskDueDate.toISOString().split("T")[0];
    editDueDate.value = formattedDueDate;

    saveChangesButton.addEventListener("click", async () => {
      await editTask(taskId);

      const editTaskModal = bootstrap.Modal.getInstance(document.getElementById("editTaskWindow"));
      editTaskModal.hide();
    }, { once: true });
  }
})



// ------------------------------------------ ↓ TASK FUNCTIONS ↓ -------------------------------------------


async function displayTasks() {
  try {

    const sortSelect = document.getElementById("sortSelect");
    const sortBy = sortSelect.value; // Due date - Date created - default

    let query = "";
    if (sortBy !== "default") {
      query = `?sortBy=${sortBy}`;
    }

    const response = await fetch(`${URL}/tasks${query}`);

    if (!response.ok) {
      throw new Error(`Failed to get tasks: ${response.status}`)
    }

    const data = await response.json();

    function formatTask(task) {
      const li = document.createElement("li");
      li.classList.add("p-3", "shadow-sm", "mt-2", "card");
      li.innerHTML = task.completed ? 
      `
      <div class="d-flex justify-content-between align-items-center">
        <h4 class="col-11 text-decoration-line-through opacity-50">${task.title}</h4>
        <button data-id="${task._id}" type="button" class="btn-close delete" aria-label="Close"></button>
      </div>
      <p class="text-decoration-line-through opacity-50">${task.description}</p>
      <p class="text-decoration-line-through opacity-50"><strong>Due: </strong>${new Date(task.dueDate).toLocaleDateString()}</p>
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <button data-id="${task._id}" class="btn btn-secondary shadow-sm notDone" type="button">Not done</button>
        </div>
        <p class="m-0 text-decoration-line-through opacity-50"><strong>Created on: </strong>${new Date(task.createdOn).toLocaleDateString()}</p>
      </div>
      `
      :
      `
      <div class="d-flex justify-content-between align-items-center">
        <h4 class="col-11">${task.title}</h4>
        <button data-id="${task._id}" type="button" class="btn-close delete" aria-label="Close"></button>
      </div>
      <p>${task.description}</p>
      <p><strong>Due: </strong>${new Date(task.dueDate).toLocaleDateString()}</p>
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <button data-bs-toggle="modal" data-bs-target="#editTaskWindow" data-id="${task._id}" data-title="${task.title}" data-description="${task.description}" data-due-date="${task.dueDate}" class="btn btn-secondary shadow-sm edit" type="button">Edit</button>
          <button data-id="${task._id}" class="btn btn-secondary shadow-sm done" type="button">Done</button>
        </div>
          <p class="m-0"><strong>Created on: </strong>${new Date(task.createdOn).toLocaleDateString()}</p>
      </div>
      `;
      return li;
    }

    // Wipes column data to prevent double ups
    toDoList.innerHTML = "";
    completedList.innerHTML = "";

    const tasks = data;

    tasks.forEach(task => {
      task.completed ? completedList.appendChild(formatTask(task)) : toDoList.appendChild(formatTask(task));
    });

    // Resets the "Create New Task" form
    resetForm();
    
  } catch (error) {
    console.error("Error:", error);
  }
}



async function createNewTask() {
  try {
    const taskDetails = {
      title: document.getElementById("taskName").value.trim(),
      description: document.getElementById("taskDescription").value.trim(),
      dueDate: document.getElementById("dueDate").value
    };

    const response = await fetch(`${URL}/tasks/todo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }, 
      body: JSON.stringify(taskDetails)
    });

    if (!response.ok) {
      throw new Error(`Failed to create a new task: ${response.status}`)
    }

    const data = await response.json();
    console.log("New task created:", data);
    displayTasks();

  } catch (error) {
    console.error("Error:", error);
  }
}



async function completeTask(id) {
  try {
    const response = await fetch(`${URL}/tasks/complete/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ completed: true })
    });

    if (!response.ok) {
      throw new Error(`Failed to complete task: ${response.status}`);
    }

    const data = await response.json();
    console.log("Task completed", data);
    displayTasks();

  } catch (error) {
    console.error("Error:", error);
  }
}



async function taskNotCompleted(id) {
    try {
      const response = await fetch(`${URL}/tasks/notComplete/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ completed: false })
    });

    if (!response.ok) {
      throw new Error(`Failed to set task to 'not complete': ${response.status}`);
    }

    const data = await response.json();
    console.log("Task is set to 'not complete'", data);
    displayTasks();

  } catch (error) {
    console.error("Error:", error);
  }
}



async function deleteTask(id) {
  try {
    const response = await fetch(`${URL}/tasks/delete/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete task! ${response.status}`);
    }

    const data = await response.json();
    console.log({ message: "Deleted task", task: data });
    displayTasks();
    
  } catch (error) {
    console.error("Error:", error);
  }
}



async function editTask(id) {
  try {
    const updatedDetails = {
      title: document.getElementById("editTaskName").value.trim(),
      description: document.getElementById("editTaskDescription").value.trim(),
      dueDate: document.getElementById('editDueDate').value
    };

    const response = await fetch(`${URL}/tasks/update/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updatedDetails)
    });

    if (!response.ok) {
      throw new Error(`Failed to edit task: ${response.status}`);
    }

    const data = await response.json();
    console.log("Edited task:", data);
    displayTasks();
    
  } catch (error) {
    console.error("Error:", error);
  }
}