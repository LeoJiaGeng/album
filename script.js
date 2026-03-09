// ============================================
// 配置区 - 请修改 config.js 中的配置
// ============================================

// ============================================
// 作品列表
// ============================================
const artworkList = [
    'artworks/001-shanshui-qingyin.md',
    'artworks/002-xiangrikui.md',
    'artworks/003-chunjiang-shuinuan.md',
    'artworks/004-changcheng.md',
    'artworks/005-lantingxu.md',
    'artworks/006-mozhutu.md',
    'artworks/007-xingkong.md',
    'artworks/008-jiangnan-shuixiang.md',
    'artworks/009-laodongzhe.md',
    'artworks/010-fuchun-shanjutu.md',
    'artworks/011-shuilian.md',
    'artworks/012-zixutie.md',
    'artworks/013-huangshan-yunhai.md',
    'artworks/014-richu-yinxiang.md',
    'artworks/015-huaping.md',
    'artworks/016-qingming-shanghetu.md',
    'artworks/017-mengnalisha.md',
    'artworks/018-qianli-jiangshan.md',
    'artworks/019-zuihou-de-wancan.md',
    'artworks/020-benmatu.md',
    'artworks/021-chuangzo-yadang.md',
    'artworks/022-xia.md',
    'artworks/023-chijiu-de-jiyi.md',
    'artworks/024-quehua-qiuse.md',
    'artworks/025-nahan.md'
];

// ============================================
// 数据存储
// ============================================
let artworks = [];
let currentCategory = 'all';
let currentYear = 'all';
let currentPage = 'gallery';
let currentArtworkSlug = null;
let searchQuery = '';

// 分类映射
const categoryMap = {
    'guohua': '国画',
    'youhua': '油画',
    'shuicai': '水彩',
    'banhua': '版画',
    'shufa': '书法'
};

// API 缓存
const apiCache = new Map();
const CACHE_DURATION = 60000; // 1分钟缓存

// ============================================
// DOM 元素
// ============================================
const gallery = document.getElementById('gallery');
const galleryPage = document.getElementById('galleryPage');
const authorPage = document.getElementById('authorPage');
const detailPage = document.getElementById('detailPage');
const categoryBtns = document.querySelectorAll('.category-btn');
const aboutLink = document.getElementById('aboutLink');
const backBtn = document.getElementById('backBtn');
const detailTitle = document.getElementById('detailTitle');
const detailMeta = document.getElementById('detailMeta');
const detailMainImage = document.getElementById('detailMainImage');
const detailDescription = document.getElementById('detailDescription');
const detailGallery = document.getElementById('detailGallery');
const likeBtn = document.getElementById('likeBtn');
const likeCount = document.getElementById('likeCount');
const viewCount = document.getElementById('viewCount');
const downloadBtn = document.getElementById('downloadBtn');
const commentsList = document.getElementById('commentsList');
const commentName = document.getElementById('commentName');
const commentText = document.getElementById('commentText');
const commentSubmit = document.getElementById('commentSubmit');
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');

// 详情页侧边栏元素
const artworkInfoCard = document.getElementById('artworkInfoCard');
const artworkTimeline = document.getElementById('artworkTimeline');
const authorOtherWorks = document.getElementById('authorOtherWorks');
const relatedWorks = document.getElementById('relatedWorks');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const collectBtn = document.getElementById('collectBtn');

// ============================================
// GitHub Issues API 封装
// ============================================

/**
 * 统一的 GitHub API 请求函数
 */
async function githubApi(endpoint, options = {}) {
    if (!CONFIG.isValid()) {
        console.warn('GitHub 配置不完整，请检查 config.js');
        return null;
    }

    const url = `${CONFIG.apiBase}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Authorization': `token ${CONFIG.github.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        
        if (response.status === 403) {
            console.warn('GitHub API 速率限制，请稍后再试');
            return null;
        }
        
        if (response.status === 401) {
            console.error('GitHub Token 无效，请检查配置');
            return null;
        }
        
        if (!response.ok) {
            throw new Error(`GitHub API 错误: ${response.status}`);
        }
        
        // 204 No Content 处理
        if (response.status === 204) {
            return true;
        }
        
        return await response.json();
    } catch (error) {
        console.error('GitHub API 请求失败:', error);
        return null;
    }
}

// ============================================
// 评论功能（GitHub Issues）
// ============================================

/**
 * 获取作品的评论列表
 */
