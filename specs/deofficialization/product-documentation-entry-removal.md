# 移除官方产品文档入口

## 目标

移除 Desktop 与 Web UI 中打开 ZCode 官方产品文档的入口，避免 NCode 个人版继续把
`https://zcode.z.ai/docs` 表现为自己的产品帮助内容。

## 范围与所有者

- `WorkspaceHelpMenuButton` 拥有工作区帮助菜单的展示，不再渲染“产品文档”。
- `createQuickPickCommands` 拥有命令中心的静态应用命令，不再注册 `product-docs`。
- 删除只服务上述入口的 URL 常量、action handler、图标类型和 i18n 文案。
- 删除 action handler 退出后无调用方的 `exportLogsAction` UI 包装层；Desktop 平台的日志导出能力保持不变。
- `IPlatformService.openExternal` 是其他外链共用的平台能力，不在本次删除范围内。

## 行为规则

- Desktop 和 Web 的帮助菜单均不显示“产品文档”。
- Web 在删除唯一帮助项后不渲染空的帮助按钮。
- 命令中心搜索 `docs`、`documentation`、`文档` 或 `产品文档` 时，不再出现产品文档命令。
- 应用不会因为帮助菜单或命令中心操作打开 `zcode.z.ai/docs`。
- 资源管理器、检查更新、关于、导出日志以及其他合法外链保持原行为。
- 本次不处理 Desktop 原生菜单中的 changelog 入口；它由后续去官方化任务单独迁移。

## 状态与时序

本功能没有持久状态、异步缓存或协议命令。删除后的事件路径为：

```text
帮助菜单 / 命令中心构建
  ├─ 不创建产品文档项
  └─ 不产生 openExternal(https://zcode.z.ai/docs)
```

## 失败语义

- 不保留禁用态、空 handler 或点击后报错的兼容入口。
- 删除文档 URL 常量后如仍有调用方，应由类型检查或引用搜索暴露，而不是提供旧地址兜底。

## 验收场景

1. Desktop 帮助菜单不存在“产品文档”；Web 不显示空的帮助按钮。
2. 打开命令中心并搜索中英文文档关键词，不存在 `product-docs` 命令。
3. 全仓 UI 源码中不存在 `ZCODE_PRODUCT_DOCS_URL`、`zcode.z.ai/docs`、
   `quickPick.command.productDocs` 或 `workspaceHeader.help.docs`。
4. Desktop 帮助菜单仍可打开资源管理器、检查更新和关于；Web 帮助菜单不新增桌面专属入口。
5. `pnpm typecheck`、`pnpm lint`、`pnpm fmt:check`、
   `pnpm architecture:check --changed` 与 `git diff --check` 不引入新增失败。

## 迁移边界

该入口没有用户数据或持久化状态，不需要迁移。未来如建立 NCode 自有文档，应按新的 URL、
内容所有者和发布流程重新增加入口，不能恢复指向 ZCode 官方站点的常量。
