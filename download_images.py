#!/usr/bin/env python3
"""
图片下载脚本
将网络图片下载到本地 images 目录
"""

import os
import requests
import time

# 基础路径
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGES_DIR = os.path.join(BASE_DIR, 'images')

# 图片URL模板
PICSUM_BASE = 'https://picsum.photos'

def download_image(url, save_path, description=''):
    """下载单张图片"""
    try:
        print(f'正在下载: {description}')
        print(f'  URL: {url}')
        print(f'  保存到: {save_path}')
        
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        # 确保目录存在
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        
        # 保存图片
        with open(save_path, 'wb') as f:
            f.write(response.content)
        
        print(f'  ✓ 下载成功')
        time.sleep(0.5)  # 避免请求过快
        return True
    except Exception as e:
        print(f'  ✗ 下载失败: {e}')
        return False

def download_all_images():
    """下载所有占位图片"""
    
    print('=' * 50)
    print('开始下载占位图片...')
    print('=' * 50)
    
    # 1. 下载横幅图片
    print('\n[1/3] 下载横幅图片...')
    download_image(
        f'{PICSUM_BASE}/1920/600?random=banner',
        os.path.join(IMAGES_DIR, 'banner', 'hero.jpg'),
        '首页横幅'
    )
    
    # 2. 下载头像
    print('\n[2/3] 下载头像图片...')
    download_image(
        f'{PICSUM_BASE}/400/400?random=avatar',
        os.path.join(IMAGES_DIR, 'avatar', 'author.jpg'),
        '作者头像'
    )
    
    # 3. 下载作品图片
    print('\n[3/3] 下载作品图片...')
    
    # 作品列表
    artworks = [
        ('001-shanshui-qingyin', 800, 1000, ['局部1', '局部2']),
        ('002-xiangrikui', 800, 900, ['局部']),
        ('003-chunjiang-shuinuan', 800, 800, ['局部1', '局部2']),
        ('004-changcheng', 800, 1000, ['局部']),
        ('005-lantingxu', 800, 1200, ['局部1', '局部2']),
        ('006-mozhutu', 800, 900, ['局部']),
        ('007-xingkong', 800, 700, ['局部1', '局部2']),
        ('008-jiangnan-shuixiang', 800, 850, ['局部']),
        ('009-laodongzhe', 800, 950, ['局部']),
        ('010-fuchun-shanjutu', 800, 600, ['局部1', '局部2']),
        ('011-shuilian', 800, 800, ['局部']),
        ('012-zixutie', 800, 1100, ['局部']),
        ('013-huangshan-yunhai', 800, 1000, ['局部1', '局部2']),
        ('014-richu-yinxiang', 800, 700, ['局部']),
        ('015-huaping', 800, 750, ['局部']),
        ('016-qingming-shanghetu', 800, 500, ['局部1', '局部2']),
        ('017-mengnalisha', 800, 1000, ['局部']),
        ('018-qianli-jiangshan', 800, 450, ['局部']),
        ('019-zuihou-de-wancan', 800, 550, ['局部']),
        ('020-benmatu', 800, 650, ['局部']),
        ('021-chuangzo-yadang', 800, 400, ['局部']),
        ('022-xia', 800, 600, ['局部']),
        ('023-chijiu-de-jiyi', 800, 550, ['局部']),
        ('024-quehua-qiuise', 800, 500, ['局部']),
        ('025-nahan', 800, 900, ['局部']),
    ]
    
    for idx, (slug, width, height, details) in enumerate(artworks):
        print(f'\n下载作品 [{idx+1}/{len(artworks)}]: {slug}')
        
        # 主图
        download_image(
            f'{PICSUM_BASE}/{width}/{height}?random={slug}',
            os.path.join(IMAGES_DIR, 'artworks', slug, 'main.jpg'),
            f'{slug} 主图'
        )
        
        # 细节图
        for i, detail in enumerate(details):
            download_image(
                f'{PICSUM_BASE}/400/300?random={slug}-detail{i+1}',
                os.path.join(IMAGES_DIR, 'artworks', slug, f'detail-{i+1}.jpg'),
                f'{slug} {detail}'
            )
    
    print('\n' + '=' * 50)
    print('所有图片下载完成！')
    print('=' * 50)
    print(f'\n图片保存在: {IMAGES_DIR}')
    print('\n请注意：这些是占位图片，请替换为您的真实作品图片。')

if __name__ == '__main__':
    try:
        import requests
        download_all_images()
    except ImportError:
        print('错误：请先安装 requests 库')
        print('运行命令: pip install requests')