async function fetchGitHubComments(slug) {
    // 如果未启用 GitHub 或配置不完整，使用本地存储
    if (!CONFIG.comments.enabled || !CONFIG.comments.useGitHub || !CONFIG.isValid()) {
        return getLocalComments(slug);
    }

    // 检查缓存
    const cacheKey = `comments_${slug}`;
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.time < CACHE_DURATION) {
        return cached.data;
    }

    try {
        const issues = await githubApi(
            `/issues?labels=${CONFIG.comments.label},${slug}&state=open&sort=created&direction=desc`
        );
        
        if (!issues) return getLocalComments(slug);

        const comments = issues.map(issue => ({
            id: issue.number,
            name: issue.user.login,
            content: issue.body.replace(/---\n\*\*作品ID\*\*:.*$/s, '').trim(),
            time: new Date(issue.created_at).getTime(),
            avatar: issue.user.avatar_url,
            isGitHub: true
        }));

        // 更新缓存
        apiCache.set(cacheKey, { data: comments, time: Date.now() });
        
        // 合并本地评论
        const localComments = getLocalComments(slug);
        const merged = [...comments, ...localComments.filter(lc => !lc.isGitHub)];
        
        return merged;
        
    } catch (error) {
        console.warn('获取 GitHub 评论失败，使用本地存储:', error);
        return getLocalComments(slug);
    }
}

/**
 * 提交评论
 */
async function submitGitHubComment(slug, name, content) {
    // 保存到本地（作为备份）
    const localComment = { 
        name, 
        content, 
        time: Date.now(), 
        isGitHub: false 
    };
    saveLocalComment(slug, localComment);

    // 如果未启用 GitHub，直接返回
    if (!CONFIG.comments.enabled || !CONFIG.comments.useGitHub || !CONFIG.isValid()) {
        return { success: true, local: true };
    }

    try {
        const artwork = artworks.find(a => a.slug === slug);
        const title = `[留言] ${artwork ? artwork.title : slug} - ${name}`;
        const body = `${content}\n\n---\n**作品ID**: ${slug}\n**昵称**: ${name}`;

        const issue = await githubApi('/issues', {
            method: 'POST',
            body: JSON.stringify({
                title: title,
                body: body,
                labels: [CONFIG.comments.label, slug]
            })
        });

        if (issue) {
            apiCache.delete(`comments_${slug}`);
            return { success: true, issueNumber: issue.number };
        }
        
        return { success: false, error: '创建失败' };
        
    } catch (error) {
        console.error('提交评论失败:', error);
        return { success: false, error: error.message, local: true };
    }
}

// 本地评论存储
function getLocalComments(slug) {
    const comments = JSON.parse(localStorage.getItem('galleryComments') || '{}');
    return comments[slug] || [];
}

function saveLocalComment(slug, comment) {
    const comments = JSON.parse(localStorage.getItem('galleryComments') || '{}');
    if (!comments[slug]) comments[slug] = [];
    comments[slug].unshift(comment);
    localStorage.setItem('galleryComments', JSON.stringify(comments));
}

// ============================================
// 点赞功能（GitHub Issues）
// ============================================

/**
 * 获取作品点赞数
 */
async function fetchGitHubLikes(slug) {
    if (!CONFIG.likes.enabled || !CONFIG.likes.useGitHub || !CONFIG.isValid()) {
        return getLocalStats(slug).likes || 0;
    }

    try {
        const issues = await githubApi(
            `/issues?labels=${CONFIG.likes.label},${slug}&state=open`
        );
        
        if (issues && issues.length > 0) {
            const count = parseInt(issues[0].body) || 0;
            const reactions = issues[0].reactions?.['+1'] || 0;
            return Math.max(count, reactions);
        }
        
        return 0;
    } catch (error) {
        return getLocalStats(slug).likes || 0;
    }
}

/**
 * 添加点赞
 */
