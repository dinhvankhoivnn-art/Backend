const global = {
  url: "http://localhost:1000/api/v1/tasks",
};

const form = document.querySelector("#form_post");

/**
 * Asynchronous function to fetch tasks from an API endpoint
 *
 * This function makes a GET request to the API endpoint at the global URL.
 * If the request is successful, it returns a promise that resolves with the fetched data.
 * If the request fails, it throws an error.
 * @returns {Promise} - Returns a promise that resolves with the fetched data
 * @throws {Error} - Throws an error if the API request fails
 */
const fetchTasks = async () => {
  try {
    // Make a request to the global URL endpoint
    const res = await fetch(global.url);
    if (!res.ok) throw new Error("Lỗi kết nối API");
    const data = await res.json();
    return data;
  } catch (error) {
    throw new Error("Lỗi kết nối API: " + error);
  }
};

/**
 * Format a given date string into a human-readable format.
 *
 * This function takes a date string as an argument and returns a formatted string
 * in the format "DD/MM/YYYY HH:MM:SS".
 *
 * @param {string} dateString - The date string to be formatted
 * @returns {string} - The formatted date string
 */
function formatDate(dateString) {
  // Create a new date object from the given date string
  const date = new Date(dateString);

  // Get the year, month, day, hours, minutes and seconds from the date object
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  // Format the date string into the desired format
  const formattedDate = `${day}/${month}/${year} : ${hours}:${minutes}:${seconds}`;

  // Return the formatted date string
  return formattedDate;
}
/**
 * Hiển thị đơn task
 * @param {object} task - Task object to be displayed
 */
