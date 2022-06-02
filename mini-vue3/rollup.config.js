import pkg from "./package.json"
import typescript from "@rollup/plugin-typescript"
export default {
  // 打包的入口文件路径
  input: "./src/index.ts",
  output: [{
    // 1. cjs -> commonjs
    // 2. esm
    format: "cjs",
    file: pkg.main
  }, {
    format: "es",
    file: pkg.module
  }],
  plugins: [typescript()]
}