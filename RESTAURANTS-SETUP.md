# 浏览器附近餐厅

在高德应用中增加服务平台为「Web端（JS API）」的 Key，网站域名白名单添加 `kaychiao.github.io`。

GitHub Actions Repository Secrets：

- AMAP_JS_KEY：JS API Key。
- AMAP_JS_SECURITY_CODE：对应 securityJsCode。

这些 JS SDK 配置会随网页发布，是浏览器可见的配置；请设置域名白名单、配额等限制。AMAP_API_KEY 是 Web 服务 Key，不注入浏览器。修改 Secrets 后需手动运行部署。

用户点击「用我的位置」后，浏览器申请定位授权，再由高德 convertFrom 将 GPS 坐标转为高德坐标，搜索 3 公里内餐厅。没有授权时可输入城市、商圈或地铁站，选择具体地点后再搜索。不会自动读取或持久化位置，也不经过 Cloudflare。

位置和地点输入会发送给高德。仅保留当前页面内的候选池，「换一批」优先避开上一批。先推荐有评分且达到 4 分的川菜，其次考虑其他有评分餐厅，暂无评分时明确标注。

评分、人均、营业时间以 JS API 实际返回字段为准，不保证所有店铺都有。地图服务、定位和搜索网络失败时显示重试提示，不伪造结果或切回固定测试点。

本地需通过 localhost HTTP 服务打开，域名限制按高德控制台要求配置；线上 GitHub Pages 使用 HTTPS。