async function addGitHubLike(slug) {
    const stats = getLocalStats(slug);
    
    // 检查是否已点赞（本地记录）
    if (stats.liked) {
        return { success: false, error: 'already_liked', count: stats.likes };
    }
    
    // 更新本地数据
    stats.likes = (stats.likes || 0) + 1;
    stats.liked = true;
    saveLocalStats(slug, stats);

    // 如果未启用 GitHub，直接返回
    if (!CONFIG.likes.enabled || !CONFIG.likes.useGitHub || !CONFIG.isValid()) {
        return { success: true, local: true, count: stats.likes };
    }

    try {
        // 查找或创建点赞统计 Issue
        let issues = await githubApi(
            `/issues?labels=${CONFIG.likes.label},${slug}&state=open`
        );

        let issueNumber;
        
        if (!issues || issues.length === 0) {
            // 创建新的统计 Issue
            const newIssue = await githubApi('/issues', {
                method: 'POST',
                body: JSON.stringify({
                    title: `[点赞] ${slug}`,
                    body: '1',
                    labels: [CONFIG.likes.label, slug]
                })
            });
            issueNumber = newIssue.number;
        } else {
            issueNumber = issues[0].number;
            const currentCount = parseInt(issues[0].body) || 0;
            
            // 更新计数
            await githubApi(`/issues/${issueNumber}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    body: (currentCount + 1).toString()
                })
            });
        }

        // 添加表情反应
        await githubApi(`/issues/${issueNumber}/reactions`, {
            method: 'POST',
            body: JSON.stringify({ content: '+1' })
        });

        return { success: true, count: stats.likes };
        
    } catch (error) {
        console.error('GitHub 点赞失败:', error);
        return { success: true, local: true, count: stats.likes };
    }
}

// ============================================
// 浏览量统计（GitHub Issues）
// ============================================

/**
 * 增加浏览量
 */
async function addGitHubView(slug) {
    // 更新本地数据
    const stats = getLocalStats(slug);
    stats.views = (stats.views || 0) + 1;
    saveLocalStats(slug, stats);

    // 如果未启用 GitHub，直接返回
    if (!CONFIG.views.enabled || !CONFIG.views.useGitHub || !CONFIG.isValid()) {
        return { success: true, local: true, count: stats.views };
    }

    try {
        // 查找或创建浏览量统计 Issue
        let issues = await githubApi(
            `/issues?labels=${CONFIG.views.label},${slug}&state=open`
        );

        if (!issues || issues.length === 0) {
            // 创建新的统计 Issue
            await githubApi('/issues', {
                method: 'POST',
                body: JSON.stringify({
                    title: `[浏览量] ${slug}`,
                    body: '1',
                    labels: [CONFIG.views.label, slug]
                })
            });
        } else {
            const issueNumber = issues[0].number;
            const currentCount = parseInt(issues[0].body) || 0;
            
            // 更新计数
            await githubApi(`/issues/${issueNumber}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    body: (currentCount + 1).toString()
                })
            });
        }

        return { success: true, count: stats.views };
        
    } catch (error) {
        console.error('GitHub 浏览量统计失败:', error);
        return { success: true, local: true, count: stats.views };
    }
}

/**
 * 获取浏览量
 */
async function fetchGitHubViews(slug) {
    if (!CONFIG.views.enabled || !CONFIG.views.useGitHub || !CONFIG.isValid()) {
        return getLocalStats(slug).views || 0;
    }

    try {
        const issues = await githubApi(
            `/issues?labels=${CONFIG.views.label},${slug}&state=open`
        );
        
        if (issues && issues.length > 0) {
            return parseInt(issues[0].body) || 0;
        }
        return 0;
    } catch (error) {
        return getLocalStats(slug).views || 0;
    }
}

// 本地统计存储
function getLocalStats(slug) {
    const allStats = JSON.parse(localStorage.getItem('galleryStats') || '{}');
    return allStats[slug] || { likes: 0, views: 0, liked: false };
}

function saveLocalStats(slug, stats) {
    const allStats = JSON.parse(localStorage.getItem('galleryStats') || '{}');
    allStats[slug] = stats;
    localStorage.setItem('galleryStats', JSON.stringify(allStats));
}

// ============================================
// 鼠标效果
// ============================================
function initMouseEffects() {
    const tailLength = 20;
    const tails = [];
    
    const head = document.createElement('div');
    head.className = 'star-head';
    document.body.appendChild(head);
    
    for (let i = 0; i < tailLength; i++) {
        const tail = document.createElement('div');
        tail.className = 'star-tail';
        const scale = 1 - (i / tailLength) * 0.8;
        const size = 6 * scale;
        tail.style.width = size + 'px';
        tail.style.height = size + 'px';
        tail.style.background = `radial-gradient(circle, rgba(102, 126, 234, ${0.8 - i * 0.03}) 0%, transparent 70%)`;
        document.body.appendChild(tail);
        tails.push({ el: tail, x: 0, y: 0 });
    }
    
    let mouseX = 0, mouseY = 0;
    let headX = 0, headY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    function animate() {
        headX += (mouseX - headX) * 0.2;
        headY += (mouseY - headY) * 0.2;
        head.style.left = (headX - 4) + 'px';
        head.style.top = (headY - 4) + 'px';
        
        let prevX = headX;
        let prevY = headY;
        
        tails.forEach((tail, i) => {
            tail.x += (prevX - tail.x) * (0.3 - i * 0.01);
            tail.y += (prevY - tail.y) * (0.3 - i * 0.01);
            tail.el.style.left = (tail.x - 3) + 'px';
            tail.el.style.top = (tail.y - 3) + 'px';
            prevX = tail.x;
            prevY = tail.y;
        });
        
        requestAnimationFrame(animate);
    }
    animate();
}

