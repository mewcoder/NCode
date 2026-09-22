import { z } from "zod";

export type SessionCreateSource = "group" | "project" | "session";
export type SessionCreateClientKind = "desktop" | "web";

/** 会话创建事件；公共用户/设备身份仍由桌面 TelemetryCore 注入。 */
export const sessionCreateTelemetrySchema = z
  .object({
    elementName: z.literal("session_create"),
    eventRegion: z.literal("app"),
    eventType: z.literal("result"),
    talkId: z.string().min(1).max(512),
    messageId: z.string().min(1).max(512),
    context: z
      .object({
        clientTimezone: z.string().max(128),
        clientLanguage: z.string().max(128),
        screenResolution: z.string().max(64),
      })
      .strict(),
    eventExtraDetail: z
      .object({
        create_source: z.enum(["group", "project", "session"]),
        client_kind: z.enum(["desktop", "web"]),
        workspace_kind: z.enum(["local", "remote"]),
        remote_kind: z.enum(["", "ssh", "wsl", "docker", "server"]),
      })
      .strict(),
  })
  .strict();

export type SessionCreateTelemetry = z.infer<typeof sessionCreateTelemetrySchema>;

/** 自动化由执行 Host 报告；浏览器端不得冒充无人值守派发来源。 */
export const automationSessionCreateTelemetrySchema = sessionCreateTelemetrySchema.extend({
  eventExtraDetail: sessionCreateTelemetrySchema.shape.eventExtraDetail.extend({
    create_source: z.enum(["automation_idle", "automation_scheduled"]),
    client_kind: z.literal("desktop"),
  }),
});
export type AutomationSessionCreateTelemetry = z.infer<
  typeof automationSessionCreateTelemetrySchema
>;
