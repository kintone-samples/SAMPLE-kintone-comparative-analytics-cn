# SAMPLE-kintone-comparative-analytics-cn
同比环比图项目，用于评估业绩
![效果](https://raw.githubusercontent.com/kintone-samples/SAMPLE-kintone-comparative-analytics-cn/main/screenshots/echarts.png)

# 安装
你可以使用npm命令安装后，运行build命令进行编译，将dist目录下的成品文件上传到kintone app。
```console
npm i
npm run build
```

或者

在kintone app的自定义中上传Echarts的CND link，如：

https://cdn.jsdelivr.net/npm/echarts@5.4.2/dist/echarts.min.js

再修改src/index.js,移除第一行的import语句后上传到kintone app
