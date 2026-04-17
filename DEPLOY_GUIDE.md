# 部署指引 — ohwowbill.com

以下是将网站发布到 GitHub Pages 并绑定自定义域名的完整步骤。

---

## 第一步：在 GitHub 新建仓库

1. 打开 https://github.com/new
2. Repository name 填：`mywebsite`（或任意名称）
3. 设为 **Public**（GitHub Pages 免费版需公开）
4. **不要**勾选 "Initialize this repository"
5. 点击 **Create repository**

---

## 第二步：将代码推送到 GitHub

在你的 Mac **终端**里，进入项目目录并执行：

```bash
cd ~/mywebsite

# 添加远程仓库（将 ohwowbill 换成你的 GitHub 用户名，mywebsite 换成你刚建的仓库名）
git remote add origin https://github.com/ohwowbill/mywebsite.git

# 提交所有文件
git add .
git commit -m "feat: initial Blowfish site setup with all posts"

# 推送到 GitHub
git push -u origin main
```

> 如果提示 `main` 分支不存在，改用：
> ```bash
> git branch -M main
> git push -u origin main
> ```

---

## 第三步：启用 GitHub Pages（通过 Actions 部署）

1. 打开你的仓库页面：`https://github.com/ohwowbill/mywebsite`
2. 点击顶部 **Settings** 标签
3. 左侧菜单找 **Pages**
4. **Source** 选择 **GitHub Actions**
5. 保存

之后每次 push 到 `main`，网站会自动构建并发布。

---

## 第四步：在 GitHub Pages 设置自定义域名

1. 在 **Settings → Pages** 页面
2. **Custom domain** 填入：`ohwowbill.com`
3. 点击 **Save**
4. 勾选 **Enforce HTTPS**（等 DNS 生效后才能勾选）

---

## 第五步：在 Namecheap 配置 DNS

登录 Namecheap → 找到 `ohwowbill.com` → 点击 **Manage** → 进入 **Advanced DNS** 标签页。

### 删除旧记录

删除所有旧的 A 记录和 CNAME 记录（指向原服务器的那些）。

### 添加以下 DNS 记录

| Type  | Host | Value               | TTL      |
|-------|------|---------------------|----------|
| A     | @    | 185.199.108.153     | Automatic |
| A     | @    | 185.199.109.153     | Automatic |
| A     | @    | 185.199.110.153     | Automatic |
| A     | @    | 185.199.111.153     | Automatic |
| CNAME | www  | ohwowbill.github.io | Automatic |

> 这 4 个 IP 是 GitHub Pages 的官方服务器地址（2024年最新）。

### DNS 生效时间

通常 **10 分钟 ~ 2 小时**内生效，最长 48 小时。

可用以下命令检查是否生效：
```bash
dig ohwowbill.com +short
```
出现 `185.199.xxx.xxx` 即表示生效。

---

## 验证清单

- [ ] GitHub 仓库已创建并推送代码
- [ ] Actions 工作流已成功运行（绿色✓）
- [ ] GitHub Pages 已设置自定义域名
- [ ] Namecheap DNS 已更新（4 条 A 记录 + 1 条 CNAME）
- [ ] 浏览器访问 https://ohwowbill.com 显示新网站

---

## 常见问题

**Q: push 后 Actions 没有运行？**  
A: 检查 Settings → Actions → General，确保 Actions 已启用。

**Q: 网站出现 404？**  
A: 等待 Actions 完成（约 1-2 分钟），或检查 `.github/workflows/deploy.yml` 是否已提交。

**Q: 样式全部丢失？**  
A: 可能是 Blowfish 子模块未正确推送。在终端执行：
```bash
git submodule update --init --recursive
git add .
git commit -m "fix: ensure submodule is tracked"
git push
```

**Q: HTTPS 证书错误？**  
A: DNS 生效后，在 GitHub Pages 设置中点击 "Enforce HTTPS"，等待几分钟即可。
