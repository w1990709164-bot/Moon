# 小手机

一个模拟手机界面的 Web 应用，基于 Vue 3 构建。

## 文件结构

```
├── index.html   # 主页面（HTML 模板）
├── style.css    # 所有样式
├── app.js       # Vue 3 应用逻辑
└── README.md    # 说明文档
```

## 本地预览

直接用浏览器打开 `index.html` 即可（需要网络加载 Vue CDN）。

## 部署到 Cloudflare Pages

1. 将此项目推送到 GitHub 仓库
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
3. 进入 **Pages** → **Create a project** → **Connect to Git**
4. 选择此 GitHub 仓库
5. Build settings 全部留空（静态项目无需构建）
6. 点击 **Save and Deploy**
