# client-config

NCode 的窗口级公共配置兼容端口，只提供本地默认值。RPC 接口继续通过 services 公开入口访问。

- `getSnapshot` 保留参数校验；返回默认排序、空推荐与空漏洞链接，每次返回新数组。
- 普通、并发和强刷都不解析 endpoint、读取凭据、发送请求、设置计时器或发出事件；不持久化、不维护 TTL。
- 装配依赖签名暂时保留以兼容 Host，运行时不使用这些外部能力。
- 已安装插件面板是 UI 对插件管理 store 的派生投影，不由本模块保存。
- Main 的桌面提示开启及已关闭的套餐/帮助等读取由各自装配入口负责，见 [spec](../../../../docs/ncode-local-client-config.spec.md)。
