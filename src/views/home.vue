<template>
  <div class="home-page">
    <div class="menu">
      <div
        class="item"
        v-for="(item, index) in menus"
        :key="index"
        @click="handleClick(index, item.path)"
      >
        <div class="btn" :class="{ active: curTab == index }">
          <div class="line"></div>
          <div class="line"></div>
          <div class="line"></div>
          <div class="line"></div>
          {{ item.title }}
        </div>
      </div>
    </div>
    <div class="main">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
export default {
  name: "Home",
  data() {
    return {
      menus: [
        { title: "压缩图片", path: "/compress" },
        { title: "精灵图工具", path: "/diff" },
        // { title: "测试功能", path: "/" },
      ],
      curTab: 0,
    };
  },
  methods: {
    handleClick(index, path) {
      this.curTab = index;
      this.$router.push({ path });
    },
  },
};
</script>

<style lang="scss" scoped>
.home-page {
  width: 100%;
  height: 100%;
  display: flex;
  .menu {
    width: 150px;
    min-width: 150px;
    height: 100%;
    background-color: #f8f8f8;
    .item {
      padding: 15px;
      box-sizing: border-box;
      .btn {
        width: 100%;
        height: 40px;
        cursor: pointer;
        line-height: 40px;
        text-align: center;
        font-weight: bold;
        position: relative;
        overflow: hidden;
        background-color: #ffffff;
        border-radius: 2px;
        .line {
          position: absolute;
        }
        .line:nth-child(1) {
          width: 100%;
          height: 2px;
          top: 0;
          left: -100%;
          background: linear-gradient(to right, transparent, #ff6530);
          animation: animate1 1s linear infinite;
        }
        .line:nth-child(2) {
          width: 2px;
          height: 100%;
          top: -100%;
          right: 0;
          background: linear-gradient(to bottom, transparent, #ff6530);
          animation: animate2 1s linear infinite;
          animation-delay: 0.25s;
        }
        .line:nth-child(3) {
          width: 100%;
          height: 2px;
          bottom: 0;
          right: -100%;
          background: linear-gradient(to left, transparent, #ff6530);
          animation: animate3 1s linear infinite;
          animation-delay: 0.5s;
        }
        .line:nth-child(4) {
          width: 2px;
          height: 100%;
          bottom: -100%;
          left: 0;
          background: linear-gradient(to top, transparent, #ff6530);
          animation: animate4 1s linear infinite;
          animation-delay: 0.75s;
        }
      }
      .btn.active {
        background-color: #ff6530;
        color: #ffffff;
      }
    }
  }
  .main {
    flex: 1;
    box-sizing: border-box;
    padding: 20px;
  }
}
@keyframes animate1 {
  0% {
    left: -100%;
  }
  50%,
  100% {
    left: 100%;
  }
}
@keyframes animate2 {
  0% {
    top: -100%;
  }
  50%,
  100% {
    top: 100%;
  }
}
@keyframes animate3 {
  0% {
    right: -100%;
  }
  50%,
  100% {
    right: 100%;
  }
}
@keyframes animate4 {
  0% {
    bottom: -100%;
  }
  50%,
  100% {
    bottom: 100%;
  }
}
::v-deep .el-col .el-button {
  width: 100%;
  margin-bottom: 20px;
}
</style>
