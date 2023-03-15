import * as fs from 'fs';
import * as path from 'path';
import { randomInt, randomUUID } from 'crypto';

export function generateFullBlog(title: string, tag: string, category: string, content: string): string {
    let date: Date = new Date();
    let dateStr: string = date.toISOString();
    let id: string = date.getTime().toString() + randomInt(1000).toString();

    let blogHead = `---
title: ${title}
date: ${dateStr}
id: ${id}
tags:
	${tag}
categories:
	[${category}]


---`

    let fullBlog = blogHead + "\r\n" + content;
    return fullBlog;
}

export function processImages(blog: string, title: string, originDir: string, targetDir: string): string {
    let rExp: RegExp = /!\[[^\]]*\]\((.*?)\s*("(?:.*[^"])")?\s*\)/g;
    let imgs = blog.match(rExp)
    let imgUrlToProcess = []
    if (imgs && imgs.length > 0) {
        for(let i = 0; i < imgs.length; i++) {
            let url = getImgsUrl(imgs[i])
            if (url.length == 0) {
                continue;
            }

            if (isNetImage(url)) {
                continue;
            }

            if (isLocalImage(url)) {
                imgUrlToProcess.push(url)
            }
          }
    }

    // obsidian 默认图片在md文件同级的img文件夹下
    const originImgDir = 'img/';
    // 将图片移动到hexo目录下的sources/imgs目录下以当前md文件名称同名的目录下
    const targetImgDir = '/imgs/' + title + '/';

    for (let i = 0; i < imgUrlToProcess.length; i++) {
        blog = changeImgUrl(blog, imgUrlToProcess[i], originImgDir, targetImgDir)
    }

    const fullTargetImgDir = path.join(targetDir, targetImgDir)

    copyImages(originDir, fullTargetImgDir, getImagesRawName(imgUrlToProcess))

    return blog;
}

function getImagesRawName(imgs: Array<string>): Array<string> {
    let res: Array<string> = [];
    if (imgs && imgs.length > 0) {
        for (let i = 0; i < imgs.length; i++) {
            if (imgs[i].startsWith('img/')) {
                res.push(imgs[i].substring(4))
            }
        }
    }
    return res;
}

function copyImages(source: string, target: string, imgs: Array<string>) {
    if (imgs && imgs.length > 0) {
        for (let i = 0; i < imgs.length; i++) {
            let sourceImg = path.join(source, imgs[i])
            let targetImg = path.join(target, imgs[i])

            if (!fs.existsSync(target)) {
                fs.mkdirSync(target)
            }

            fs.copyFile(sourceImg, targetImg, function(err) {
                if(err) {
                    console.log(err)
                }
                else console.log('copy file succeed');
            })

        }

    }
}

function changeImgUrl(content: string, img: string, originPrefix: string, newPrefix: string) {
    if (img && img.startsWith(originPrefix)) {
        let new_img_url = img.replace(originPrefix, newPrefix);
        content = content.replace(img, new_img_url)
    }
    return content
}

function getImgsUrl(imgLabel: string): string {
    let left = imgLabel.indexOf('(')
    let right = imgLabel.indexOf(')')
    if (left != -1 && right != -1 && left < right) {
        return imgLabel.substring(left + 1, right)
    }
    return '';
}

function isNetImage(url: string): boolean {
    return url.indexOf("http") != -1 || url.indexOf("https") != -1
}

function isLocalImage(url: string): boolean {
    // 因为obsdian默认将图片放在与md文件同级目录下的img文件夹下
    return url.startsWith("img")
}