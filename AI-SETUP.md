# Gemini 每日文案

## 配置

在仓库 Settings → Secrets and variables → Actions → Secrets 配置三个 Repository Secrets：

- `GEMINI_API_KEY`：Google AI Studio API key。
- `FRED_PROFILE`：背景 JSON 对象。可包含 recipient、background 数组、sender、boundaries 数组。正文不放入仓库。
- `FRED_RECENT`：近况 JSON 对象，格式为 `{"events":[{"date":"YYYY-MM-DD","expires":"YYYY-MM-DD","fact":"近况"}]}`。无新近况时填 `{"events":[]}`。

可选 Repository Variable：`GEMINI_MODEL`，填写账户可用的文本模型 ID。不配置时脚本查询可用模型，优先选择 gemini-2.5-flash，其次选择支持 generateContent 的 Flash 文本模型。账户配额、可用模型和结算状态由 Google 管理。

## 更新与运行

更新 `FRED_RECENT` 后，Actions → Deploy Static Site to GitHub Pages → Run workflow，即可生成并部署。Secrets 变更本身不会触发运行。也会在推送和北京时间约每天 07:17 自动运行（GitHub 定时任务可能延迟）。

近况的 date 是实际发生日期，不能填写录入配置的日期；无法确认日期时不要臆造，可暂不添加该事件。fact 建议写“吃了手抛饭”这样的事实，不写“昨晚吃了手抛饭”。expires 是可引用的有效截止日，上海时区，包含截止日；过期事件不发送给模型。`content/style.md` 用于调整表达偏好。AI 每批生成 12 套完整短笺，不拆句混合。

每次正常只调用一次生成（90 秒超时）；返回内容不符合字数或时间规则时，携带具体校验反馈交给 AI 重写一次，最多两次生成。HTTP 错误与超时不重试。默认选模型时另有一次模型列表请求。仍未通过校验时回退有效历史批次，再回退 `daily-copy.js` 人工素材。

## 数据与输出

背景、近况和 API key 从 Actions Secrets 注入进程，不写入源码、站点文件或日志。背景、有效近况和写作偏好会发送给 Google；生成后的短笺会展示在公开网页上。

生成文件 `generated-copy.js` 在构建时生成，上传 Pages，不回写 Git 仓库。上一批成功内容通过 Actions Cache 保存；缓存可能被清理。缓存只保存生成后的短笺，不包含输入背景或密钥。网页也会检查 validUntil，过期批次不再展示。

`daily-copy.js` 是原有公开的人工素材；历史提交中的旧资料不会因启用 Secrets 消失。

本地可通过环境变量配置相同三项后执行 `node scripts/generate-copy.mjs`。不要将密钥写入源码或聊天。未配置密钥时自动使用备用内容。

网页每 520 秒（8 分 40 秒）从有效 AI 批次切换一套，手动换句会重新计时。切回标签页时未到期保持原文；这不会每 520 秒调用一次 AI。AI 在构建时生成，不在浏览器暴露密钥。

时间校验：过往事件只写“那次”“之前”或省略时间，不使用“昨天、昨晚、前两天、上周”等相对时间或臆造具体日期。模板规则变更后旧版本 AI 缓存不再复用；生成失败仍回退人工素材，不将备用内容称为 AI 生成。