function createExplosion(x, y) {
    const particleCount = 12;
    const colors = ['#667eea', '#764ba2', '#fff', '#9b59b6', '#3498db'];
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'explosion-particle';
        
        const angle = (i / particleCount) * Math.PI * 2;
        const distance = 50 + Math.random() * 50;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.setProperty('--tx', tx + 'px');
        particle.style.setProperty('--ty', ty + 'px');
        particle.style.width = (4 + Math.random() * 4) + 'px';
        particle.style.height = particle.style.width;
        
        document.body.appendChild(particle);
        
        setTimeout(() => particle.remove(), 800);
    }
}

function createRipple(e, element) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
    
    createExplosion(e.clientX, e.clientY);
}

// ============================================
// MD 文件解析
// ============================================
function parseFrontMatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return null;

    const frontMatter = {};
    const lines = match[1].split('\n');
    
    lines.forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > -1) {
            const key = line.slice(0, colonIndex).trim();
            let value = line.slice(colonIndex + 1).trim();
            
            if (value.startsWith('[') && value.endsWith(']')) {
                value = value.slice(1, -1).split(',').map(s => s.trim());
            } else if (!isNaN(value) && value !== '') {
                value = parseInt(value);
            }
            
            frontMatter[key] = value;
        }
    });

    return {
        meta: frontMatter,
        content: match[2].trim()
    };
}

function parseImages(content) {
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const images = [];
    let match;
    
    while ((match = imageRegex.exec(content)) !== null) {
        images.push({
            alt: match[1],
            src: match[2]
        });
    }
    
    return images;
}

