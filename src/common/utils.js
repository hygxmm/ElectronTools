const path = window.require("path");
const fs = window.require("fs");

/** 递归查找指定文件夹下的文件
 * dirPath - 文件夹路径
 * options.filters - 查找的文件类型
 * options.minSize - 限制最小文件大小
 * options.maxSize - 限制最大文件大小
 * options.excludes - 排除掉的文件/文件夹名称
 *  */
export function iteratorDir(dirPath, options = {}) {
    let fileArray = [];
    const { filters, minSize, maxSize, excludes } = options;
    console.log('filters', filters)
    console.log('minSize', minSize)
    console.log('maxSize', maxSize)
    console.log('excludes', excludes)
    function iterator(dirPath) {
        const files = fs.readdirSync(dirPath);
        // console.log(files);
        files.forEach(filename => {
            if (excludes && excludes.includes(filename)) return;
            // console.log('filename', filename);
            let filePath = path.join(dirPath, filename);
            // console.log('filePath', filePath)
            let fileStat = fs.statSync(filePath);
            // console.log('fileStat', fileStat)
            if (fileStat.isDirectory()) {
                iterator(filePath);
            } else {
                let extname = path.extname(filename);
                // 如果有文件类型限制,并且当前文件不在限制范围内
                if (filters && !filters.includes(extname)) return;
                // 如果有文件大小限制,并且当前文件不在最小限制范围内
                if (minSize && fileStat.size < minSize) return;
                // 如果有文件大小限制,并且当前文件不在最大限制范围内
                if (maxSize && fileStat.size > maxSize) return;
                // 满足条件的文件加入数组
                fileArray.push({ filename, filePath, fileSize: fileStat.size });
            }
        });
    }
    iterator(dirPath);
    return fileArray;
}