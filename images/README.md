# 图片说明

## 目录结构

```
images/
├── artworks/        # 作品图片
│   ├── 001-shanshui-qingyin/
│   │   ├── main.jpg           # 主图
│   │   ├── detail-1.jpg       # 局部图1
│   │   └── detail-2.jpg       # 局部图2
│   ├── 002-xiangrikui/
│   │   ├── main.jpg
│   │   └── detail-1.jpg
│   └── ...
├── banner/          # 首页横幅
│   └── hero.jpg              # 横幅大图
├── avatar/          # 头像
│   └── author.jpg            # 作者头像
└── icons/           # 图标
    └── logo.svg              # Logo 图标
```

## 图片命名规范

### 作品图片

建议为每个作品创建单独的文件夹：

- 文件夹名：`作品ID`（与MD文件名对应）
- `main.jpg` 或 `main.png`：主图（高清图）
- `detail-1.jpg`、`detail-2.jpg`：细节图
- `other-1.jpg`：其他相关图片

### 推荐尺寸

| 类型 | 推荐尺寸 | 说明 |
|------|----------|------|
| 作品主图 | 1200x1500 或 1500x1200 | 高清图，用于详情页 |
| 作品缩略图 | 400x500 | 用于列表展示 |
| 横幅图片 | 1920x600 | 首页大横幅 |
| 头像 | 400x400 | 圆形头像 |

## 如何下载图片

### 方法一：手动下载

1. 找到需要的图片
2. 右键保存到对应目录
3. 更新 MD 文件中的路径

### 方法二：使用脚本

运行以下命令自动下载占位图片：

```bash
# 需要安装 Python 和 requests 库
pip install requests
python download_images.py
```

## 占位图片说明

当前使用的是 picsum.photos 提供的随机图片作为占位符。
您需要将这些占位图片替换为真实的作品图片。

替换步骤：
1. 准备好您的作品图片
2. 按照上述目录结构放入对应文件夹
3. 更新 artworks/ 目录下 MD 文件中的图片路径
4. 更新 index.html 中的横幅和头像路径