const newTaskContent = (task) => {
  // Create list item
  const li = document.createElement("li");
  li.className = "list-group-item d-flex justify-content-between";
  li.id = task._id;
  li.title = `Thời gian tạo nội dung: ${formatDate(task.createdAt)}`;

  // Create task name span
  const nameSpan = document.createElement("span");
  nameSpan.textContent = task.name;

  // Create buttons container
  const buttonsSpan = document.createElement("span");

  // Create Edit button
  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.id = `edit_${task._id}`;
  editButton.className = "btn btn-warning btn-sm";
  editButton.setAttribute("data-bs-toggle", "modal");
  editButton.setAttribute("data-bs-target", `#modal_edit_${task._id}`);
  editButton.textContent = "Edit";

  // Create Delete button
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.id = `delete_${task._id}`;
  deleteButton.className = "btn btn-danger btn-sm";
  deleteButton.setAttribute("data-bs-toggle", "modal");
  deleteButton.setAttribute("data-bs-target", `#modal_delete_${task._id}`);
  deleteButton.textContent = "Delete";

  // Append buttons to buttons container
  buttonsSpan.appendChild(editButton);
  buttonsSpan.appendChild(deleteButton);

  // Create Edit Modal
  const editModal = document.createElement("div");
  editModal.className = "modal fade";
  editModal.id = `modal_edit_${task._id}`;
  editModal.tabIndex = -1;
  editModal.setAttribute("aria-labelledby", `modal_editLabel_${task._id}`);
  editModal.setAttribute("aria-hidden", "true");

  const editModalDialog = document.createElement("div");
  editModalDialog.className = "modal-dialog modal-dialog-centered modal-lg";
  const editModalContent = document.createElement("div");
  editModalContent.className = "modal-content";

  // Edit Modal Header
  const editModalHeader = document.createElement("div");
  editModalHeader.className = "modal-header";
  const editModalTitle = document.createElement("h5");
  editModalTitle.className = "modal-title";
  editModalTitle.id = `modal_editLabel_${task._id}`;
  editModalTitle.textContent = "Hộp thoại cập nhật";
  const editModalClose = document.createElement("button");
  editModalClose.type = "button";
  editModalClose.className = "btn-close";
  editModalClose.setAttribute("data-bs-dismiss", "modal");
  editModalClose.setAttribute("aria-label", "Close");

  editModalHeader.appendChild(editModalTitle);
  editModalHeader.appendChild(editModalClose);

  // Edit Modal Body
  const editModalBody = document.createElement("div");
  editModalBody.className = "modal-body";
  const editForm = document.createElement("form");
  editForm.className = "was-validated";

  const editInput = document.createElement("input");
  editInput.type = "text";
  editInput.className = "form-control w-100";
  editInput.id = `text_${task._id}`;
  editInput.value = task.name;
  editInput.name = "text";
  editInput.placeholder = "Nhập nội dung";
  editInput.required = true;
  editInput.setAttribute("aria-describedby", "textHelp");

  const editFormCheck = document.createElement("div");
  editFormCheck.className = "form-check my-3";
  const editCheckbox = document.createElement("input");
  editCheckbox.className = "form-check-input";
  editCheckbox.type = "checkbox";
  editCheckbox.id = `checked_${task._id}`;
  if (task.completed) editCheckbox.checked = true;
  const editCheckboxLabel = document.createElement("label");
  editCheckboxLabel.className = "form-check-label";
  editCheckboxLabel.htmlFor = `checked_${task._id}`;
  editCheckboxLabel.textContent = "Xác nhận đã update";

  const updateButton = document.createElement("button");
  updateButton.type = "button";
  updateButton.className = "btn btn-primary";
  updateButton.id = `is_updated_${task._id}`;
  updateButton.textContent = "Thay đổi cập nhật";

  editFormCheck.appendChild(editCheckbox);
  editFormCheck.appendChild(editCheckboxLabel);
  editForm.appendChild(editInput);
  editForm.appendChild(editFormCheck);
  editForm.appendChild(updateButton);
  editModalBody.appendChild(editForm);

  // Edit Modal Footer
  const editModalFooter = document.createElement("div");
  editModalFooter.className = "modal-footer";
  const editCancelButton = document.createElement("button");
  editCancelButton.type = "button";
  editCancelButton.className = "btn btn-secondary";
  editCancelButton.setAttribute("data-bs-dismiss", "modal");
  editCancelButton.textContent = "Hủy";
  editModalFooter.appendChild(editCancelButton);

  editModalContent.appendChild(editModalHeader);
  editModalContent.appendChild(editModalBody);
  editModalContent.appendChild(editModalFooter);
  editModalDialog.appendChild(editModalContent);
  editModal.appendChild(editModalDialog);

  // Create Delete Modal
  const deleteModal = document.createElement("div");
  deleteModal.className = "modal fade";
  deleteModal.id = `modal_delete_${task._id}`;
  deleteModal.tabIndex = -1;
  deleteModal.setAttribute("aria-labelledby", `modal_deleteLabel_${task._id}`);
  deleteModal.setAttribute("aria-hidden", "true");

  const deleteModalDialog = document.createElement("div");
  deleteModalDialog.className = "modal-dialog modal-sm";
  const deleteModalContent = document.createElement("div");
  deleteModalContent.className = "modal-content";

  // Delete Modal Header
  const deleteModalHeader = document.createElement("div");
  deleteModalHeader.className = "modal-header";
  const deleteModalTitle = document.createElement("h5");
  deleteModalTitle.className = "modal-title";
  deleteModalTitle.id = `modal_deleteLabel_${task._id}`;
  deleteModalTitle.textContent = "Xác nhận xóa Task";
  const deleteModalClose = document.createElement("button");
  deleteModalClose.type = "button";
  deleteModalClose.className = "btn-close";
  deleteModalClose.setAttribute("data-bs-dismiss", "modal");
  deleteModalClose.setAttribute("aria-label", "Close");

  deleteModalHeader.appendChild(deleteModalTitle);
  deleteModalHeader.appendChild(deleteModalClose);

  // Delete Modal Body
  const deleteModalBody = document.createElement("div");
  deleteModalBody.className = "modal-body";
  const deleteWarning = document.createElement("h5");
  deleteWarning.className = "text-center fw-bold text-danger";
  deleteWarning.textContent = "Bạn muốn xóa task";
  const deleteTaskName = document.createElement("p");
  deleteTaskName.textContent = task.name;
  const deleteSpan = document.createElement("span");
  deleteSpan.appendChild(deleteTaskName);
  deleteModalBody.appendChild(deleteWarning);
  deleteModalBody.appendChild(deleteSpan);

  // Delete Modal Footer
  const deleteModalFooter = document.createElement("div");
  deleteModalFooter.className = "modal-footer";
  const deleteCancelButton = document.createElement("button");
  deleteCancelButton.type = "button";
  deleteCancelButton.className = "btn btn-secondary";
  deleteCancelButton.setAttribute("data-bs-dismiss", "modal");
  deleteCancelButton.textContent = "Hủy";
  const confirmDeleteButton = document.createElement("button");
  confirmDeleteButton.type = "button";
  confirmDeleteButton.className = "btn btn-danger";
  confirmDeleteButton.id = `is_deleted_${task._id}`;
  confirmDeleteButton.textContent = "Xác nhận xóa";

  deleteModalFooter.appendChild(deleteCancelButton);
  deleteModalFooter.appendChild(confirmDeleteButton);

  deleteModalContent.appendChild(deleteModalHeader);
  deleteModalContent.appendChild(deleteModalBody);
  deleteModalContent.appendChild(deleteModalFooter);
  deleteModalDialog.appendChild(deleteModalContent);
  deleteModal.appendChild(deleteModalDialog);

  // Append all elements to list item
  li.appendChild(nameSpan);
  li.appendChild(buttonsSpan);
  li.appendChild(editModal);
  li.appendChild(deleteModal);

  // Append list item to ul
  const ul = document.querySelector("ul");
  ul.appendChild(li);

  /**
   * Event handler for delete and update actions
   * @param {Event} e - The event object
   */
  const handleClick = async (e) => {
    // Check if the target element is a delete button
    if (e.target.id.startsWith("is_deleted")) {
      const id = e.target.id.split("_")[2];

      try {
        // Delete the task
        await deleteTask(id);
      } catch (error) {
        throw new Error(`Error deleting task with ID ${id}: ${error}`);
      }
    }

    // Check if the target element is an update button
    if (e.target.id.startsWith("is_updated")) {
      const id = e.target.id.split("_")[2];

      try {
        // Update the task
        await updatedTaskForID(id);
      } catch (error) {
        throw new Error(`Error updating task with ID ${id}: ${error}`);
      }
    }
  };

  ul.addEventListener("click", handleClick);
};
/**
 * Update a task by its ID
 * @param {string} id - The ID of the task to update
 * @returns {Promise<void>} - A promise that resolves when the task is updated successfully
 * @throws {Error} - An error if the update request fails
 */
