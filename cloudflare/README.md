# 和风天气实时接口

Worker 地址：`https://blue-white-weather.kaychiao216.workers.dev`。

`/health` 检查部署和配置状态，不请求和风；`/weather` 查询上海实时观测与逐小时降水概率。同一边缘节点缓存 5 分钟，不依赖 GitHub Actions 发布时间。只查询固定上海坐标，不接受调用者指定上游地址或任意地点。

## 控制台配置

进入 Workers & Pages → blue-white-weather → Settings → Variables and Secrets，添加：

| 名称 | 类型 | 值 |
| --- | --- | --- |
| QWEATHER_API_KEY | Secret | 现有和风 API Key，由本人输入 |
| QWEATHER_API_HOST | Text 或 Secret | 和风控制台分配的 API Host，仅域名，不带 https:// 或路径 |

这两个值与 GitHub Actions 中对应的 Secrets 内容相同，但需要在 Cloudflare 单独配置。密钥不进入源码、Git 或浏览器。上传的 `worker.mjs` 不含任何密钥。

设置后部署，再访问 `/health`：`configured: true` 表示配置格式齐全；真正的鉴权及天气结果要访问 `/weather` 验证。`configured: false` 时 `/weather` 返回 503。上游失败返回 502 及经过白名单限制的故障阶段、HTTP 状态或校验分类，不回传上游响应、域名或密钥。缓存读写失败不会丢弃已成功查询的天气。

## 部署与测试

可以在控制台的 Edit code 中用 `worker.mjs` 替换示例代码后 Deploy；也可在本人完成 Wrangler 授权后运行：

```sh
npx wrangler deploy --config cloudflare/wrangler.jsonc
```

本地自动化检查（使用模拟上游，不消耗和风额度）：

```sh
node --test cloudflare/worker.test.mjs
```

实际部署后：

```sh
curl https://blue-white-weather.kaychiao216.workers.dev/health
curl https://blue-white-weather.kaychiao216.workers.dev/weather
```

默认允许 GitHub Pages 和 localhost:8000 的浏览器跨域请求。CORS 不是接口鉴权；公开接口仍可被非浏览器调用。固定地点和 5 分钟边缘缓存用于减少上游查询，和风配额仍应在其控制台管理。Worker 不读取定位，不打印请求内容或密钥。

前端接口地址在 `data/weather-config.js`。打开页面请求实时接口，前台每 5 分钟查询，手动刷新实际请求；切回标签页时距上次查询超过 1 分钟则更新。接口失败时展示最近有效观测或发布快照，并标明备用状态。

Wrangler 配置启用了 `keep_vars: true`，避免后续命令行部署清除你在控制台保存的 Host 等变量；密钥仍应使用 Secret 类型。
