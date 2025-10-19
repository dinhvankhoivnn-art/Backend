"use strict";

const form = document.querySelector("form");
let message = document.querySelector("#message");
const handleSubmit = async (event) => {
  event.preventDefault();
  // ! lấy dữ liệu từ form
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  console.log(`dữ liệu form:  ${JSON.stringify(data)}`);
  try {
    // gửi yêu cầu POST /login
    const res = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    console.log(`Chờ kết quả từ server : ${result}`);
    // ! thông báo
    if (res.ok) {
      message.textContent = result.message || "Đăng nhập thành công !";
      message.style.color = "green";
      //   ! lấy token trong response
      if (result.token) {
        //   ! lưu token trong localstorage
        localStorage.setItem("token", result.token);
      }
      await fetchData();
    } else {
      message.textContent = result.message || "Đăng nhập thất bại !";
      message.style.color = "red";
    }
  } catch (error) {
    console.log(error);
    message.textContent = error.message || "Đăng nhập thất bại !";
    message.style.color = "red";
  }
};
// ! hàm fetchData

const fetchData = async () => {
  try {
    const res = await fetch("/lucky", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      credentials: "include",
    });
    const result = await res.json();
    console.log(`Chờ kết quả từ server : ${result}`);
    // ! thong bao
    if (res.ok) {
      message.textContent = `Số mai mắn: ${result.data}` || "Lucky number";
      message.style.color = "green";
    } else {
      message.textContent = result.message || "Lucky number";
      message.style.color = "red";
    }
  } catch (error) {
    console.log("Lỗi " + error);
    message.textContent = error.message || "Lỗi !";
    message.style.color = "red";
  }
};

form.addEventListener("submit", handleSubmit);
