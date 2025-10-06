const sayHiName = (name = "Admin") => {
  if (!name) {
    console.log(`chưa có người dùng`);
    return name;
  } else {
    console.log(`chào mừng user ${name}`);
    return `chào mừng user ${name}`;
  }
};

module.exports = sayHiName;
