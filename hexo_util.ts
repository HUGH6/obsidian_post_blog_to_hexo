import { Notice } from "obsidian";

export function updateHexoPage(cliPath: string) {
    let exec = require('child_process').exec;
    exec('npm run blog u', {
        cwd: cliPath
    }, function(err: any, stdout: any, stderr: any) {
        if (err) {
            console.log(err)
            console.log(stderr)
            new Notice("发布失败")
        } else {
            new Notice("发布成功")
        }
        console.log(stdout)
    });
}

export function uploadBlogSource(cliPath: string) {
    let exec = require('child_process').exec;
    exec('npm run blog f', {
        cwd: cliPath
    }, function(err: any, stdout: any, stderr: any) {
        if (err) {
            console.log(stderr)
            new Notice("更新源码失败")
        }
        console.log(stdout)
        new Notice("更新源码成功")
    });
}