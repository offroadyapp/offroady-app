# Offroady 指示：实现 Trip Chat（MVP）

请在 Offroady 网站中新增 **Trip Chat** 功能，目标是让 **已经 join 同一个 trip 的注册用户** 能在该 trip 内进行群聊，方便沟通 **trip planning / scheduling / meeting point / last-minute updates / sharing**。

## 一、产品目标

Trip Chat 只服务于 **某一次具体 trip**，不是公开论坛，也不是全站私聊系统。

它应该解决这些实际问题：
- 确认出发日期和时间
- 确认集合地点
- 沟通车辆要求、装备、路况、天气
- 临时迟到、取消、人数变动
- 出行前后的简短分享和提醒

## 二、MVP 范围

先做 **Trip Chat only**，不要做 Crew Chat，不要做私信，不要做复杂频道系统。

### 这期必须有
1. 每个 trip 有一个独立聊天房间
2. 只有以下用户可访问该 trip chat：
   - trip planner / creator
   - 已 join 该 trip 的 participants
3. 用户 join trip 后，自动可以看到并使用该 trip chat
4. 用户 leave trip 后，失去该 trip chat 访问权限
5. 聊天支持：
   - 发送纯文字消息
   - 显示发送者
   - 显示时间
   - 按时间顺序展示
6. 在 trip detail 页提供 chat 入口
7. 有未读消息提示（至少基础版）
8. 有基础站内通知 / badge（MVP 可简化）
9. trip creator / planner 可以删除不当消息，或至少先预留管理员删除能力
10. 聊天内容只对该 trip 成员可见

### 这期不要做
- 图片上传
- 文件上传
- @mentions
- emoji reactions
- poll / vote
- typing indicator
- read receipts per user
- push notification
- 复杂 moderation 后台
- 全站搜索聊天记录
- public chat preview

## 三、核心产品逻辑

### 1. 访问权限
Trip Chat 必须是 **严格私有** 的。

规则：
- 未登录用户：不能访问
- 已登录但未 join 该 trip 的用户：不能访问
- planner / creator：可以访问
- joined participants：可以访问
- leave trip 后：立即失去访问权限

如果有人直接输入 URL，后端也必须拦截，不能只做前端隐藏。

### 2. join / leave 与 chat 的关系
- 用户 **join a trip** 后，自动获得 trip chat 访问资格
- 用户 **leave trip** 后，自动失去 trip chat 访问资格
- 如果 planner cancel trip，chat 可保留为只读或显示 trip cancelled 状态（MVP 可先保留可读，但不允许继续发言，或者先继续允许读写也可，只要逻辑一致）

### 3. planner 的角色
trip planner / creator 在 chat 中有更高权限：
- 默认可见
- 可发送消息
- 可删除任意消息（MVP 推荐）
- 后续可扩展 pinned message，但本期不做 UI

## 四、页面与入口要求

### 1. Trip detail 页面
在每个 trip 的详情区域新增 chat 模块入口。

建议文案：

**Trip Chat**  
Chat with everyone in this trip to coordinate timing, meeting point, trail conditions, and updates.

按钮逻辑：
- 未登录：显示 `Log in to join and chat`
- 已登录但未 join：显示 `Join this trip to chat`
- 已 join 或 planner：显示 `Open Trip Chat`

### 2. Chat 页面路由
建议新增独立页面，例如：

`/trips/[tripId]/chat`

要求：
- 页面顶部显示 trip 基本信息：
  - trip title / trail name
  - planned date
  - planner
- 中间显示消息列表
- 底部固定输入框和发送按钮

### 3. My Trips / Join a Trip 页面
如果当前用户对某个 trip 有 chat 权限，可显示一个小入口：
- `Open Chat`
- 如果有未读，可显示 `New messages`

## 五、推荐的数据结构

请根据现有 Supabase / DB 结构最小增量实现。建议新增两张表：

### 1. `trip_chat_messages`
字段建议：
- `id` uuid primary key
- `trip_id` uuid not null
- `user_id` uuid not null
- `message_text` text not null
- `created_at` timestamptz default now()
- `updated_at` timestamptz nullable
- `deleted_at` timestamptz nullable
- `is_system` boolean default false

说明：
- 普通消息 `is_system = false`
- 后续系统消息可复用此表，例如 “Alice joined the trip”

### 2. `trip_chat_reads`
用于未读逻辑，字段建议：
- `trip_id` uuid not null
- `user_id` uuid not null
- `last_read_at` timestamptz nullable
- primary key `(trip_id, user_id)`

如果你觉得更适合，也可以用 `last_seen_message_id`，但 `last_read_at` 对 MVP 足够。

## 六、权限与后端规则

### 1. 发消息权限
只有满足以下之一才允许 insert：
- 当前用户是 trip planner / creator
- 当前用户是该 trip 的已加入 participant

### 2. 读消息权限
select 也必须遵守相同规则，绝不能让非 trip 成员读到聊天内容。

### 3. 删除消息权限
MVP 建议：
- 用户可删除自己的消息
- trip planner 可删除任何该 trip 的消息

如果先简化，也可以只允许 planner 删除任何消息，用户不能删除自己的消息，但建议至少保留扩展空间。

### 4. RLS
如果你们现在用 Supabase，建议对聊天表启用 RLS，并基于 trip membership 做 policy，不能只靠客户端控制。

## 七、未读消息逻辑（MVP 简化版）

请先做最基础但实用的未读机制。

