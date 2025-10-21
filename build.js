const fs = require('fs');
const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME = process.env.REPO_NAME;

async function fetchIssues() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${REPO_OWNER}/${REPO_NAME}/issues?state=all&sort=created&direction=desc&per_page=100`,
      method: 'GET',
      headers: {
        'User-Agent': 'GitHub-Pages-Blog-Generator',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const issues = JSON.parse(data).filter(issue => !issue.pull_request);
          resolve(issues);
        } else {
          reject(new Error(`API returned ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

function formatDate(dateString) {
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  };
  return new Date(dateString).toLocaleDateString('en-US', options) + ' UTC';
}

function markdownToHtml(markdown) {
  if (!markdown) return '';
  
  let html = markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    .replace(/^---$/gim, '<hr>')
    .replace(/\n/g, '<br>');
  
  // Wrap consecutive <li> elements in <ul>
  html = html.replace(/(<li>.*?<\/li>(?:\s*<li>.*?<\/li>)*)/gs, '<ul>$1</ul>');
  
  return html;
}

function getContrastColor(hex) {
  if (!hex) return '#000000';
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 125 ? '#000000' : '#ffffff';
}

function generateBlogContent(issues) {
  const openIssues = issues.filter(issue => issue.state === 'open');
  const closedIssues = issues.filter(issue => issue.state === 'closed');
  
  // Collect all unique labels for tag filtering
  const allLabels = new Set();
  issues.forEach(issue => {
    issue.labels.forEach(label => allLabels.add(label.name));
  });
  
  function renderIssues(issueList, sectionTitle, sectionIcon) {
    if (issueList.length === 0) return '';
    
    const postsHtml = issueList.map(issue => {
      const labelsHtml = issue.labels && issue.labels.length > 0 
        ? `<div class="labels">${issue.labels.map(label => 
            `<span class="label" data-tag="${label.name}" style="background-color: #${label.color || 'e1e4e8'}; color: ${getContrastColor(label.color || 'e1e4e8')}">${label.name}</span>`
          ).join('')}</div>`
        : '';
      
      return `
        <article class="blog-post" data-tags="${issue.labels.map(l => l.name).join(',')}">
          <h2>
            <a href="${issue.html_url}" target="_blank" class="post-title">
              ${issue.title}
            </a>
            <span class="state-badge state-${issue.state.toLowerCase()}">${issue.state.toLowerCase()}</span>
          </h2>
          <div class="post-meta">
            Published on ${formatDate(issue.created_at)} by ${issue.user.login}
            ${issue.comments > 0 ? ` • ${issue.comments} comment${issue.comments === 1 ? '' : 's'}` : ''}
          </div>
          ${labelsHtml}
          <div class="post-content">
            ${markdownToHtml(issue.body) || '<em>No content</em>'}
          </div>
        </article>
      `;
    }).join('');
    
    return `
      <section class="posts-section">
        <h2 class="section-title">${sectionIcon} ${sectionTitle}</h2>
        ${postsHtml}
      </section>
    `;
  }
  
  // Generate tag filters
  const tagFilters = allLabels.size > 0 
    ? `<div class="tag-filters">
         <button class="tag-filter active" data-tag="all">All Posts</button>
         ${Array.from(allLabels).sort().map(tag => 
           `<button class="tag-filter" data-tag="${tag}">${tag}</button>`
         ).join('')}
       </div>`
    : '';
  
  // Generate blog content
  let blogContent = '';
  if (issues.length === 0) {
    blogContent = `<div class="no-posts">No blog posts yet. <a href="https://github.com/${REPO_OWNER}/${REPO_NAME}/issues/new" target="_blank">Create an issue</a> to write your first post!</div>`;
  } else {
    blogContent = renderIssues(openIssues, 'Recent Posts', '📝') + renderIssues(closedIssues, 'Archive', '📁');
  }
  
  return { tagFilters, blogContent };
}

async function main() {
  try {
    console.log('🔍 Fetching issues...');
    const issues = await fetchIssues();
    console.log(`📊 Found ${issues.length} issues`);
    
    console.log('🏗️ Generating blog content...');
    const { tagFilters, blogContent } = generateBlogContent(issues);
    
    console.log('📄 Reading template...');
    let template = fs.readFileSync('template.html', 'utf8');
    
    // Replace placeholders
    template = template
      .replace('{{LAST_UPDATED}}', new Date().toLocaleString('en-US', { timeZone: 'UTC' }) + ' UTC')
      .replace('{{TAG_FILTERS}}', tagFilters)
      .replace('{{BLOG_CONTENT}}', blogContent);
    
    fs.writeFileSync('index.html', template);
    console.log('✅ Generated index.html successfully!');
    console.log(`📈 Stats: ${issues.filter(i => i.state === 'open').length} open, ${issues.filter(i => i.state === 'closed').length} closed`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();