import * as path from "path";
import * as fs from "fs";

function directoryExist(dir: string) : boolean {
    return fs.existsSync(dir)
}

export function writeFile(dir: string, name: string, content: string): void {
    let full_name = path.join(dir, name).toString();
    fs.writeFile(full_name, content, {
        flag: 'w',
    }, (err) => {
        if (err) {
            console.log(err);
        }
    })
}
