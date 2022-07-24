import * as serverless from "serverless-http";
import * as express from "express";
import * as multer from "multer";
import * as sharp from "sharp";
import * as bodyParser from "body-parser";
import * as sizeOf from "buffer-image-size";
import * as cors from "cors";
import axios from "axios";

const app = express();

const upload = multer({
  storage: multer.memoryStorage(),
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.put("/uploadImage", upload.single("file"), async (req: any, res) => {
  try {
    let { signedUrl } = req.body;
    let file = req.file;

    // Validate the input fields

    if (!signedUrl)
      return res.json({
        Status: "Failed",
        Message: "Input Issue: The field signedUrl is a required.",
      });

    if (!file)
      return res.json({
        Status: "Failed",
        Message: "Input Issue: The field file is a required.",
      });

    if (!file.mimetype.includes("image"))
      return res.json({
        Status: "Failed",
        Message: "Input Issue: Only images are accepted for the file field",
      });

    if (!file.buffer)
      return res.status(500).json({
        Status: "Failed",
        Message: "Internal Issue: File buffer not found",
      });

    const uploadDetail = sizeOf(file.buffer);

    let uploadBuffer = file.buffer;

    // Formate the image to fit the with the following standard
    // width: 1000px, and height: 1000px, type: jpg

    if (uploadDetail.width > 1000)
      uploadBuffer = await sharp(uploadBuffer)
        .resize({ width: 1000 })
        .toBuffer();

    if (uploadDetail.height > 1000)
      uploadBuffer = await sharp(uploadBuffer)
        .resize({ height: 1000 })
        .toBuffer();

    if (uploadDetail.type !== "jpg")
      uploadBuffer = await sharp(uploadBuffer).toFormat("jpg").toBuffer();

    // Upload the formatted file to s3

    await axios({
      method: "put",
      url: signedUrl,
      data: uploadBuffer,
      headers: {
        "Content-Type": "image/jpg",
      },
    });

    res.json({
      status: "Successful",
      message: "File Uploaded",
    });
  } catch (e) {
    console.log(e);
    res.json({ status: "Failed", message: e });
  }
});

app.put("/uploadAudio", upload.single("file"), async (req: any, res) => {
  try {
    let { signedUrl } = req.body;
    let file = req.file;

    // Validate the input fields

    if (!signedUrl)
      return res.json({
        Status: "Failed",
        Message: "Input Issue: The field signedUrl is a required.",
      });

    if (!file)
      return res.json({
        Status: "Failed",
        Message: "Input Issue: The field file is a required.",
      });

    if (!file.mimetype.includes("audio"))
      return res.json({
        Status: "Failed",
        Message: "Input Issue: Only Audio are accepted for the file field",
      });

    if (!file.buffer)
      return res.status(500).json({
        Status: "Failed",
        Message: "Internal Issue: File buffer not found",
      });

    let uploadBuffer = file.buffer;
    // Upload the formatted file to s3

    await axios({
      method: "put",
      url: signedUrl,
      data: uploadBuffer,
      headers: {
        "Content-Type": "audio/mp3",
      },
    });

    res.json({
      status: "Successful",
      message: "File Uploaded",
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ status: "Failed", message: e });
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    Status: "Error",
    Message: "Route Issue: Given route doesn't exist",
  });
});

module.exports.handler = serverless(app);
