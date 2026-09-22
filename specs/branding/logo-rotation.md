# ZCode 产品标志顺时针旋转

## 目标

将本仓库自有的 ZCode 产品标志顺时针旋转 90°，使原有的 Z 形标志呈现为 N 形方向，同时保持产品名称文字和第三方模型 provider 标志不变。

## 范围与所有者

- 产品标志的唯一视觉规则由本 spec 约束；运行时没有新增状态或持久化字段。
- UI 组件、Desktop 启动/关于页只负责按各自平台渲染该规则，不再引入第二套方向判断；`apps/zcode-cli` 属于内核，保持原源码和 logo 不变。
- `public/logo/icons` 与 `packages/desktop/build` 中的应用图标是同一份产品素材的发布副本，必须保持像素内容与方向一致。
- `packages/ui/src/assets/provider-icons` 中属于第三方 provider 的素材（包括 Z.AI provider 图标）不在本次变更范围内。

## 行为与不变量

- 产品标志的几何变换为顺时针 90°，不是镜像、反色或改名。
- 非方形 SVG 必须同时校正路径、渐变和 viewBox 的输出坐标系，顶部与底部边界要对齐，不能只旋转外层 `<g>`。
- 非方形 SVG 的 viewBox 与显示比例同步调整，不能因旋转被裁切或拉伸。
- 方形应用图标只旋转内部产品标志；圆角底色、透明边界和图标尺寸保持不变。
- 包含产品标志的安装器立体图保留盒体方向；其中的产品标志单独旋转。
- 本 spec 只约束标志几何方向；产品名称迁移由 [`product-name-migration.md`](product-name-migration.md) 单独约束，provider 名称保持原文。
- 同一展示面不得同时加载旧方向和新方向的产品标志。

## 验收场景

1. README、Desktop 应用图标、Windows 托盘图标、macOS 图标、启动页和关于页中的产品标志均呈顺时针 90° 方向。
2. Web/Desktop 主界面的左上角、侧栏折叠入口、欢迎页、引导页和草稿空态使用新方向标志。
3. CLI TUI 空会话 logo 保持原方向和源码不变，不纳入本次品牌素材更新，便于后续同步上游内核。
4. provider 设置、OAuth provider 和其他第三方 provider 图标保持原图，不受产品标志改动影响。
5. 旋转后的 PNG、ICO、ICNS 仍能被 `file`/系统图标工具识别，且各副本方向一致。

## 迁移边界

本次只改变 Desktop、Web 和共享 UI 中的视觉素材与内嵌 SVG 方向；`apps/zcode-cli` 的 ASCII logo 和其他源码不变。产品名变更由品牌迁移 spec 管理，不改变服务端点、账号体系、provider 语义、窗口尺寸、布局状态或协议接口。
