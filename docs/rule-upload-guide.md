# Rule 上传指南

1. 准备 ZIP：根目录或子目录包含 **RULE.md**（或 Windows 下常见的 **RULE.md.txt**；大小写不敏感，如 `rule.md`）。YAML frontmatter 可与 SKILL.md 相同。单文件不得超过约 2MB，否则会被跳过并提示「未找到」。若 ZIP 里同一路径（忽略大小写）出现两次，只保留后出现的文件。
2. 在站点顶栏设置 **身份**，与表单中的 **作者** 完全一致（若服务端开启 `HUB_AUTH=on`）。
3. 打开 `/rules/upload`，可选先拖入 ZIP 自动填充名称与说明，再补全分类与标签。
4. 创建成功后可在 **在线编辑** 中维护多文件并保存为新版本。

详见 `docs/RULE.template.md` 中的 RULE.md 模板。
