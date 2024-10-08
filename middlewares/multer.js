import multer from "multer";

const multerUpload= multer({
  limits: {
    fileSize: 1024 * 1024 * 500
  }
})

const singleAvatar = multerUpload.single("profile");
const singleFile = multerUpload.single("file");
const AnyFile = multerUpload.any()

export { singleAvatar, singleFile,AnyFile }