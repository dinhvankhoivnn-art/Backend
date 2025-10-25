// todo: shema Bootcamp

const mongoose = require("mongoose");

const BootcampSchema = new mongoose.Schema(
  {
    name: {
      type: String, //? kiểu dữ liệu
      required: [true, "Vui lòng thêm tên bootcamp"], //?  bắt buộc nhập tên
      unique: true, // ? tính duy nhất
      trim: true, //? xoá khoảng trắng
      maxLength: [50, "Tên bootcamp không được quá 50 ký tự"], //? quá 50 ký tự
    },
    slug: String, //?  thuộc tính tuỳ chọn
    description: {
      type: String, //? kiểu dữ liệu
      required: [true, "Vui lòng thêm mô tả bootcamp"], //?  bắt buộc nhập tên
      unique: true, // ? tính duy nhất
      trim: true, //? xoá khoảng trắng
      maxLength: [500, "Mô tả bootcamp không được quá 500 ký tự"], //? quá 500 ký tự
    },
    website: {
      type: String, //? kiểu dữ liệu
      match: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
        "Please use a valid URL with HTTP or HTTPS",
      ], //! xác thực url
    },
    phone: {
      type: String, //? kiểu dữ liệu
      maxLength: [20, "Phone number not more than 20 digits"],
    },
    email: {
      type: String, //? kiểu dữ liệu
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ], //! xác thực email
    },
    address: {
      type: String,
      required: [true, "Thêm địa chỉ "],
    },
    location: {
      // todo: GeoJSON Point
      type: {
        //! định nghĩa type
        type: String, // ? kiểu dữ liệu
        enum: ["Point"], // ? chiều dữ liệu
        required: true, // ? bắt buộc
      },
      coordinates: {
        type: [Number], // ? chiều dữ liệu
        required: true, // ? bắt buộc
        index: "2dsphere", // ? sử dụng index
      },
      //   todo: dữ liệu options
      formattedAddress: String,
      street: String,
      city: String,
      state: String,
      zipcode: String,
      country: String,
    },
    careers: {
      // ! array of string
      type: [String],
      required: true,
      enum: [
        "Web Development",
        "Mobile Development",
        "UI/UX",
        "Data Science",
        "Business",
        "Other",
      ],
    },
    averageRating: {
      type: Number,
      min: [1, "Chỉ số đánh giá nhỏ nhất 1"],
      max: [10, "Chỉ số đánh giá lớn nhất 10"],
    },
    averageCost: Number,
    photo: {
      type: String,
      default: "no-photo.jpg",
    },
    housing: {
      type: Boolean,
      default: false,
    },
    jobAssistance: {
      type: Boolean,
      default: false,
    },
    jobGuarantee: {
      type: Boolean,
      default: false,
    },
    acceptGi: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now, //? tự động tạo ngày tạo
    },
  },
  {
    timestamps: true, //? tạo ngày tạo, ngày cap nhật
  }
);

const Bootcamp = mongoose.model("Bootcamp", BootcampSchema);

module.exports = Bootcamp;
