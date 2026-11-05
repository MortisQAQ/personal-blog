# 研究来源与取舍

读取日期：2026-09-10。此文件只供技能维护；常规建档不要求联网。

v4 留存了以下公开方法来源。本轮 v5 完整读取 writing-skills 附带的 Anthropic 技能编写指南及子代理评估方法，未重新抓取全部公网页面，不把历史检索说成本次最新调研。

## 技能组织

- [Agent Skills 规范](https://agentskills.io/specification)：采用短入口、相对路径、单层引用和按需加载；五个阶段分别拥有执行文件，不把所有规则堆进入口。
- [Anthropic 技能编写最佳实践](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)：采用工作流、可检查中间产物、模板和基于真实任务的评估；压缩解释性重复，不压缩产物必要信息。
- [Anthropic 开源 skill-creator](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md)：参考新旧技能对照和应用场景评估思路；不移植其完整评测平台，不引入部署、网页报告或运行时依赖。

## 可还原技术档

- [arc42：Building Block View](https://docs.arc42.org/section-5/)：采用“模块职责、接口、依赖、代码位置”的结构视图，重要模块逐层展开，普通内容合并。
- [arc42：Runtime View](https://docs.arc42.org/section-6/)：用代表性的主流程、错误流程和生命周期解释模块如何协作，不只保存静态文件树。

本技能进一步要求版本快照、真实符号、字段取值、分支走查和脱离源码的复述检查。这是针对离开项目后仍需回忆实现的适配，不宣称 arc42 要求完整源码重建。

## 求职与面试

- [Tech Interview Handbook 开源仓库](https://github.com/yangshun/tech-interview-handbook)及其[简历指南](https://www.techinterviewhandbook.org/resume/)：采用少而具体的贡献、本人动作、可信结果和岗位相关性排序；不采用“必须量化”、代码行数代表熟练度或强制某种简历编辑工具。
- [Tech Interview Handbook 行为面试指南](https://www.techinterviewhandbook.org/behavioral-interview/)：采用 STAR(R)、少数可复用故事、练习与追问；适配实习生，不强制领导力、跨团队影响或大规模成果。
- [H5BP 前端面试题库](https://github.com/h5bp/Front-end-Developer-Interview-Questions/blob/main/src/questions/general-questions.md)：参考技术困难、性能、可维护性、协作与学习等考察维度；问题必须绑定母档的实际机制，不整批搬运八股题。

只借鉴方法并重新组织中文指令，没有复制开源项目的代码或整段模板。外部来源不证明用户经历，也不能给用户补出未做过的成果。

## v5 架构变化

将实现事实放入技术实现概要，母档承载 STAR(R) 叙事和架构判断。按用途分开，不再以超过行数作为两类读者分流的前提。长期档案由双档及必要附录组成，简历与面试套件按需派生。

入口只负责产物契约、路由和硬边界；流程保留证据要求，删除逐机制等长表单。一个双粒度范例取代重复口号，让“用段落讲因果”同时出现在指令与示范里。

对实现复刻采用较低自由度：真实状态、顺序、分支和清理必须保留。对叙述采用较高自由度：标题与篇幅由故事决定，STAR 是检查而非格式锁。机械指标只提示文体噪声，独立读者验证理解与事实。

## 用户指定的风格参考

本轮读取《AI 助手对话页交接》（revision 198）和《焦昊楠 第二次 demo night》（revision 10259）。前者提供范围、职责树、链路与排障入口的组织方式；后者提供业务问题、技术命题、方案取舍、结果与成长的叙事方式。

只抽取方法，不将内部原文、身份或业务数据打包进技能。没有复制大表格、密集加粗或未经核验的效果主张；评论中对归因和排名的质疑也提示要保留证据边界。

## 评估边界

在修改前运行旧版应用基线，再让新代理使用工作区新版生成同项目双档与压力场景，独立核验还原能力、个人贡献和叙述质量。评估方法见 evaluation.md；项目数据、原始材料、基线和报告留在任务工作区，不随全局技能发布。一次项目试验不证明跨模型或跨项目普适提升。
