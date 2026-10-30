# Host database startup

Host Worker 是 app 库启动准备的唯一执行者。宿主验证 progress/done/failed 帧后更新启动状态；输入只携带数据库路径。

先读取旧 settings，再调用 project-storage 的启动入口迁移和维护索引，完成后发送 done，失败保留结构化错误及已经提交的迁移事实。所有退出路径关闭 MessagePort。此顺序避免空设置先记账、之后无法再恢复旧项目种子。

构建产物仍为 host/tasksStorageWorker.js，取消、超时及进程代际仍由宿主原有管理器负责；不改变历史 SQL、checksum 或 attachment。

Main 的 `databaseStartupTelemetry.ts` 是本模块启动状态的可选观察适配器，只消费状态，不拥有迁移状态或改变启动顺序。ARMS 客户端通过 desktop-telemetry 的公开入口访问；NCode 端点为空时客户端不加载，适配器直接返回，不建立采样记录、不读取 SDK 配置或发送事件；本地状态转发与排错日志继续使用原有链路。
