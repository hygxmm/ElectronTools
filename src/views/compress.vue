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
            <el-checkbox label=".png"></el-checkbox>
            <el-checkbox label=".jpg"></el-checkbox>
            <el-checkbox label=".jpeg"></el-checkbox>
          </el-checkbox-group>
        </div>
        <div>
          <h3>文件大小</h3>
          <el-slider
            v-model="limit"
            range
            :min="10"
            :max="10000"
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
          </el-checkbox-group>
        </div>
      </div>
    </div>
    <div class="right">
      <div class="mb-10">
        <el-button
          type="info"
          size="mini"
          @click="handleClear"
          @dblclick="forceClear"
        >
          清空数据
        </el-button>
        <el-button type="primary" size="mini" @click="compressAll">
          一键压缩
        </el-button>
        <el-button type="text">
          成功: {{ succCount }},失败: {{ failCount }}
        </el-button>
      </div>
      <div class="table-container">
        <el-table :data="images" border size="mini" height="100%">
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
</template>

<script>
const { ipcRenderer } = window.require("electron");
const { dialog } = window.require("electron").remote;
const path = window.require("path");
const fs = window.require("fs");
import { iteratorDir } from "@/common/utils";

export default {
  data() {
    return {
      excludes: [
        ".git",
        ".DS_Store",
        "dist",
        "node_modules",
        "nativeplugins",
        "unpackage",
      ],
      filters: [".png", ".jpg", ".jpeg"],
      limit: [5, 1000],
      images: [],
      loading: false,
      totalCount: 0,
      succCount: 0,
      failCount: 0,
    };
  },
  watch: {
    succCount(val) {
      if (val) {
        if (val + this.failCount === this.totalCount) {
          this.$message.success("文件处理完成");
          this.loading = false;
        }
      }
    },
    failCount(val) {
      if (val) {
        if (val + this.succCount === this.totalCount) {
          this.$message.success("文件处理完成");
          this.loading = false;
        }
      }
    },
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
      let dirs = e.dataTransfer.files;
      const files = Array.from(dirs).reduce((fileArr, file) => {
        let fileStat = fs.statSync(file.path);
        if (fileStat.isDirectory()) {
          let _files = iteratorDir(file.path, {
            excludes: this.excludes,
            filters: this.filters,
            minSize: this.limit[0] * 1000,
            maxSize: this.limit[1] * 1000,
          });
          fileArr.push(..._files);
        } else {
          let extname = path.extname(file.path);
          if (this.filters && !this.filters.includes(extname)) return fileArr;
          // 如果有文件大小限制,并且当前文件不在最小限制范围内
          if (this.limit[0] && fileStat.size < this.limit[0] * 1000)
            return fileArr;
          // 如果有文件大小限制,并且当前文件不在最大限制范围内
          if (this.limit[1] && fileStat.size > this.limit[1] * 1000)
            return fileArr;
          fileArr.push({
            filename: file.name,
            filePath: file.path,
            fileSize: fileStat.size,
          });
        }
        return fileArr;
      }, []);
      this.renderImageList(files);
    },
    handleClick() {
      const result = dialog.showOpenDialogSync({
        title: "选择文件夹",
        properties: ["openDirectory"],
      });
      if (!result) return;
      let dirPath = result[0];
      let filters = this.filters.map((item) => item.toLowerCase());
      let files = iteratorDir(dirPath, {
        excludes: this.excludes,
        filters,
        minSize: this.limit[0] * 1000,
        maxSize: this.limit[1] * 1000,
      });
      console.log("遍历出来的文件", files);
      this.renderImageList(files);
    },
    // 处理图片列表
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
      this.images = [];
      this.totalCount = 0;
      this.succCount = 0;
      this.failCount = 0;
    },
    // 强制清空
    forceClear() {
      console.log("强制清空");
      this.images = [];
      this.totalCount = 0;
      this.succCount = 0;
      this.failCount = 0;
    },
    // 一键压缩
    compressAll() {
      if (this.images.length == 0) return this.$message.error("请先上传内容");
      if (this.loading) return this.$message.warning("正在压缩中,请稍后再试");
      this.loading = true;
      this.totalCount = this.images.length;
      this.images.forEach((image) => {
        this.compressImage(image);
      });
    },
    // 压缩图片
    compressImage(image) {
      if (image.status === "loading") return;
      image.status = "loading";
      let filePath = image.filePath;
      ipcRenderer.invoke("compress-image", filePath).then((res) => {
        if (res.status === 0) {
          // console.log(filePath, "成功");
          image.status = "success";
          image.cutSize = res.cutSize;
          image.ratio = res.ratio;
          this.succCount += 1;
          this.$forceUpdate();
          console.log(filePath, "成功" + this.succCount);
        } else {
          image.status = "fail";
          this.failCount += 1;
        }
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
    display: flex;
    flex-direction: column;
    .table-container {
      flex: 1;
      position: relative;
      .el-table {
        position: absolute;
        width: 100%;
      }
      // height: calc(100% - 38px);
      // position: relative;
      // .table-box {
      //   width: 100%;
      //   height: 100%;
      //   position: absolute;
      // }
    }
  }
}
.mb-10 {
  margin-bottom: 10px;
}
</style>