### 建议逻辑
- 当用户打开 trip chat 页面时，更新 `trip_chat_reads.last_read_at = now()`
- 未读数量可按：
  - `message.created_at > last_read_at`
  - 且 `user_id != current_user`
- 在 trip 卡片或 chat 入口处显示：
  - 小红点
  - 或 `New`
  - 或未读数量 badge

### MVP 要求
最少做到：
- 用户有新消息时，trip card / chat entry 有 badge 或 dot
- 打开 chat 后未读状态消失

## 八、系统消息（推荐做，能明显提升体验）

MVP 里建议支持简单系统消息，但 UI 可以非常轻。

例如：
- `Alice joined the trip`
- `Bob left the trip`
- `Planner updated the trip date`
- `Trip was cancelled`

这些消息可以写入 `trip_chat_messages`，设置：
- `is_system = true`
- `user_id` 可为空，或者用系统用户占位

如果本期不做 date change / cancel 的系统消息，至少建议做：
- join trip -> system message
- leave trip -> system message

这样 chat 会更有“活性”，也更清楚谁在。

## 九、实时更新

如果当前项目已在用 Supabase realtime，请把 Trip Chat 接到 realtime subscription。

要求：
- 新消息发送后，聊天室成员无需刷新即可看到
- 新消息到达时，当前不在 chat 页的成员可看到 unread badge 更新，或者至少在下次刷新时正确显示

如果 realtime 接入成本较高，MVP 也可以先轮询，但优先 realtime。

## 十、UI / UX 要求

### 页面布局
建议标准聊天布局：
- 顶部：trip info
- 中间：消息列表
- 底部：输入框 + send button

### 消息展示
每条消息显示：
- sender display name
- 时间
- message text

### 样式建议
- 自己的消息和他人的消息可稍微区分
- system message 用居中、浅色、小字体
- 保持移动端友好

### 空状态
如果没有消息，显示：

> No messages yet. Say hello and start coordinating this trip.

### 错误状态
- 无权限访问：显示明确提示，而不是空白页
- trip 不存在：显示正常 404 / fallback

## 十一、通知要求

这期不要做太复杂，但要有最基础提示。

### MVP 可接受方案
- 站内 unread badge
- trip 列表里显示 `New messages`
- chat 页面标题附近显示未读状态（可选）

### 暂不要求
- email notification
- browser push
- SMS

后续再做通知偏好设置。

## 十二、安全与社区规范

Trip Chat 是私有群聊，但仍要注意最基础的安全控制。

### 至少需要
- message text 做 XSS / unsafe HTML 处理
- 限制单条消息长度，例如 1000 字内
- 限制空消息 / 全空白发送
- 基础频率限制，避免刷屏（例如简单 throttle）
- 删除能力至少给 planner

### 后续可扩展
- report message
- mute trip
- block user
- moderation logs

这期可以不做完整 UI，但代码结构请尽量不要封死。

## 十三、与现有功能衔接

请确认 Trip Chat 与现有这些逻辑兼容：
- join trip
- leave trip
- my trips
- trail detail 中显示 planned trips
- weekly digest 中可能导流到 trip

重点是：**Trip Chat 只是挂在 trip 上，不要改乱 Trail / Trip / Crew 既有层级。**

当前产品结构应保持：
- Trail = 路线
- Trip = 某次具体出行
- Crew = 长期关系
- Chat = Trip 的附属沟通层

## 十四、建议实现步骤

请按这个顺序做：

### Step 1
设计并创建 DB schema：
- `trip_chat_messages`
- `trip_chat_reads`

### Step 2
做好后端 permission / RLS

### Step 3
实现读写接口 / data access layer

### Step 4
在 trip detail 页面增加 chat CTA 逻辑

### Step 5
实现 `/trips/[tripId]/chat` 页面

### Step 6
实现 unread badge / new message indicator

### Step 7
接 realtime 或轮询

### Step 8
补基础系统消息（join / leave）

### Step 9
做完整验证：
- planner
- participant
- non-member
- leave after join
- unauthorized direct URL access

## 十五、验收标准

以下都满足，才算完成：

1. 已登录且已 join 某个 trip 的用户，可以进入该 trip chat
2. planner 可以进入该 trip chat
3. 未 join 的用户不能进入
4. 非登录用户不能进入
5. 可以正常发送纯文字消息
6. 新消息能显示发送者和时间
7. join 后立即获得 chat 权限
8. leave 后立即失去 chat 权限
9. trip detail 页能正确显示 chat CTA
10. 有基础 unread 提示
11. 后端权限有效，不能通过直接请求绕过
12. UI 在桌面和移动端都能正常使用

## 十六、文案建议

### Trip detail CTA
**Trip Chat**  
Coordinate timing, meeting point, trail conditions, and last-minute updates with everyone in this trip.

按钮：
- `Open Trip Chat`
- `Join this trip to chat`
- `Log in to join and chat`

### 空状态
**No messages yet**  
Say hello and start coordinating this trip.

### 无权限
**This chat is only available to the trip planner and joined participants.**

## 十七、实施原则

请按以下原则实现：
- 先做可上线的 MVP
- 不要过度设计
- 不要引入大型聊天框架，除非现有技术栈非常适合
- 优先复用现有 auth / trip membership / profile 数据
- 权限判断以后端和 RLS 为准
- 代码保持为后续 Crew Chat 留扩展空间，但这期不要顺手做 Crew Chat
