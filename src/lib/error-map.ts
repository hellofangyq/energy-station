export function translateError(message: string | undefined | null, lang: "zh" | "en") {
  if (!message || lang !== "en") return message || "";

  const map: Record<string, string> = {
    "缺少字段": "Missing fields",
    "缺少邮箱": "Missing email",
    "该邮箱已注册": "Email already registered",
    "请选择两个不同的问题": "Please choose two different questions",
    "邀请已失效": "Invite expired",
    "账号不存在": "Account not found",
    "密码错误": "Incorrect password",
    "未登录": "Not logged in",
    "无权操作": "Not allowed",
    "成员不存在": "Member not found",
    "缺少成员姓名": "Missing member name",
    "缺少接收人": "Missing recipient",
    "缺少标题": "Missing title",
    "不支持的类型": "Unsupported type",
    "缺少媒体文件": "Missing media file",
    "缺少通知": "Missing notifications",
    "缺少状态": "Missing status",
    "该成员已完成绑定": "Member already linked",
    "该账号未设置安全问题": "Security questions not set",
    "回答不正确": "Incorrect answers",
    "链接已失效": "Link expired",
    "姓名不能为空": "Name is required",
    "保存失败": "Save failed",
    "删除失败": "Delete failed",
    "导出失败": "Export failed",
    "导入失败": "Import failed",
    "添加失败": "Add failed",
    "生成失败": "Generate failed",
    "发送失败": "Send failed",
    "加载失败": "Load failed"
  };

  return map[message] ?? message;
}
