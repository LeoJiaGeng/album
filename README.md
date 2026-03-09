# 霊雨霏霏工作室 - 艺术相册

一个精美的艺术相册网站，支持时间轴浏览、多分类、留言互动等功能。

## 功能特性

- 时间轴浏览
- 多分类支持
- 爱心点赞统计
- 浏览次数统计
- 高清图下载
- GitHub Issues 留言系统
- 响应式设计

## 部署到 GitHub Pages

### 1. 创建 GitHub 仓库

1. 在 GitHub 上创建新仓库
2. 将此项目推送到仓库

### 2. 配置 GitHub Pages

1. 进入仓库 Settings > Pages
2. Source 选择 "GitHub Actions"
3. 等待自动部署完成

### 3. 配置留言功能

编辑 `_config.yml` 文件，修改以下信息：

```yaml
repository:
  owner: YOUR_GITHUB_USERNAME  # 替换为您的GitHub用户名
  name: YOUR_REPO_NAME         # 替换为您的仓库名
```

### 4. 更新图片

将 `images/` 目录下的占位图片替换为您的真实图片：

- `images/banner/` - 首页横幅图片
- `images/avatar/` - 作者头像
- `images/artworks/` - 作品图片

## 目录结构

```
gallery/
├── .github/
│   ├── workflows/
│   │   └── deploy.yml      # GitHub Actions 部署配置
│   └── ISSUE_TEMPLATE/      # Issue 模板
├── images/
│   ├── artworks/            # 作品图片
│   ├── banner/              # 横幅图片
│   ├── avatar/              # 头像图片
│   └── icons/               # 图标
├── artworks/                # 作品MD文件
├── index.html               # 主页面
├── styles.css               # 样式文件
├── script.js                # 脚本文件
├── _config.yml              # 配置文件
└── README.md                # 说明文档
```

## 更换图片

### 作品图片

1. 将图片放入 `images/artworks/` 目录
2. 图片命名建议：`作品名-主图.jpg`、`作品名-局部1.jpg`
3. 更新对应的 MD 文件中的图片路径

### 横幅图片

将横幅图片放入 `images/banner/` 目录，然后更新 `index.html` 中的路径。

### 头像图片

将头像图片放入 `images/avatar/` 目录，然后更新 `index.html` 中的路径。

## 自定义配置

编辑 `_config.yml` 文件可以修改：

- 网站标题
- 网站描述
- 作者信息
- 主题色
- GitHub 仓库信息

## 本地预览

```bash
# 使用 Python 启动本地服务器
python -m http.server 8080

# 或使用 Node.js
npx serve .
```

然后访问 `http://localhost:8080`

## 技术栈

- HTML5 / CSS3 / JavaScript
- GitHub Pages
- GitHub Actions
- GitHub Issues API

## License

MIT License
