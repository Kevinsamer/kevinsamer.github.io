# kevinsamer.github.io

这是 Kevinsamer 的 **Codex 前端实验室**首页，用于集中展示未来发布的前端测试项目。

## 发布结构

- 账号级 Pages：`https://kevinsamer.github.io/`
- 独立项目：建议每个项目使用单独仓库，并通过 GitHub Pages 发布到 `https://kevinsamer.github.io/<project-name>/`
- 当前首页暂不加入旧项目，等新项目发布后再添加导航卡片。

## 自动部署

向 `main` 分支推送后，`.github/workflows/pages.yml` 会通过 GitHub Actions 自动部署静态文件。

在 GitHub 仓库设置中确认：

1. 打开 **Settings → Pages**。
2. 在 **Build and deployment** 中将 **Source** 设为 **GitHub Actions**。
3. 等待工作流完成后访问首页。

## 前端项目注意事项

- Vite 项目发布到 Project Pages 时，将 `base` 配置为 `/<仓库名>/`。
- React Router / Vue Router 测试项目优先考虑 hash 路由，避免刷新后出现 404。
- API Key、数据库密码等服务端密钥不能写入前端代码。
- 需要后端能力时，让 Pages 前端请求配置好 HTTPS 和 CORS 的外部 API。
