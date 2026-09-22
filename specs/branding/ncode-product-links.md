# NCode 产品链接与发布元数据

## 目标

确保安装包和用户可见的产品链接只使用 NCode/GitHub 身份，不把 ZCode/Z.ai 官网、作者或邮箱
展示为 NCode 的产品归属。

## 行为规则

- Desktop 安装包 homepage 指向 `https://github.com/mewcoder/NCode`。
- 安装包 author 使用 NCode 仓库维护者身份，不使用 ZCode 或 `@zcode.z.ai` 邮箱。
- “新功能/Changelog”和架构不匹配下载按钮统一打开 NCode GitHub Releases。
- Desktop 测试菜单不展示官方 production/test endpoint 选择。
- 模型 Provider 的 Z.ai/BigModel API 地址、显式环境变量和远程 workspace 底层 endpoint 兼容不在本次
  替换范围内；GitHub 不能伪装成 API endpoint。

## 验收场景

1. 打包 metadata 不包含 `homepage: https://zcode.z.ai`、`author: ZCode` 或 `@zcode.z.ai` 邮箱。
2. 用户点击 changelog 或架构下载按钮时打开 NCode Releases。
3. Desktop 菜单不显示 ZCode production/test endpoint 选择。
4. 类型、Lint、格式和架构检查通过。

## 迁移边界

本次只处理产品归属和用户可见链接，不改变 Provider API Key、SSH/WSL/Docker 资源部署或内部协议。
