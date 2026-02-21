# 图片复制插件

[English](README.md) | [简体中文](README_zh.md)

这个插件可以将包含嵌入图片的 Markdown 笔记复制到剪贴板，同时保留文本格式和图片。当粘贴到 Google Docs、Notion 或 Word 等富文本编辑器中时，图片会与格式化文本一起显示。

## 功能特性

- 将完整的笔记和图片复制到剪贴板
- 保留 Markdown 格式为 HTML
- 直接在剪贴板数据中嵌入图片
- 支持 `![](image.png)` 和 `![[image.png]]` 两种语法
- 支持常见图片格式（PNG、JPG、JPEG、GIF、WebP、BMP、SVG）

## 使用方法

有两种方式使用此插件：

1. **命令面板**：打开命令面板（`Ctrl/Cmd+P`）并搜索"复制完整笔记（含图片）"
2. **右键菜单**：在文件资源管理器中右键点击 Markdown 文件，选择"复制完整笔记（含图片）"

## 安装方式

### 从社区插件安装（推荐）
1. 打开 Obsidian 设置
2. 进入"社区插件"
3. 点击"浏览"并搜索"Copy with Images"
4. 安装插件

### 手动安装
1. 从 GitHub 下载最新版本
2. 解压到您的仓库 `.obsidian/plugins/` 文件夹
3. 重启 Obsidian 并启用插件

## 配置选项

插件包含多个配置选项：
- 复制时是否包含代码块
- 嵌入图片的最大尺寸
- 图片压缩质量

## 支持平台

此插件支持所有平台（Windows、macOS、Linux、移动端）。

## 问题反馈与贡献

在 [GitHub](https://github.com/yourusername/obsidian-copy-with-images) 上报告问题或贡献代码。