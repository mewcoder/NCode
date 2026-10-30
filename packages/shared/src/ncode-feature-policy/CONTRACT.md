# ncode-feature-policy

`policy.js` 是当前仍有控制入口的策略唯一来源。Runtime 从 shared 公开入口导入；纯 Node 构建脚本可直接导入公开的 policy.js，不要求先构建 shared。

- 只读值，无 IO、环境覆盖、计时器、缓存、状态写入或广播；嵌套默认值与构建配置同样冻结。
- 类型由同目录手写的 `policy.d.ts` 承担，不与 `policy.js` 一同编辑即失效：`@zcode/shared` 的 exports 指向 `src/index.ts`，未开启 `allowJs` 的下游（如 `@zcode/contracts`）直接编译本目录源码，缺声明会报 TS7016 并中断 agent-cli 构建。字段增删改必须同步两处，通过根与 CLI 类型检查以及工程策略值锚点校验；不恢复已退役的 App 声明单测。
- 消费方优先把值传给现有 enabled/模式/define。没有开关的遗留请求在其 owner 的入口短路，不复制请求实现。
- 已移除的 UI/依赖和调度入口不由这里恢复，不暴露无实际消费者的开关。
- 具体接入位置、请求保留边界和验收见 [spec](../../../../docs/ncode-local-client-config.spec.md)。
