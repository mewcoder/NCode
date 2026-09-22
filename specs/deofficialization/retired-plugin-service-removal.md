# 删除已退役的旧插件服务

## 目标

删除无调用方的 `IPluginsService`、`usePlugins` 和 `usePluginStore` 兼容链路。插件管理继续统一使用
`IPluginManagementService` 与 `pluginManagementStore`，不保留调用后抛错的旧 channel。

## 边界与不变量

- `IPluginManagementService` 是插件列表、市场、安装、启停、更新和卸载的唯一服务入口。
- `pluginManagementStore` 是设置页插件状态的唯一 UI owner。
- `IPluginSyncService`、个人 marketplace、远程 workspace 插件管理和 Agent 插件协议保持可用。
- 删除 `ServiceChannels.Plugins`、Host 注册、Renderer 代理和远程 workspace 转发。
- 本次不删除官方插件市场；其 CDN 与市场身份由独立任务处理。

## 验收场景

1. 全仓不存在 `IPluginsService`、`createPluginsService`、`usePlugins` 或 `usePluginStore`。
2. 插件设置页仍只使用 `IPluginManagementService` 与 `pluginManagementStore`。
3. 服务集合和远程 workspace 不再注册旧 `plugins` channel。
4. 类型、Lint、格式、架构检查通过，现有插件管理调用链不新增第二状态 owner。

## 迁移边界

旧 service 不持有独立持久数据，删除不需要迁移。插件配置、已安装插件和 marketplace 数据继续由
当前 Agent 插件管理路径读取。
