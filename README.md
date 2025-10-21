# 🎉 Fun Blog

> A GitHub Issues-powered blog with automatic archive and tag support!

## ✨ Features

- **📝 Issues as Posts**: Every GitHub issue becomes a blog post
- **🔄 Auto-rebuild**: Updates automatically when you create/edit/close issues
- **📁 Smart Archive**: Open issues in "Recent Posts", closed issues in "Archive"
- **🏷️ Tag Filtering**: Use issue labels as tags with interactive filtering
- **⚡ Static Generation**: Fast loading, no API rate limits
- **🎨 Clean Design**: Responsive, accessible design

## 🚀 How It Works

### Write a Post
1. [Create a new issue](../../issues/new)
2. Write your post content in markdown
3. Add labels for categorization
4. The blog updates automatically! ✨

### Archive a Post  
- **Close the issue** → moves to "📁 Archive" section
- **Reopen the issue** → moves back to "📝 Recent Posts"

### Tag System
- **Add labels** to issues for categorization
- Labels become **clickable tags** on the blog
- **Filter posts** by clicking tag buttons or post labels

## 🏗️ Technical Details

### File Structure
```
├── template.html          # Blog template with placeholders
├── build.js              # Static site generator script
├── .github/workflows/    # Auto-deployment
│   └── blog.yml         # GitHub Actions workflow
└── index.html           # Generated blog (auto-created)
```

### Build Process
1. **GitHub Actions** triggers on issue events
2. **build.js** fetches all issues via authenticated API
3. **template.html** gets populated with issue data
4. **index.html** is generated and deployed to GitHub Pages

### Customization
- **Edit `template.html`** to change styling or layout
- **Modify `build.js`** to change how issues are processed
- **Workflow runs automatically** when you push changes

## 🎯 Getting Started

1. **Enable GitHub Pages**: Settings → Pages → Source: "GitHub Actions"
2. **Create your first post**: [New Issue](../../issues/new)
3. **Add some labels** for tags (e.g., `tutorial`, `announcement`, `fun`)
4. **Watch the magic happen**: GitHub Actions builds and deploys automatically!

## 🔧 Local Development

```bash
# Set environment variables
export GITHUB_TOKEN="your_token"
export REPO_OWNER="catoncat"
export REPO_NAME="fun"

# Generate blog locally
node build.js

# Open index.html in browser
```

---

**Blog URL**: https://catoncat.github.io/fun/

*Built with ❤️ using GitHub Issues, Actions, and Pages*