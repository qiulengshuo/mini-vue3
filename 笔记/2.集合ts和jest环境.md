1. npm init --y 初始化npm

2. npm install typescript --dev 安装 typescript

3. npx tsc --init 初始化 typescript 生成 tsconfig.json

4. 在 tsconfig.json 文件中 "types": ["jest"]，在 ts 中可以写 测试

5. npm install jest @type/jest --dev 安装 jest 和 type 类型的jest

6. npm install --dev babel-jest @babel/core @babel/preset-env 安装 jest 环境 的 babel

7. npm install -dev @babel/preset-typescript 安装 typescript 环境的 babel

8. 在 babel.config.js 中配置

   ```javascript
   module.exports = {
    presets: [['@babel/preset-env', {targets: {node: 'current'}}], '@babel/preset-typescript'],
   };
   ```

9. npm run test 去执行 jest 跑测试