const updatedTaskForID = async (id) => {
  try {
    // Select the form within the modal
    const form = document.querySelector(`#modal_edit_${id} form`);
    const textInput = form.querySelector(`#text_${id}`);
    const checkbox = form.querySelector(`#checked_${id}`);

    // Get the updated data from the form
    const updatedData = {
      name: textInput.value,
      completed: checkbox.checked,
    };

    // Send a PUT request to the API
    const res = await fetch(`${global.url}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedData),
    });

    if (!res.ok) throw new Error("Failed to update task");

    const data = await res.json();

    // Close the modal and reload the page
    closeModalEdit(id);
    reloadPage();
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
};

/**
 * Reload the page
 * @returns {void} - Nothing is returned
 */
const reloadPage = () => {
  // Reload the page to reflect the changes made
  window.location.reload();
};

/**
 * Close the edit modal
 * @param {string} id - The ID of the task
 * @returns {void} - Nothing is returned
 */
const closeModalEdit = (id) => {
  /**
   * Get the modal element from the DOM
   * @returns {Element} The modal element
   */
  const getModal = () => document.querySelector(`#modal_edit_${id}`);

  /**
   * Get the bootstrap modal instance from the modal element
   * @returns {bootstrap.Modal} The bootstrap modal instance
   */
  const getModalInstance = (modal) => new bootstrap.Modal(modal);

  // Get the modal element and the bootstrap modal instance
  const modal = getModal();
  const bsModal = getModalInstance(modal);

  // Hide the modal
  bsModal.hide();
};

// Đóng modal delete
const closeModalDelete = (id) => {
  const modal = document.querySelector(`#modal_delete_${id}`);
  const bsModal = new bootstrap.Modal(modal);
  bsModal.hide();
};

/**
 * Xóa task theo ID
 * @param {string} id - ID của task cần xóa
 * @returns {Promise<void>} - Promise that resolves when the task is deleted successfully
 * @throws {Error} - Error if the delete request fails
 */
const deleteTask = async (id) => {
  try {
    // Gửi yêu cầu DELETE đến API endpoint
    const res = await fetch(`${global.url}/${id}`, {
      method: "DELETE",
    });

    // Kiểm tra xem có lỗi không
    if (!res.ok) throw new Error("Lỗi khi gửi request DELETE");

    // Nhận dữ liệu trả về từ API
    const data = await res.json();

    // Đóng modal delete
    closeModalDelete(id);

    // Reload lại trang
    reloadPage();
  } catch (error) {
    console.error("Lỗi xóa task:", error);
    throw error;
  }
};

/**
 * Thêm dữ liệu task
 * @param {Event} e - The event object
 * @returns {Promise<void>} - Promise that resolves when the task is posted successfully
 * @throws {Error} - Error if the post request fails
 */
const postTask = async (e) => {
  e.preventDefault();

  // Lấy dữ liệu từ form và chuyển thành object
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  // Tạo object dữ liệu task
  const objectData = {
    name: data.text,
    completed: true,
  };

  // Gửi yêu cầu POST đến API endpoint
  try {
    const res = await fetch(global.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(objectData),
    });
    if (!res.ok) throw new Error("Lỗi Post");

    // Nhận dữ liệu trả về từ API
    const data = await res.json();
    reloadPage();
  } catch (error) {
    throw new Error("Lỗi Post " + error);
  }
};

// Gắn sự kiện submit cho form
if (form) {
  form.addEventListener("submit", postTask);
} else {
  console.error("Không tìm thấy form #form_post");
}

/**
 * Render danh sách tasks lên client
 * @returns {Promise<void>} - A promise that resolves when the tasks are rendered successfully
 * @throws {Error} - An error if the render request fails
 */
const renderTasks = async () => {
  try {
    // Gửi yêu cầu GET đến API endpoint
    const { data } = await fetchTasks();

    // Lấy thẻ ul
    let ul = document.querySelector("ul");
    if (!ul) {
      console.error("Không tìm thấy thẻ ul");
      return;
    }

    // Làm sạch thẻ ul
    ul.innerHTML = "";

    // Duyệt qua mảng dữ liệu tasks
    data.forEach((task) => {
      // Gọi hàm newTaskContent để hiển thị nội dung task
      newTaskContent(task);
    });
  } catch (error) {
    console.error("Lỗi render danh sách tasks:", error);
    alert("Lỗi khi tải danh sách tasks: " + error.message);
  }
};

renderTasks();
