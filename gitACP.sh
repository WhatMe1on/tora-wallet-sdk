#!/bin/bash

# 设置默认的 commit message
DEFAULT_MSG="默认提交"

# 使用传入的参数作为 commit message，否则使用默认值
COMMIT_MSG="${1:-$DEFAULT_MSG}"

english_text=$(trans -b :en "$COMMIT_MSG")

# 拼接中文和英文
COMMIT_MSG="$COMMIT_MSG - $english_text"

# 执行 git 操作
git add . && \
git commit -m "$COMMIT_MSG" && \
git push
