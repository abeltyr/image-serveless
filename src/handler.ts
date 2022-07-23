import * as serverless from "serverless-http";
import * as express from "express";
import * as multer from "multer";
import * as sharp from "sharp";
import * as bodyParser from "body-parser";
import * as fs from "fs";
import * as path from "path";
import * as cors from "cors";
import axios from "axios";

const app = express();

const upload = multer({
  storage: multer.memoryStorage(),
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.put("/upload", upload.single("fileData"), async (req: any, res) => {
  try {
    // console.log("formattedFile", formattedFile._final.);

    if (!req.file)
      return res.json({
        Status: "NOtOK",
        Message: "fileData is a required Field",
      });

    if (!req.body && !req.body.putSignedUrl)
      return res.json({
        Status: "NOtOK",
        Message: "putSignedUrl is a required Field",
      });

    if (req.file.mimetype.includes("image")) {
      let formattedFile = await sharp(req.file.buffer)
        .resize({ width: 1000, height: 1000 })
        .toBuffer();

      let uploadImage = await axios({
        method: "put",
        url: req.body.putSignedUrl,
        data: formattedFile,
        headers: {
          "Content-Type": "image/jpg",
        },
      });
    }
    // console.log("uploadImage", uploadImage.status);
    res.json({ status: "OK", message: "File Upload" });
  } catch (e) {
    console.log(e);
    res.json({ status: "NotOk", message: e });
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

module.exports.handler = serverless(app);
