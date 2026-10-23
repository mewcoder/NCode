# personalization

将 NCode 全局指令编辑从上游设置页独立出来；产品规则与时序见根目录 `ncode-feature.md` 的“个性化设置”。

- `PersonalizationSection` 独占读取结果、草稿、路径及加载/保存状态；页面只挂载组件。
- `hooks/personalization/` 固定从本机 Host 获取既有 `ISettingsSyncService`，不跟随当前远程 workspace。
- 读取失败禁止保存，保存失败保留草稿；卸载后忽略未完成读取。文件格式与服务接口不变。
- 文件读取只跟随组件挂载及本机服务身份；语言变化仅更新文案，不重新加载或重置草稿。在途读取失败时用当前语言提示。
- 不新增共享状态、持久化、文件冲突策略或跨窗口同步。
