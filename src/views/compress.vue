<template>
  <div class="compress-box">
    <div class="left">
      <div
        class="el-upload"
        @dragover.prevent
        @drop.prevent="handleDrop"
        @click="handleClick"
      >
        <div class="el-upload-dragger">
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        </div>
      </div>
      <div>
        <div>
          <h3>文件类型</h3>
          <el-checkbox-group v-model="filters">
            <el-checkbox label=".PNG"></el-checkbox>
            <el-checkbox label=".JPG"></el-checkbox>
            <el-checkbox label=".JPEG"></el-checkbox>
            <el-checkbox label=".GIF"></el-checkbox>
          </el-checkbox-group>
        </div>
        <div>
          <h3>文件大小</h3>
          <el-slider
            v-model="limit"
            range
            :min="5"
            :max="2000"
            :format-tooltip="formatTooltip"
          >
          </el-slider>
        </div>
        <div>
          <h3>排除文件夹</h3>
          <el-checkbox-group v-model="excludes">
            <el-checkbox class="mb-10" label=".git"></el-checkbox>
            <el-checkbox class="mb-10" label=".DS_Store"></el-checkbox>
            <el-checkbox class="mb-10" label="node_modules"></el-checkbox>
            <el-checkbox class="mb-10" label="dist"></el-checkbox>
            <el-checkbox class="mb-10" label="nativeplugins"></el-checkbox>
            <el-checkbox class="mb-10" label="unpackage"></el-checkbox>
            <el-checkbox class="mb-10" label="dist_electron"></el-checkbox>
          </el-checkbox-group>
        </div>
      </div>
    </div>
    <div class="right">
      <div class="mb-10">
        <el-button type="info" size="mini" @click="handleClear">
          清空数据
        </el-button>
        <el-button type="primary" size="mini" @click="compressAll">
          一键压缩
        </el-button>
      </div>
      <div class="table-container">
        <div class="table-box">
          <el-table
            :data="images"
            border
            size="mini"
            style="width: 100%;height: 100%;"
          >
            <el-table-column
              label="序号"
              align="center"
              type="index"
              width="50"
            ></el-table-column>
            <el-table-column label="图片路径" prop="filePath"></el-table-column>
            <el-table-column label="压缩前大小" align="center" width="100">
              <template slot-scope="scope">
                <span>{{ scope.row.fileSize | formatSize }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" align="center" width="120">
              <template slot-scope="scope">
                <span>{{ scope.row.status | formatStatus }}</span>
              </template>
            </el-table-column>

            <el-table-column label="压缩后大小" align="center" width="100">
              <template slot-scope="scope">
                <span>{{ scope.row.cutSize | formatSize }}</span>
              </template>
            </el-table-column>

            <el-table-column label="压缩比例" align="center" width="80">
              <template slot-scope="scope">
                <span>{{ scope.row.ratio || "" }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template slot-scope="scope">
                <el-button @click="compressImage(scope.row)" type="text">
                  重新压缩
                </el-button>
                <el-button @click="compressImage(scope.row)" type="text">
                  预览
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const { dialog } = window.require("electron").remote;
const path = window.require("path");
const fs = window.require("fs");
const https = window.require("https");
const { URL } = window.require("url");
import { iteratorDir } from "@/common/utils";
const options = {
  method: "POST",
  hostname: "tinypng.com",
  path: "/web/shrink",
  headers: {
    rejectUnauthorized: false,
    "Postman-Token": Date.now(),
    "Cache-Control": "no-cache",
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36",
  },
};
export default {
  data() {
    return {
      excludes: [".DS_Store", "dist", "node_modules", "dist_electron"],
      filters: [".PNG", ".JPG", ".JPEG"],
      limit: [20, 1000],
      images: [],
      loading: false,
    };
  },
  filters: {
    formatSize(val) {
      if (!val) return "";
      val = parseFloat((val / 1000).toFixed(1));
      if (val < 1000) {
        return val + "KB";
      } else if (val) {
        return parseFloat((val / 1000).toFixed(1)) + "MB";
      }
    },
    formatStatus(val) {
      switch (val) {
        case "wait":
          return "等待中";
        case "loading":
          return "压缩中";
        case "success":
          return "压缩成功";
        case "fail":
          return "压缩失败";
      }
      return val;
    },
  },
  methods: {
    handleDrop(e) {
      const files = e.dataTransfer.files;
      console.log(files);
    },
    handleClick() {
      const result = dialog.showOpenDialogSync({
        title: "选择文件夹",
        properties: ["openDirectory"],
      });
      if (!result) return;
      let dirPath = result[0];
      let filters = this.filters.map((item) => item.toLowerCase());
      let files = iteratorDir(dirPath, { excludes: this.excludes, filters });
      console.log("遍历出来的文件", files);
      this.renderImageList(files);
    },
    //
    renderImageList(list) {
      let newArray = list.map((item) => {
        item.cutSize = 0;
        item.ratio = 0;
        item.status = "wait"; // wait:等待 loading:上传中 success:成功 fail: 失败
        return item;
      });
      this.images = newArray;
    },
    // 格式化范围选择提示
    formatTooltip(val) {
      if (val < 1000) {
        return val + "KB";
      } else {
        return parseFloat((val / 1000).toFixed(2)) + "MB";
      }
    },
    // 清空数据
    handleClear() {
      if (this.loading) return this.$message.warning("正在压缩中,请稍后再试");
      this.loading = true;
    },
    // 一键压缩
    compressAll() {
      if (this.images.length == 0) return this.$message.error("请先上传内容");
      if (this.loading) return this.$message.warning("正在压缩中,请稍后再试");
      this.loading = true;
      this.images.forEach((image) => {
        this.compressImage(image.filePath);
      });
    },
    // 压缩图片
    compressImage(image) {
      if (image.status === "loading") return;
      image.status = "loading";
      let filePath = image.filePath;
      options.headers["X-Forwarded-For"] = this.getRandomIP();
      let req = https.request(options, (res) => {
        res.on("data", async (buf) => {
          let result = JSON.parse(buf.toString());
          if (result.error) {
            image.status = "fail";
            console.log("压缩失败: ", result.message);
          } else {
            this.downloadFile(filePath, result)
              .then((res) => {
                console.log("成功", res);
                image.status = "success";
                image.cutSize = res.output;
                image.ratio = res.ratio;
              })
              .catch((err) => {
                console.log("失败", err);
                image.status = "fail";
              });
          }
        });
      });
      req.write(fs.readFileSync(filePath), "binary");
      req.on("error", (e) => {
        console.warn("ERROR", e);
        image.status = "fail";
      });
      req.end();
    },
    // 下载图片
    downloadFile(filePath, result) {
      return new Promise((resolve, reject) => {
        let options = new URL(result.output.url);
        let req = https.request(options, (res) => {
          let body = "";
          res.setEncoding("binary");
          res.on("data", (data) => {
            body += data;
          });
          res.on("end", () => {
            let pathArr = filePath.split("/");
            let newName = pathArr[pathArr.length - 1].split(".");
            pathArr[pathArr.length - 1] =
              newName[0] + "_compress." + newName[1];
            let newFilePath = pathArr.join("/");

            fs.writeFile(newFilePath, body, "binary", (err) => {
              if (err) {
                reject(err);
              }
              resolve({
                output: result.output.size,
                ratio: Math.ceil((1 - result.output.ratio) * 100) + "%",
                filePath,
              });
            });
          });
        });
        req.on("error", (e) => {
          console.log("download file error", e);
        });
        req.end();
      });
    },
    // 随机IP地址
    getRandomIP() {
      return Array.from(Array(4))
        .map(() => parseInt(Math.random() * 255))
        .join(".");
    },
  },
};
</script>

<style lang="scss" scoped>
.compress-box {
  width: 100%;
  height: 100%;
  display: flex;
  .left {
    width: 360px;
    height: 100%;
    margin-right: 20px;
  }
  .right {
    flex: 1;
    position: relative;
    .table-container {
      width: 100%;
      height: calc(100% - 38px);
      position: relative;
      .table-box {
        position: absolute;
        width: 100%;
        height: 100%;
      }
    }
  }
}
.mb-10 {
  margin-bottom: 10px;
}
</style>
