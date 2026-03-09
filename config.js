// ============================================
// 用户配置区域 - 请修改以下配置
// ============================================

const CONFIG = {
    // 【必填】GitHub 仓库配置（留言/点赞/统计功能需要）
    github: {
        // 您的 GitHub 用户名（必填，替换 YOUR_GITHUB_USERNAME）
        // 示例：如果你的GitHub地址是 https://github.com/zhangsan
        // 则填写：owner: 'zhangsan'
        owner: 'LeoJiaGeng',  
        
        // 您的仓库名（必填，替换 YOUR_REPO_NAME）
        // 这个仓库用于存储评论、点赞、浏览量数据
        // 可以与网站部署的仓库相同，也可以不同
        // 示例：repo: 'art-gallery' 或 repo: 'my-website-data'
        repo: 'album',          
        
        // 【重要】Personal Access Token（用于自动创建Issues）
        // 获取方式：
        // 1. 登录 GitHub -> 点击右上角头像 -> Settings
        // 2. 左侧最下方 Developer settings -> Personal access tokens -> Tokens (classic)
        // 3. 点击 Generate new token (classic)
        // 4. 填写 Note：Art Gallery Comments
        // 5. 有效期：选择 No expiration（永不过期）
        // 6. 勾选权限：public_repo（公开仓库）或 repo（私有仓库）
        // 7. 点击 Generate token，立即复制（只显示一次！）
        // 8. 将复制的 token 粘贴到下方（替换 ghp_YOUR_TOKEN_HERE）
        token: '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',    
    },
    
    // 【可选】留言功能配置
    comments: {
        enabled: true,                    // 是否启用留言功能
        useGitHub: true,                 // true=使用GitHub Issues，false=仅使用本地存储
        label: 'comment',                 // 留言 Issue 的标签名称
    },
    
    // 【可选】点赞功能配置
    likes: {
        enabled: true,                    // 是否启用点赞功能
        useGitHub: true,                 // true=同步到GitHub，false=仅本地存储
        label: 'like',                    // 点赞统计 Issue 的标签名称
    },
    
    // 【可选】浏览量统计配置
    views: {
        enabled: true,                    // 是否启用浏览量统计
        useGitHub: true,                 // true=同步到GitHub，false=仅本地存储
        label: 'view',                    // 浏览量统计 Issue 的标签名称
    },
    
    // 网站信息配置
    site: {
        title: '霊雨霏霏工作室',
        subtitle: '艺术 · 美学 · 生活',
        author: '霊雨霏霏',
    },
    
    // 图片路径配置
    images: {
        baseUrl: './images',              // 图片基础路径
        artworks: './images/artworks',    // 作品图片路径
        banner: './images/banner',        // 横幅图片路径
        avatar: './images/avatar',        // 头像图片路径
    }
};

// ============================================
// 以下代码请勿修改
// ============================================

// API 基础地址
CONFIG.apiBase = `https://api.github.com/repos/${CONFIG.github.owner}/${CONFIG.github.repo}`;

// 验证配置是否完整
CONFIG.isValid = function() {
    return this.github.owner !== 'YOUR_GITHUB_USERNAME' && 
           this.github.repo !== 'YOUR_REPO_NAME' &&
           this.github.token !== 'ghp_YOUR_TOKEN_HERE' &&
           this.github.token.startsWith('ghp_');
};

// 检查是否为配置占位符
CONFIG.isPlaceholder = function() {
    return this.github.owner === 'YOUR_GITHUB_USERNAME' || 
           this.github.repo === 'YOUR_REPO_NAME' ||
           this.github.token === 'ghp_YOUR_TOKEN_HERE';
};

// 导出配置（如果使用模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}