function markdownToHtml(content) {
    content = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '');
    content = content.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    content = content.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    content = content.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    content = content.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');
    content = content.replace(/^\- (.*$)/gm, '<li>$1</li>');
    content = content.replace(/^(\d+)\. (.*$)/gm, '<li>$2</li>');
    content = content.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    content = content.split('\n\n').map(para => {
        para = para.trim();
        if (!para) return '';
        if (para.startsWith('<h') || para.startsWith('<blockquote') || para.startsWith('<li')) {
            return para;
        }
        return `<p>${para.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');
    
    return content;
}

// ============================================
// 作品加载
// ============================================
async function loadArtwork(filePath, index) {
    const fullPath = filePath.startsWith('/') ? filePath : `/album/${filePath}`;
    try {
        const response = await fetch(fullPath);
        if (!response.ok) throw new Error(`Failed to load ${fullPath}`);
        
        const content = await response.text();
        const parsed = parseFrontMatter(content);
        
        if (parsed) {
            const slug = filePath.split('/').pop().replace('.md', '');
            const images = parseImages(parsed.content);
            
            let categories = parsed.meta.categories || parsed.meta.category || ['guohua'];
            if (!Array.isArray(categories)) {
                categories = [categories];
            }
            
            return {
                id: index + 1,
                slug: slug,
                file: filePath,
                ...parsed.meta,
                categories: categories,
                categoryNames: categories.map(c => categoryMap[c] || c),
                description: parsed.content,
                htmlContent: markdownToHtml(parsed.content),
                additionalImages: images
            };
        }
    } catch (error) {
        console.warn(`无法加载作品: ${filePath}`, error);
    }
    return null;
}

async function loadAllArtworks() {
    gallery.innerHTML = '<div class="loading">正在加载作品</div>';
    
    const promises = artworkList.map((file, index) => loadArtwork(file, index));
    const results = await Promise.all(promises);
    
    artworks = results.filter(art => art !== null);
    artworks.sort((a, b) => b.year - a.year);
    
    renderGallery();
    updateTimelineCounts();
}

// ============================================
// 初始化
// ============================================
async function init() {
    await loadAllArtworks();
    bindEvents();
    initMouseEffects();
    checkHash();
    
    // 显示配置提示
    if (CONFIG.isPlaceholder()) {
        console.log('%c⚠️ GitHub 配置未完成', 'color: orange; font-size: 16px; font-weight: bold;');
        console.log('%c请在 config.js 中填写您的 GitHub 用户名、仓库名和 Token', 'color: #666;');
        console.log('%c当前使用本地存储模式（数据仅保存在浏览器中）', 'color: #999;');
    } else {
        console.log('%c✅ GitHub 配置已启用', 'color: green; font-size: 14px;');
    }
}

function checkHash() {
    const hash = window.location.hash.slice(1);
    if (hash === 'author') {
        switchPage('author');
    } else if (hash.startsWith('artwork/')) {
        const slug = hash.replace('artwork/', '');
        const art = artworks.find(a => a.slug === slug);
        if (art) {
            showDetailPage(art);
        }
    }
}

// ============================================
// 页面切换
// ============================================
function switchPage(page) {
    currentPage = page;
    
    galleryPage.style.display = page === 'gallery' ? 'block' : 'none';
    authorPage.style.display = page === 'author' ? 'block' : 'none';
    detailPage.style.display = page === 'detail' ? 'block' : 'none';
    
    categoryBtns.forEach(btn => {
        if (btn.dataset.page) {
            btn.classList.toggle('active', btn.dataset.page === page);
        } else if (btn.dataset.category) {
            btn.classList.toggle('active', btn.dataset.category === 'all' && page === 'gallery');
        }
    });
    
    // 修改这里：使用完整路径，避免 base 标签影响
    if (page === 'author') {
        history.pushState(null, null, '/album/#author');
    } else if (page === 'gallery') {
        history.pushState(null, null, '/album/');
    } else if (page === 'detail' && currentArtworkSlug) {
        history.pushState(null, null, `/album/#artwork/${currentArtworkSlug}`);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// 渲染
// ============================================
function renderGallery() {
    const filtered = artworks.filter(art => {
        const categoryMatch = currentCategory === 'all' || art.categories.includes(currentCategory);
        const yearMatch = currentYear === 'all' || art.year === parseInt(currentYear);
        const searchMatch = !searchQuery || 
            art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            art.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
            art.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            art.categoryNames.some(name => name.includes(searchQuery));
        return categoryMatch && yearMatch && searchMatch;
    });

    if (filtered.length === 0) {
        gallery.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5-7l-3 3.72L9 13l-3 4h12l-4-5z"/>
                </svg>
                <p>${searchQuery ? `未找到"${searchQuery}"相关作品` : '暂无相关作品'}</p>
            </div>
        `;
        return;
    }

    gallery.innerHTML = filtered.map(art => {
        const stats = getLocalStats(art.slug);
        return `
            <div class="gallery-item" data-slug="${art.slug}">
                <div class="gallery-item-image">
                    <img src="${art.image}" alt="${art.title}" loading="lazy">
                </div>
                <div class="gallery-item-info">
                    <div class="gallery-item-title">${art.title}</div>
                    <div class="gallery-item-meta">${art.author} · ${art.year}</div>
                    <div class="gallery-item-categories">
                        ${art.categoryNames.map(name => `<span class="gallery-item-category">${name}</span>`).join('')}
                    </div>
                    <div class="gallery-item-stats">
                        <button class="gallery-item-like ${stats.liked ? 'liked' : ''}" data-slug="${art.slug}" onclick="event.stopPropagation(); toggleLike('${art.slug}')">
                            <svg class="heart-icon" viewBox="0 0 24 24" fill="${stats.liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                            <span>${stats.likes}</span>
                        </button>
                        <span class="gallery-item-views">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                            ${stats.views}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateTimelineCounts() {
    const years = [...new Set(artworks.map(art => art.year))].sort((a, b) => b - a);
    const timelineList = document.querySelector('.timeline-list');
    
    let html = `
        <li class="timeline-item active" data-year="all">
            <span class="year">全部</span>
            <span class="count">${artworks.length}件</span>
        </li>
    `;
    
    html += years.map(year => `
        <li class="timeline-item" data-year="${year}">
            <span class="year">${year}</span>
            <span class="count">${artworks.filter(art => art.year === year).length}件</span>
        </li>
    `).join('');
    
    timelineList.innerHTML = html;
    
    document.querySelectorAll('.timeline-item').forEach(item => {
        item.addEventListener('click', (e) => {
            createRipple(e, item);
            document.querySelectorAll('.timeline-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            currentYear = item.dataset.year;
            renderGallery();
        });
    });
}

// ============================================
// 详情页功能
// ============================================
async function showDetailPage(art) {
    currentArtworkSlug = art.slug;
    
    // 增加浏览量
    const viewResult = await addGitHubView(art.slug);
    
    detailTitle.textContent = art.title;
    detailMeta.innerHTML = `
        <span>${art.author}</span>
        <span>${art.year}年</span>
        ${art.categoryNames.map(name => `<span>${name}</span>`).join('')}
    `;
    
    detailMainImage.src = art.image;
    detailMainImage.alt = art.title;
    detailDescription.innerHTML = art.htmlContent;
    
    if (art.additionalImages && art.additionalImages.length > 0) {
        detailGallery.innerHTML = `
            <h3>更多图片</h3>
            <div class="detail-gallery-grid">
                ${art.additionalImages.map(img => `
                    <div class="detail-gallery-item">
                        <img src="${img.src}" alt="${img.alt}" loading="lazy">
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        detailGallery.innerHTML = '';
    }
    
    // 更新统计数据
    const likes = await fetchGitHubLikes(art.slug);
    const views = await fetchGitHubViews(art.slug);
    const stats = getLocalStats(art.slug);
    
    likeCount.textContent = likes;
    viewCount.textContent = views;
    likeBtn.classList.toggle('liked', stats.liked);
    
    // 填充侧边栏数据
    renderArtworkInfo(art);
    renderArtworkTimeline(art);
    renderAuthorOtherWorks(art);
    renderRelatedWorks(art);
    updateCollectBtn(art.slug);
    
    // 加载留言
    const artworkComments = await fetchGitHubComments(art.slug);
    renderComments(art.slug, artworkComments);
    
    downloadBtn.onclick = () => downloadImage(art.image, art.title);
    
    switchPage('detail');
    window.location.hash = `artwork/${art.slug}`;
}

function downloadImage(url, title) {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}-高清图.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ============================================
// 详情页侧边栏渲染
// ============================================
function renderArtworkInfo(art) {
    const stats = getLocalStats(art.slug);
    const artworkIndex = artworks.findIndex(a => a.slug === art.slug) + 1;
    
    artworkInfoCard.innerHTML = `
        <div class="artwork-number">
            <span>No. ${String(artworkIndex).padStart(3, '0')}</span>
        </div>
        <div class="info-row">
            <span class="info-label">作者</span>
            <span class="info-value">${art.author}</span>
        </div>
        <div class="info-row">
            <span class="info-label">创作年份</span>
            <span class="info-value">${art.year}年</span>
        </div>
        <div class="info-row">
            <span class="info-label">艺术类型</span>
            <span class="info-value highlight">${art.categoryNames.join(' · ')}</span>
        </div>
        <div class="info-row">
            <span class="info-label">浏览次数</span>
            <span class="info-value">${stats.views} 次</span>
        </div>
        <div class="info-row">
            <span class="info-label">收藏次数</span>
            <span class="info-value">${stats.likes} 次</span>
        </div>
    `;
}

function renderArtworkTimeline(art) {
    const nearbyWorks = artworks
        .filter(a => a.year >= art.year - 2 && a.year <= art.year + 2)
        .sort((a, b) => a.year - b.year)
        .slice(0, 5);
    
    artworkTimeline.innerHTML = `
        <div class="timeline-mini">
            ${nearbyWorks.map(work => `
                <div class="timeline-mini-item ${work.slug === art.slug ? 'current' : ''}" data-slug="${work.slug}">
                    <div class="year">${work.year}年</div>
                    <div class="title">${work.title}</div>
                </div>
            `).join('')}
        </div>
    `;
    
    artworkTimeline.querySelectorAll('.timeline-mini-item').forEach(item => {
        item.addEventListener('click', () => {
            const slug = item.dataset.slug;
            const work = artworks.find(a => a.slug === slug);
            if (work) {
                showDetailPage(work);
            }
        });
        item.style.cursor = 'pointer';
    });
}

function renderAuthorOtherWorks(art) {
    const AUTHOR_SORT_MODE = 'views';
    const MAX_AUTHOR_WORKS = 3;
    
    let otherWorks = artworks.filter(a => 
        a.author === art.author && 
        a.slug !== art.slug
    );
    
    switch (AUTHOR_SORT_MODE) {
        case 'views':
            otherWorks.sort((a, b) => {
                const statA = getLocalStats(a.slug);
                const statB = getLocalStats(b.slug);
                return statB.views - statA.views;
            });
            break;
        case 'likes':
            otherWorks.sort((a, b) => {
                const statA = getLocalStats(a.slug);
                const statB = getLocalStats(b.slug);
                return statB.likes - statA.likes;
            });
            break;
        case 'year':
            otherWorks.sort((a, b) => b.year - a.year);
            break;
        case 'year_asc':
            otherWorks.sort((a, b) => a.year - b.year);
            break;
        case 'random':
            otherWorks.sort(() => Math.random() - 0.5);
            break;
    }
    
    otherWorks = otherWorks.slice(0, MAX_AUTHOR_WORKS);
    
    if (otherWorks.length === 0) {
        authorOtherWorks.innerHTML = '<p style="text-align: center; color: #999; font-size: 13px; padding: 10px;">暂无其他作品</p>';
        return;
    }
    
    authorOtherWorks.innerHTML = otherWorks.map(work => {
        const stat = getLocalStats(work.slug);
        return `
            <div class="related-item" data-slug="${work.slug}">
                <div class="related-item-img">
                    <img src="${work.image}" alt="${work.title}" loading="lazy">
                </div>
                <div class="related-item-info">
                    <div class="related-item-title">${work.title}</div>
                    <div class="related-item-meta">${work.year}年 · ${work.categoryNames[0]} · ${stat.views}次浏览</div>
                </div>
            </div>
        `;
    }).join('');
    
    authorOtherWorks.querySelectorAll('.related-item').forEach(item => {
        item.addEventListener('click', () => {
            const slug = item.dataset.slug;
            const work = artworks.find(a => a.slug === slug);
            if (work) {
                showDetailPage(work);
            }
        });
    });
}

function renderRelatedWorks(art) {
    const SORT_MODE = 'views';
    const MAX_RELATED = 3;
    
    let related = artworks.filter(a => 
        a.categories.some(c => art.categories.includes(c)) && 
        a.slug !== art.slug
    );
    
    switch (SORT_MODE) {
        case 'views':
            related.sort((a, b) => {
                const statA = getLocalStats(a.slug);
                const statB = getLocalStats(b.slug);
                return statB.views - statA.views;
            });
            break;
        case 'likes':
            related.sort((a, b) => {
                const statA = getLocalStats(a.slug);
                const statB = getLocalStats(b.slug);
                return statB.likes - statA.likes;
            });
            break;
        case 'year':
            related.sort((a, b) => b.year - a.year);
            break;
        case 'year_asc':
            related.sort((a, b) => a.year - b.year);
            break;
        case 'random':
            related.sort(() => Math.random() - 0.5);
            break;
    }
    
    related = related.slice(0, MAX_RELATED);
    
    if (related.length === 0) {
        relatedWorks.innerHTML = '<p style="text-align: center; color: #999; font-size: 13px; padding: 10px;">暂无相关推荐</p>';
        return;
    }
    
    relatedWorks.innerHTML = related.map(work => {
        const stat = getLocalStats(work.slug);
        return `
            <div class="related-item" data-slug="${work.slug}">
                <div class="related-item-img">
                    <img src="${work.image}" alt="${work.title}" loading="lazy">
                </div>
                <div class="related-item-info">
                    <div class="related-item-title">${work.title}</div>
                    <div class="related-item-meta">${work.author} · ${work.year}年 · ${stat.views}次浏览</div>
                </div>
            </div>
        `;
    }).join('');
    
    relatedWorks.querySelectorAll('.related-item').forEach(item => {
        item.addEventListener('click', () => {
            const slug = item.dataset.slug;
            const work = artworks.find(a => a.slug === slug);
            if (work) {
                showDetailPage(work);
            }
        });
    });
}

function updateCollectBtn(slug) {
    const collected = isCollected(slug);
    collectBtn.classList.toggle('collected', collected);
    collectBtn.innerHTML = collected ? `
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
        <span>已收藏</span>
    ` : `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
        <span>收藏作品</span>
    `;
}

function isCollected(slug) {
    const collections = JSON.parse(localStorage.getItem('galleryCollections')) || [];
    return collections.includes(slug);
}

function toggleCollect(slug) {
    let collections = JSON.parse(localStorage.getItem('galleryCollections')) || [];
    if (collections.includes(slug)) {
        collections = collections.filter(s => s !== slug);
    } else {
        collections.push(slug);
    }
    localStorage.setItem('galleryCollections', JSON.stringify(collections));
    updateCollectBtn(slug);
}

function renderComments(slug, commentList) {
    if (!commentList || commentList.length === 0) {
        commentsList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">暂无留言，快来抢沙发吧~</p>';
        return;
    }

    commentsList.innerHTML = commentList.map(comment => `
        <div class="comment-item">
            <div class="comment-header">
                <span class="comment-author">${escapeHtml(comment.name)}</span>
                <span class="comment-time">${formatTime(comment.time)}</span>
            </div>
            <div class="comment-content">${escapeHtml(comment.content)}</div>
        </div>
    `).join('');
}

async function submitComment() {
    const name = commentName.value.trim();
    const content = commentText.value.trim();

    if (!name) {
        alert('请输入您的昵称');
        return;
    }

    if (!content) {
        alert('请输入留言内容');
        return;
    }

    // 显示提交中状态
    commentSubmit.disabled = true;
    commentSubmit.textContent = '提交中...';

    try {
        const result = await submitGitHubComment(currentArtworkSlug, name, content);
        
        if (result.success) {
            commentName.value = '';
            commentText.value = '';
            
            // 重新加载留言
            const artworkComments = await fetchGitHubComments(currentArtworkSlug);
            renderComments(currentArtworkSlug, artworkComments);
            
            if (result.local) {
                alert('留言已保存到本地（GitHub 同步失败或已禁用）');
            } else {
                alert('留言提交成功！');
            }
        } else {
            alert('提交失败：' + (result.error || '未知错误'));
        }
    } catch (error) {
        alert('提交出错：' + error.message);
    } finally {
        commentSubmit.disabled = false;
        commentSubmit.textContent = '发表留言';
    }
}

// ============================================
// 交互功能
// ============================================
async function toggleLike(slug) {
    const result = await addGitHubLike(slug);
    
    if (result.success) {
        // 更新显示
        if (currentArtworkSlug === slug) {
            likeCount.textContent = result.count;
            likeBtn.classList.add('liked');
        }
        
        // 刷新画廊
        renderGallery();
        
        if (result.local && CONFIG.isValid()) {
            console.log('点赞已保存到本地（GitHub 同步失败）');
        }
    } else if (result.error === 'already_liked') {
        alert('您已经点赞过这个作品了！');
    }
}

// ============================================
// 工具函数
// ============================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
    return date.toLocaleDateString();
}

// ============================================
// 事件绑定
// ============================================
function bindEvents() {
    // 分类切换
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            createRipple(e, btn);
            
            if (btn.dataset.page) {
                switchPage(btn.dataset.page);
                return;
            }
            
            switchPage('gallery');
            categoryBtns.forEach(b => {
                if (b.dataset.category) {
                    b.classList.toggle('active', b === btn);
                }
            });
            currentCategory = btn.dataset.category;
            currentYear = 'all';
            
            document.querySelectorAll('.timeline-item').forEach((item, index) => {
                item.classList.toggle('active', index === 0);
            });
            
            renderGallery();
        });
    });

    // 图片点击
    gallery.addEventListener('click', (e) => {
        const item = e.target.closest('.gallery-item');
        if (item && !e.target.closest('.gallery-item-like')) {
            const slug = item.dataset.slug;
            const art = artworks.find(a => a.slug === slug);
            if (art) {
                showDetailPage(art);
            }
        }
    });

    // 返回按钮
    backBtn.addEventListener('click', () => {
        switchPage('gallery');
    });

    // 关于我们
    if (aboutLink) {
        aboutLink.addEventListener('click', (e) => {
            e.preventDefault();
            switchPage('author');
        });
    }
    
    // 点赞
    likeBtn.addEventListener('click', () => {
        if (currentArtworkSlug) {
            toggleLike(currentArtworkSlug);
        }
    });
    
    // 提交留言
    commentSubmit.addEventListener('click', submitComment);
    
    // 监听hash变化
    window.addEventListener('hashchange', checkHash);
    
    // 全局点击效果
    document.addEventListener('click', (e) => {
        createExplosion(e.clientX, e.clientY);
        
        const target = e.target.closest('button, .timeline-item, .gallery-item');
        if (target && !target.classList.contains('gallery-item-like')) {
            createRipple(e, target);
        }
    });
    
    // 搜索功能
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim();
            searchClear.style.display = searchQuery ? 'flex' : 'none';
            renderGallery();
        });
        
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                searchQuery = '';
                searchClear.style.display = 'none';
                renderGallery();
                searchInput.blur();
            }
        });
    }
    
    if (searchClear) {
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            searchQuery = '';
            searchClear.style.display = 'none';
            renderGallery();
            searchInput.focus();
        });
    }
    
    // 收藏功能
    if (collectBtn) {
        collectBtn.addEventListener('click', () => {
            if (currentArtworkSlug) {
                toggleCollect(currentArtworkSlug);
            }
        });
    }
    
    // 复制链接
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', () => {
            const url = window.location.href;
            navigator.clipboard.writeText(url).then(() => {
                const originalTitle = copyLinkBtn.title;
                copyLinkBtn.title = '已复制!';
                setTimeout(() => {
                    copyLinkBtn.title = originalTitle;
                }, 2000);
            }).catch(() => {
                alert('链接复制失败，请手动复制地址栏链接');
            });
        });
    }
}

// ============================================
// 启动
// ============================================
document.addEventListener('DOMContentLoaded', init);
