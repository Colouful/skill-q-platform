# 常见问题（FAQ）

**Q: 创建 Rule 提示需要身份？**  
A: 生产环境若设置 `HUB_AUTH=on`，请求须带 `X-Hub-Actor`；在 **特工档案 `/me`** 保存昵称后与作者字段一致即可。

**Q: Skill 与 Rule 区别？**  
A: Skill 面向 Agent 技能包（SKILL.md），Rule 面向规则包（RULE.md），榜单与搜索均支持双轨筛选。

**Q: 上传 ZIP 大小限制？**  
A: 单包 10MB，详见上传 API 与解析逻辑中的常量。
