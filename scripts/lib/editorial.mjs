import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { analyticsTag, consentBanner, siteFooter } from './chrome.mjs';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date = value => new Date(`${value}T12:00:00Z`).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric', timeZone:'UTC' });
const href = a => `/articles/${a.slug}/`;
const readingTime = a => Math.max(1, Math.ceil(a.sections.reduce((n, s) => n + s.paragraphs.map(p => p.text ?? p).join(' ').split(/\s+/).length, 0) / 220));

function page({title, description, path, siteUrl, cssVersion, content, image, article}) {
  const url = siteUrl + path;
  const schema = article ? { '@context':'https://schema.org', '@type':'Article', headline:article.title, description, datePublished:article.published, image:siteUrl + image, author:{'@type':'Organization',name:'UAV360'}, publisher:{'@type':'Organization',name:'UAV360'}, mainEntityOfPage:url } : null;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — UAV360</title><meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(url)}"><meta property="og:url" content="${esc(url)}"><meta property="og:site_name" content="UAV360"><meta property="og:type" content="${article ? 'article' : 'website'}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}">
${image ? `<meta property="og:image" content="${esc(siteUrl + image)}"><meta property="og:image:alt" content="${esc(article.coverAlt)}"><meta name="twitter:card" content="summary_large_image">` : ''}
${article ? `<meta property="article:published_time" content="${esc(article.published)}"><script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>` : ''}
<link rel="stylesheet" href="/assets/styles.css?v=${esc(cssVersion)}"><link rel="stylesheet" href="/assets/articles.css?v=${esc(cssVersion)}">${analyticsTag()}
</head><body class="editorial-page"><a class="skip-link" href="#main">Skip to content</a>
<header class="site-head"><div class="wrap"><a class="brand" href="/">UAV &amp; Counter-Drone News</a><nav aria-label="Main navigation"><a href="/">News</a><a href="/digest/">Monthly Digest</a><a href="/articles/" aria-current="${article ? 'true' : 'page'}">Articles</a></nav></div></header>
<main class="wrap" id="main">${content}</main>${siteFooter()}${consentBanner()}</body></html>`;
}

export async function publishEditorial({root, out, siteUrl, cssVersion}) {
  const dir = join(root, 'content', 'articles');
  const articles = [];
  for (const file of (await readdir(dir)).filter(f => f.endsWith('.json'))) {
    const a = JSON.parse(await readFile(join(dir, file), 'utf8'));
    if (a.status !== 'published') continue;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a.slug) || !/^\d{4}-\d{2}-\d{2}$/.test(a.published) || !a.title || !a.sections?.length || !a.cover?.startsWith('/assets/')) throw new Error(`Invalid editorial article: ${file}`);
    if (articles.some(item => item.slug === a.slug)) throw new Error(`Duplicate article slug: ${a.slug}`);
    await readFile(join(root, 'src', a.cover.slice(1)));
    for (const section of a.sections) for (const p of section.paragraphs) {
      for (const id of p.sources || []) if (!Number.isInteger(id) || !a.sources?.[id - 1]) throw new Error(`Missing source ${id} in ${file}`);
    }
    articles.push(a);
  }
  articles.sort((a,b) => b.published.localeCompare(a.published) || a.slug.localeCompare(b.slug));
  await mkdir(join(out, 'articles'), {recursive:true});
  const cards = articles.map(a => `<a class="editorial-card" href="${href(a)}"><img src="${esc(a.cover)}" alt="${esc(a.coverAlt)}" width="1536" height="864" loading="lazy"><div class="editorial-card-body"><div class="editorial-meta">${esc(a.category)} · <time datetime="${a.published}">${date(a.published)}</time></div><h2>${esc(a.title)}</h2><p>${esc(a.description)}</p><span class="editorial-read">Read article <span aria-hidden="true">↗</span> · ${readingTime(a)} min read</span></div></a>`).join('\n');
  await writeFile(join(out,'articles','index.html'), page({title:'Articles', description:'Original reporting and analysis of the UAV and counter-UAS market from UAV360.', path:'/articles/', siteUrl, cssVersion, content:`<section class="editorial-intro"><div class="editorial-kicker">UAV360 / Analysis &amp; perspectives</div><h1>Articles</h1><p>The developments shaping the UAV and counter-UAS market, explained.</p></section><section class="editorial-grid" aria-label="Latest articles">${cards || '<p>New articles are coming soon.</p>'}</section>`}));
  for (const a of articles) {
    const paragraphs = a.sections.map(s => `${s.heading ? `<h2>${esc(s.heading)}</h2>` : ''}${s.paragraphs.map(p => `<p>${esc(p.text ?? p)}${p.sources?.length ? ` <span class="editorial-citations">${p.sources.map(id => `<a href="#source-${id}" aria-label="Source ${id}">[${id}]</a>`).join(' ')}</span>` : ''}</p>`).join('\n')}`).join('\n');
    const sources = (a.sources || []).map((s,i) => { if (!/^https:\/\//.test(s.url)) throw new Error('Sources must use HTTPS'); return `<li id="source-${i+1}"><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} <span aria-hidden="true">↗</span></a></li>`; }).join('\n');
    const content = `<article class="editorial-article"><a class="editorial-back" href="/articles/">← All articles</a><header class="editorial-title"><div class="editorial-kicker">${esc(a.category)} · ${esc(a.period)}</div><h1>${esc(a.title)}</h1><p class="editorial-deck">${esc(a.description)}</p><div class="editorial-meta">UAV360 · <time datetime="${a.published}">${date(a.published)}</time> · ${readingTime(a)} min read</div></header><figure class="editorial-cover"><img src="${esc(a.cover)}" alt="${esc(a.coverAlt)}" width="1536" height="864" fetchpriority="high"><figcaption>Illustration generated with AI for UAV360.</figcaption></figure><div class="editorial-prose">${paragraphs}<section class="editorial-sources" aria-labelledby="sources-title"><h2 id="sources-title">Sources</h2><ol>${sources}</ol></section><a class="editorial-back" href="/articles/">← Back to articles</a></div></article>`;
    await mkdir(join(out,'articles',a.slug),{recursive:true});
    await writeFile(join(out,'articles',a.slug,'index.html'),page({title:a.title,description:a.description,path:href(a),siteUrl,cssVersion,content,image:a.cover,article:a}));
  }
  return articles;
}
