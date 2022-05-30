<template>
  <div>
    <input type="file" @change="handleChange" />
    <canvas id="canva" :width="width" :height="height" ></canvas>
    <el-input :value="width"></el-input>
    <el-input :value="height"></el-input>
  </div>
</template>

<script>
export default {
  data(){
    return {
      width: 32,
      height: 320,

    }
  },
  methods: {
    handleChange(e){
      const file = e.target.files[0];
      console.log(file)
      this.drawImage(file)
    },
    drawImage(img){
      const reader = new FileReader();
      reader.readAsDataURL(img);
      reader.onload = (e) => {
        const base64 = e.target.result;
         const image = new Image();
        image.src = base64;
        image.onload = function(e) {
          console.log("----",e,image)
           const c = document.getElementById("canva");
          const ctx = c.getContext("2d");
          ctx.drawImage(image,0,0,100,100); 
        }
      }
    }
  }
};
</script>

<style></style>
